import { logger } from "./logger.js";

export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = "AppError";
  }
}

export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((error) => {
    logger.error("Async handler error:", error);
    next(error);
  });
};

export const createErrorResponse = (statusCode, message, errors = null) => ({
  success: false,
  statusCode,
  message,
  ...(errors && { errors })
});
