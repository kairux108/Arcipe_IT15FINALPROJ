import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';
import styles from './Sidebar.module.css';

const adminNav = [
  { to: '/admin/dashboard', icon: '📊', label: 'Dashboard' },
  { to: '/admin/menu', icon: '🍽️', label: 'Menu' },
  { to: '/admin/orders', icon: '📋', label: 'Orders' },
  { to: '/admin/inventory', icon: '📦', label: 'Inventory' },
  { to: '/admin/reports', icon: '📈', label: 'Reports' },
  { to: '/admin/users', icon: '👥', label: 'Users' },
];

const cashierNav = [
  { to: '/cashier/pos', icon: '💳', label: 'Point of Sale' },
  { to: '/cashier/orders', icon: '📋', label: 'Order Queue' },
  { to: '/cashier/inventory', icon: '📦', label: 'Inventory' },
];

const customerNav = [
  { to: '/menu', icon: '🍽️', label: 'Browse Menu' },
  { to: '/my-orders', icon: '📋', label: 'My Orders' },
];

const navByRole = { admin: adminNav, cashier: cashierNav, customer: customerNav };

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navItems = navByRole[user?.role] || [];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      {isOpen && <div className={styles.overlay} onClick={onClose} />}
      <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
        <div className={styles.brand}>
          <span className={styles.brandIcon}>🍽️</span>
          <div>
            <div className={styles.brandName}>Inventopia</div>
            <div className={styles.brandSub}>Canteen Management System</div>
          </div>
        </div>

        <div className={styles.userCard}>
          <div className={styles.avatar}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className={styles.userInfo}>
            <div className={styles.userName}>{user?.name}</div>
            <div className={`badge ${
              user?.role === 'admin' ? 'badge-warning' :
              user?.role === 'cashier' ? 'badge-info' : 'badge-success'
            } ${styles.roleBadge}`}>
              {user?.role}
            </div>
          </div>
        </div>

        <nav className={styles.nav}>
          <div className={styles.navSection}>
            <span className={styles.navSectionLabel}>Navigation</span>
            {navItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `${styles.navItem} ${isActive ? styles.active : ''}`
                }
                onClick={onClose}
              >
                <span className={styles.navIcon}>{item.icon}</span>
                <span className={styles.navLabel}>{item.label}</span>
                <span className={styles.navArrow}>›</span>
              </NavLink>
            ))}
          </div>
        </nav>

        <div className={styles.footer}>
          <button onClick={handleLogout} className={styles.logoutBtn}>
            <span>🚪</span>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}