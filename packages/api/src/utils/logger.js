import winston from 'winston';

const { combine, timestamp, printf, colorize, errors } = winston.format;

/**
 * Custom log format for console output
 */
const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

/**
 * Application-wide Winston logger instance
 * - Console transport with colors in development
 * - File transport for errors in all environments
 * @type {winston.Logger}
 */
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true })
  ),
  transports: [
    new winston.transports.Console({
      format: combine(colorize(), logFormat),
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: combine(logFormat),
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: combine(logFormat),
    }),
  ],
});

// Suppress logs during tests
if (process.env.NODE_ENV === 'test') {
  logger.silent = true;
}

export default logger;
