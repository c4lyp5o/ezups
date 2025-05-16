import logger from "../utils/logger.js";

const errorHandler = (err, _req, res, _next) => {
	logger.error(err.message);
	res.status(500).json({ message: "Internal Server Error" });
};

export default errorHandler;
