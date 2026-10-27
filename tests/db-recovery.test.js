import { describe, it, expect } from "bun:test";
import { Database } from "bun:sqlite";
import { mkdtempSync, writeFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

// The failover: a database that is already damaged when the app starts must not
// take the service down. It gets quarantined and replaced with an empty one.
const tmp = mkdtempSync(path.join(tmpdir(), "ezups-recover-"));
const DB_FILE = path.join(tmp, "test.sqlite");

process.env.PORT = "0";
process.env.DB_PATH = DB_FILE;
process.env.UPLOADS_DIR = path.join(tmp, "uploads");
process.env.PURGE_MAX_AGE_DAYS = "0";

// Damaged on disk BEFORE the app loads: a real SQLite header (so open() is
// happy) with garbage after it, which is exactly the shape that produced
// SQLITE_CORRUPT on 2026-10-19.
const damaged = Buffer.alloc(8192);
Buffer.from("SQLite format 3\0").copy(damaged, 0);
damaged.fill(0x5a, 16);
writeFileSync(DB_FILE, damaged);

const { app } = await import("../server.js");
const { isCorruptError, recoverDatabase } = await import("../database/sqlite.js");

const quarantined = () =>
	readdirSync(tmp).filter((name) => name.startsWith("test.sqlite.corrupt-"));

const upload = async (body, name = "after.txt") => {
	const fd = new FormData();
	fd.append("file", new Blob([body]), name);
	return app.handle(
		new Request("http://localhost/api/v1/upload", { method: "POST", body: fd }),
	);
};

describe("corrupt database at boot", () => {
	it("quarantines the file and serves from a fresh database", async () => {
		expect(quarantined().length).toBe(1);

		const res = await upload("after recovery");
		expect(res.status).toBe(201);
		const { key } = await res.json();

		const dl = await app.handle(
			new Request(`http://localhost/api/v1/download?key=${key}`),
		);
		expect(dl.status).toBe(200);
		expect(await dl.text()).toBe("after recovery");
	});

	it("leaves the damaged bytes on disk for a manual carve", () => {
		const [file] = quarantined();
		expect(readdirSync(tmp)).toContain(file);
	});
});

describe("recovery helpers", () => {
	it("recognises corruption, and only corruption", () => {
		expect(
			isCorruptError(new Error("SQLiteError: database disk image is malformed")),
		).toBe(true);
		expect(isCorruptError(new Error("SQLITE_NOTADB: file is not a database"))).toBe(
			true,
		);
		expect(
			isCorruptError(new Error("UNIQUE constraint failed: uploads.key")),
		).toBe(false);
		expect(isCorruptError(new Error("SQLITE_BUSY: database is locked"))).toBe(
			false,
		);
	});

	it("recoverDatabase() swaps in an empty, working database", async () => {
		expect(recoverDatabase("test: simulating a damaged file")).toBe(true);
		expect(quarantined().length).toBe(2);

		const fresh = new Database(DB_FILE, { readonly: true });
		const rows = fresh.query("SELECT count(*) AS c FROM uploads").get();
		fresh.close();
		expect(rows.c).toBe(0);

		// and the app still answers
		const res = await upload("post-recovery", "again.txt");
		expect(res.status).toBe(201);
	});
});
