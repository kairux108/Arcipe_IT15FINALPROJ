import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../Components/Common/Sidebar';
import Navbar from '../Components/Common/Navbar';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  // Close sidebar on mobile when route changes
  useEffect(() => {
    if (window.innerWidth < 992) {
      setSidebarOpen(false);
    }
  }, [location.pathname]);

  // On desktop, default open
  useEffect(() => {
    setSidebarOpen(window.innerWidth >= 992);
  }, []);

  return (
    <div
      className="d-flex"
      style={{
        minHeight: '100vh',
        background: 'var(--surface-0)',
        fontFamily: 'var(--font-body)',
      }}
    >
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content — offset by sidebar width on desktop */}
      <div
        className="d-flex flex-column flex-grow-1"
        style={{
          marginLeft: sidebarOpen && window.innerWidth >= 992 ? 260 : 0,
          transition: 'margin-left 0.25s ease',
          minWidth: 0,
          minHeight: '100vh',
        }}
      >
        {/* Navbar */}
        <Navbar onMenuToggle={() => setSidebarOpen(prev => !prev)} />

        {/* Page Content */}
        <main
          className="flex-grow-1 p-4"
          style={{ minWidth: 0 }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}