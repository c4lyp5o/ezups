import path from "node:path";
import { existsSync, mkdirSync } from "node:fs";
import { Elysia } from "elysia";
import staticPlugin from "@elysiajs/static";
import { PORT, PUBLIC_DIR, UPLOADS_DIR } from "./config.js";
import logger from "./utils/logger.js";
import { HttpRoutes } from "./routes/httpRoutes.js";

// The static plugin errors on a missing assets dir; make sure the runtime
// dirs exist even before the client has been built (dev mode, fresh checkout).
mkdirSync(PUBLIC_DIR, { recursive: true });
mkdirSync(UPLOADS_DIR, { recursive: true });

export const app = new Elysia()
	.onError(({ code, error, set, request }) => {
		if (code === "VALIDATION") {
			set.status = 400;
			return { message: "Bad Request" };
		}
		if (code === "NOT_FOUND") {
			// SPA fallback: unknown non-API paths go to the client router so
			// deep links keep working after a refresh. /api/* stays a JSON 404.
			const { pathname } = new URL(request.url);
			if (!pathname.startsWith("/api")) {
				const indexHtml = path.join(PUBLIC_DIR, "index.html");
				if (existsSync(indexHtml)) {
					return new Response(Bun.file(indexHtml), {
						status: 200,
						headers: {
							"Content-Type": "text/html; charset=utf-8",
							"Cache-Control": "no-cache",
						},
					});
				}
			}
			set.status = 404;
			return { message: "Not Found" };
		}

		// Service-level errors carry their own status; anything else is a 500.
		if (error?.status) {
			set.status = error.status;
			return { message: error.message };
		}

		set.status = 500;
		logger.error(`[server] 💥 [${code}] Server Error: ${error?.stack || error?.message}`);
		return { message: "Internal Server Error" };
	})
	.onRequest(({ set, request }) => {
		set.headers["X-Content-Type-Options"] = "nosniff";
		set.headers["X-Frame-Options"] = "DENY";
		set.headers["Referrer-Policy"] = "no-referrer";
		set.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()";
		// Strict CSP. style-src allows 'unsafe-inline' because react-toastify
		// injects its stylesheet at runtime; everything else stays same-origin.
		set.headers["Content-Security-Policy"] =
			"default-src 'none'; base-uri 'none'; form-action 'self'; " +
			"frame-ancestors 'none'; object-src 'none'; img-src 'self' data:; " +
			"style-src 'self' 'unsafe-inline'; font-src 'self'; " +
			"script-src 'self'; connect-src 'self'";
		const { pathname } = new URL(request.url);
		if (pathname === "/" || pathname.endsWith("index.html")) {
			set.headers["Cache-Control"] = "no-cache";
		}
	})
	.use(HttpRoutes)
	.use(
		staticPlugin({
			assets: PUBLIC_DIR,
			prefix: "/",
			indexHTML: true,
			alwaysStatic: true,
			maxAge: 7 * 24 * 60 * 60,
		}),
	);

app.listen(PORT, () => {
	logger.info(`[app] ezups is running on port ${PORT}`);
});