import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTheme } from '../../Context/ThemeContext';

const PAGE_TITLES = {
  '/admin/dashboard': 'Dashboard',
  '/admin/menu':      'Menu Management',
  '/admin/orders':    'Orders',
  '/admin/inventory': 'Inventory',
  '/admin/reports':   'Sales Reports',
  '/admin/users':     'User Management',
  '/cashier/pos':     'Point of Sale',
  '/cashier/orders':  'Order Queue',
  '/cashier/inventory': 'Inventory',
  '/menu':            'Browse Menu',
  '/my-orders':       'My Orders',
};

export default function Navbar({ onMenuToggle }) {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
      setDate(now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  const title = PAGE_TITLES[location.pathname] || 'Inventopia';

  return (
    <header
      className="d-flex align-items-center justify-content-between px-4"
      style={{
        height: 64,
        background: 'var(--surface-1)',
        borderBottom: '1px solid var(--border-subtle)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        fontFamily: 'var(--font-body)',
        flexShrink: 0,
      }}
    >
      {/* Left */}
      <div className="d-flex align-items-center gap-3">
        {/* Hamburger */}
        <button
          className="btn d-flex flex-column justify-content-center gap-1 p-2 rounded-3"
          onClick={onMenuToggle}
          style={{
            background: 'var(--surface-2)',
            border: '1px solid var(--border-subtle)',
            width: 38,
            height: 38,
          }}
        >
          <span style={{ display: 'block', width: 16, height: 2, background: 'var(--text-secondary)', borderRadius: 2 }} />
          <span style={{ display: 'block', width: 16, height: 2, background: 'var(--text-secondary)', borderRadius: 2 }} />
          <span style={{ display: 'block', width: 16, height: 2, background: 'var(--text-secondary)', borderRadius: 2 }} />
        </button>

        {/* Page Title */}
        <h1 className="mb-0" style={{
          fontSize: 18,
          fontWeight: 700,
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-body)',
        }}>
          {title}
        </h1>
      </div>

      {/* Right */}
      <div className="d-flex align-items-center gap-2">

        {/* Time */}
        <div
          className="d-none d-md-block fw-bold"
          style={{ fontSize: 14, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}
        >
          {time}
        </div>

        {/* Date pill */}
        <span
          className="d-none d-md-block badge rounded-pill px-3 py-2"
          style={{
            background: 'var(--surface-2)',
            color: 'var(--text-muted)',
            fontSize: 12,
            fontWeight: 600,
            border: '1px solid var(--border-subtle)',
          }}
        >
          {date}
        </span>

        {/* Theme Toggle */}
        <button
          className="btn d-flex align-items-center justify-content-center rounded-3"
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          style={{
            width: 38,
            height: 38,
            background: 'var(--surface-2)',
            border: '1px solid var(--border-subtle)',
            fontSize: 16,
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = '#FF6B35'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>
    </header>
  );
}