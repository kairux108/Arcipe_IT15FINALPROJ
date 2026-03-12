import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';

const NAV = {
  admin: [
    { to: '/admin/dashboard', icon: '📊', label: 'Dashboard' },
    { to: '/admin/menu',      icon: '🍽️', label: 'Menu' },
    { to: '/admin/orders',    icon: '📋', label: 'Orders' },
    { to: '/admin/inventory', icon: '📦', label: 'Inventory' },
    { to: '/admin/reports',   icon: '📈', label: 'Reports' },
    { to: '/admin/users',     icon: '👥', label: 'Users' },
  ],
  cashier: [
    { to: '/cashier/pos',       icon: '🖥️', label: 'Point of Sale' },
    { to: '/cashier/orders',    icon: '📋', label: 'Order Queue' },
    { to: '/cashier/inventory', icon: '📦', label: 'Inventory' },
  ],
  customer: [
    { to: '/menu',      icon: '🍽️', label: 'Browse Menu' },
    { to: '/my-orders', icon: '📋', label: 'My Orders' },
  ],
};

const ROLE_COLORS = {
  admin:    { bg: 'rgba(255,107,53,0.15)',  color: '#FF6B35' },
  cashier:  { bg: 'rgba(17,138,178,0.15)',  color: '#118AB2' },
  customer: { bg: 'rgba(6,214,160,0.15)',   color: '#06D6A0' },
};

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const navItems = NAV[user?.role] || [];
  const roleStyle = ROLE_COLORS[user?.role] || ROLE_COLORS.customer;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="d-lg-none position-fixed top-0 start-0 w-100 h-100"
          style={{ background: 'rgba(0,0,0,0.6)', zIndex: 1040, backdropFilter: 'blur(4px)' }}
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className="d-flex flex-column position-fixed top-0 start-0 h-100"
        style={{
          width: 260,
          background: 'var(--surface-1)',
          borderRight: '1px solid var(--border-subtle)',
          zIndex: 1045,
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.25s ease',
          fontFamily: 'var(--font-body)',
        }}
      >
        {/* Brand */}
        <div className="d-flex align-items-center gap-3 px-4 py-4"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <div
            className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
            style={{
              width: 40, height: 40,
              background: 'linear-gradient(135deg, #FF6B35, #FFD166)',
              fontSize: 18,
              boxShadow: '0 4px 12px rgba(255,107,53,0.3)',
            }}
          >
            🍽️
          </div>
          <div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: 18,
              fontWeight: 800,
              color: '#FF6B35',
              lineHeight: 1,
            }}>
              Inventopia
            </div>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.1em', marginTop: 3 }}>
              CANTEEN MANAGEMENT SYSTEM
            </div>
          </div>
        </div>

        {/* User Card */}
        <div className="mx-3 mt-3 mb-2 p-3 rounded-3"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)' }}>
          <div className="d-flex align-items-center gap-3">
            <div
              className="d-flex align-items-center justify-content-center rounded-3 fw-bold flex-shrink-0"
              style={{
                width: 38, height: 38,
                background: 'linear-gradient(135deg, #FF6B35, #FFD166)',
                color: 'white',
                fontSize: 15,
              }}
            >
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <div className="fw-semibold text-truncate" style={{ fontSize: 14, color: 'var(--text-primary)' }}>
                {user?.name}
              </div>
              <span
                className="badge rounded-pill mt-1"
                style={{
                  background: roleStyle.bg,
                  color: roleStyle.color,
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '3px 8px',
                }}
              >
                {user?.role}
              </span>
            </div>
          </div>
        </div>

        {/* Nav Label */}
        <div className="px-4 mb-2 mt-3" style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
          Navigation
        </div>

        {/* Nav Links */}
        <nav className="px-2 flex-grow-1" style={{ overflowY: 'auto' }}>
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className="d-flex align-items-center gap-3 text-decoration-none rounded-3 mb-1 px-3 py-2"
              style={({ isActive }) => ({
                background: isActive ? 'rgba(255,107,53,0.12)' : 'transparent',
                color: isActive ? '#FF6B35' : 'var(--text-secondary)',
                fontWeight: isActive ? 700 : 500,
                fontSize: 14,
                borderLeft: isActive ? '3px solid #FF6B35' : '3px solid transparent',
                transition: 'all 0.15s ease',
              })}
            >
              <span style={{ fontSize: 16, width: 22, textAlign: 'center' }}>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Sign Out */}
        <div className="p-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <button
            className="btn d-flex align-items-center gap-3 w-100 rounded-3 px-3 py-2"
            onClick={handleLogout}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: 14,
              fontWeight: 500,
              transition: 'all 0.15s ease',
              textAlign: 'left',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(239,71,111,0.08)';
              e.currentTarget.style.color = '#EF476F';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
          >
            <span style={{ fontSize: 16 }}>🚪</span>
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </>
  );
}