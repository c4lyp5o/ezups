import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

// Point the DB + uploads at a throwaway temp dir BEFORE importing the app so
// the real db/ and uploads/ are never touched by the test run.
const tmp = mkdtempSync(path.join(tmpdir(), "ezups-test-"));
// Port 0 = let the OS pick a free port; test files run back to back
// and must never fight over 5000 (or over a service already using it).
process.env.PORT = "0";
process.env.DB_PATH = path.join(tmp, "test.sqlite");
process.env.UPLOADS_DIR = path.join(tmp, "uploads");

const { app } = await import("../server.js");

// Synthetic request helper — no real socket needed for the controller paths.
const api = (url, init) => app.handle(new Request(url, init));

const toFormData = (fields = {}, file = null) => {
	const fd = new FormData();
	for (const [k, v] of Object.entries(fields)) fd.append(k, v);
	if (file) {
		fd.append(
			"file",
			new Blob([file.contents]),
			file.name,
		);
	}
	return fd;
};

describe("EZUPS API", () => {
	it("GET /api/v1/healthcheck - loopback-gated liveness probe", async () => {
		// healthcheck is loopback-gated; a synthetic app.handle() request has no
		// real socket -> 403. The real Docker probe (curl 127.0.0.1) -> 200.
		const synthetic = await api("http://localhost/api/v1/healthcheck");
		expect(synthetic.status).toBe(403);

		const port = app.server?.port ?? 5000;
		const real = await fetch(`http://127.0.0.1:${port}/api/v1/healthcheck`);
		expect(real.status).toBe(200);
		const data = await real.json();
		expect(data).toMatchObject({ message: "ok" });
		// The version the deploy is actually running, straight from package.json.
		expect(data.version).toMatch(/^\d+\.\d+\.\d+$/);
	});

	it("POST /api/v1/upload - returns a share key", async () => {
		const res = await api("http://localhost/api/v1/upload", {
			method: "POST",
			body: toFormData({}, { name: "hello.txt", contents: "hi there" }),
		});
		expect(res.status).toBe(201);
		const data = await res.json();
		expect(data.key).toMatch(/^[0-9a-f]{6}$/);
		expect(data.filename).toBe("hello.txt");
	});

	it("upload then download - roundtrips the file contents", async () => {
		const uploadRes = await api("http://localhost/api/v1/upload", {
			method: "POST",
			body: toFormData({}, { name: "roundtrip.txt", contents: "roundtrip me" }),
		});
		const { key, password } = await uploadRes.json();

		const downloadRes = await api(
			`http://localhost/api/v1/download?key=${key}&password=${encodeURIComponent(password)}`,
			{ method: "GET" },
		);
		expect(downloadRes.status).toBe(200);
		expect(downloadRes.headers.get("content-disposition")).toContain(
			"filename=\"roundtrip.txt\"",
		);
		expect(downloadRes.headers.get("cache-control")).toBe("no-store");
		expect(await downloadRes.text()).toBe("roundtrip me");
	});

	it("download with wrong password - 403", async () => {
		const uploadRes = await api("http://localhost/api/v1/upload", {
			method: "POST",
			body: toFormData({ password: "secret" }, { name: "p.txt", contents: "x" }),
		});
		const { key } = await uploadRes.json();

		const res = await api(
			`http://localhost/api/v1/download?key=${key}&password=wrong`,
			{ method: "GET" },
		);
		expect(res.status).toBe(403);
	});

	it("download with unknown key - 404", async () => {
		const res = await api("http://localhost/api/v1/download?key=zzzzzz", {
			method: "GET",
		});
		expect(res.status).toBe(404);
	});

	it("upload with no file - 400", async () => {
		const res = await api("http://localhost/api/v1/upload", {
			method: "POST",
			body: toFormData(),
		});
		expect(res.status).toBe(400);
	});

	it("deleteAfterDownload removes the file after one fetch", async () => {
		const uploadRes = await api("http://localhost/api/v1/upload", {
			method: "POST",
			body: toFormData(
				{ deleteAfterDownload: "true" },
				{ name: "burn.txt", contents: "gone soon" },
			),
		});
		const { key } = await uploadRes.json();

		const first = await api(
			`http://localhost/api/v1/download?key=${key}`,
			{ method: "GET" },
		);
		expect(first.status).toBe(200);

		const second = await api(
			`http://localhost/api/v1/download?key=${key}`,
			{ method: "GET" },
		);
		expect(second.status).toBe(404);
	});

	it("DELETE /api/v1/purge - loopback-gated (synthetic network 403)", async () => {
		// purge is destructive, so it stays loopback-only. A synthetic
		// app.handle() request has no loopback socket -> rejected.
		const res = await api("http://localhost/api/v1/purge", {
			method: "DELETE",
		});
		expect(res.status).toBe(403);
	});
});

afterAll(() => {
	rmSync(tmp, { recursive: true, force: true });
});