import { multmidd, logmidd } from '../../middleware/conf';
import prisma from '../../lib/prisma';
import nextConnect from 'next-connect';
import path from 'path';
import fs from 'fs';

const cronAPI = nextConnect();
cronAPI.use(multmidd);

cronAPI.post(async (req, res, next) => {
  logmidd.info(`${req.method} ${req.url} Clearing all database and files`);
  const uploads = await prisma.uploads.findMany();
  logmidd.info(`${req.method} ${req.url} Found ${uploads.length} files`);
  for (const upload of uploads) {
    await prisma.uploads.delete({
      where: {
        id: upload.id,
      },
    });
    logmidd.info(`${req.method} ${req.url} Deleting entry in DB`);
    const filePath = path.resolve(process.cwd(), upload.path);
    try {
      fs.unlinkSync(filePath);
      logmidd.info(`${req.method} ${req.url} Deleting file`);
    } catch (error) {
      next;
    }
  }
  logmidd.info(`${req.method} ${req.url} Cleared all database and files`);
  res.status(200).json({
    status: 'Success',
    code: 200,
    message: 'All files and database entries deleted',
    uploads: uploads,
  });
});

export default cronAPI;
