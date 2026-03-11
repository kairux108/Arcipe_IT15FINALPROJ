import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../Components/Common/Sidebar';
import Navbar from '../Components/Common/Navbar';
import styles from './AppLayout.module.css';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className={styles.layout}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className={styles.main}>
        <Navbar onMenuToggle={() => setSidebarOpen(s => !s)} />
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}