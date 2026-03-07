import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, User, Mail, Phone } from 'lucide-react';
import Header from '../../components/Header.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import WebsiteBadge from '../../components/WebsiteBadge.jsx';
import * as endpoints from '../../api/endpoints.js';

/**
 * Customer detail page — profile info and full order history
 */
export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: customer, isLoading } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => endpoints.getCustomer(id).then((r) => r.data.customer),
  });

  if (isLoading) {
    return (
      <div>
        <Header title="Customer Details" />
        <div className="p-6"><div className="bg-white rounded-lg shadow-sm p-6 animate-pulse"><div className="h-6 bg-gray-200 rounded w-1/3" /></div></div>
      </div>
    );
  }

  if (!customer) return null;

  return (
    <div>
      <Header title="Customer Details" />
      <div className="p-6 space-y-6">
        <button onClick={() => navigate('/admin/customers')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft size={16} /> Back to Customers
        </button>

        <div className="bg-white rounded-lg shadow-sm p-6" data-testid="customer-profile">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white text-lg font-semibold">
              {customer.firstName.charAt(0)}{customer.lastName.charAt(0)}
            </div>
            <div>
              <h2 className="text-xl font-bold">{customer.firstName} {customer.lastName}</h2>
              <WebsiteBadge source={customer.sourceWebsite} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2"><Mail size={14} className="text-gray-400" /> {customer.email}</div>
            <div className="flex items-center gap-2"><Phone size={14} className="text-gray-400" /> {customer.phone || 'No phone'}</div>
            <div className="flex items-center gap-2"><User size={14} className="text-gray-400" /> Joined {new Date(customer.createdAt).toLocaleDateString()}</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm" data-testid="customer-orders">
          <div className="px-5 py-4 border-b"><h3 className="text-sm font-semibold">Order History ({customer.orders?.length || 0})</h3></div>
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs text-gray-500 border-b bg-gray-50">
              <th className="px-4 py-3 font-medium">Order #</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Date</th>
            </tr></thead>
            <tbody>
              {customer.orders?.map((order) => (
                <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/admin/orders/${order.id}`)}>
                  <td className="px-4 py-3 font-medium text-primary">{order.orderNumber}</td>
                  <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                  <td className="px-4 py-3">{order.totalAmount ? `$${Number(order.totalAmount).toFixed(2)}` : '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
