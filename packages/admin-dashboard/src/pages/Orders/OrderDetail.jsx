import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Check, Clock, Package, User, MapPin, FileText } from 'lucide-react';
import Header from '../../components/Header.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import WebsiteBadge from '../../components/WebsiteBadge.jsx';
import * as endpoints from '../../api/endpoints.js';

const STATUSES = ['PENDING', 'PROCESSING', 'BOOKED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED', 'ON_HOLD'];
const CARRIERS = ['XPO', 'RL_CARRIERS', 'SEFL', 'FEDEX_FREIGHT'];

/**
 * Order detail page — full order info, shipment details, rate quotes, tracking, audit log, admin notes
 */
export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState('');
  const [notesSaved, setNotesSaved] = useState(false);
  const [trackingNum, setTrackingNum] = useState('');
  const [trackingCarrier, setTrackingCarrier] = useState('XPO');

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => endpoints.getOrder(id).then((r) => {
      const o = r.data.order;
      setNotes(o.adminNotes || '');
      setTrackingNum(o.trackingNumber || '');
      if (o.carrierBooked) setTrackingCarrier(o.carrierBooked);
      return o;
    }),
  });

  const statusMutation = useMutation({
    mutationFn: (status) => endpoints.updateOrderStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['order', id] }),
  });

  const trackingMutation = useMutation({
    mutationFn: () => endpoints.updateTracking(id, { trackingNumber: trackingNum, carrierBooked: trackingCarrier }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['order', id] }),
  });

  const notesMutation = useMutation({
    mutationFn: () => endpoints.updateNotes(id, notes),
    onSuccess: () => { setNotesSaved(true); setTimeout(() => setNotesSaved(false), 2000); },
  });

  if (isLoading) {
    return (
      <div>
        <Header title="Order Details" />
        <div className="p-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
              <div className="h-4 bg-gray-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!order) return null;

  return (
    <div>
      <Header title="Order Details" />
      <div className="p-6 space-y-6">
        {/* Back + Header */}
        <div className="flex items-center justify-between">
          <button onClick={() => navigate('/admin/orders')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
            <ArrowLeft size={16} /> Back to Orders
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6" data-testid="order-header">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-bold">{order.orderNumber}</h2>
            <StatusBadge status={order.status} />
            <WebsiteBadge source={order.sourceWebsite} />
            <span className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleString()}</span>
          </div>

          {/* Status Change */}
          <div className="mt-4 flex items-center gap-2">
            <label className="text-sm text-gray-600">Change Status:</label>
            <select
              value={order.status}
              onChange={(e) => statusMutation.mutate(e.target.value)}
              className="h-8 px-2 border border-gray-300 rounded text-sm"
              data-testid="status-select"
            >
              {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select>
          </div>
        </div>

        {/* Customer */}
        <div className="bg-white rounded-lg shadow-sm p-6" data-testid="customer-section">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-3">
            <User size={16} /> Customer
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div><span className="text-gray-500">Name:</span> <span className="font-medium">{order.customer?.firstName} {order.customer?.lastName}</span></div>
            <div><span className="text-gray-500">Email:</span> <span className="font-medium">{order.customer?.email}</span></div>
            <div><span className="text-gray-500">Phone:</span> <span className="font-medium">{order.customer?.phone || '—'}</span></div>
          </div>
        </div>

        {/* Shipment Details */}
        {order.shipmentDetails && (
          <div className="bg-white rounded-lg shadow-sm p-6" data-testid="shipment-section">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-3">
              <Package size={16} /> Shipment Details
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div><span className="text-gray-500">Cabinets:</span> <span className="font-medium">{order.shipmentDetails.cabinetCount} ({order.shipmentDetails.cabinetType})</span></div>
              <div><span className="text-gray-500">Weight:</span> <span className="font-medium">{Number(order.shipmentDetails.estimatedWeight)} lbs</span></div>
              <div><span className="text-gray-500">Origin ZIP:</span> <span className="font-medium">{order.shipmentDetails.originZip}</span></div>
              <div><span className="text-gray-500">Dest ZIP:</span> <span className="font-medium">{order.shipmentDetails.destinationZip}</span></div>
              <div><span className="text-gray-500">Location:</span> <span className="font-medium">{order.shipmentDetails.deliveryLocationType}</span></div>
              <div><span className="text-gray-500">Method:</span> <span className="font-medium">{order.shipmentDetails.deliveryMethod}</span></div>
              <div><span className="text-gray-500">Freight Class:</span> <span className="font-medium">{order.shipmentDetails.freightClass}</span></div>
              <div><span className="text-gray-500">Pallets:</span> <span className="font-medium">{order.shipmentDetails.estimatedPallets}</span></div>
            </div>
          </div>
        )}

        {/* Rate Quotes */}
        {order.rateQuotes?.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6" data-testid="quotes-section">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Rate Quotes</h3>
            <div className="space-y-2">
              {order.rateQuotes.map((q) => (
                <div key={q.id} className={`flex items-center justify-between p-3 border rounded-md ${q.id === order.selectedRateId ? 'border-primary bg-blue-50' : 'border-gray-200'}`}>
                  <div className="flex items-center gap-3">
                    {q.id === order.selectedRateId && <Check size={16} className="text-primary" />}
                    <span className="text-sm font-medium">{q.carrier.replace('_', ' ')}</span>
                    <span className="text-xs text-gray-500">{q.serviceLevel}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1 text-gray-500"><Clock size={14} /> {q.transitDays}d</span>
                    <span className="font-bold">${Number(q.totalCost).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tracking */}
        <div className="bg-white rounded-lg shadow-sm p-6" data-testid="tracking-section">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-3">
            <MapPin size={16} /> Tracking
          </h3>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="text-xs text-gray-500">Tracking Number</label>
              <input
                value={trackingNum}
                onChange={(e) => setTrackingNum(e.target.value)}
                className="block h-9 px-3 border border-gray-300 rounded-md text-sm mt-1"
                placeholder="Enter tracking #"
                data-testid="tracking-input"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Carrier</label>
              <select
                value={trackingCarrier}
                onChange={(e) => setTrackingCarrier(e.target.value)}
                className="block h-9 px-2 border border-gray-300 rounded-md text-sm mt-1"
              >
                {CARRIERS.map((c) => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
              </select>
            </div>
            <button
              onClick={() => trackingMutation.mutate()}
              disabled={!trackingNum || trackingMutation.isPending}
              className="h-9 px-4 bg-primary text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
              data-testid="save-tracking-btn"
            >
              {trackingMutation.isPending ? 'Saving...' : 'Save Tracking'}
            </button>
          </div>
        </div>

        {/* Admin Notes */}
        <div className="bg-white rounded-lg shadow-sm p-6" data-testid="notes-section">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-3">
            <FileText size={16} /> Admin Notes
            {notesSaved && <span className="text-xs text-success font-normal">Saved ✓</span>}
          </h3>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={() => notesMutation.mutate()}
            rows={3}
            className="w-full p-3 border border-gray-300 rounded-md text-sm resize-none focus:ring-2 focus:ring-primary"
            placeholder="Add internal notes..."
            data-testid="admin-notes"
          />
        </div>

        {/* Audit Log */}
        {order.auditLogs?.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6" data-testid="audit-log">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Activity Timeline</h3>
            <div className="space-y-3">
              {order.auditLogs.map((log) => (
                <div key={log.id} className="flex gap-3 text-sm">
                  <div className="w-2 h-2 mt-1.5 bg-gray-300 rounded-full flex-shrink-0" />
                  <div>
                    <p className="text-gray-700">
                      <span className="font-medium">{log.action.replace('_', ' ')}</span>
                      {log.oldValue && <span className="text-gray-500"> from {log.oldValue}</span>}
                      {log.newValue && <span className="text-gray-500"> to <span className="font-medium">{log.newValue}</span></span>}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(log.createdAt).toLocaleString()} — {log.performedBy || 'System'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
