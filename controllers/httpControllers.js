import crypto from 'node:crypto';
import { readFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import initializeDatabase from '@/database/sqlite';
import {
  hasCache,
  setCache,
  deleteCache,
  clearCache,
} from '@/database/cache.js';
import logger from '@/utils/logger.js';
import { type } from 'node:os';

const ezupsDb = await initializeDatabase();

const healthCheck = (_req, res) => {
  res.status(200).json({ message: 'ok' });
};

const uploadFile = async (req, res) => {
  const [file] = req.files;
  const { password = '', deleteAfterDownload = 'false' } = req.body || {};

  if (!file) return res.status(400).json({ message: 'Bad Request' });

  let key;
  do {
    key = crypto.randomBytes(3).toString('hex');
    if (hasCache(key)) {
      logger.warn(
        `[cache] Key ${key} already exists in cache. Generating a new key.`
      );
    }
  } while (hasCache(key));
  setCache(key, true);
  logger.info(`[cache] Key ${key} added to cache.`);

  ezupsDb
    .prepare(
      'INSERT INTO uploads (key, file, password, deleteAfterDownload) VALUES (?, ?, ?, ?)'
    )
    .run(
      key,
      file.path,
      password,
      deleteAfterDownload === 'true' ? true : false
    );

  res.status(201).json({ key, password });
};

const downloadFile = async (req, res) => {
  const { key, password } = req.query || {};

  if (!key) return res.status(400).json({ message: 'Bad Request' });

  if (!hasCache(key)) return res.status(404).json({ message: 'Not Found' });

  const result = ezupsDb
    .prepare('SELECT * FROM uploads WHERE key = ?')
    .get(key);

  if (!result) return res.status(404).json({ message: 'Not Found' });

  if (result.password && result.password !== password) {
    return res.status(403).json({ message: 'Unauthorized' });
  }

  let binaryData;
  try {
    binaryData = await readFile(result.file);
  } catch (err) {
    logger.error(`[fs] File not found: ${result.file}`);
    return res.status(410).json({ message: 'File no longer exists' });
  }

  if (result.deleteAfterDownload) {
    ezupsDb.prepare('DELETE FROM uploads WHERE key = ?').run(key);
    deleteCache(key);
    logger.info(`[cache] Key ${key} deleted from cache.`);
    try {
      await unlink(result.file);
      logger.info(`[fs] File ${result.file} deleted from filesystem.`);
    } catch (error) {
      logger.error(`[fs] Error deleting file ${result.file}: ${error.message}`);
    }
  }

  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=\"${path.basename(result.file)}\"`
  );
  res.setHeader('Content-Length', binaryData.length);
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).send(binaryData);
};

const purgeEverything = (_req, res) => {
  ezupsDb
    .prepare('SELECT * FROM uploads')
    .all()
    .forEach((uploaded) => {
      try {
        unlink(uploaded.file);
        logger.info(`[fs] File ${uploaded.file} deleted from filesystem.`);
      } catch (error) {
        logger.error(
          `[fs] Error deleting file ${uploaded.file}: ${error.message}`
        );
      }
    });
  ezupsDb.prepare('DELETE FROM uploads').run();
  logger.info('[db] All keys deleted from database.');
  clearCache();
  logger.info('[cache] All keys deleted from cache.');
  res.status(200).json({ message: 'ok' });
};

export { healthCheck, uploadFile, downloadFile, purgeEverything };
