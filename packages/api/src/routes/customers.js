import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * /api/customers:
 *   get:
 *     summary: List all customers with filters
 *     tags: [Customers]
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const {
      sourceWebsite, search,
      page = '1', limit = '25',
      sortBy = 'createdAt', sortOrder = 'desc',
    } = req.query;

    const where = {};
    if (sourceWebsite) where.sourceWebsite = sourceWebsite;
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        include: { _count: { select: { orders: true } } },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take,
      }),
      prisma.customer.count({ where }),
    ]);

    res.json({
      success: true,
      customers,
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
 * /api/customers/{id}:
 *   get:
 *     summary: Get customer with full order history
 *     tags: [Customers]
 */
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: req.params.id },
      include: {
        orders: {
          include: { shipmentDetails: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!customer) throw new AppError('Customer not found', 404);

    res.json({ success: true, customer });
  } catch (err) {
    next(err);
  }
});

export default router;
