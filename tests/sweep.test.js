import { describe, it, expect } from "bun:test";
import { Database } from "bun:sqlite";
import { mkdtempSync, writeFileSync, existsSync, utimesSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

// Retention sweep: an expired row (30 days old) and an unreferenced old file go,
// a fresh upload stays. dryRun reports without deleting.
const tmp = mkdtempSync(path.join(tmpdir(), "ezups-sweep-"));
// Port 0 = let the OS pick a free port; test files run back to back
// and must never fight over 5000 (or over a service already using it).
process.env.PORT = "0";
process.env.DB_PATH = path.join(tmp, "test.sqlite");
process.env.UPLOADS_DIR = path.join(tmp, "uploads");
process.env.PURGE_MAX_AGE_DAYS = "7";

const { app } = await import("../server.js");
const port = app.server?.port ?? 5000;

const OLD = path.join(process.env.UPLOADS_DIR, "aaaaaa-old.txt");
const ORPHAN = path.join(process.env.UPLOADS_DIR, "bbbbbb-orphan.txt");
const hourAgo = new Date(Date.now() - 60 * 60_000);

const seedOldRow = () => {
	const db = new Database(process.env.DB_PATH);
	db.run(
		"INSERT OR REPLACE INTO uploads (key, password, file, original_name, deleteAfterDownload, created_at) VALUES (?,?,?,?,?,datetime('now','-30 days'))",
		["aaaaaa", "", OLD, "old.txt", 0],
	);
	db.close();
};

describe("POST /api/v1/sweep", () => {
	it("dryRun reports the expired row and orphan but deletes nothing", async () => {
		writeFileSync(OLD, "expired");
		writeFileSync(ORPHAN, "orphan");
		utimesSync(OLD, hourAgo, hourAgo);
		utimesSync(ORPHAN, hourAgo, hourAgo);
		seedOldRow();

		const res = await fetch(`http://127.0.0.1:${port}/api/v1/sweep?dryRun=1`, {
			method: "POST",
		});
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.dryRun).toBe(true);
		expect(body.expired.map((r) => r.key)).toContain("aaaaaa");
		expect(body.orphans).toContain("bbbbbb-orphan.txt");
		// nothing touched
		expect(existsSync(OLD)).toBe(true);
		expect(existsSync(ORPHAN)).toBe(true);
	});

	it("removes expired rows + files and orphan files, keeps fresh uploads", async () => {
		const fd = new FormData();
		fd.append("file", new Blob(["keep me"]), "fresh.txt");
		const up = await app.handle(
			new Request("http://localhost/api/v1/upload", { method: "POST", body: fd }),
		);
		expect(up.status).toBe(201);
		const { key } = await up.json();

		const res = await fetch(`http://127.0.0.1:${port}/api/v1/sweep`, {
			method: "POST",
		});
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.dryRun).toBe(false);

		expect(existsSync(OLD)).toBe(false);
		expect(existsSync(ORPHAN)).toBe(false);

		const db = new Database(process.env.DB_PATH);
		const old = db.query("SELECT * FROM uploads WHERE key = 'aaaaaa'").get();
		const fresh = db.query("SELECT * FROM uploads WHERE key = ?").get(key);
		db.close();
		expect(old).toBeNull();
		expect(fresh).not.toBeNull();

		// the fresh upload is still downloadable
		const dl = await app.handle(
			new Request(`http://localhost/api/v1/download?key=${key}`),
		);
		expect(dl.status).toBe(200);
		expect(await dl.text()).toBe("keep me");
	});
});
