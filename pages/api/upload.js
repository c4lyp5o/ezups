import middleware from '../../middleware/conf';
import nextConnect from 'next-connect';
import prisma from '../../lib/prisma';
import crypto from 'crypto';

const uploadAPI = nextConnect();

uploadAPI.use(middleware);

uploadAPI.post(async (req, res) => {
  const random = crypto.randomBytes(3).toString('hex');
  const Uploads = await prisma.uploads.create({
    data: {
      filename: req.files[0].filename,
      mimetype: req.files[0].mimetype,
      path: req.files[0].path,
      size: req.files[0].size,
      key: random,
      password: req.body.password,
      dad: 'yes',
    },
  });
  res.status(200).json({
    message: 'File Uploaded',
    file: Uploads.filename,
    size: Uploads.size,
    key: Uploads.key,
    password: Uploads.password,
    dad: Uploads.dad,
  });
});

export const config = {
  api: {
    bodyParser: false,
  },
};

export default uploadAPI;
