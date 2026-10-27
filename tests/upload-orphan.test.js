import { describe, it, expect, afterAll, mock } from "bun:test";
import { mkdtempSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

// Regression test for the 2026-10-27 incident: the DB insert failed and the
// already-written upload was left orphaned on disk. Simulate a failing insert
// and assert the bytes are cleaned up and the client gets a 500.
const tmp = mkdtempSync(path.join(tmpdir(), "ezups-orphan-"));
// Port 0 = let the OS pick a free port; test files run back to back
// and must never fight over 5000 (or over a service already using it).
process.env.PORT = "0";
process.env.DB_PATH = path.join(tmp, "test.sqlite");
process.env.UPLOADS_DIR = path.join(tmp, "uploads");

mock.module("../database/sqlite.js", () => ({
	createUpload: {
		run() {
			throw new Error("SQLITE_CORRUPT: database disk image is malformed");
		},
	},
	findUploadByKey: { get: () => null },
	deleteUploadByKey: { run: () => ({ changes: 0 }) },
	allUploads: { all: () => [] },
	clearUploads: { run: () => ({ changes: 0 }) },
	pingDb: { get: () => ({ ok: 1 }) },
	expiredUploads: { all: () => [] },
	deleteExpired: { run: () => ({ changes: 0 }) },
}));

const { app } = await import("../server.js");

describe("upload when the DB insert fails", () => {
	it("returns 500 and does not leave an orphan file behind", async () => {
		const fd = new FormData();
		fd.append("file", new Blob(["orphan me"]), "orphan.txt");

		const res = await app.handle(
			new Request("http://localhost/api/v1/upload", {
				method: "POST",
				body: fd,
			}),
		);

		expect(res.status).toBe(500);
		expect(readdirSync(process.env.UPLOADS_DIR)).toEqual([]);
	});
});

// Without this the module mock leaks into every other test file in the same
// `bun test` process and their uploads start failing.
afterAll(() => {
	mock.restore();
});
