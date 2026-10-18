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
	// Destructive + liveness probe stay loopback-only. NOTE: Docker's HEALTHCHECK
	// runs `curl http://127.0.0.1:...` inside the container, which originates on
	// 127.0.0.1, so the loopback gate still admits the probe.
	.get("/healthcheck", healthCheck, { beforeHandle: [localAuth] })
	.post("/upload", uploadFile, { beforeHandle: [rateLimit] })
	.get("/download", downloadFile, { beforeHandle: [rateLimit] })
	// Destructive — loopback only.
	.delete("/purge", purgeEverything, { beforeHandle: [localAuth] });