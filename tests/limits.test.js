import { describe, it, expect } from "bun:test";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const tmp = mkdtempSync(path.join(tmpdir(), "ezups-limits-"));
process.env.PORT = "0";
process.env.DB_PATH = path.join(tmp, "test.sqlite");
process.env.UPLOADS_DIR = path.join(tmp, "uploads");
process.env.PURGE_MAX_AGE_DAYS = "0";
// Small cap so the oversize test is cheap.
process.env.MAX_UPLOAD_SIZE = String(1024 * 1024);

const { app } = await import("../server.js");
const { clientIp } = await import("../middlewares/rateLimit.js");
const port = app.server?.port ?? 5000;

const withXff = (xff) =>
	new Request("http://x/api/v1/upload", { headers: { "x-forwarded-for": xff } });

describe("rate limiter trust boundary", () => {
	it("uses the LAST X-Forwarded-For hop, the one traefik appends", () => {
		expect(clientIp(withXff("1.2.3.4"), null)).toBe("1.2.3.4");
		// A client-supplied first hop must not win.
		expect(clientIp(withXff("spoofed, 1.2.3.4"), null)).toBe("1.2.3.4");
		expect(clientIp(withXff("a, b, 9.9.9.9"), null)).toBe("9.9.9.9");
	});

	it("falls back to X-Real-IP, then the socket", () => {
		expect(
			clientIp(new Request("http://x/", { headers: { "x-real-ip": "8.8.8.8" } }), null),
		).toBe("8.8.8.8");
		expect(
			clientIp(new Request("http://x/"), {
				requestIP: () => ({ address: "10.0.0.5" }),
			}),
		).toBe("10.0.0.5");
	});

	it("counts a rotating spoofed first hop against the same caller", async () => {
		// Before the fix every one of these looked like a new client, so the
		// limit never engaged and the key space was enumerable.
		let status = 0;
		for (let i = 0; i < 55; i++) {
			const fd = new FormData();
			fd.append("file", new Blob(["x"]), "x.txt");
			const res = await fetch(`http://127.0.0.1:${port}/api/v1/upload`, {
				method: "POST",
				body: fd,
				headers: { "x-forwarded-for": `10.0.0.${i}, 7.7.7.7` },
			});
			status = res.status;
			if (status === 429) break;
		}
		expect(status).toBe(429);
	});
});

describe("oversize upload", () => {
	it("rejects on Content-Length before parsing the multipart body", async () => {
		const fd = new FormData();
		fd.append("file", new Blob([new Uint8Array(2 * 1024 * 1024)]), "big.bin");
		const res = await app.handle(
			new Request("http://localhost/api/v1/upload", { method: "POST", body: fd }),
		);
		expect(res.status).toBe(413);
		expect((await res.json()).message).toContain("1MB");
	});
});
