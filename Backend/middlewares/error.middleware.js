import { logger } from "../utils/logger.js";

export const notFoundMiddleware = (req, _res, next) => {
	const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
	error.statusCode = 404;
	next(error);
};

export const errorMiddleware = (err, req, res, _next) => {
	const statusCode = err.statusCode || 500;

	if (statusCode >= 500) {
		logger.error(`Unhandled error on ${req.method} ${req.originalUrl}`, err);
	}

	res.status(statusCode).json({
		success: false,
		message: err.message || "Internal server error",
	});
};

