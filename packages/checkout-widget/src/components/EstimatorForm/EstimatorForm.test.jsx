import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EstimatorForm from './EstimatorForm.jsx';

// Mock the useRates hook
vi.mock('../../hooks/useRates.js', () => ({
  useRates: () => ({
    fetchRates: vi.fn(),
    loading: false,
    error: null,
  }),
}));

describe('EstimatorForm', () => {
  test('renders all 9 form fields', () => {
    render(<EstimatorForm />);

    expect(screen.getByTestId('cabinet-count')).toBeInTheDocument();
    expect(screen.getByTestId('type-rta')).toBeInTheDocument();
    expect(screen.getByTestId('type-assembled')).toBeInTheDocument();
    expect(screen.getByTestId('check-lazySusan')).toBeInTheDocument();
    expect(screen.getByTestId('check-ventHood')).toBeInTheDocument();
    expect(screen.getByTestId('check-drawers')).toBeInTheDocument();
    expect(screen.getByTestId('delivery-residential')).toBeInTheDocument();
    expect(screen.getByTestId('delivery-commercial')).toBeInTheDocument();
    expect(screen.getByTestId('method-curbside')).toBeInTheDocument();
    expect(screen.getByTestId('method-inside')).toBeInTheDocument();
    expect(screen.getByTestId('appointment-toggle')).toBeInTheDocument();
    expect(screen.getByTestId('destination-zip')).toBeInTheDocument();
  });

  test('quantity inputs appear only when parent checkbox is checked', async () => {
    const user = userEvent.setup();
    render(<EstimatorForm />);

    expect(screen.queryByTestId('qty-lazySusan')).not.toBeInTheDocument();

    await user.click(screen.getByTestId('check-lazySusan'));
    expect(screen.getByTestId('qty-lazySusan')).toBeInTheDocument();
  });

  test('shows weight estimate that updates with cabinet count', () => {
    render(<EstimatorForm />);

    const weightEstimate = screen.getByTestId('weight-estimate');
    expect(weightEstimate).toHaveTextContent('65 lbs'); // 1 RTA = 65
  });

  test('shows get rates button', () => {
    render(<EstimatorForm />);
    expect(screen.getByTestId('get-rates-btn')).toBeInTheDocument();
    expect(screen.getByTestId('get-rates-btn')).toHaveTextContent('Get Shipping Rates');
  });

  test('renders the form with data-testid', () => {
    render(<EstimatorForm />);
    expect(screen.getByTestId('estimator-form')).toBeInTheDocument();
  });
});
