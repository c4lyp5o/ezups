import { randomBytes } from "node:crypto";
import { writeFile, readFile, unlink } from "node:fs/promises";
import path from "node:path";
import {
	UPLOADS_DIR,
	KEY_LENGTH,
	MAX_UPLOAD_SIZE,
	MAX_PASSWORD_LENGTH,
	MAX_FILENAME_LENGTH,
} from "../config.js";
import {
	createUpload,
	findUploadByKey,
	deleteUploadByKey,
	allUploads,
	clearUploads,
} from "../database/sqlite.js";
import logger from "../utils/logger.js";

const healthCheck = () => ({ message: "ok" });

// Bun-native upload: read the multipart body straight off the Fetch request
// and write the file to disk with Bun/fs -- no multer, no upload middleware.
const uploadFile = async ({ request, set }) => {
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
		return { message: "File too large (max 100MB)" };
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

	await writeFile(storagePath, new Uint8Array(await file.arrayBuffer()));

	createUpload.run(
		key,
		storagePath,
		original,
		password,
		deleteAfterDownload ? 1 : 0,
	);

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

	let binaryData;
	try {
		binaryData = await readFile(result.file);
	} catch {
		logger.error(`[fs] File not found: ${result.file}`);
		set.status = 410;
		return { message: "File no longer exists" };
	}

	// Delete-after-download: nuke the DB row + file before serving so the file
	// is gone even if the connection drops mid-transfer.
	if (result.deleteAfterDownload) {
		deleteUploadByKey.run(key);
		logger.info(`[download] key=${key} deleted after download`);
		try {
			await unlink(result.file);
		} catch (error) {
			logger.error(
				`[fs] Error deleting file ${result.file}: ${error.message}`,
			);
		}
	}

	const filename = result.original_name || path.basename(result.file);
	set.status = 200;
	return new Response(new Uint8Array(binaryData), {
		status: 200,
		headers: {
			"Content-Type": "application/octet-stream",
			"Content-Disposition": `attachment; filename="${filename}"`,
			"Content-Length": String(binaryData.length),
			"Cache-Control": "no-store",
		},
	});
};

// Wipe every uploaded file + DB row. Fixed: the old loop iterated the array
// but never used its elements, so it threw instead of purging.
const purgeEverything = async ({ set }) => {
	const files = allUploads.all();
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

export { healthCheck, uploadFile, downloadFile, purgeEverything };