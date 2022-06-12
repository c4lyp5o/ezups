import nextConnect from 'next-connect';
import multer from 'multer';

const safekeeping = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './public/uploads');
  },
  filename: (req, file, cb) => {
    cb(null, `${file.originalname}`);
  },
});

const middleware = nextConnect({
  onError(error, req, res) {
    res
      .status(501)
      .json({ error: `Sorry something Happened! ${error.message}` });
  },
  onNoMatch(req, res) {
    res.status(405).json({ error: `Method "${req.method}" Not Allowed` });
  },
});

middleware.use(multer({ storage: safekeeping }).any());

export default middleware;
