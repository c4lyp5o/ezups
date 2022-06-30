import prisma from '../../lib/prisma';
import nextConnect from 'next-connect';
import middleware from '../../middleware/conf';
import path from 'path';
import fs from 'fs';

const downloadAPI = nextConnect();
downloadAPI.use(middleware);

var key = '';
var password = '';

async function responseType(req, res) {
  res.status(404).json({
    status: 'Failed',
    code: 404,
    message: 'No file found using the key provided!',
  });
}

downloadAPI.get(async (req, res) => {
  const Uploads = await prisma.uploads.findFirst({
    where: {
      key: key,
      // password: password,
    },
  });
  if (!Uploads) {
    responseType(req, res);
  } else {
    const file = fs.readFileSync(path.resolve(process.cwd(), Uploads.path));
    res.setHeader('Content-Type', Uploads.mimetype);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=${Uploads.filename}`
    );
    res.send(file);
  }
});

downloadAPI.post(async (req, res) => {
  key = req.body.key;
  password = req.body.password;
  const Uploads = await prisma.uploads.findFirst({
    where: {
      key: key,
      // password: password,
    },
  });
  console.log(Uploads);
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
