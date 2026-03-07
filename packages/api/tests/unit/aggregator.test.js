import { describe, test, expect, vi, beforeEach } from 'vitest';
import { fetchAllRates } from '../../src/carriers/aggregator.js';
import * as xpo from '../../src/carriers/xpo.js';
import * as rl from '../../src/carriers/rl.js';
import * as sefl from '../../src/carriers/sefl.js';
import * as fedex from '../../src/carriers/fedex.js';
import {
  mockXPOQuote,
  mockRLQuote,
  mockSEFLQuote,
  mockFedExQuote,
  validRatePayload,
} from '../mocks/carrierMocks.js';

vi.mock('../../src/carriers/xpo.js');
vi.mock('../../src/carriers/rl.js');
vi.mock('../../src/carriers/sefl.js');
vi.mock('../../src/carriers/fedex.js');

describe('fetchAllRates (aggregator)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    xpo.getRates = vi.fn().mockResolvedValue([mockXPOQuote]);
    rl.getRates = vi.fn().mockResolvedValue([mockRLQuote]);
    sefl.getRates = vi.fn().mockResolvedValue([mockSEFLQuote]);
    fedex.getRates = vi.fn().mockResolvedValue([mockFedExQuote]);
  });

  test('returns quotes from all 4 carriers when all succeed', async () => {
    const { quotes, errors } = await fetchAllRates(validRatePayload);
    expect(quotes).toHaveLength(4);
    expect(errors).toHaveLength(0);
  });

  test('results are sorted by price ascending', async () => {
    const { quotes } = await fetchAllRates(validRatePayload);
    for (let i = 1; i < quotes.length; i++) {
      expect(quotes[i].totalCost).toBeGreaterThanOrEqual(quotes[i - 1].totalCost);
    }
  });

  test('cheapest quote has isRecommended set to true', async () => {
    const { quotes } = await fetchAllRates(validRatePayload);
    const cheapest = quotes[0];
    expect(cheapest.isRecommended).toBe(true);
  });

  test('cheapest quote has Best Price badge', async () => {
    const { quotes } = await fetchAllRates(validRatePayload);
    expect(quotes[0].badges).toContain('Best Price');
  });

  test('fastest quote has Fastest badge', async () => {
    const { quotes } = await fetchAllRates(validRatePayload);
    const fastest = quotes.find((q) => q.badges.includes('Fastest'));
    expect(fastest).toBeDefined();
    const minTransit = Math.min(...quotes.map((q) => q.transitDays));
    expect(fastest.transitDays).toBe(minTransit);
  });

  test('still returns partial results if one carrier fails', async () => {
    xpo.getRates = vi.fn().mockRejectedValue(new Error('XPO timeout'));
    const { quotes, errors } = await fetchAllRates(validRatePayload);
    expect(quotes).toHaveLength(3);
    expect(errors).toHaveLength(1);
    expect(errors[0].carrier).toBe('XPO');
    expect(errors[0].error).toBe('XPO timeout');
  });

  test('returns partial results if two carriers fail', async () => {
    xpo.getRates = vi.fn().mockRejectedValue(new Error('XPO down'));
    sefl.getRates = vi.fn().mockRejectedValue(new Error('SEFL down'));
    const { quotes, errors } = await fetchAllRates(validRatePayload);
    expect(quotes).toHaveLength(2);
    expect(errors).toHaveLength(2);
  });

  test('returns empty quotes if all carriers fail', async () => {
    xpo.getRates = vi.fn().mockRejectedValue(new Error('fail'));
    rl.getRates = vi.fn().mockRejectedValue(new Error('fail'));
    sefl.getRates = vi.fn().mockRejectedValue(new Error('fail'));
    fedex.getRates = vi.fn().mockRejectedValue(new Error('fail'));
    const { quotes, errors } = await fetchAllRates(validRatePayload);
    expect(quotes).toHaveLength(0);
    expect(errors).toHaveLength(4);
  });

  test('handles carrier timeout gracefully', async () => {
    xpo.getRates = vi.fn().mockRejectedValue(new Error('timeout of 8000ms exceeded'));
    const { quotes, errors } = await fetchAllRates(validRatePayload);
    expect(quotes).toHaveLength(3);
    expect(errors[0].error).toContain('timeout');
  });

  test('non-recommended quotes have isRecommended false', async () => {
    const { quotes } = await fetchAllRates(validRatePayload);
    const nonRecommended = quotes.filter((q) => !q.isRecommended);
    nonRecommended.forEach((q) => {
      expect(q.isRecommended).toBe(false);
    });
  });
});
