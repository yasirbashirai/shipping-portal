import logger from '../utils/logger.js';

/**
 * Standard error response codes
 * @type {Record<string, string>}
 */
const ERROR_CODES = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHENTICATED',
  403: 'UNAUTHORIZED',
  404: 'NOT_FOUND',
  422: 'VALIDATION_ERROR',
  429: 'RATE_LIMITED',
  500: 'INTERNAL_ERROR',
  503: 'SERVICE_UNAVAILABLE',
};

/**
 * Custom application error class with status code and error code
 */
export class AppError extends Error {
  /**
   * @param {string} message - Human-readable error message
   * @param {number} statusCode - HTTP status code
   * @param {string} [code] - Machine-readable error code
   * @param {object} [details] - Additional error details
   */
  constructor(message, statusCode, code, details) {
    super(message);
    this.statusCode = statusCode;
    this.code = code || ERROR_CODES[statusCode] || 'UNKNOWN_ERROR';
    this.details = details || {};
  }
}

/**
 * Global Express error handler middleware
 * Catches all errors and returns consistent JSON response format
 */
export function errorHandler(err, req, res, _next) {
  const statusCode = err.statusCode || 500;
  const code = err.code || ERROR_CODES[statusCode] || 'INTERNAL_ERROR';

  if (statusCode >= 500) {
    logger.error(`${req.method} ${req.path} - ${err.message}`, err);
  } else {
    logger.warn(`${req.method} ${req.path} - ${statusCode} ${err.message}`);
  }

  res.status(statusCode).json({
    success: false,
    error: statusCode >= 500 ? 'Internal server error' : err.message,
    code,
    details: err.details || {},
  });
}
