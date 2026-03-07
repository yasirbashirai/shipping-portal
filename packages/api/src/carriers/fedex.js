import axios from 'axios';
import { calculateShipmentData } from '../utils/freightClass.js';
import { getNextBusinessDay, getEstimatedDeliveryDate } from '../utils/weightCalc.js';
import logger from '../utils/logger.js';

const FEDEX_TOKEN_URL = 'https://apis.fedex.com/oauth/token';
const FEDEX_RATE_URL = 'https://apis.fedex.com/rate/v1/rates/quotes';

let cachedToken = null;
let tokenExpiry = null;

/**
 * Retrieves FedEx OAuth 2.0 access token (cached until near expiry)
 * @returns {Promise<string>} Access token
 */
async function getFedExToken() {
  if (cachedToken && tokenExpiry > Date.now()) return cachedToken;

  const resp = await axios.post(
    FEDEX_TOKEN_URL,
    new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.FEDEX_CLIENT_ID,
      client_secret: process.env.FEDEX_CLIENT_SECRET,
    }).toString(),
    {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }
  );

  cachedToken = resp.data.access_token;
  tokenExpiry = Date.now() + (resp.data.expires_in - 60) * 1000;
  return cachedToken;
}

/**
 * Normalizes FedEx Freight API response into standard quote format
 * @param {object} data - Raw FedEx API response
 * @returns {object[]} Normalized quotes
 */
function normalizeFedExResponse(data) {
  const rateDetails = data.output?.rateReplyDetails || [data];
  return rateDetails.map((detail) => {
    const shipment = detail.ratedShipmentDetails?.[0] || detail;
    return {
      carrier: 'FEDEX_FREIGHT',
      serviceLevel: detail.serviceType || 'FedEx Freight Priority',
      totalCost: parseFloat(shipment.totalNetCharge || shipment.totalCharges || 0),
      transitDays: parseInt(detail.commit?.transitDays || detail.transitDays || 5, 10),
      estimatedDelivery: detail.commit?.dateDetail?.dayFormat || getEstimatedDeliveryDate(parseInt(detail.commit?.transitDays || 5, 10)).toISOString(),
      logoUrl: '/logos/fedex.svg',
      features: [],
      rawResponse: detail,
    };
  });
}

/**
 * Fetches rate quotes from FedEx Freight API
 * @param {object} shipmentData - Enriched shipment data
 * @returns {Promise<object[]>} Normalized rate quotes
 */
export async function getRates(shipmentData) {
  const { totalWeight, pallets, freightClass, accessorials } = calculateShipmentData(shipmentData);
  const token = await getFedExToken();

  const resp = await axios.post(
    FEDEX_RATE_URL,
    {
      accountNumber: { value: process.env.FEDEX_ACCOUNT_NUMBER },
      requestedShipment: {
        shipper: { address: { postalCode: shipmentData.originZip, countryCode: 'US' } },
        recipient: { address: { postalCode: shipmentData.destinationZip, countryCode: 'US' } },
        pickupType: 'USE_SCHEDULED_PICKUP',
        serviceType: 'FEDEX_FREIGHT_PRIORITY',
        requestedPackageLineItems: [{
          weight: { units: 'LB', value: totalWeight },
          dimensions: { length: 48, width: 40, height: 48, units: 'IN' },
          freightClass: freightClass,
          pieces: pallets,
        }],
        shipDateStamp: getNextBusinessDay().toISOString().split('T')[0],
        specialServicesRequested: accessorials.length > 0 ? { specialServiceTypes: accessorials } : undefined,
      },
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      timeout: 8000,
    }
  );

  logger.info('FedEx Freight rate quote received');
  return normalizeFedExResponse(resp.data);
}
