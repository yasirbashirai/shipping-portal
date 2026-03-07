import * as xpo from './xpo.js';
import * as rl from './rl.js';
import * as sefl from './sefl.js';
import * as fedex from './fedex.js';
import logger from '../utils/logger.js';

/**
 * Carrier configuration — name and rate function reference
 * @type {Array<{ name: string, fn: Function }>}
 */
/**
 * Returns carrier configuration — resolves function references at call time
 * to support mocking in tests
 * @returns {Array<{ name: string, fn: Function }>}
 */
function getCarriers() {
  return [
    { name: 'XPO', fn: xpo.getRates },
    { name: 'RL_CARRIERS', fn: rl.getRates },
    { name: 'SEFL', fn: sefl.getRates },
    { name: 'FEDEX_FREIGHT', fn: fedex.getRates },
  ];
}

/**
 * Sorts quotes by total cost ascending
 * @param {object[]} quotes - Array of normalized quotes
 * @returns {object[]} Sorted quotes
 */
function sortByPrice(quotes) {
  return quotes.sort((a, b) => a.totalCost - b.totalCost);
}

/**
 * Adds badge flags to quotes — Best Price and Fastest
 * @param {object[]} quotes - Sorted array of quotes
 * @returns {object[]} Quotes with isRecommended and badge flags
 */
function addBadges(quotes) {
  if (quotes.length === 0) return quotes;

  // Best Price = cheapest (first after sorting)
  quotes[0].isRecommended = true;
  quotes[0].badges = ['Best Price'];

  // Fastest = shortest transit time
  const fastest = quotes.reduce((min, q) => (q.transitDays < min.transitDays ? q : min), quotes[0]);
  if (!fastest.badges) fastest.badges = [];
  if (!fastest.badges.includes('Best Price')) {
    fastest.badges.push('Fastest');
  } else {
    fastest.badges.push('Fastest');
  }

  // All non-badged quotes get empty badges array
  quotes.forEach((q) => {
    if (!q.badges) q.badges = [];
    if (!('isRecommended' in q)) q.isRecommended = false;
  });

  return quotes;
}

/**
 * Fetches rates from all 4 carriers in parallel using Promise.allSettled
 * Individual carrier failures do NOT crash the endpoint — partial results are returned
 * @param {object} shipmentData - Enriched shipment data (includes totalWeight, pallets, freightClass)
 * @returns {Promise<{ quotes: object[], errors: object[] }>}
 */
export async function fetchAllRates(shipmentData) {
  const carriers = getCarriers();
  const results = await Promise.allSettled(
    carriers.map((c) => c.fn(shipmentData))
  );

  const quotes = [];
  const errors = [];

  results.forEach((result, i) => {
    if (result.status === 'fulfilled') {
      const normalized = result.value.map((q) => ({
        ...q,
        carrier: q.carrier || carriers[i].name,
      }));
      quotes.push(...normalized);
    } else {
      errors.push({
        carrier: carriers[i].name,
        error: result.reason?.message || 'Unknown error',
      });
      logger.warn(`Carrier ${carriers[i].name} failed: ${result.reason?.message}`);
    }
  });

  const sorted = sortByPrice(quotes);
  const badged = addBadges(sorted);

  return { quotes: badged, errors };
}
