import api from './api';

// ─── Menu ────────────────────────────────────────────────────────────────────
export const menuService = {
  getItems: (params = {}) =>
    api.get('/menu', { params }).then(r => r.data),

  getItem: (id) =>
    api.get(`/menu/${id}`).then(r => r.data),

  getCategories: () =>
    api.get('/categories').then(r => r.data),

  createItem: (data) =>
    api.post('/menu', data),

  updateItem: (id, data) =>
    api.put(`/menu/${id}`, data),

  deleteItem: (id) =>
    api.delete(`/menu/${id}`),

  toggleAvailability: (id) =>
    api.patch(`/menu/${id}/toggle-availability`),
};

// ─── Orders ──────────────────────────────────────────────────────────────────
export const orderService = {
  getOrders: (params = {}) =>
    api.get('/orders', { params }).then(r => r.data),

  getOrder: (id) =>
    api.get(`/orders/${id}`).then(r => r.data),

  getQueue: (params = {}) =>
    api.get('/orders-queue', { params }).then(r => r.data),

  getMyOrders: (params = {}) =>
    api.get('/orders/my', { params }).then(r => r.data),

  createOrder: (data) =>
    api.post('/orders', data).then(r => r.data),

  updateStatus: (id, status, notes = '') =>
    api.patch(`/orders/${id}/status`, { status, notes }).then(r => r.data),

  cancelOrder: (id, reason = '') =>
    api.patch(`/orders/${id}/status`, { status: 'cancelled', notes: reason }).then(r => r.data),
};

// ─── Inventory ───────────────────────────────────────────────────────────────
export const inventoryService = {
  getInventory: (params = {}) =>
    api.get('/inventory', { params }).then(r => r.data),

  getLowStockAlerts: () =>
    api.get('/inventory/low-stock').then(r => r.data),

  restockItem: (id, quantity, reason = '') =>
    api.post(`/inventory/${id}/restock`, { quantity, reason }).then(r => r.data),

  bulkRestock: (items) =>
    api.post('/inventory/bulk-restock', { items }).then(r => r.data),

  adjustStock: (id, quantity, type, reason = '') =>
    api.post(`/inventory/${id}/adjust`, { quantity, type, reason }).then(r => r.data),

  getLogs: (params = {}) =>
    api.get('/inventory/logs', { params }).then(r => r.data),
};

// ─── Reports ─────────────────────────────────────────────────────────────────
export const reportService = {
  getSalesSummary: (params = {}) =>
    api.get('/reports/sales-summary', { params }).then(r => r.data),

  getBestSellers: (params = {}) =>
    api.get('/reports/best-sellers', { params }).then(r => r.data),

  getTopItems: (params = {}) =>
    api.get('/reports/best-sellers', { params }).then(r => r.data),

  getSalesByCategory: (params = {}) =>
    api.get('/reports/sales-by-category', { params }).then(r => r.data),

  getOrderTrends: (params = {}) =>
    api.get('/reports/order-trends', { params }).then(r => r.data),

  exportCsv: (params = {}) =>
    api.get('/reports/export-csv', { params, responseType: 'blob' }).then(r => {
      const url  = window.URL.createObjectURL(new Blob([r.data]));
      const link = document.createElement('a');
      link.href  = url;
      link.setAttribute('download', `sales-report-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    }),
};