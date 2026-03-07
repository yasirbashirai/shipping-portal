import { useQuery } from '@tanstack/react-query';
import { Package, AlertCircle, DollarSign, UserPlus } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import Header from '../../components/Header.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import WebsiteBadge from '../../components/WebsiteBadge.jsx';
import { useFilterStore } from '../../store/filterStore.js';
import * as endpoints from '../../api/endpoints.js';

const CARRIER_COLORS = { XPO: '#3B82F6', RL_CARRIERS: '#10B981', SEFL: '#F59E0B', FEDEX_FREIGHT: '#8B5CF6' };

/**
 * Dashboard overview page — stat cards, recent orders, carrier usage chart
 */
export default function Dashboard() {
  const { sourceWebsite } = useFilterStore();
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-stats', sourceWebsite],
    queryFn: () => endpoints.getDashboardStats(sourceWebsite).then((r) => r.data.stats),
    refetchInterval: 30000,
  });

  const statCards = [
    { label: 'Orders Today', value: data?.ordersToday, sub: `${data?.ordersThisWeek || 0} this week`, icon: Package, color: 'text-blue-600 bg-blue-100' },
    { label: 'Pending Tracking', value: data?.pendingTracking, sub: 'Need tracking #', icon: AlertCircle, color: 'text-orange-600 bg-orange-100' },
    { label: 'Revenue (Month)', value: data?.revenueThisMonth ? `$${Number(data.revenueThisMonth).toLocaleString()}` : '$0', sub: 'This month', icon: DollarSign, color: 'text-green-600 bg-green-100' },
    { label: 'New Customers', value: data?.newCustomersThisWeek, sub: 'This week', icon: UserPlus, color: 'text-purple-600 bg-purple-100' },
  ];

  return (
    <div>
      <Header title="Dashboard" />
      <div className="p-6 space-y-6">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4" data-testid="stat-cards">
          {statCards.map((card) => (
            <div key={card.label} className="bg-white rounded-lg shadow-sm p-5" data-testid="stat-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{card.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {isLoading ? <span className="inline-block w-12 h-7 bg-gray-200 rounded animate-pulse" /> : card.value}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
                </div>
                <div className={`p-3 rounded-lg ${card.color}`}>
                  <card.icon size={20} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Orders + Carrier Chart */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          {/* Recent Orders */}
          <div className="xl:col-span-3 bg-white rounded-lg shadow-sm" data-testid="recent-orders">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">Recent Orders</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 border-b">
                    <th className="px-5 py-3 font-medium">Order #</th>
                    <th className="px-5 py-3 font-medium">Customer</th>
                    <th className="px-5 py-3 font-medium">Site</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        <td colSpan={5} className="px-5 py-3">
                          <div className="h-4 bg-gray-100 rounded animate-pulse" />
                        </td>
                      </tr>
                    ))
                  ) : data?.recentOrders?.length > 0 ? (
                    data.recentOrders.map((order) => (
                      <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                        <td className="px-5 py-3 font-medium text-primary">{order.orderNumber}</td>
                        <td className="px-5 py-3 text-gray-700">
                          {order.customer?.firstName} {order.customer?.lastName}
                        </td>
                        <td className="px-5 py-3"><WebsiteBadge source={order.sourceWebsite} /></td>
                        <td className="px-5 py-3"><StatusBadge status={order.status} /></td>
                        <td className="px-5 py-3 text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-5 py-8 text-center text-gray-400">
                        <Package size={32} className="mx-auto mb-2 opacity-50" />
                        No orders yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Carrier Usage Chart */}
          <div className="xl:col-span-2 bg-white rounded-lg shadow-sm p-5" data-testid="carrier-chart">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Carrier Usage</h2>
            {data?.carrierUsage?.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={data.carrierUsage}
                    dataKey="count"
                    nameKey="carrier"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={40}
                    label={({ carrier }) => carrier?.replace('_', ' ')}
                  >
                    {data.carrierUsage.map((entry) => (
                      <Cell key={entry.carrier} fill={CARRIER_COLORS[entry.carrier] || '#6B7280'} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
                No carrier data yet
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
