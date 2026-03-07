import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler.js';

/**
 * JWT authentication middleware
 * Verifies access token from Authorization header
 * Attaches decoded user data to req.user
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export function authenticate(req, _res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Authentication required', 401));
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new AppError('Access token expired', 401, 'TOKEN_EXPIRED'));
    }
    return next(new AppError('Invalid access token', 401));
  }
}

/**
 * Role-based authorization middleware factory
 * Checks that the authenticated user has one of the allowed roles
 * @param {...string} roles - Allowed roles (e.g., 'OWNER', 'STAFF')
 * @returns {import('express').RequestHandler}
 */
export function authorize(...roles) {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }
    if (!roles.includes(req.user.role)) {
      return next(new AppError('Insufficient permissions', 403));
    }
    next();
  };
}
