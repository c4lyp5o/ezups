const notFound = (_req, res, _next) => {
	res.status(404).json({ message: "Not found" });
};

export default notFound;
