import axios from 'axios';
import { calculateShipmentData } from '../utils/freightClass.js';
import { getNextBusinessDay, getEstimatedDeliveryDate } from '../utils/weightCalc.js';
import logger from '../utils/logger.js';

const XPO_BASE = 'https://api.ltl.xpo.com/shipper/v2';

let cachedToken = null;
let tokenExpiry = null;

/**
 * Retrieves XPO OAuth 2.0 access token (cached until near expiry)
 * @returns {Promise<string>} Access token
 */
async function getXPOToken() {
  if (cachedToken && tokenExpiry > Date.now()) return cachedToken;

  const resp = await axios.post(`${XPO_BASE}/auth/token`, {
    client_id: process.env.XPO_CLIENT_ID,
    client_secret: process.env.XPO_CLIENT_SECRET,
    grant_type: 'client_credentials',
  });

  cachedToken = resp.data.access_token;
  tokenExpiry = Date.now() + (resp.data.expires_in - 60) * 1000;
  return cachedToken;
}

/**
 * Normalizes XPO API response into standard quote format
 * @param {object} data - Raw XPO API response
 * @returns {object[]} Normalized quotes
 */
function normalizeXPOResponse(data) {
  const quotes = data.rateQuotes || [data];
  return quotes.map((q) => ({
    carrier: 'XPO',
    serviceLevel: q.serviceType || 'Standard LTL',
    totalCost: parseFloat(q.totalCharges || q.totalCost || 0),
    transitDays: parseInt(q.transitDays || q.transitTime || 5, 10),
    estimatedDelivery: q.estimatedDeliveryDate || getEstimatedDeliveryDate(parseInt(q.transitDays || 5, 10)).toISOString(),
    logoUrl: '/logos/xpo.svg',
    features: [],
    rawResponse: q,
  }));
}

/**
 * Fetches rate quotes from XPO Logistics API
 * @param {object} shipmentData - Enriched shipment data with weight/class/accessorials
 * @returns {Promise<object[]>} Normalized rate quotes
 */
export async function getRates(shipmentData) {
  const { totalWeight, pallets, freightClass, accessorials } = calculateShipmentData(shipmentData);
  const token = await getXPOToken();

  const resp = await axios.post(
    `${XPO_BASE}/pricing/rateQuote`,
    {
      shipper: { zip: shipmentData.originZip, country: 'USA' },
      consignee: { zip: shipmentData.destinationZip, country: 'USA' },
      commodities: [{ weight: totalWeight, freightClass, pieces: pallets }],
      accessorials,
      pickupDate: getNextBusinessDay().toISOString().split('T')[0],
    },
    {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 8000,
    }
  );

  logger.info('XPO rate quote received');
  return normalizeXPOResponse(resp.data);
}
