import { multmidd, logmidd } from '../../middleware/conf';
import prisma from '../../lib/prisma';
import nextConnect from 'next-connect';
import path from 'path';
import fs from 'fs';

const downloadAPI = nextConnect();
downloadAPI.use(multmidd);

async function responseType(req, res) {
  logmidd.warn(`${req.method} ${req.url} User entered wrong key / password`);
  return res.status(404).json({
    status: 'Failed',
    code: 404,
    error: 'No file found using the key / password provided!',
  });
}

async function deleteFile(id, path) {
  await prisma.uploads.delete({
    where: {
      id: id,
    },
  });
  setTimeout(() => {
    try {
      fs.unlinkSync(path);
    } catch (error) {
      console.log(error);
    }
  }, 10000);
}

async function findFile(key, password) {
  const file = await prisma.uploads.findFirst({
    where: {
      key: key,
      password: password,
    },
  });
  return file;
}

downloadAPI.get(async (req, res) => {
  const { key, password } = req.query;
  const Uploads = await findFile(key, password);
  try {
    logmidd.info(
      `${req.method} ${req.url} Downloading file: ${Uploads.filename}`
    );
    res.setHeader('Content-Type', Uploads.mimetype);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=${Uploads.filename}`
    );
    res.send(fs.readFileSync(path.resolve(process.cwd(), Uploads.path)));
  } catch (error) {
    responseType(req, res);
  }
  if (Uploads.dad === 'true') {
    logmidd.info(`${req.method} ${req.url} Deleting file`);
    await deleteFile(Uploads.id, Uploads.path);
  }
});

downloadAPI.post(async (req, res) => {
  const { key, password } = req.body;
  if (!key) {
    logmidd.warn(
      `${req.method} ${req.url} User accessed API route without file key`
    );
    return res.status(401).json({ error: "Don't do that again!" });
  }
  logmidd.info(`${req.method} ${req.url} Searching for file`);
  const Uploads = await findFile(key, password);
  try {
    const { filename, size, mimetype, dad } = Uploads;
    res.status(200).json({
      status: 'Success',
      code: 200,
      message: 'File found!',
      file: filename,
      size: size,
      mimetype: mimetype,
      dad: dad,
    });
  } catch (error) {
    responseType(req, res);
  }
});

export default downloadAPI;
