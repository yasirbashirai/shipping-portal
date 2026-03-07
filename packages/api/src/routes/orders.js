import { Router } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { validate } from '../middleware/validate.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import logger from '../utils/logger.js';

const router = Router();
const prisma = new PrismaClient();

// ─── Schemas ─────────────────────────────────────────────────────────────────

const createOrderSchema = z.object({
  magentoOrderId: z.string().min(1),
  sourceWebsite: z.enum(['CABINETS_DEALS', 'NORTHVILLE_CABINETRY']),
  customer: z.object({
    email: z.string().email(),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    phone: z.string().optional(),
  }),
  shipmentDetails: z.object({
    originZip: z.string().regex(/^\d{5}$/),
    destinationZip: z.string().regex(/^\d{5}$/),
    destinationCity: z.string().optional(),
    destinationState: z.string().optional(),
    cabinetCount: z.number().int().min(1),
    cabinetType: z.enum(['RTA', 'ASSEMBLED']),
    hasLazySusan: z.boolean().default(false),
    lazySusanQty: z.number().int().min(0).optional(),
    hasVentHood: z.boolean().default(false),
    ventHoodQty: z.number().int().min(0).optional(),
    hasDrawers: z.boolean().default(false),
    drawerQty: z.number().int().min(0).optional(),
    deliveryLocationType: z.enum(['RESIDENTIAL', 'COMMERCIAL']),
    deliveryMethod: z.enum(['CURBSIDE', 'INSIDE_DELIVERY']),
    appointmentRequired: z.boolean().default(false),
    estimatedWeight: z.number().positive(),
    freightClass: z.string().optional(),
    estimatedPallets: z.number().int().min(1).optional(),
  }),
  selectedRateSessionId: z.string().optional(),
  totalAmount: z.number().positive(),
  signature: z.string().optional(),
});

const updateStatusSchema = z.object({
  status: z.enum([
    'PENDING', 'PROCESSING', 'BOOKED', 'IN_TRANSIT',
    'DELIVERED', 'CANCELLED', 'ON_HOLD',
  ]),
});

const updateTrackingSchema = z.object({
  trackingNumber: z.string().min(1),
  carrierBooked: z.enum(['XPO', 'RL_CARRIERS', 'SEFL', 'FEDEX_FREIGHT']),
  estimatedDelivery: z.string().datetime().optional(),
});

const updateNotesSchema = z.object({
  adminNotes: z.string(),
});

/**
 * Generates sequential order number in format SP-YYYY-NNNNN
 * @returns {Promise<string>}
 */
async function generateOrderNumber() {
  const year = new Date().getFullYear();
  const prefix = `SP-${year}-`;
  const lastOrder = await prisma.order.findFirst({
    where: { orderNumber: { startsWith: prefix } },
    orderBy: { orderNumber: 'desc' },
  });

  let nextNum = 1;
  if (lastOrder) {
    const lastNum = parseInt(lastOrder.orderNumber.split('-')[2], 10);
    nextNum = lastNum + 1;
  }

  return `${prefix}${String(nextNum).padStart(5, '0')}`;
}

/**
 * Verifies HMAC signature for Magento webhook payloads
 * @param {object} payload - Request body
 * @param {string} signature - HMAC signature from request
 * @returns {boolean}
 */
function verifyWebhookSignature(payload, signature) {
  if (!process.env.MAGENTO_WEBHOOK_SECRET) return true;
  const { signature: _sig, ...data } = payload;
  const expected = crypto
    .createHmac('sha256', process.env.MAGENTO_WEBHOOK_SECRET)
    .update(JSON.stringify(data))
    .digest('hex');
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create order from Magento webhook
 *     tags: [Orders]
 */
router.post('/', validate(createOrderSchema), async (req, res, next) => {
  try {
    const data = req.validated;

    // Verify HMAC signature if present
    if (data.signature && !verifyWebhookSignature(req.body, data.signature)) {
      throw new AppError('Invalid webhook signature', 401, 'INVALID_SIGNATURE');
    }

    // Upsert customer
    const customer = await prisma.customer.upsert({
      where: { email: data.customer.email },
      update: {
        firstName: data.customer.firstName,
        lastName: data.customer.lastName,
        phone: data.customer.phone,
      },
      create: {
        email: data.customer.email,
        firstName: data.customer.firstName,
        lastName: data.customer.lastName,
        phone: data.customer.phone,
        sourceWebsite: data.sourceWebsite,
      },
    });

    const orderNumber = await generateOrderNumber();

    const order = await prisma.order.create({
      data: {
        orderNumber,
        magentoOrderId: data.magentoOrderId,
        sourceWebsite: data.sourceWebsite,
        customerId: customer.id,
        totalAmount: data.totalAmount,
        shipmentDetails: {
          create: data.shipmentDetails,
        },
      },
      include: { shipmentDetails: true, customer: true },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        orderId: order.id,
        action: 'ORDER_CREATED',
        newValue: `Order ${orderNumber} created from ${data.sourceWebsite}`,
        performedBy: 'MAGENTO_WEBHOOK',
      },
    });

    logger.info(`Order created: ${orderNumber} from ${data.sourceWebsite}`);

    res.status(201).json({ success: true, order });
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: List all orders with filters
 *     tags: [Orders]
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const {
      status, sourceWebsite, search,
      startDate, endDate,
      page = '1', limit = '25',
      sortBy = 'createdAt', sortOrder = 'desc',
    } = req.query;

    const where = {};
    if (status) where.status = status;
    if (sourceWebsite) where.sourceWebsite = sourceWebsite;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { customer: { email: { contains: search, mode: 'insensitive' } } },
        { customer: { firstName: { contains: search, mode: 'insensitive' } } },
        { customer: { lastName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: { customer: true, shipmentDetails: true },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take,
      }),
      prisma.order.count({ where }),
    ]);

    res.json({
      success: true,
      orders,
      pagination: {
        page: parseInt(page),
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Get single order with full details
 *     tags: [Orders]
 */
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        customer: true,
        shipmentDetails: true,
        rateQuotes: { orderBy: { totalCost: 'asc' } },
        auditLogs: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!order) throw new AppError('Order not found', 404);

    res.json({ success: true, order });
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/orders/{id}/status:
 *   patch:
 *     summary: Update order status
 *     tags: [Orders]
 */
router.patch('/:id/status', authenticate, validate(updateStatusSchema), async (req, res, next) => {
  try {
    const existing = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new AppError('Order not found', 404);

    const { status } = req.validated;

    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: { status },
    });

    await prisma.auditLog.create({
      data: {
        orderId: order.id,
        action: 'STATUS_CHANGED',
        oldValue: existing.status,
        newValue: status,
        performedBy: req.user.email,
      },
    });

    logger.info(`Order ${order.orderNumber} status: ${existing.status} → ${status}`);

    res.json({ success: true, order });
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/orders/{id}/tracking:
 *   patch:
 *     summary: Add/update tracking number
 *     tags: [Orders]
 */
router.patch('/:id/tracking', authenticate, validate(updateTrackingSchema), async (req, res, next) => {
  try {
    const existing = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new AppError('Order not found', 404);

    const { trackingNumber, carrierBooked, estimatedDelivery } = req.validated;

    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: {
        trackingNumber,
        carrierBooked,
        estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) : undefined,
        status: 'BOOKED',
      },
    });

    await prisma.auditLog.create({
      data: {
        orderId: order.id,
        action: 'TRACKING_ADDED',
        oldValue: existing.trackingNumber,
        newValue: trackingNumber,
        performedBy: req.user.email,
      },
    });

    logger.info(`Tracking added to ${order.orderNumber}: ${trackingNumber}`);

    res.json({ success: true, order });
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/orders/{id}/notes:
 *   patch:
 *     summary: Add admin notes to order
 *     tags: [Orders]
 */
router.patch('/:id/notes', authenticate, validate(updateNotesSchema), async (req, res, next) => {
  try {
    const existing = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new AppError('Order not found', 404);

    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: { adminNotes: req.validated.adminNotes },
    });

    await prisma.auditLog.create({
      data: {
        orderId: order.id,
        action: 'NOTES_UPDATED',
        oldValue: existing.adminNotes,
        newValue: req.validated.adminNotes,
        performedBy: req.user.email,
      },
    });

    res.json({ success: true, order });
  } catch (err) {
    next(err);
  }
});

export default router;
