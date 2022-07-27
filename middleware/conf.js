import nextConnect from 'next-connect';
import multer from 'multer';
import log4js from 'log4js';
import crypt from 'simple-crypto-js';

const cryptic = new crypt(process.env.API_SALT);

log4js.configure({
  appenders: {
    everything: {
      type: 'file',
      filename: 'logs/everything.log',
      maxLogSize: 10485760,
      backups: 3,
      compress: true,
      layout: {
        type: 'pattern',
        pattern: '%d %p %c - %m',
      },
    },
  },
  categories: {
    default: { appenders: ['everything'], level: 'info' },
  },
});

const logmidd = log4js.getLogger();
logmidd.level = 'info';

const safekeeping = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './public/uploads');
  },
  filename: (req, file, cb) => {
    cb(null, `${file.originalname}`);
  },
});

const multmidd = nextConnect({
  onError(error, req, res) {
    res
      .status(501)
      .json({ error: `Sorry something Happened! ${error.message}` });
  },
  onNoMatch(req, res) {
    res.status(405).json({ error: `Method "${req.method}" Not Allowed` });
  },
  onBadRequest(req, res) {
    res.status(400).json({ error: `Bad Request` });
  },
})
  .use(multer({ storage: safekeeping }).any())
  .post((req, res, next) => {
    try {
      const { API_KEY } = req.body;
      if (!API_KEY) {
        logmidd.warn(
          `${req.method} ${req.url} User accessed API route without API key`
        );
        return res.status(401).json({ error: `Unauthorized` });
      }
      const dehashed = cryptic.decrypt(req.body.API_KEY);
      if (dehashed !== process.env.API_KEY) {
        logmidd.warn(
          `${req.method} ${req.url} User accessed API route with invalid API key`
        );
        return res.status(401).json({ error: `Unauthorized` });
      }
      next();
    } catch (error) {
      logmidd.warn(
        `${req.method} ${req.url} User accessed API route without API key`
      );
      res.status(401).json({ error: "Don't do that again!" });
    }
  })
  .get((req, res, next) => {
    try {
      const { key } = req.query;
      if (!key) {
        logmidd.warn(
          `${req.method} ${req.url} User accessed API route without file key`
        );
        return res.status(401).json({ error: "Don't do that again!" });
      }
      next();
    } catch (error) {
      logmidd.warn(
        `${req.method} ${req.url} User accessed API route without API key`
      );
      res.status(401).json({ error: `Unauthorized` });
    }
  });

export { multmidd, logmidd };
