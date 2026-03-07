import { calculateShipmentData } from './freightClass.js';

/**
 * Calculates estimated weight summary for display in the checkout widget
 * @param {object} input - Estimator form data
 * @returns {{ estimatedWeight: number, estimatedPallets: number, freightClass: string }}
 */
export function getWeightSummary(input) {
  const { totalWeight, pallets, freightClass } = calculateShipmentData(input);
  return {
    estimatedWeight: totalWeight,
    estimatedPallets: pallets,
    freightClass,
  };
}

/**
 * Returns the next business day from today (skips weekends)
 * @param {Date} [fromDate] - Starting date (defaults to now)
 * @returns {Date} Next business day
 */
export function getNextBusinessDay(fromDate = new Date()) {
  const date = new Date(fromDate);
  date.setDate(date.getDate() + 1);
  const day = date.getDay();
  if (day === 0) date.setDate(date.getDate() + 1); // Sunday -> Monday
  if (day === 6) date.setDate(date.getDate() + 2); // Saturday -> Monday
  return date;
}

/**
 * Calculates estimated delivery date from transit days
 * @param {number} transitDays - Number of transit days
 * @param {Date} [fromDate] - Starting date
 * @returns {Date} Estimated delivery date (skipping weekends)
 */
export function getEstimatedDeliveryDate(transitDays, fromDate = new Date()) {
  let date = new Date(fromDate);
  let daysAdded = 0;
  while (daysAdded < transitDays) {
    date.setDate(date.getDate() + 1);
    const day = date.getDay();
    if (day !== 0 && day !== 6) {
      daysAdded++;
    }
  }
  return date;
}
