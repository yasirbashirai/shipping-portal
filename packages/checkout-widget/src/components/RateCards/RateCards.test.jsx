import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import RateCards from './RateCards.jsx';
import { useShippingStore } from '../../store/shippingStore.js';

const mockQuotes = [
  {
    carrier: 'RL_CARRIERS',
    serviceLevel: 'Standard LTL',
    totalCost: 298.75,
    transitDays: 5,
    estimatedDelivery: '2026-03-15T00:00:00Z',
    badges: ['Best Price'],
    isRecommended: true,
  },
  {
    carrier: 'SEFL',
    serviceLevel: 'Standard LTL',
    totalCost: 315.00,
    transitDays: 3,
    estimatedDelivery: '2026-03-13T00:00:00Z',
    badges: ['Fastest'],
    isRecommended: false,
  },
  {
    carrier: 'XPO',
    serviceLevel: 'Standard LTL',
    totalCost: 342.50,
    transitDays: 4,
    estimatedDelivery: '2026-03-14T00:00:00Z',
    badges: [],
    isRecommended: false,
  },
];

describe('RateCards', () => {
  beforeEach(() => {
    useShippingStore.setState({
      step: 'rates',
      quotes: mockQuotes,
      errors: [],
      shipmentSummary: { estimatedWeight: 780, freightClass: '92.5', estimatedPallets: 1 },
    });
  });

  test('renders correct number of cards', () => {
    render(<RateCards />);
    const cards = screen.getAllByTestId('rate-card');
    expect(cards).toHaveLength(3);
  });

  test('Best Price badge appears on lowest cost card', () => {
    render(<RateCards />);
    expect(screen.getByTestId('badge-best-price')).toBeInTheDocument();
  });

  test('Fastest badge appears', () => {
    render(<RateCards />);
    expect(screen.getByTestId('badge-fastest')).toBeInTheDocument();
  });

  test('clicking a card shows selected checkmark', () => {
    render(<RateCards />);
    const cards = screen.getAllByTestId('rate-card');
    fireEvent.click(cards[0]);
    expect(screen.getByTestId('selected-check')).toBeInTheDocument();
  });

  test('renders unavailable carrier cards', () => {
    useShippingStore.setState({
      errors: [{ carrier: 'FEDEX_FREIGHT', error: 'Timeout' }],
    });
    render(<RateCards />);
    expect(screen.getByTestId('rate-card-unavailable')).toBeInTheDocument();
  });

  test('displays rate prices', () => {
    render(<RateCards />);
    const prices = screen.getAllByTestId('rate-price');
    expect(prices[0]).toHaveTextContent('$298.75');
  });
});
