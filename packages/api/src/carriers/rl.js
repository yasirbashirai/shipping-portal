import axios from 'axios';
import { calculateShipmentData } from '../utils/freightClass.js';
import { getNextBusinessDay, getEstimatedDeliveryDate } from '../utils/weightCalc.js';
import logger from '../utils/logger.js';

const RL_BASE = 'https://www.rlcarriers.com/api/v2';

/**
 * Normalizes R+L Carriers API response into standard quote format
 * @param {object} data - Raw R+L API response
 * @returns {object[]} Normalized quotes
 */
function normalizeRLResponse(data) {
  const quote = data.RateQuote || data;
  return [{
    carrier: 'RL_CARRIERS',
    serviceLevel: quote.ServiceType || 'Standard LTL',
    totalCost: parseFloat(quote.TotalCharges || quote.NetCharge || 0),
    transitDays: parseInt(quote.ServiceDays || quote.TransitDays || 5, 10),
    estimatedDelivery: quote.DeliveryDate || getEstimatedDeliveryDate(parseInt(quote.ServiceDays || 5, 10)).toISOString(),
    logoUrl: '/logos/rl.svg',
    features: [],
    rawResponse: quote,
  }];
}

/**
 * Fetches rate quotes from R+L Carriers API
 * @param {object} shipmentData - Enriched shipment data
 * @returns {Promise<object[]>} Normalized rate quotes
 */
export async function getRates(shipmentData) {
  const { totalWeight, pallets, freightClass, accessorials } = calculateShipmentData(shipmentData);

  const resp = await axios.post(
    `${RL_BASE}/rateQuote`,
    {
      Origin: { Zip: shipmentData.originZip, Country: 'USA' },
      Destination: { Zip: shipmentData.destinationZip, Country: 'USA' },
      Items: [{
        Weight: totalWeight,
        Class: freightClass,
        Pieces: pallets,
      }],
      Accessorials: accessorials,
      PickupDate: getNextBusinessDay().toISOString().split('T')[0],
    },
    {
      headers: { apiKey: process.env.RL_API_KEY },
      timeout: 8000,
    }
  );

  logger.info('R+L Carriers rate quote received');
  return normalizeRLResponse(resp.data);
}
