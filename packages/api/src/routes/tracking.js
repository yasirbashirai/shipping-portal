import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { AppError } from '../middleware/errorHandler.js';
import logger from '../utils/logger.js';

const router = Router();
const prisma = new PrismaClient();

const batchTrackingSchema = z.object({
  updates: z.array(
    z.object({
      orderId: z.string().min(1),
      trackingNumber: z.string().min(1),
      carrierBooked: z.enum(['XPO', 'RL_CARRIERS', 'SEFL', 'FEDEX_FREIGHT']),
    })
  ).min(1),
});

/**
 * @swagger
 * /api/tracking:
 *   get:
 *     summary: Get orders needing tracking numbers
 *     tags: [Tracking]
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      where: {
        status: { in: ['PROCESSING', 'BOOKED'] },
        trackingNumber: null,
      },
      include: { customer: true },
      orderBy: { createdAt: 'asc' },
    });

    res.json({ success: true, orders });
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/tracking/batch:
 *   post:
 *     summary: Batch update tracking numbers
 *     tags: [Tracking]
 */
router.post('/batch', authenticate, validate(batchTrackingSchema), async (req, res, next) => {
  try {
    const { updates } = req.validated;
    const results = [];

    for (const update of updates) {
      const existing = await prisma.order.findUnique({ where: { id: update.orderId } });
      if (!existing) {
        results.push({ orderId: update.orderId, success: false, error: 'Order not found' });
        continue;
      }

      const order = await prisma.order.update({
        where: { id: update.orderId },
        data: {
          trackingNumber: update.trackingNumber,
          carrierBooked: update.carrierBooked,
          status: 'BOOKED',
        },
      });

      await prisma.auditLog.create({
        data: {
          orderId: order.id,
          action: 'TRACKING_ADDED',
          oldValue: existing.trackingNumber,
          newValue: update.trackingNumber,
          performedBy: req.user.email,
        },
      });

      results.push({ orderId: update.orderId, success: true, orderNumber: order.orderNumber });
    }

    logger.info(`Batch tracking update: ${results.filter(r => r.success).length}/${updates.length} successful`);

    res.json({ success: true, results });
  } catch (err) {
    next(err);
  }
});

export default router;
