import soap from 'soap';
import { calculateShipmentData } from '../utils/freightClass.js';
import { getEstimatedDeliveryDate } from '../utils/weightCalc.js';
import logger from '../utils/logger.js';

/**
 * Normalizes SEFL SOAP response into standard quote format
 * @param {object} result - Parsed SOAP response
 * @returns {object[]} Normalized quotes
 */
function normalizeSEFLResponse(result) {
  const data = result[0] || result;
  const quote = data.GetRateQuoteResult || data;

  return [{
    carrier: 'SEFL',
    serviceLevel: 'Standard LTL',
    totalCost: parseFloat(quote.TotalCharges || quote.totalCharges || 0),
    transitDays: parseInt(quote.TransitDays || quote.transitDays || 5, 10),
    estimatedDelivery: quote.DeliveryDate || quote.deliveryDate || getEstimatedDeliveryDate(parseInt(quote.TransitDays || 5, 10)).toISOString(),
    logoUrl: '/logos/sefl.svg',
    features: [],
    rawResponse: quote,
  }];
}

/**
 * Fetches rate quotes from SEFL via SOAP/XML API
 * Uses the soap npm package to create a SOAP client and call the WSDL endpoint
 * @param {object} shipmentData - Enriched shipment data
 * @returns {Promise<object[]>} Normalized rate quotes
 */
export async function getRates(shipmentData) {
  const { totalWeight, freightClass, accessorials } = calculateShipmentData(shipmentData);

  const wsdlUrl = process.env.SEFL_WSDL_URL || 'https://www.sefl.com/WebServices/RateQuote.asmx?WSDL';
  const client = await soap.createClientAsync(wsdlUrl);

  const result = await client.GetRateQuoteAsync({
    Username: process.env.SEFL_USERNAME,
    Password: process.env.SEFL_PASSWORD,
    AccountNumber: process.env.SEFL_ACCOUNT_NUMBER,
    OriginZip: shipmentData.originZip,
    DestZip: shipmentData.destinationZip,
    Weight: totalWeight,
    FreightClass: freightClass,
    Accessorials: accessorials.join(','),
  });

  logger.info('SEFL rate quote received');
  return normalizeSEFLResponse(result);
}
