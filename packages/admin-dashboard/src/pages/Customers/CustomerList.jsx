import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Search, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import Header from '../../components/Header.jsx';
import WebsiteBadge from '../../components/WebsiteBadge.jsx';
import { useFilterStore } from '../../store/filterStore.js';
import * as endpoints from '../../api/endpoints.js';

/**
 * Customer list page with search and pagination
 */
export default function CustomerList() {
  const navigate = useNavigate();
  const { sourceWebsite } = useFilterStore();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const params = {
    page, limit: 25,
    ...(sourceWebsite !== 'ALL' && { sourceWebsite }),
    ...(search && { search }),
  };

  const { data, isLoading } = useQuery({
    queryKey: ['customers', params],
    queryFn: () => endpoints.getCustomers(params).then((r) => r.data),
  });

  return (
    <div>
      <Header title="Customers" />
      <div className="p-6">
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by name or email..."
              className="w-full h-9 pl-9 pr-3 border border-gray-300 rounded-md text-sm"
              data-testid="customer-search"
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-x-auto" data-testid="customers-table">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b bg-gray-50">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Site</th>
                <th className="px-4 py-3 font-medium">Orders</th>
                <th className="px-4 py-3 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td colSpan={6} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td></tr>
                ))
              ) : data?.customers?.length > 0 ? (
                data.customers.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-gray-50 hover:bg-gray-50 transition cursor-pointer"
                    onClick={() => navigate(`/admin/customers/${c.id}`)}
                    data-testid="customer-row"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">{c.firstName} {c.lastName}</td>
                    <td className="px-4 py-3 text-gray-600">{c.email}</td>
                    <td className="px-4 py-3 text-gray-600">{c.phone || '—'}</td>
                    <td className="px-4 py-3"><WebsiteBadge source={c.sourceWebsite} /></td>
                    <td className="px-4 py-3 text-gray-600">{c._count?.orders || 0}</td>
                    <td className="px-4 py-3 text-gray-500">{new Date(c.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                  <Users size={32} className="mx-auto mb-2 opacity-50" />No customers found
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        {data?.pagination && data.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
            <span>Page {page} of {data.pagination.totalPages}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="p-2 border rounded-md hover:bg-gray-50 disabled:opacity-50"><ChevronLeft size={16} /></button>
              <button onClick={() => setPage(Math.min(data.pagination.totalPages, page + 1))} disabled={page === data.pagination.totalPages} className="p-2 border rounded-md hover:bg-gray-50 disabled:opacity-50"><ChevronRight size={16} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
