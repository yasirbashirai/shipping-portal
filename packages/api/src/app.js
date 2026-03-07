import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { PrismaClient } from '@prisma/client';
import { errorHandler } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimit.js';
import authRoutes from './routes/auth.js';
import ratesRoutes from './routes/rates.js';
import ordersRoutes from './routes/orders.js';
import customersRoutes from './routes/customers.js';
import trackingRoutes from './routes/tracking.js';
import { authenticate, authorize } from './middleware/auth.js';
import logger from './utils/logger.js';

const app = express();
const prisma = new PrismaClient();

// ─── Core Middleware ──────────────────────────────────────────────────────────

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',')
    : ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(apiLimiter);

// ─── Swagger Documentation ───────────────────────────────────────────────────

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Shipping Portal API',
      version: '1.0.0',
      description: 'Unified Shipping & Order Management Portal API for cabinet e-commerce',
    },
    servers: [{ url: '/api' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
  },
  apis: ['./src/routes/*.js'],
});

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ─── Routes ───────────────────────────────────────────────────────────────────

app.use('/api/auth', authRoutes);
app.use('/api/rates', ratesRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/tracking', trackingRoutes);

// ─── Dashboard Stats ─────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/dashboard/stats:
 *   get:
 *     summary: Dashboard overview statistics
 *     tags: [Dashboard]
 *     security: [{ bearerAuth: [] }]
 */
app.get('/api/dashboard/stats', authenticate, async (req, res, next) => {
  try {
    const { sourceWebsite } = req.query;
    const where = sourceWebsite ? { sourceWebsite } : {};

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      ordersToday,
      ordersThisWeek,
      pendingTracking,
      revenueThisMonth,
      newCustomersThisWeek,
      carrierUsage,
      recentOrders,
    ] = await Promise.all([
      prisma.order.count({ where: { ...where, createdAt: { gte: today } } }),
      prisma.order.count({ where: { ...where, createdAt: { gte: weekAgo } } }),
      prisma.order.count({
        where: { ...where, trackingNumber: null, status: { in: ['PROCESSING', 'BOOKED'] } },
      }),
      prisma.order.aggregate({
        where: { ...where, createdAt: { gte: monthStart } },
        _sum: { totalAmount: true },
      }),
      prisma.customer.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.order.groupBy({
        by: ['carrierBooked'],
        where: { ...where, carrierBooked: { not: null } },
        _count: true,
        orderBy: { _count: { carrierBooked: 'desc' } },
      }),
      prisma.order.findMany({
        where,
        include: { customer: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    res.json({
      success: true,
      stats: {
        ordersToday,
        ordersThisWeek,
        pendingTracking,
        revenueThisMonth: revenueThisMonth._sum.totalAmount || 0,
        newCustomersThisWeek,
        carrierUsage: carrierUsage.map((c) => ({
          carrier: c.carrierBooked,
          count: c._count,
        })),
        recentOrders,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── Rate Audit (Owner only) ─────────────────────────────────────────────────

app.get('/api/rates/audit', authenticate, authorize('OWNER'), async (req, res, next) => {
  try {
    const quotes = await prisma.rateQuote.findMany({
      include: { order: { select: { orderNumber: true, sourceWebsite: true } } },
      orderBy: { quotedAt: 'desc' },
      take: 100,
    });

    res.json({ success: true, quotes });
  } catch (err) {
    next(err);
  }
});

// ─── Health Check ─────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check
 *     tags: [System]
 */
app.get('/api/health', async (_req, res) => {
  let dbStatus = 'connected';
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    dbStatus = 'disconnected';
  }

  res.json({
    success: true,
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: dbStatus,
    version: '1.0.0',
  });
});

// ─── Error Handler ────────────────────────────────────────────────────────────

app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3001;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    logger.info(`Shipping Portal API running on port ${PORT}`);
    logger.info(`Swagger docs: http://localhost:${PORT}/api/docs`);
  });
}

export default app;
