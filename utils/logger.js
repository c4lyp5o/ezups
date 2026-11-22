import path from "node:path";
import { DATA_DIR } from "../config.js";
import { createLogger } from "./ezlog.js";

export const LOG_DIR = process.env.LOG_DIR || path.join(DATA_DIR, "logs");

const logger = createLogger(LOG_DIR, "ezups");

export default logger;
