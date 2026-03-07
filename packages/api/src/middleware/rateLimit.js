import rateLimit from 'express-rate-limit';

/**
 * General API rate limiter — 100 requests per 15 minutes per IP
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests, please try again later',
    code: 'RATE_LIMITED',
    details: {},
  },
});

/**
 * Auth endpoint rate limiter — 10 attempts per 15 minutes per IP
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many login attempts, please try again later',
    code: 'RATE_LIMITED',
    details: {},
  },
});

/**
 * Rate quote endpoint limiter — 30 requests per 15 minutes per IP
 */
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many rate requests, please try again later',
    code: 'RATE_LIMITED',
    details: {},
  },
});
