import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import EstimatorForm from './components/EstimatorForm';
import RateCards from './components/RateCards';
import ConfirmBanner from './components/ConfirmBanner';
import LoadingState from './components/LoadingState.jsx';
import { useShippingStore } from './store/shippingStore.js';

/**
 * Main shipping widget app — multi-step flow:
 * form -> loading -> rates -> confirmed
 */
function ShippingWidget() {
  const { step } = useShippingStore();

  return (
    <div className="max-w-lg mx-auto p-4 sm:p-6 font-sans">
      {step === 'form' && <EstimatorForm />}
      {step === 'loading' && <LoadingState />}
      {step === 'rates' && <RateCards />}
      {step === 'confirmed' && <ConfirmBanner />}
    </div>
  );
}

const root = document.getElementById('shipping-widget');
if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <ShippingWidget />
    </React.StrictMode>
  );
}

export default ShippingWidget;
