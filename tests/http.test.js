import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

// Point the DB + uploads at a throwaway temp dir BEFORE importing the app so
// the real db/ and uploads/ are never touched by the test run.
const tmp = mkdtempSync(path.join(tmpdir(), "ezups-test-"));
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
	it("GET /api/v1/healthcheck - gated to loopback (403 for synthetic)", async () => {
		// localAuth only lets real loopback sockets through (Docker HEALTHCHECK
		// curls this from 127.0.0.1). Synthetic app.handle() requests have no
		// real socket, so they're correctly rejected — not a bug.
		const res = await api("http://localhost/api/v1/healthcheck");
		expect(res.status).toBe(403);
	});

	it("GET /api/v1/healthcheck - real loopback socket passes (200)", async () => {
		// The app listens on PORT (5000) when server.js is imported; a real
		// loopback fetch is the true Docker probe path.
		const addr = app.server?.address;
		const port = typeof addr === "string" ? addr : app.server?.port;
		const res = await fetch(`http://127.0.0.1:${port}/api/v1/healthcheck`);
		expect(res.status).toBe(200);
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
});

afterAll(() => {
	rmSync(tmp, { recursive: true, force: true });
});