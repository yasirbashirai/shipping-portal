import { Router } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { validate } from '../middleware/validate.js';
import { rateLimiter } from '../middleware/rateLimit.js';
import { fetchAllRates } from '../carriers/aggregator.js';
import { calculateShipmentData } from '../utils/freightClass.js';

const router = Router();

const rateRequestSchema = z.object({
  cabinetCount: z.number().int().min(1).max(999),
  cabinetType: z.enum(['RTA', 'ASSEMBLED']),
  hasLazySusan: z.boolean().default(false),
  lazySusanQty: z.number().int().min(0).default(0),
  hasVentHood: z.boolean().default(false),
  ventHoodQty: z.number().int().min(0).default(0),
  hasDrawers: z.boolean().default(false),
  drawerQty: z.number().int().min(0).default(0),
  deliveryLocationType: z.enum(['RESIDENTIAL', 'COMMERCIAL']),
  deliveryMethod: z.enum(['CURBSIDE', 'INSIDE_DELIVERY']),
  appointmentRequired: z.boolean().default(false),
  destinationZip: z.string().regex(/^\d{5}$/, 'Must be a 5-digit US ZIP code'),
  originZip: z.string().regex(/^\d{5}$/, 'Must be a 5-digit US ZIP code'),
  sourceWebsite: z.enum(['CABINETS_DEALS', 'NORTHVILLE_CABINETRY']),
});

/**
 * @swagger
 * /api/rates:
 *   post:
 *     summary: Get real-time LTL freight rates from all carriers
 *     tags: [Rates]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Rate quotes from available carriers
 *       422:
 *         description: Validation error
 */
router.post('/', rateLimiter, validate(rateRequestSchema), async (req, res, next) => {
  try {
    const shipmentData = req.validated;
    const { totalWeight, pallets, freightClass } = calculateShipmentData(shipmentData);

    const enrichedData = {
      ...shipmentData,
      totalWeight,
      pallets,
      freightClass,
    };

    const { quotes, errors } = await fetchAllRates(enrichedData);

    const sessionId = `rate_${crypto.randomBytes(12).toString('hex')}`;

    res.json({
      success: true,
      quotes,
      errors: errors.length > 0 ? errors : undefined,
      shipmentSummary: {
        estimatedWeight: totalWeight,
        freightClass,
        estimatedPallets: pallets,
      },
      sessionId,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
