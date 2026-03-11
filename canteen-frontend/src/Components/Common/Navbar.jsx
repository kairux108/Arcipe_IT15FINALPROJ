import { useLocation } from 'react-router-dom';
import styles from './Navbar.module.css';

const pageTitles = {
  '/admin/dashboard': 'Dashboard',
  '/admin/menu': 'Menu Management',
  '/admin/orders': 'Orders',
  '/admin/inventory': 'Inventory',
  '/admin/reports': 'Sales Reports',
  '/admin/users': 'User Management',
  '/cashier/pos': 'Point of Sale',
  '/cashier/orders': 'Order Queue',
  '/cashier/inventory': 'Inventory',
  '/menu': 'Browse Menu',
  '/my-orders': 'My Orders',
};

export default function Navbar({ onMenuToggle }) {
  const location = useLocation();
  const now = new Date();
  const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const date = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const title = pageTitles[location.pathname] || 'CanteenPro';

  return (
    <header className={styles.navbar}>
      <div className={styles.left}>
        <button className={styles.menuBtn} onClick={onMenuToggle} aria-label="Toggle menu">
          <span />
          <span />
          <span />
        </button>
        <div className={styles.pageTitle}>{title}</div>
      </div>
      <div className={styles.right}>
        <div className={styles.time}>{time}</div>
        <div className={styles.datePill}>{date}</div>
      </div>
    </header>
  );
}