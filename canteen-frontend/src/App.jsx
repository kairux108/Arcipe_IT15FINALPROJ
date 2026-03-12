import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './Context/AuthContext';
import { CartProvider } from './Context/CartContext';
import { ThemeProvider } from './Context/ThemeContext';
import ErrorBoundary from './Components/Common/ErrorBoundary';
import AppLayout from './layouts/AppLayout';
import ProtectedRoute from './Components/Auth/ProtectedRoute';
import Login from './Components/Auth/Login';

// Admin
import AdminDashboard  from './Components/Dashboard/AdminDashboard';
import MenuList        from './Components/Menu/MenuList';
import OrderQueue      from './Components/Orders/OrderQueue';
import InventoryTable  from './Components/Inventory/InventoryTable';
import InventoryLogPage from './Components/Inventory/InventoryLogPage';
import LowStockAlert   from './Components/Inventory/LowStockAlert';
import SalesReport     from './Components/reports/SalesReport';
import UserManagement  from './Components/user/UserManagement';

// Cashier
import POSInterface from './Components/Orders/POSInterface';

// Customer
import BrowseMenu from './Components/customer/BrowseMenu';
import MyOrders   from './Components/customer/MyOrders';

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>
            <ErrorBoundary>
              <Routes>

                {/* Public */}
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<Navigate to="/login" replace />} />

                {/* Admin */}
                <Route element={
                  <ProtectedRoute roles={['admin']}>
                    <AppLayout />
                  </ProtectedRoute>
                }>
                  <Route path="/admin/dashboard"        element={<AdminDashboard />} />
                  <Route path="/admin/menu"             element={<MenuList />} />
                  <Route path="/admin/orders"           element={<OrderQueue />} />
                  <Route path="/admin/inventory"        element={<InventoryTable />} />
                  <Route path="/admin/inventory/log"    element={<InventoryLogPage />} />
                  <Route path="/admin/inventory/alerts" element={<LowStockAlert />} />
                  <Route path="/admin/reports"          element={<SalesReport />} />
                  <Route path="/admin/users"            element={<UserManagement />} />
                </Route>

                {/* Cashier */}
                <Route element={
                  <ProtectedRoute roles={['cashier']}>
                    <AppLayout />
                  </ProtectedRoute>
                }>
                  <Route path="/cashier/pos"               element={<POSInterface />} />
                  <Route path="/cashier/orders"            element={<OrderQueue />} />
                  <Route path="/cashier/inventory"         element={<InventoryTable />} />
                  <Route path="/cashier/inventory/log"     element={<InventoryLogPage />} />
                </Route>

                {/* Customer */}
                <Route element={
                  <ProtectedRoute roles={['customer']}>
                    <AppLayout />
                  </ProtectedRoute>
                }>
                  <Route path="/menu"      element={<BrowseMenu />} />
                  <Route path="/my-orders" element={<MyOrders />} />
                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/login" replace />} />

              </Routes>
            </ErrorBoundary>
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}