import { Database } from "bun:sqlite";
import path from "node:path";
import {
	mkdirSync,
	existsSync,
	renameSync,
	readdirSync,
	unlinkSync,
} from "node:fs";
import {
	DB_PATH,
	DB_AUTO_RECOVER,
	DB_MAX_RECOVERIES,
	DB_KEEP_QUARANTINES,
} from "../config.js";
import logger from "../utils/logger.js";

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS uploads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL UNIQUE,
  password TEXT,
  file TEXT NOT NULL,
  original_name TEXT,
  deleteAfterDownload BOOLEAN DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

const STATEMENTS = {
	createUpload:
		"INSERT INTO uploads (key, file, original_name, password, deleteAfterDownload) VALUES (?, ?, ?, ?, ?)",
	findUploadByKey: "SELECT * FROM uploads WHERE key = ?",
	deleteUploadByKey: "DELETE FROM uploads WHERE key = ?",
	allUploads: "SELECT * FROM uploads",
	clearUploads: "DELETE FROM uploads",
	// Cheap liveness read for /healthcheck -- throws on a corrupt database.
	pingDb: "SELECT 1 AS ok",
	// Retention sweep: created_at is written by SQLite's CURRENT_TIMESTAMP (UTC),
	// so compare against datetime('now', <modifier>) which is UTC too.
	expiredUploads: "SELECT * FROM uploads WHERE created_at < datetime('now', ?)",
	deleteExpired: "DELETE FROM uploads WHERE created_at < datetime('now', ?)",
};

const dir = path.dirname(DB_PATH);
mkdirSync(dir, { recursive: true });

let db = null;
// Rebuilt on every open, so a recovery swaps the statements under the
// exported query objects without touching any caller.
let prepared = {};
let recoveries = 0;

const END = ["", "-wal", "-shm"];

function pragmas(handle) {
	handle.exec("PRAGMA journal_mode = WAL;");
	// FULL: one fsync per commit. At this volume (a handful of uploads a day) the
	// cost is nil, and it shrinks the window where a hard stop leaves a
	// half-applied commit behind -- the exact shape of the corruption that took
	// uploads down on 2026-10-19.
	handle.exec("PRAGMA synchronous = FULL;");
	// The sweep and an upload can write at the same moment; without a busy
	// timeout the loser gets an instant SQLITE_BUSY, which surfaced as a 500.
	handle.exec("PRAGMA busy_timeout = 5000;");
	handle.exec("PRAGMA foreign_keys = ON;");
}

function migrate(handle) {
	// The pre-existing (unstable) uploads table has no original_name column.
	try {
		handle.run("ALTER TABLE uploads ADD COLUMN original_name TEXT");
	} catch (error) {
		// Only "duplicate column" is expected here; anything else is real.
		if (!/duplicate column/i.test(String(error?.message))) throw error;
	}
}

function checkIntegrity(handle) {
	const row = handle.query("PRAGMA quick_check").get();
	const value = row ? Object.values(row)[0] : null;
	if (value !== "ok") {
		throw new Error(`quick_check returned ${JSON.stringify(row)}`);
	}
}

function prepare(handle) {
	const next = {};
	for (const [name, sql] of Object.entries(STATEMENTS)) {
		next[name] = handle.query(sql);
	}
	prepared = next;
}

// Open the existing file, proving it is usable. Throws on a damaged file.
function openExisting() {
	const handle = new Database(DB_PATH, { create: true });
	try {
		handle.exec(SCHEMA);
		checkIntegrity(handle);
		migrate(handle);
		pragmas(handle);
		handle.exec(
			"CREATE INDEX IF NOT EXISTS idx_uploads_created ON uploads(created_at);",
		);
		return handle;
	} catch (error) {
		// Release the file lock before the caller renames the file away.
		try {
			handle.close();
		} catch {
			/* already unusable */
		}
		throw error;
	}
}

// A brand new, empty database. No integrity check: it was just created.
function openFresh() {
	const handle = new Database(DB_PATH, { create: true });
	handle.exec(SCHEMA);
	pragmas(handle);
	handle.exec(
		"CREATE INDEX IF NOT EXISTS idx_uploads_created ON uploads(created_at);",
	);
	return handle;
}

// Move the damaged file (and its WAL/SHM) aside instead of deleting it: those
// bytes are the only place its rows still exist, and a page-level carve can
// still recover them by hand.
function quarantine() {
	const stamp = new Date().toISOString().replace(/[:.]/g, "-");
	const target = `${DB_PATH}.corrupt-${stamp}`;
	let moved = false;
	for (const suffix of END) {
		const from = DB_PATH + suffix;
		if (!existsSync(from)) continue;
		try {
			renameSync(from, `${target}${suffix}`);
			moved = true;
		} catch (error) {
			logger.error(`[db] cannot quarantine ${from}: ${error.message}`);
		}
	}
	pruneQuarantines();
	return moved ? target : null;
}

function pruneQuarantines() {
	try {
		const prefix = `${path.basename(DB_PATH)}.corrupt-`;
		const stamps = readdirSync(dir)
			.filter((name) => name.startsWith(prefix) && !/-wal$|-shm$/.test(name))
			.sort();
		const excess = stamps.slice(
			0,
			Math.max(0, stamps.length - DB_KEEP_QUARANTINES),
		);
		for (const name of excess) {
			for (const suffix of END) {
				const file = path.join(dir, name + suffix);
				if (existsSync(file)) {
					try {
						unlinkSync(file);
					} catch (error) {
						logger.error(`[db] cannot prune ${file}: ${error.message}`);
					}
				}
			}
		}
	} catch (error) {
		logger.error(`[db] cannot list quarantine dir: ${error.message}`);
	}
}

export function isCorruptError(error) {
	return /SQLITE_CORRUPT|SQLITE_NOTADB|database disk image is malformed|file is not a database/i.test(
		String(error?.message ?? error ?? ""),
	);
}

// Replace the database with an empty one and rebuild the statements. Returns
// true when the caller can retry against the new file.
export function recoverDatabase(reason) {
	if (!DB_AUTO_RECOVER) {
		logger.error(`[db] corrupt (${reason}) and DB_AUTO_RECOVER=0 — refusing to recover`);
		return false;
	}
	if (recoveries >= DB_MAX_RECOVERIES) {
		logger.error(
			`[db] corrupt (${reason}) but already recovered ${recoveries}/${DB_MAX_RECOVERIES} times this process — giving up`,
		);
		return false;
	}
	recoveries += 1;

	try {
		db?.close();
	} catch (error) {
		logger.error(`[db] close during recovery failed: ${error.message}`);
	}
	db = null;
	prepared = {};

	const moved = quarantine();
	logger.error(
		`[db] CORRUPT (${reason}) — quarantined ${moved ?? "nothing"}, creating a fresh database (recovery ${recoveries}/${DB_MAX_RECOVERIES})`,
	);

	db = openFresh();
	prepare(db);
	logger.error(`[db] fresh database ready at ${DB_PATH}; old bytes kept at ${moved}`);
	return true;
}

// Every exported query goes through here, so a runtime SQLITE_CORRUPT heals
// once and retries instead of surfacing as a 500.
function call(name, method, args) {
	try {
		return prepared[name][method](...args);
	} catch (error) {
		if (
			!isCorruptError(error) ||
			!recoverDatabase(`${method} ${name}: ${error.message}`)
		) {
			throw error;
		}
		return prepared[name][method](...args);
	}
}

const q = (name) => ({
	run: (...args) => call(name, "run", args),
	get: (...args) => call(name, "get", args),
	all: (...args) => call(name, "all", args),
});

// Boot: try the existing file; if it is damaged, quarantine it and carry on with
// a fresh one. Without DB_AUTO_RECOVER the process exits instead -- a loud
// failure is better than eight days of silent 500s.
try {
	db = openExisting();
} catch (error) {
	logger.error(`[db] ${DB_PATH} is unreadable or corrupt: ${error.message}`);
	if (!recoverDatabase(`boot: ${error.message}`)) {
		throw new Error(
			`[db] ${DB_PATH} is unreadable or corrupt: ${error.message}`,
			{ cause: error },
		);
	}
}
prepare(db);

export const createUpload = q("createUpload");
export const findUploadByKey = q("findUploadByKey");
export const deleteUploadByKey = q("deleteUploadByKey");
export const allUploads = q("allUploads");
export const clearUploads = q("clearUploads");
export const pingDb = q("pingDb");
export const expiredUploads = q("expiredUploads");
export const deleteExpired = q("deleteExpired");

logger.info(
	`[db] Database initialized at ${DB_PATH}${recoveries > 0 ? ` (recovered ${recoveries}x)` : ""}`,
);
