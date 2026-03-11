import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './Context/AuthContext';
import { CartProvider } from './Context/CartContext';
import ProtectedRoute from './Components/Auth/ProtectedRoute';
import ErrorBoundary from './Components/Common/ErrorBoundary';
import AppLayout from './layouts/AppLayout';

// Pages
import Login from './Components/Auth/Login';
import AdminDashboard from './Components/Dashboard/AdminDashboard';
import MenuList from './Components/Menu/MenuList';
import POSInterface from './Components/Orders/POSInterface';
import OrderQueue from './Components/Orders/OrderQueue';
import InventoryTable from './Components/Inventory/InventoryTable';

// Lazy-loaded or simple page wrappers
function ReportsPage() {
  // Import inline to keep bundle manageable
  const { useState, useEffect } = require('react');
  return <div style={{ padding: 20, color: 'var(--text-muted)' }}>Sales Reports — charts coming soon (see AdminDashboard)</div>;
}

function NotFound() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16, textAlign: 'center' }}>
      <div style={{ fontSize: 60 }}>404</div>
      <h2 style={{ fontFamily: 'var(--font-display)' }}>Page Not Found</h2>
      <p style={{ color: 'var(--text-muted)' }}>The page you're looking for doesn't exist.</p>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <ErrorBoundary>
            <Routes>
              {/* Public */}
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<Navigate to="/login" replace />} />

              {/* Protected - Admin */}
              <Route element={
                <ProtectedRoute roles={['admin']}>
                  <AppLayout />
                </ProtectedRoute>
              }>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/menu" element={<MenuList />} />
                <Route path="/admin/orders" element={<OrderQueue />} />
                <Route path="/admin/inventory" element={<InventoryTable />} />
                <Route path="/admin/reports" element={<AdminDashboard />} />
              </Route>

              {/* Protected - Cashier */}
              <Route element={
                <ProtectedRoute roles={['cashier']}>
                  <AppLayout />
                </ProtectedRoute>
              }>
                <Route path="/cashier/pos" element={<POSInterface />} />
                <Route path="/cashier/orders" element={<OrderQueue />} />
                <Route path="/cashier/inventory" element={<InventoryTable />} />
              </Route>

              {/* Protected - Customer */}
              <Route element={
                <ProtectedRoute roles={['customer']}>
                  <AppLayout />
                </ProtectedRoute>
              }>
                <Route path="/menu" element={
                  <div style={{ padding: 20, color: 'var(--text-muted)' }}>
                    Customer menu browsing page (uses same MenuList with no admin actions)
                  </div>
                } />
                <Route path="/my-orders" element={
                  <div style={{ padding: 20, color: 'var(--text-muted)' }}>
                    My Orders page — list of customer's past orders
                  </div>
                } />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </ErrorBoundary>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}