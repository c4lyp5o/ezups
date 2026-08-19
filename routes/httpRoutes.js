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
	.get("/healthcheck", healthCheck, { beforeHandle: [localAuth] })
	.post("/upload", uploadFile, { beforeHandle: [rateLimit] })
	.get("/download", downloadFile, { beforeHandle: [rateLimit] })
	.delete("/purge", purgeEverything, { beforeHandle: [localAuth] });