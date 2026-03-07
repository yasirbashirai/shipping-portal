/**
 * Mock carrier API responses for testing
 */

export const mockXPOQuote = {
  carrier: 'XPO',
  serviceLevel: 'Standard LTL',
  totalCost: 342.50,
  transitDays: 4,
  estimatedDelivery: '2026-03-14T00:00:00Z',
  logoUrl: '/logos/xpo.svg',
  features: ['Residential delivery', 'Curbside'],
  rawResponse: { mock: true },
};

export const mockRLQuote = {
  carrier: 'RL_CARRIERS',
  serviceLevel: 'Standard LTL',
  totalCost: 298.75,
  transitDays: 5,
  estimatedDelivery: '2026-03-15T00:00:00Z',
  logoUrl: '/logos/rl.svg',
  features: ['Residential delivery'],
  rawResponse: { mock: true },
};

export const mockSEFLQuote = {
  carrier: 'SEFL',
  serviceLevel: 'Standard LTL',
  totalCost: 315.00,
  transitDays: 3,
  estimatedDelivery: '2026-03-13T00:00:00Z',
  logoUrl: '/logos/sefl.svg',
  features: [],
  rawResponse: { mock: true },
};

export const mockFedExQuote = {
  carrier: 'FEDEX_FREIGHT',
  serviceLevel: 'FedEx Freight Priority',
  totalCost: 425.00,
  transitDays: 2,
  estimatedDelivery: '2026-03-12T00:00:00Z',
  logoUrl: '/logos/fedex.svg',
  features: ['Priority handling'],
  rawResponse: { mock: true },
};

export const validRatePayload = {
  cabinetCount: 12,
  cabinetType: 'RTA',
  hasLazySusan: false,
  lazySusanQty: 0,
  hasVentHood: true,
  ventHoodQty: 1,
  hasDrawers: false,
  drawerQty: 0,
  deliveryLocationType: 'RESIDENTIAL',
  deliveryMethod: 'CURBSIDE',
  appointmentRequired: false,
  destinationZip: '90210',
  originZip: '30301',
  sourceWebsite: 'CABINETS_DEALS',
};

export const validOrderPayload = {
  magentoOrderId: 'MAG-TEST-001',
  sourceWebsite: 'CABINETS_DEALS',
  customer: {
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'Customer',
    phone: '555-9999',
  },
  shipmentDetails: {
    originZip: '30301',
    destinationZip: '90210',
    destinationCity: 'Beverly Hills',
    destinationState: 'CA',
    cabinetCount: 10,
    cabinetType: 'RTA',
    hasLazySusan: false,
    lazySusanQty: 0,
    hasVentHood: false,
    ventHoodQty: 0,
    hasDrawers: false,
    drawerQty: 0,
    deliveryLocationType: 'RESIDENTIAL',
    deliveryMethod: 'CURBSIDE',
    appointmentRequired: false,
    estimatedWeight: 650,
    freightClass: '92.5',
    estimatedPallets: 1,
  },
  totalAmount: 1450.00,
};
