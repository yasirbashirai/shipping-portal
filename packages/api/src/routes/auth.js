import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimit.js';
import { AppError } from '../middleware/errorHandler.js';
import logger from '../utils/logger.js';

const router = Router();
const prisma = new PrismaClient();

const loginSchema = z.object({
  email: z.string().email('Valid email required'),
  password: z.string().min(1, 'Password required'),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token required'),
});

/**
 * Generates JWT access and refresh token pair
 * @param {object} user - Admin user record
 * @returns {{ accessToken: string, refreshToken: string }}
 */
async function generateTokens(user) {
  const accessToken = jwt.sign(
    { userId: user.id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' }
  );

  const refreshTokenValue = crypto.randomBytes(64).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await prisma.refreshToken.create({
    data: {
      token: refreshTokenValue,
      adminUserId: user.id,
      expiresAt,
    },
  });

  return { accessToken, refreshToken: refreshTokenValue };
}

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Admin login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200: { description: Login successful }
 *       401: { description: Invalid credentials }
 */
router.post('/login', authLimiter, validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.validated;

    const user = await prisma.adminUser.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      throw new AppError('Invalid email or password', 401);
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new AppError('Invalid email or password', 401);
    }

    const tokens = await generateTokens(user);

    await prisma.adminUser.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    logger.info(`Admin login: ${user.email}`);

    res.json({
      success: true,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      ...tokens,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Auth]
 */
router.post('/refresh', validate(refreshSchema), async (req, res, next) => {
  try {
    const { refreshToken } = req.validated;

    const stored = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { adminUser: true },
    });

    if (!stored || stored.expiresAt < new Date()) {
      if (stored) {
        await prisma.refreshToken.delete({ where: { id: stored.id } });
      }
      throw new AppError('Invalid or expired refresh token', 401);
    }

    // Delete old token and issue new pair
    await prisma.refreshToken.delete({ where: { id: stored.id } });
    const tokens = await generateTokens(stored.adminUser);

    res.json({
      success: true,
      ...tokens,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout — invalidate refresh token
 *     tags: [Auth]
 */
router.post('/logout', authenticate, async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
    }

    // Clean up all expired tokens for this user
    await prisma.refreshToken.deleteMany({
      where: {
        adminUserId: req.user.userId,
        expiresAt: { lt: new Date() },
      },
    });

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
});

export default router;
