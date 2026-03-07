import { describe, test, expect } from 'vitest';
import { getNextBusinessDay, getEstimatedDeliveryDate } from '../../src/utils/weightCalc.js';

describe('getNextBusinessDay', () => {
  test('returns Monday when starting from Friday', () => {
    const friday = new Date('2026-03-06T12:00:00'); // Friday
    const next = getNextBusinessDay(friday);
    expect(next.getDay()).toBe(1); // Monday
  });

  test('returns Monday when starting from Saturday', () => {
    const saturday = new Date('2026-03-07T12:00:00'); // Saturday
    const next = getNextBusinessDay(saturday);
    expect(next.getDay()).toBe(1); // Monday
  });

  test('returns next day for weekday', () => {
    const wednesday = new Date('2026-03-04T12:00:00'); // Wednesday
    const next = getNextBusinessDay(wednesday);
    expect(next.getDay()).toBe(4); // Thursday
  });
});

describe('getEstimatedDeliveryDate', () => {
  test('skips weekends when calculating delivery date', () => {
    const thursday = new Date('2026-03-05T12:00:00'); // Thursday
    const delivery = getEstimatedDeliveryDate(3, thursday);
    // Thu -> Fri (1) -> skip Sat/Sun -> Mon (2) -> Tue (3)
    expect(delivery.getDay()).toBe(2); // Tuesday
  });

  test('handles 1 transit day correctly', () => {
    const monday = new Date('2026-03-02T12:00:00');
    const delivery = getEstimatedDeliveryDate(1, monday);
    expect(delivery.getDay()).toBe(2); // Tuesday
  });

  test('handles 5 transit days across a weekend', () => {
    const monday = new Date('2026-03-02T12:00:00');
    const delivery = getEstimatedDeliveryDate(5, monday);
    expect(delivery.getDay()).toBe(1); // Next Monday
  });
});
