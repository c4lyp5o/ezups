import path from "node:path";
import express from "express";
import cors from "cors";
import { configDotenv } from "dotenv";
import logger from "./utils/logger.js";

configDotenv();

const PORT = process.env.PORT || 5000;

import httpRoutes from "./routes/httpRoutes.js";

import notFound from "./middlewares/notFound.js";
import errorHandler from "./middlewares/errorHandler.js";

const app = express();

app.set("trust proxy", "172.18.0.0/16");

app.use(express.json());
app.use(express.static(path.join(process.cwd(), "public")));
app.use(cors());

app.use("/api/v1", httpRoutes);

app.get("/{*splat}", (_req, res) => {
	res.sendFile(path.join(process.cwd(), "public", "index.html"));
});

app.use(notFound);
app.use(errorHandler);

try {
	app.listen(PORT, () => {
		logger.info(
			`[app] ezups is running on port ${PORT} | Deploy mode: ${
				process.env.NODE_ENV ? process.env.NODE_ENV : "production"
			}`,
		);
	});
} catch (error) {
	logger.error(`[app] Error: ${error.message}`);
	process.exit(1);
}
