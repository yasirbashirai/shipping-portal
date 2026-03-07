import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Eye, Pencil, MapPin, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import Header from '../../components/Header.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import WebsiteBadge from '../../components/WebsiteBadge.jsx';
import { useFilterStore } from '../../store/filterStore.js';
import * as endpoints from '../../api/endpoints.js';

const STATUSES = ['', 'PENDING', 'PROCESSING', 'BOOKED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED', 'ON_HOLD'];

/**
 * Orders list page with filters, search, and pagination
 */
export default function OrderList() {
  const navigate = useNavigate();
  const { sourceWebsite } = useFilterStore();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');

  const params = {
    page,
    limit: 25,
    ...(status && { status }),
    ...(sourceWebsite !== 'ALL' && { sourceWebsite }),
    ...(search && { search }),
  };

  const { data, isLoading } = useQuery({
    queryKey: ['orders', params],
    queryFn: () => endpoints.getOrders(params).then((r) => r.data),
  });

  return (
    <div>
      <Header title="Orders" />
      <div className="p-6">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4 flex flex-wrap gap-3 items-center" data-testid="order-filters">
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="h-9 px-3 border border-gray-300 rounded-md text-sm"
            data-testid="status-filter"
          >
            <option value="">All Statuses</option>
            {STATUSES.filter(Boolean).map((s) => (
              <option key={s} value={s}>{s.replace('_', ' ')}</option>
            ))}
          </select>

          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search orders, customers..."
              className="w-full h-9 pl-9 pr-3 border border-gray-300 rounded-md text-sm"
              data-testid="order-search"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-x-auto" data-testid="orders-table">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b bg-gray-50">
                <th className="px-4 py-3 font-medium">Order #</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Site</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Carrier</th>
                <th className="px-4 py-3 font-medium">Shipping</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={8} className="px-4 py-3">
                      <div className="h-4 bg-gray-100 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : data?.orders?.length > 0 ? (
                data.orders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50 transition" data-testid="order-row">
                    <td className="px-4 py-3 font-medium text-primary">{order.orderNumber}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {order.customer?.firstName} {order.customer?.lastName}
                    </td>
                    <td className="px-4 py-3"><WebsiteBadge source={order.sourceWebsite} /></td>
                    <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                    <td className="px-4 py-3 text-gray-600">{order.carrierBooked?.replace('_', ' ') || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {order.shippingCost ? `$${Number(order.shippingCost).toFixed(2)}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button
                          onClick={() => navigate(`/admin/orders/${order.id}`)}
                          className="p-1.5 text-gray-400 hover:text-primary transition"
                          title="View"
                          data-testid="view-order-btn"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => navigate(`/admin/orders/${order.id}`)}
                          className="p-1.5 text-gray-400 hover:text-primary transition"
                          title="Edit Status"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => navigate(`/admin/tracking`)}
                          className="p-1.5 text-gray-400 hover:text-primary transition"
                          title="Add Tracking"
                        >
                          <MapPin size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                    No orders found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data?.pagination && data.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
            <span>
              Showing {((page - 1) * 25) + 1}–{Math.min(page * 25, data.pagination.total)} of {data.pagination.total}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="p-2 border rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setPage(Math.min(data.pagination.totalPages, page + 1))}
                disabled={page === data.pagination.totalPages}
                className="p-2 border rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
