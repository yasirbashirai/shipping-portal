import { CheckCircle, Truck, Calendar, DollarSign, RotateCcw } from 'lucide-react';
import { useShippingStore } from '../../store/shippingStore.js';

const CARRIER_NAMES = {
  XPO: 'XPO Logistics',
  RL_CARRIERS: 'R+L Carriers',
  SEFL: 'SEFL',
  FEDEX_FREIGHT: 'FedEx Freight',
};

/**
 * Confirmation banner — Step 3 of the checkout widget
 * Displays selected carrier, cost, and estimated delivery after customer selection
 */
export default function ConfirmBanner() {
  const { selectedQuote, reset } = useShippingStore();

  if (!selectedQuote) return null;

  return (
    <div className="bg-green-50 border-2 border-success rounded-card p-6 space-y-4" data-testid="confirm-banner">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-success rounded-full flex items-center justify-center">
          <CheckCircle size={24} className="text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Shipping Selected!</h3>
          <p className="text-sm text-gray-600">Your carrier preference has been saved</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex items-center gap-2">
          <Truck size={18} className="text-success" />
          <div>
            <p className="text-xs text-gray-500">Carrier</p>
            <p className="text-sm font-semibold">{CARRIER_NAMES[selectedQuote.carrier] || selectedQuote.carrier}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <DollarSign size={18} className="text-success" />
          <div>
            <p className="text-xs text-gray-500">Shipping Cost</p>
            <p className="text-sm font-semibold">
              ${typeof selectedQuote.totalCost === 'number' ? selectedQuote.totalCost.toFixed(2) : selectedQuote.totalCost}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Calendar size={18} className="text-success" />
          <div>
            <p className="text-xs text-gray-500">Est. Delivery</p>
            <p className="text-sm font-semibold">
              {new Date(selectedQuote.estimatedDelivery).toLocaleDateString('en-US', {
                weekday: 'short', month: 'short', day: 'numeric',
              })}
              <span className="text-gray-500 font-normal"> ({selectedQuote.transitDays} days)</span>
            </p>
          </div>
        </div>
      </div>

      <button
        onClick={reset}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition"
        data-testid="change-selection-btn"
      >
        <RotateCcw size={14} />
        Change selection
      </button>
    </div>
  );
}
