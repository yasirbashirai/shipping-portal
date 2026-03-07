/**
 * Base weight per cabinet in lbs
 * @type {Record<string, number>}
 */
const BASE_WEIGHT = {
  RTA: 65,
  ASSEMBLED: 110,
};

/**
 * Special item weights in lbs
 * @type {Record<string, number>}
 */
const SPECIAL_WEIGHTS = {
  lazySusan: 25,
  ventHood: 45,
  drawer: 20,
};

/**
 * Carrier accessorial codes
 * @type {Record<string, string>}
 */
const ACCESSORIALS = {
  RESIDENTIAL: 'RESIDENTIAL_DELIVERY',
  INSIDE_DELIVERY: 'INSIDE_DELIVERY',
  APPOINTMENT: 'APPOINTMENT_REQUIRED',
};

/**
 * Determines NMFC freight class based on density (lbs per cubic foot)
 * @param {number} density - Density in lbs/ft3
 * @returns {string} Freight class code
 */
export function getFreightClass(density) {
  if (density >= 50) return '50';
  if (density >= 35) return '55';
  if (density >= 30) return '60';
  if (density >= 22.5) return '65';
  if (density >= 15) return '70';
  if (density >= 13.5) return '77.5';
  if (density >= 12) return '85';
  if (density >= 10.5) return '92.5';
  if (density >= 9) return '100';
  if (density >= 8) return '110';
  if (density >= 7) return '125';
  if (density >= 6) return '150';
  if (density >= 5) return '175';
  if (density >= 4) return '200';
  if (density >= 3) return '250';
  if (density >= 2) return '300';
  if (density >= 1) return '400';
  return '500';
}

/**
 * Calculates complete shipment data from estimator form input
 * @param {object} input - Estimator form data
 * @param {number} input.cabinetCount - Number of cabinets
 * @param {string} input.cabinetType - 'RTA' or 'ASSEMBLED'
 * @param {boolean} [input.hasLazySusan] - Has lazy susan items
 * @param {number} [input.lazySusanQty] - Quantity of lazy susans
 * @param {boolean} [input.hasVentHood] - Has vent hood items
 * @param {number} [input.ventHoodQty] - Quantity of vent hoods
 * @param {boolean} [input.hasDrawers] - Has drawer items
 * @param {number} [input.drawerQty] - Quantity of drawers
 * @param {string} [input.deliveryLocationType] - 'RESIDENTIAL' or 'COMMERCIAL'
 * @param {string} [input.deliveryMethod] - 'CURBSIDE' or 'INSIDE_DELIVERY'
 * @param {boolean} [input.appointmentRequired] - Requires appointment
 * @returns {{ totalWeight: number, pallets: number, freightClass: string, accessorials: string[] }}
 */
export function calculateShipmentData(input) {
  const baseWeight = input.cabinetCount * BASE_WEIGHT[input.cabinetType];
  const specialWeight =
    (input.lazySusanQty || 0) * SPECIAL_WEIGHTS.lazySusan +
    (input.ventHoodQty || 0) * SPECIAL_WEIGHTS.ventHood +
    (input.drawerQty || 0) * SPECIAL_WEIGHTS.drawer;

  const totalWeight = baseWeight + specialWeight;
  const pallets = Math.ceil(totalWeight / 1500);

  // NMFC freight class by density (cubic inches to cubic feet)
  const density = totalWeight / ((pallets * 48 * 40 * 48) / 1728);
  const freightClass = getFreightClass(density);

  const accessorials = [];
  if (input.deliveryLocationType === 'RESIDENTIAL') {
    accessorials.push(ACCESSORIALS.RESIDENTIAL);
  }
  if (input.deliveryMethod === 'INSIDE_DELIVERY') {
    accessorials.push(ACCESSORIALS.INSIDE_DELIVERY);
  }
  if (input.appointmentRequired) {
    accessorials.push(ACCESSORIALS.APPOINTMENT);
  }

  return { totalWeight, pallets, freightClass, accessorials };
}

export { BASE_WEIGHT, SPECIAL_WEIGHTS, ACCESSORIALS };
