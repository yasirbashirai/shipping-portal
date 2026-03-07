import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapPin, Save, Check } from 'lucide-react';
import Header from '../../components/Header.jsx';
import * as endpoints from '../../api/endpoints.js';

const CARRIERS = ['XPO', 'RL_CARRIERS', 'SEFL', 'FEDEX_FREIGHT'];

/**
 * Manual tracking entry page — shows orders needing tracking numbers
 * Staff can enter tracking numbers directly in table rows and batch save
 */
export default function Tracking() {
  const queryClient = useQueryClient();
  const [trackingInputs, setTrackingInputs] = useState({});
  const [carrierInputs, setCarrierInputs] = useState({});
  const [saved, setSaved] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['tracking-orders'],
    queryFn: () => endpoints.getTrackingOrders().then((r) => r.data.orders),
  });

  const batchMutation = useMutation({
    mutationFn: (updates) => endpoints.batchUpdateTracking(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracking-orders'] });
      setTrackingInputs({});
      setCarrierInputs({});
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  const handleSave = () => {
    const updates = Object.entries(trackingInputs)
      .filter(([, val]) => val.trim())
      .map(([orderId, trackingNumber]) => ({
        orderId,
        trackingNumber,
        carrierBooked: carrierInputs[orderId] || 'XPO',
      }));

    if (updates.length > 0) {
      batchMutation.mutate(updates);
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      const inputs = document.querySelectorAll('[data-testid="tracking-row-input"]');
      const next = inputs[index + 1];
      if (next) {
        e.preventDefault();
        next.focus();
      }
    }
  };

  const pendingCount = Object.values(trackingInputs).filter((v) => v.trim()).length;

  return (
    <div>
      <Header title="Tracking Entry" />
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Orders Needing Tracking</h2>
            <p className="text-sm text-gray-500">{data?.length || 0} orders without tracking numbers</p>
          </div>
          <div className="flex items-center gap-3">
            {saved && (
              <span className="flex items-center gap-1 text-sm text-success font-medium" data-testid="save-success">
                <Check size={16} /> Saved!
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={pendingCount === 0 || batchMutation.isPending}
              className="flex items-center gap-2 h-9 px-4 bg-primary text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
              data-testid="batch-save-btn"
            >
              <Save size={16} />
              {batchMutation.isPending ? 'Saving...' : `Save ${pendingCount > 0 ? `(${pendingCount})` : ''}`}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-x-auto" data-testid="tracking-table">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b bg-gray-50">
                <th className="px-4 py-3 font-medium">Order #</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Carrier</th>
                <th className="px-4 py-3 font-medium">Order Date</th>
                <th className="px-4 py-3 font-medium w-64">Tracking #</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td colSpan={5} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td></tr>
                ))
              ) : data?.length > 0 ? (
                data.map((order, index) => (
                  <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50" data-testid="tracking-row">
                    <td className="px-4 py-3 font-medium text-primary">{order.orderNumber}</td>
                    <td className="px-4 py-3 text-gray-700">{order.customer?.firstName} {order.customer?.lastName}</td>
                    <td className="px-4 py-3">
                      <select
                        value={carrierInputs[order.id] || order.carrierBooked || 'XPO'}
                        onChange={(e) => setCarrierInputs((prev) => ({ ...prev, [order.id]: e.target.value }))}
                        className="h-8 px-2 border border-gray-300 rounded text-sm"
                      >
                        {CARRIERS.map((c) => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={trackingInputs[order.id] || ''}
                        onChange={(e) => setTrackingInputs((prev) => ({ ...prev, [order.id]: e.target.value }))}
                        onKeyDown={(e) => handleKeyDown(e, index)}
                        placeholder="Enter tracking number"
                        className="w-full h-8 px-3 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-primary"
                        data-testid="tracking-row-input"
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-400">
                  <MapPin size={32} className="mx-auto mb-2 opacity-50" />All orders have tracking numbers!
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
