import { create } from 'zustand';

/**
 * Zustand store for the checkout widget state
 * Manages the multi-step flow: form -> loading -> rates -> selection -> confirmation
 */
export const useShippingStore = create((set) => ({
  // Current step: 'form' | 'loading' | 'rates' | 'confirmed'
  step: 'form',

  // Form data from EstimatorForm
  formData: null,

  // Rate quotes returned from API
  quotes: [],
  errors: [],
  shipmentSummary: null,
  sessionId: null,

  // Selected rate
  selectedQuote: null,

  // Actions
  setStep: (step) => set({ step }),

  setFormData: (formData) => set({ formData }),

  setRates: ({ quotes, errors, shipmentSummary, sessionId }) =>
    set({ quotes, errors, shipmentSummary, sessionId, step: 'rates' }),

  selectQuote: (quote) => set({ selectedQuote: quote, step: 'confirmed' }),

  reset: () =>
    set({
      step: 'form',
      formData: null,
      quotes: [],
      errors: [],
      shipmentSummary: null,
      sessionId: null,
      selectedQuote: null,
    }),
}));
