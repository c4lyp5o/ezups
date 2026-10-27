import { randomBytes } from "node:crypto";
import { readFile, unlink, readdir, stat } from "node:fs/promises";
import path from "node:path";
import {
	UPLOADS_DIR,
	KEY_LENGTH,
	MAX_UPLOAD_SIZE,
	MAX_PASSWORD_LENGTH,
	MAX_FILENAME_LENGTH,
	PURGE_MAX_AGE_DAYS,
	ORPHAN_GRACE_MS,
	VERSION,
} from "../config.js";
import {
	createUpload,
	findUploadByKey,
	deleteUploadByKey,
	allUploads,
	clearUploads,
	pingDb,
	expiredUploads,
	deleteExpired,
} from "../database/sqlite.js";
import logger from "../utils/logger.js";

// Multipart framing + the password/deleteAfterDownload fields, on top of the
// file itself.
const MULTIPART_SLACK = 1024 * 1024;
const MAX_UPLOAD_MB = Math.round(MAX_UPLOAD_SIZE / (1024 * 1024));

// Attachment headers for a download. Duplicated inline in both download paths
// before, which is how the RFC 5987 escaping drifted between them.
const attachmentHeaders = (filename) => {
	const asciiFallback = filename
		.replace(/[^\x20-\x7E]/g, "_")
		.replace(/"/g, '\\"');
	const encodedFilename = encodeURIComponent(filename).replace(
		/['()*]/g,
		(c) => "%" + c.charCodeAt(0).toString(16).toUpperCase(),
	);
	return {
		"Content-Type": "application/octet-stream",
		"Content-Disposition": `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encodedFilename}`,
		"Cache-Control": "no-store",
	};
};

// Liveness probe. Touches the DB so a corrupt/unwritable database shows up as
// an unhealthy container instead of a healthy one that 500s on every write.
const healthCheck = ({ set }) => {
	try {
		pingDb.get();
	} catch (error) {
		logger.error(`[healthcheck] db ping failed: ${error?.message}`);
		set.status = 503;
		return { message: "unhealthy" };
	}
	return { message: "ok", version: VERSION };
};

// Bun-native upload: read the multipart body straight off the Fetch request
// and write the file to disk with Bun/fs -- no multer, no upload middleware.
const uploadFile = async ({ request, set }) => {
	// Reject an oversize body BEFORE request.formData(): parsing multipart reads
	// the whole payload into memory, so a single 2GB POST is an OOM long before
	// the per-file size check below is ever reached. Slack covers the multipart
	// boundaries and the small text fields.
	const declared = Number(request.headers.get("content-length") ?? 0);
	if (declared > MAX_UPLOAD_SIZE + MULTIPART_SLACK) {
		set.status = 413;
		return { message: `File too large (max ${MAX_UPLOAD_MB}MB)` };
	}

	const form = await request.formData();
	const file = form.get("file");
	const password = String(form.get("password") ?? "").slice(
		0,
		MAX_PASSWORD_LENGTH,
	);
	const deleteAfterDownload =
		form.get("deleteAfterDownload") === "true" ||
		form.get("deleteAfterDownload") === "on" ||
		form.get("deleteAfterDownload") === "1";

	if (!(file instanceof File)) {
		set.status = 400;
		return { message: "No file selected" };
	}
	if (file.size > MAX_UPLOAD_SIZE) {
		set.status = 413;
		return { message: `File too large (max ${MAX_UPLOAD_MB}MB)` };
	}

	const original =
		path.basename(String(file.name || "upload")).slice(0, MAX_FILENAME_LENGTH) ||
		"upload";

	// Unique key, collision-guarded against the DB's UNIQUE constraint.
	let key = "";
	let storagePath = "";
	do {
		key = randomBytes(KEY_LENGTH).toString("hex");
		storagePath = path.join(UPLOADS_DIR, `${key}-${original}`);
	} while (findUploadByKey.get(key));

	await Bun.write(storagePath, file);

	// The DB row is what makes a file reachable; if the insert fails the upload
	// never happened, so don't leave the bytes orphaned on disk.
	try {
		createUpload.run(
			key,
			storagePath,
			original,
			password,
			deleteAfterDownload ? 1 : 0,
		);
	} catch (error) {
		await unlink(storagePath).catch(() => {});
		logger.error(
			`[upload] DB insert failed for key=${key} (${original}): ${error?.message}`,
		);
		throw error;
	}

	logger.info(
		`[upload] key=${key} name=${original} size=${file.size} dad=${deleteAfterDownload}`,
	);
	set.status = 201;
	return { key, password, filename: original, size: file.size };
};

const downloadFile = async ({ query, set }) => {
	const { key, password = "" } = query || {};

	if (!key) {
		set.status = 400;
		return { message: "Bad Request" };
	}

	const result = findUploadByKey.get(key);
	if (!result) {
		set.status = 404;
		return { message: "Not Found" };
	}
	if (result.password && result.password !== password) {
		set.status = 403;
		return { message: "Unauthorized" };
	}

	// Delete-after-download: nuke the DB row + file before serving so the file
	// is gone even if the connection drops mid-transfer.
	if (result.deleteAfterDownload) {
		deleteUploadByKey.run(key);
		logger.info(`[download] key=${key} deleted after download`);
		let binaryData;
		try {
			binaryData = await readFile(result.file);
		} catch {
			logger.error(`[fs] File not found: ${result.file}`);
			set.status = 410;
			return { message: "File no longer exists" };
		}
		try {
			await unlink(result.file);
		} catch (error) {
			logger.error(
				`[fs] Error deleting file ${result.file}: ${error.message}`,
			);
		}
		const filename = result.original_name || path.basename(result.file);
		set.status = 200;
		return new Response(new Uint8Array(binaryData), {
			status: 200,
			headers: {
				...attachmentHeaders(filename),
				"Content-Length": String(binaryData.length),
			},
		});
	}

	// Non-DAD: stream the file straight from disk (no full-buffer).
	if (!(await Bun.file(result.file).exists())) {
		logger.error(`[fs] File not found: ${result.file}`);
		set.status = 410;
		return { message: "File no longer exists" };
	}
	const filename = result.original_name || path.basename(result.file);
	set.status = 200;
	return new Response(Bun.file(result.file), {
		status: 200,
		headers: attachmentHeaders(filename),
	});
};

// Wipe every uploaded file + DB row. Fixed: the old loop iterated the array
// but never used its elements, so it threw instead of purging.
const purgeEverything = async ({ set }) => {
	const files = allUploads.all();
	// Sequential, not Promise.all: a purge of thousands of files opened a
	// descriptor per file at once.
	for (const record of files) {
		try {
			await unlink(record.file);
			logger.info(`[fs] File ${record.file} deleted from filesystem.`);
		} catch (error) {
			logger.error(`[fs] Error deleting file ${record.file}: ${error.message}`);
		}
	}
	clearUploads.run();
	logger.info(`[purge] Removed ${files.length} upload(s) from database.`);
	return { message: "ok", removed: files.length };
};

// Daily maintenance (cron, loopback only). Replaces the old blind "delete
// everything at 01:00" purge:
//   1. rows + files older than PURGE_MAX_AGE_DAYS
//   2. files on disk that no row references (failed inserts, manual deletes),
//      skipping anything written in the last ORPHAN_GRACE_MS so an in-flight
//      upload is never raced.
// ?dryRun=1 reports what would go and deletes nothing.
const sweepExpired = async ({ query }) => {
	const dryRun = query?.dryRun === "1" || query?.dryRun === "true";
	const expired = [];
	const orphans = [];

	if (PURGE_MAX_AGE_DAYS > 0) {
		const modifier = `-${PURGE_MAX_AGE_DAYS} days`;
		for (const row of expiredUploads.all(modifier)) {
			expired.push({ key: row.key, file: row.file });
			if (dryRun) continue;
			await unlink(row.file).catch((error) => {
				if (error?.code !== "ENOENT") {
					logger.error(`[sweep] cannot delete ${row.file}: ${error.message}`);
				}
			});
		}
		if (!dryRun && expired.length > 0) deleteExpired.run(modifier);
	}

	const referenced = new Set(allUploads.all().map((r) => path.basename(r.file)));
	let entries = [];
	try {
		entries = await readdir(UPLOADS_DIR, { withFileTypes: true });
	} catch (error) {
		logger.error(`[sweep] cannot read ${UPLOADS_DIR}: ${error.message}`);
	}
	for (const entry of entries) {
		if (!entry.isFile() || entry.name === "delete.me") continue;
		if (referenced.has(entry.name)) continue;
		const full = path.join(UPLOADS_DIR, entry.name);
		const info = await stat(full).catch(() => null);
		if (!info) continue;
		if (Date.now() - info.mtimeMs < ORPHAN_GRACE_MS) continue;
		orphans.push(entry.name);
		if (!dryRun) {
			await unlink(full).catch((error) => {
				logger.error(`[sweep] cannot delete orphan ${full}: ${error.message}`);
			});
		}
	}

	if (!dryRun) {
		logger.info(
			`[sweep] age>${PURGE_MAX_AGE_DAYS}d removed=${expired.length} orphans=${orphans.length}`,
		);
	}
	return {
		message: "ok",
		dryRun,
		maxAgeDays: PURGE_MAX_AGE_DAYS,
		expired,
		orphans,
	};
};

export { healthCheck, uploadFile, downloadFile, purgeEverything, sweepExpired };