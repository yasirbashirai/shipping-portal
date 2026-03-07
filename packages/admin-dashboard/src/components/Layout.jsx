import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';

/**
 * Admin dashboard layout — sidebar + main content area
 */
export default function Layout() {
  return (
    <div className="min-h-screen bg-page">
      <Sidebar />
      <main className="lg:ml-60 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}
