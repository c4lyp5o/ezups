import multer from "multer";

const safekeeping = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, "./uploads");
	},
	filename: (req, file, cb) => {
		cb(null, `${file.originalname}`);
	},
});

const uploadSystem = multer({
	storage: safekeeping,
	limits: 100 * 1024 * 1024,
}).any();

export default uploadSystem;
