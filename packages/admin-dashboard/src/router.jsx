import { createBrowserRouter, Navigate } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Login from './pages/Login/Login.jsx';
import Dashboard from './pages/Dashboard/Dashboard.jsx';
import OrderList from './pages/Orders/OrderList.jsx';
import OrderDetail from './pages/Orders/OrderDetail.jsx';
import CustomerList from './pages/Customers/CustomerList.jsx';
import CustomerDetail from './pages/Customers/CustomerDetail.jsx';
import Tracking from './pages/Tracking/Tracking.jsx';
import Settings from './pages/Settings/Settings.jsx';
import { useAuthStore } from './store/authStore.js';

/**
 * Auth guard component — redirects to login if not authenticated
 */
function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, user } = useAuthStore.getState();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (requiredRole && user?.role !== requiredRole) return <Navigate to="/admin" replace />;
  return children;
}

/**
 * Application router configuration with role-based access control
 */
export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/admin',
    element: <ProtectedRoute><Layout /></ProtectedRoute>,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'orders', element: <OrderList /> },
      { path: 'orders/:id', element: <OrderDetail /> },
      { path: 'customers', element: <CustomerList /> },
      { path: 'customers/:id', element: <CustomerDetail /> },
      { path: 'tracking', element: <Tracking /> },
      {
        path: 'rates',
        element: <ProtectedRoute requiredRole="OWNER"><div>Rate Audit</div></ProtectedRoute>,
      },
      {
        path: 'settings',
        element: <ProtectedRoute requiredRole="OWNER"><Settings /></ProtectedRoute>,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/admin" replace />,
  },
]);
