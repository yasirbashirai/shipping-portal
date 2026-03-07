import { useState } from 'react';
import axios from 'axios';
import { useShippingStore } from '../store/shippingStore.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Custom hook for fetching shipping rates from the API
 * Manages loading/error state and updates the Zustand store
 * @returns {{ fetchRates: Function, loading: boolean, error: string|null }}
 */
export function useRates() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { setRates, setStep } = useShippingStore();

  const fetchRates = async (formData) => {
    setLoading(true);
    setError(null);
    setStep('loading');

    try {
      const response = await axios.post(`${API_URL}/api/rates`, formData);
      const { quotes, errors, shipmentSummary, sessionId } = response.data;

      if (quotes.length === 0) {
        setError('No shipping rates available for this destination. Please try again.');
        setStep('form');
        return;
      }

      setRates({ quotes, errors: errors || [], shipmentSummary, sessionId });
    } catch (err) {
      const message =
        err.response?.data?.error || 'Failed to fetch shipping rates. Please try again.';
      setError(message);
      setStep('form');
    } finally {
      setLoading(false);
    }
  };

  return { fetchRates, loading, error };
}
