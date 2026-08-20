import path from "node:path";
import { fileURLToPath } from "node:url";

// import.meta.dir is Bun-only; derive it portably so tests can import too.
const HERE = path.dirname(fileURLToPath(import.meta.url));

// All runtime paths are rooted at the ezups repo root (./config.js lives there
// in this repo, so HERE is already the repo root).
export const PORT = process.env.PORT !== undefined ? Number(process.env.PORT) : 5000;
export const DB_PATH = process.env.DB_PATH || path.join(HERE, "db/ezups.sqlite");
export const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(HERE, "uploads");
export const PUBLIC_DIR = path.join(HERE, "public");

// Keys are lowercase hex strings; 3 bytes = 24 bits. Matches the original EZ-UPS
// key scheme the UI was built around (short enough to share by hand).
export const KEY_LENGTH = 3;

// Server-side caps so the API can't be abused by clients that skip the UI limit.
export const MAX_UPLOAD_SIZE = 100 * 1024 * 1024; // 100MB
export const MAX_PASSWORD_LENGTH = 128;
export const MAX_FILENAME_LENGTH = 200;

export const RATE_LIMIT = { limit: 50, windowMs: 60_000 };