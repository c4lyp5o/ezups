import { rateLimit } from "express-rate-limit";

const limiter = rateLimit({
	windowMs: 1 * 60 * 1000, // 1 minute
	max: 50, // Limit each IP to 50 requests per windowMs
	message: "Too many requests from this IP, please try again after a minute",
});

export default limiter;
