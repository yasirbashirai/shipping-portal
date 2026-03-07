import { describe, test, expect } from 'vitest';
import { calculateShipmentData, getFreightClass } from '../../src/utils/freightClass.js';

describe('calculateShipmentData', () => {
  test('calculates correct weight for 10 RTA cabinets', () => {
    const result = calculateShipmentData({
      cabinetCount: 10,
      cabinetType: 'RTA',
      hasLazySusan: false,
      hasVentHood: false,
      hasDrawers: false,
    });
    expect(result.totalWeight).toBe(650);
  });

  test('calculates correct weight for 10 ASSEMBLED cabinets', () => {
    const result = calculateShipmentData({
      cabinetCount: 10,
      cabinetType: 'ASSEMBLED',
      hasLazySusan: false,
      hasVentHood: false,
      hasDrawers: false,
    });
    expect(result.totalWeight).toBe(1100);
  });

  test('adds accessorial for residential delivery', () => {
    const result = calculateShipmentData({
      cabinetCount: 5,
      cabinetType: 'RTA',
      deliveryLocationType: 'RESIDENTIAL',
      deliveryMethod: 'CURBSIDE',
    });
    expect(result.accessorials).toContain('RESIDENTIAL_DELIVERY');
    expect(result.accessorials).not.toContain('INSIDE_DELIVERY');
  });

  test('adds accessorial for inside delivery', () => {
    const result = calculateShipmentData({
      cabinetCount: 5,
      cabinetType: 'RTA',
      deliveryLocationType: 'COMMERCIAL',
      deliveryMethod: 'INSIDE_DELIVERY',
    });
    expect(result.accessorials).toContain('INSIDE_DELIVERY');
    expect(result.accessorials).not.toContain('RESIDENTIAL_DELIVERY');
  });

  test('adds appointment accessorial when required', () => {
    const result = calculateShipmentData({
      cabinetCount: 5,
      cabinetType: 'RTA',
      deliveryLocationType: 'COMMERCIAL',
      deliveryMethod: 'CURBSIDE',
      appointmentRequired: true,
    });
    expect(result.accessorials).toContain('APPOINTMENT_REQUIRED');
  });

  test('applies special item weights correctly', () => {
    const result = calculateShipmentData({
      cabinetCount: 8,
      cabinetType: 'ASSEMBLED',
      hasLazySusan: true,
      lazySusanQty: 2,
      hasVentHood: true,
      ventHoodQty: 1,
      hasDrawers: false,
      drawerQty: 0,
    });
    // 8 * 110 + 2 * 25 + 1 * 45 = 880 + 50 + 45 = 975
    expect(result.totalWeight).toBe(975);
  });

  test('applies drawer weights correctly', () => {
    const result = calculateShipmentData({
      cabinetCount: 5,
      cabinetType: 'RTA',
      hasDrawers: true,
      drawerQty: 3,
    });
    // 5 * 65 + 3 * 20 = 325 + 60 = 385
    expect(result.totalWeight).toBe(385);
  });

  test('calculates correct number of pallets', () => {
    const result = calculateShipmentData({
      cabinetCount: 30,
      cabinetType: 'ASSEMBLED',
    });
    // 30 * 110 = 3300 lbs -> ceil(3300/1500) = 3 pallets
    expect(result.totalWeight).toBe(3300);
    expect(result.pallets).toBe(3);
  });

  test('returns a valid freight class string', () => {
    const result = calculateShipmentData({
      cabinetCount: 10,
      cabinetType: 'RTA',
    });
    expect(result.freightClass).toBeTruthy();
    expect(typeof result.freightClass).toBe('string');
  });

  test('returns empty accessorials for commercial curbside without appointment', () => {
    const result = calculateShipmentData({
      cabinetCount: 5,
      cabinetType: 'RTA',
      deliveryLocationType: 'COMMERCIAL',
      deliveryMethod: 'CURBSIDE',
      appointmentRequired: false,
    });
    expect(result.accessorials).toEqual([]);
  });

  test('handles all special items together', () => {
    const result = calculateShipmentData({
      cabinetCount: 10,
      cabinetType: 'RTA',
      hasLazySusan: true,
      lazySusanQty: 2,
      hasVentHood: true,
      ventHoodQty: 1,
      hasDrawers: true,
      drawerQty: 4,
      deliveryLocationType: 'RESIDENTIAL',
      deliveryMethod: 'INSIDE_DELIVERY',
      appointmentRequired: true,
    });
    // 10*65 + 2*25 + 1*45 + 4*20 = 650 + 50 + 45 + 80 = 825
    expect(result.totalWeight).toBe(825);
    expect(result.accessorials).toContain('RESIDENTIAL_DELIVERY');
    expect(result.accessorials).toContain('INSIDE_DELIVERY');
    expect(result.accessorials).toContain('APPOINTMENT_REQUIRED');
    expect(result.accessorials).toHaveLength(3);
  });
});

describe('getFreightClass', () => {
  test('returns class 50 for high density', () => {
    expect(getFreightClass(55)).toBe('50');
  });

  test('returns class 92.5 for density around 10.5', () => {
    expect(getFreightClass(10.5)).toBe('92.5');
  });

  test('returns class 500 for very low density', () => {
    expect(getFreightClass(0.5)).toBe('500');
  });

  test('returns class 100 for density 9', () => {
    expect(getFreightClass(9)).toBe('100');
  });
});
