import prisma from '../../lib/prisma';
import nextConnect from 'next-connect';
import middleware from '../../middleware/conf';
import path from 'path';
import fs from 'fs';

const downloadAPI = nextConnect();
downloadAPI.use(middleware);

async function responseType(req, res) {
  return res.status(404).json({
    status: 'Failed',
    code: 404,
    message: 'No file found using the key provided!',
  });
}

downloadAPI.get(async (req, res) => {
  // console.log(req.query);
  const { key, password } = req.query;
  const Uploads = await prisma.uploads.findFirst({
    where: {
      key: key,
      password: password,
    },
  });
  if (!Uploads) {
    responseType(req, res);
  }
  // else if (Uploads.password !== password) {
  //   responseType(req, res);
  // }
  const file = fs.readFileSync(path.resolve(process.cwd(), Uploads.path));
  res.setHeader('Content-Type', Uploads.mimetype);
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=${Uploads.filename}`
  );
  res.send(file);
});

downloadAPI.post(async (req, res) => {
  const Uploads = await prisma.uploads.findFirst({
    where: {
      key: req.body.key,
      password: req.body.password,
    },
  });
  try {
    const { filename, size, mimetype } = Uploads;
    res.status(200).json({
      status: 'Success',
      code: 200,
      message: 'File found!',
      file: filename,
      size: size,
      mimetype: mimetype,
    });
  } catch (error) {
    responseType(req, res);
  }
  // if (!Uploads) {
  //   responseType(req, res);
  // } else {
  //   res.status(200).json({
  //     message: 'File Downloaded',
  //     file: Uploads.filename,
  //     size: Uploads.size,
  //     mimetype: Uploads.mimetype,
  //   });
  // }
});

export default downloadAPI;
