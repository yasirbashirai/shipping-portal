import { useState } from 'react';
import { Check, Clock, DollarSign, Zap, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { useShippingStore } from '../../store/shippingStore.js';

const CARRIER_LOGOS = {
  XPO: '/logos/xpo.svg',
  RL_CARRIERS: '/logos/rl.svg',
  SEFL: '/logos/sefl.svg',
  FEDEX_FREIGHT: '/logos/fedex.svg',
};

const CARRIER_NAMES = {
  XPO: 'XPO Logistics',
  RL_CARRIERS: 'R+L Carriers',
  SEFL: 'SEFL',
  FEDEX_FREIGHT: 'FedEx Freight',
};

/**
 * Rate cards component — Step 2 of the checkout widget
 * Displays carrier options sorted by price with badge indicators
 */
export default function RateCards() {
  const { quotes, errors, shipmentSummary, selectQuote, reset } = useShippingStore();
  const [selectedId, setSelectedId] = useState(null);
  const [showWhy, setShowWhy] = useState(false);

  const handleSelect = (quote) => {
    setSelectedId(quote.carrier);
    selectQuote(quote);
  };

  return (
    <div className="space-y-4" data-testid="rate-cards-container">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Choose Your Shipping</h2>
          <p className="text-sm text-gray-500 mt-1">
            {quotes.length} option{quotes.length !== 1 ? 's' : ''} available
          </p>
        </div>
        <button
          onClick={reset}
          className="text-sm text-primary hover:underline"
          data-testid="back-to-form"
        >
          Edit details
        </button>
      </div>

      {/* Shipment Summary */}
      {shipmentSummary && (
        <div className="bg-gray-50 p-3 rounded-input text-xs text-gray-600 flex gap-4">
          <span>Weight: <strong>{shipmentSummary.estimatedWeight} lbs</strong></span>
          <span>Class: <strong>{shipmentSummary.freightClass}</strong></span>
          <span>Pallets: <strong>{shipmentSummary.estimatedPallets}</strong></span>
        </div>
      )}

      {/* Rate Cards */}
      <div className="space-y-3">
        {quotes.map((quote) => (
          <div
            key={quote.carrier}
            onClick={() => handleSelect(quote)}
            className={`relative p-4 border-2 rounded-card cursor-pointer transition shadow-card hover:shadow-md ${
              selectedId === quote.carrier
                ? 'border-primary bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            data-testid="rate-card"
          >
            {/* Selected checkmark */}
            {selectedId === quote.carrier && (
              <div className="absolute top-3 right-3 w-6 h-6 bg-primary rounded-full flex items-center justify-center" data-testid="selected-check">
                <Check size={14} className="text-white" />
              </div>
            )}

            {/* Badges */}
            <div className="flex gap-2 mb-2">
              {quote.badges?.includes('Best Price') && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-success text-xs font-medium rounded-badge" data-testid="badge-best-price">
                  <DollarSign size={12} /> Best Price
                </span>
              )}
              {quote.badges?.includes('Fastest') && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-badge" data-testid="badge-fastest">
                  <Zap size={12} /> Fastest
                </span>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-[50px] h-[30px] bg-gray-100 rounded flex items-center justify-center text-xs font-bold text-gray-500">
                  {quote.carrier.replace('_', ' ').slice(0, 4)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {CARRIER_NAMES[quote.carrier] || quote.carrier}
                  </p>
                  <p className="text-xs text-gray-500">{quote.serviceLevel}</p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900" data-testid="rate-price">
                  ${typeof quote.totalCost === 'number' ? quote.totalCost.toFixed(2) : quote.totalCost}
                </p>
                <div className="flex items-center gap-1 text-xs text-gray-500 justify-end">
                  <Clock size={12} />
                  <span>{quote.transitDays} business day{quote.transitDays !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-400 mt-2">
              Est. delivery: {new Date(quote.estimatedDelivery).toLocaleDateString('en-US', {
                weekday: 'short', month: 'short', day: 'numeric',
              })}
            </p>
          </div>
        ))}

        {/* Unavailable carriers */}
        {errors.map((err) => (
          <div
            key={err.carrier}
            className="p-4 border-2 border-gray-100 rounded-card bg-gray-50 opacity-60"
            data-testid="rate-card-unavailable"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-[50px] h-[30px] bg-gray-200 rounded flex items-center justify-center text-xs font-bold text-gray-400">
                  {err.carrier.replace('_', ' ').slice(0, 4)}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-400">
                    {CARRIER_NAMES[err.carrier] || err.carrier}
                  </p>
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <AlertCircle size={12} /> Unavailable
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Why different prices */}
      <button
        onClick={() => setShowWhy(!showWhy)}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition"
      >
        {showWhy ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        Why are prices different?
      </button>
      {showWhy && (
        <div className="bg-gray-50 p-4 rounded-input text-xs text-gray-600 space-y-2">
          <p>LTL freight rates vary based on several factors:</p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Distance</strong> — longer routes cost more</li>
            <li><strong>Freight class</strong> — based on density and weight</li>
            <li><strong>Accessorials</strong> — residential delivery, inside delivery, and appointments add surcharges</li>
            <li><strong>Carrier rates</strong> — each carrier has different base pricing</li>
            <li><strong>Transit time</strong> — faster delivery options may cost more</li>
          </ul>
        </div>
      )}
    </div>
  );
}
