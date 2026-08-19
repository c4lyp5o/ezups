import { Database } from "bun:sqlite";
import path from "node:path";
import { mkdirSync } from "node:fs";
import { DB_PATH } from "../config.js";
import logger from "../utils/logger.js";

mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH, { create: true });

db.exec(
	`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS uploads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL UNIQUE,
  password TEXT,
  file TEXT NOT NULL,
  original_name TEXT,
  deleteAfterDownload BOOLEAN DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`,
);

// Migration-safe: the pre-existing (unstable) uploads table has no original_name
// column. Add it only if missing so old DBs keep working.
try {
	db.run("ALTER TABLE uploads ADD COLUMN original_name TEXT");
} catch {
	// column (or table) already present — nothing to do
}

db.exec("PRAGMA journal_mode = WAL;");
db.exec("PRAGMA foreign_keys = ON;");

export const createUpload = db.query(
	"INSERT INTO uploads (key, file, original_name, password, deleteAfterDownload) VALUES (?, ?, ?, ?, ?)",
);
export const findUploadByKey = db.query("SELECT * FROM uploads WHERE key = ?");
export const deleteUploadByKey = db.query("DELETE FROM uploads WHERE key = ?");
export const allUploads = db.query("SELECT * FROM uploads");
export const clearUploads = db.query("DELETE FROM uploads");

logger.info(`[db] Database initialized at ${DB_PATH}`);