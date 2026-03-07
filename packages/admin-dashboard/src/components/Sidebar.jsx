import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Package, Users, MapPin, BarChart2, Settings, LogOut, Menu, X,
} from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '../store/authStore.js';
import * as endpoints from '../api/endpoints.js';

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', roles: ['OWNER', 'STAFF'] },
  { to: '/admin/orders', icon: Package, label: 'Orders', roles: ['OWNER', 'STAFF'] },
  { to: '/admin/customers', icon: Users, label: 'Customers', roles: ['OWNER', 'STAFF'] },
  { to: '/admin/tracking', icon: MapPin, label: 'Tracking', roles: ['OWNER', 'STAFF'] },
  { to: '/admin/rates', icon: BarChart2, label: 'Rate Audit', roles: ['OWNER'] },
  { to: '/admin/settings', icon: Settings, label: 'Settings', roles: ['OWNER'] },
];

/**
 * Fixed sidebar navigation component with collapse support
 */
export default function Sidebar() {
  const { user, logout: logoutState, refreshToken } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await endpoints.logout(refreshToken);
    } catch { /* ignore */ }
    logoutState();
  };

  const filteredItems = navItems.filter((item) => item.roles.includes(user?.role));

  const sidebarContent = (
    <div className="flex flex-col h-full" data-testid="sidebar">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-gray-700">
        <h1 className="text-lg font-bold text-white">Shipping Portal</h1>
        <p className="text-xs text-gray-400 mt-0.5">Admin Dashboard</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {filteredItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/admin'}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition ${
                isActive
                  ? 'bg-sidebar-active text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`
            }
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User Info */}
      <div className="px-4 py-4 border-t border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-semibold">
            {user?.name?.charAt(0) || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <p className="text-xs text-gray-400 truncate">{user?.role}</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 text-gray-400 hover:text-white transition"
            title="Logout"
            data-testid="logout-btn"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-sidebar rounded-md text-white"
        onClick={() => setMobileOpen(!mobileOpen)}
        data-testid="mobile-menu-btn"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen w-60 bg-sidebar transition-transform lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
