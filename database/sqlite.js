import { Database } from "bun:sqlite";
import path from "node:path";
import { mkdirSync } from "node:fs";
import { DB_PATH } from "../config.js";
import logger from "../utils/logger.js";

mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH, { create: true });

db.exec(
	`CREATE TABLE IF NOT EXISTS users (
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
`,
);

// Fail fast on a damaged file: without this, every write 500s while the
// container reports healthy, and the first symptom is a user with a dead link.
try {
	const check = db.query("PRAGMA quick_check").get();
	const checkValue = check ? Object.values(check)[0] : null;
	if (checkValue !== "ok") {
		throw new Error(`quick_check returned ${JSON.stringify(check)}`);
	}
} catch (error) {
	throw new Error(
		`[db] ${DB_PATH} is unreadable or corrupt: ${error?.message}`,
		{ cause: error },
	);
}

// Migration-safe: the pre-existing (unstable) uploads table has no original_name
// column. Add it only if missing so old DBs keep working.
try {
	db.run("ALTER TABLE uploads ADD COLUMN original_name TEXT");
} catch (error) {
	// Only "duplicate column" is expected here; anything else is real.
	if (!/duplicate column/i.test(String(error?.message))) {
		throw error;
	}
}

db.exec("PRAGMA journal_mode = WAL;");
// FULL: one fsync per commit. At this volume (a handful of uploads a day) the
// cost is nil, and it shrinks the window where a hard stop leaves a
// half-applied commit behind -- the exact shape of the corruption that took
// uploads down on 2026-10-19.
db.exec("PRAGMA synchronous = FULL;");
// The sweep and an upload can write at the same moment; without a busy timeout
// the loser gets an instant SQLITE_BUSY, which surfaced to users as a 500.
db.exec("PRAGMA busy_timeout = 5000;");
db.exec("PRAGMA foreign_keys = ON;");
db.exec("CREATE INDEX IF NOT EXISTS idx_uploads_created ON uploads(created_at);");

export const createUpload = db.query(
	"INSERT INTO uploads (key, file, original_name, password, deleteAfterDownload) VALUES (?, ?, ?, ?, ?)",
);
export const findUploadByKey = db.query("SELECT * FROM uploads WHERE key = ?");
export const deleteUploadByKey = db.query("DELETE FROM uploads WHERE key = ?");
export const allUploads = db.query("SELECT * FROM uploads");
export const clearUploads = db.query("DELETE FROM uploads");
// Cheap liveness read for /healthcheck -- throws on a corrupt database.
export const pingDb = db.query("SELECT 1 AS ok");

// Retention sweep: created_at is written by SQLite's CURRENT_TIMESTAMP (UTC), so
// compare against datetime('now', <modifier>) which is UTC too.
export const expiredUploads = db.query(
	"SELECT * FROM uploads WHERE created_at < datetime('now', ?)",
);
export const deleteExpired = db.query(
	"DELETE FROM uploads WHERE created_at < datetime('now', ?)",
);

logger.info(`[db] Database initialized at ${DB_PATH}`);