import { Elysia } from "elysia";
import { rateLimit } from "../middlewares/rateLimit.js";
import { localAuth } from "../middlewares/localAuth.js";
import {
	healthCheck,
	uploadFile,
	downloadFile,
	purgeEverything,
} from "../controllers/httpControllers.js";

export const HttpRoutes = new Elysia({ prefix: "/api/v1" })
	// Public liveness probe (returns only {message:"ok"} — no data leak). It
	// must NOT be loopback-gated: Docker's HEALTHCHECK runs inside the container
	// where Bun's requestIP reports the container IP, not 127.0.0.1, so a loopback
	// check would 403 and the probe would fail.
	.get("/healthcheck", healthCheck)
	.post("/upload", uploadFile, { beforeHandle: [rateLimit] })
	.get("/download", downloadFile, { beforeHandle: [rateLimit] })
	// Destructive — loopback only.
	.delete("/purge", purgeEverything, { beforeHandle: [localAuth] });