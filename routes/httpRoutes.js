import { Router } from 'express';
import limiter from '@/middlewares/rateLimiter.js';
import uploadSystem from '@/middlewares/multer';
import {
  healthCheck,
  uploadFile,
  downloadFile,
  purgeEverything,
} from '@/controllers/httpControllers.js';
import localAuth from '@/middlewares/localAuth.js';

const router = Router();

router.get('/healthcheck', localAuth, healthCheck);
router.post('/upload', limiter, uploadSystem, uploadFile);
router.get('/download', limiter, downloadFile);
router.delete('/purge', localAuth, purgeEverything);

export default router;
