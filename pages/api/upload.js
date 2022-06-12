import middleware from '../../middleware/conf';
import nextConnect from 'next-connect';

const uploadAPI = nextConnect();

uploadAPI.use(middleware);

uploadAPI.post((req, res) => {
  console.log(req.files);
  res.status(200).json({
    message: 'File Uploaded',
    file: req.files[0].filename,
    size: req.files[0].size,
  });
});

export const config = {
  api: {
    bodyParser: false,
  },
};

export default uploadAPI;
