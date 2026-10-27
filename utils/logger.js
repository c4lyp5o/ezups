import { mkdirSync } from "node:fs";
import path from "node:path";
import deadslog from "deadslog";

// The log file lives next to the app, and git does not track empty
// directories: a fresh clone or a build that skipped the local logs/ would
// otherwise have deadslog fail on its first write.
export const LOG_DIR = process.env.LOG_DIR || "./logs";
mkdirSync(path.resolve(LOG_DIR), { recursive: true });

const logger = deadslog({
	fileOutput: {
		enabled: true,
		logFilePath: path.join(LOG_DIR, "ezups.log"),
	},
});

export default logger;
