import api from './api';

export const orderService = {
  async getOrders(params = {}) {
    const { data } = await api.get('/orders', { params });
    return data;
  },

  async getMyOrders(params = {}) {
    const { data } = await api.get('/orders/my', { params });
    return data;
  },

  async getOrder(id) {
    const { data } = await api.get(`/orders/${id}`);
    return data;
  },

  async createOrder(orderData) {
    const { data } = await api.post('/orders', orderData);
    return data;
  },

  async updateStatus(id, status) {
    const { data } = await api.patch(`/orders/${id}/status`, { status });
    return data;
  },

  async getQueue() {
    const { data } = await api.get('/orders-queue');
    return data;
  },
};

export const menuService = {
  async getItems(params = {}) {
    const { data } = await api.get('/menu', { params });
    return data;
  },

  async getItem(id) {
    const { data } = await api.get(`/menu/${id}`);
    return data;
  },

  async createItem(formData) {
    const { data } = await api.post('/menu', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async updateItem(id, formData) {
    const { data } = await api.put(`/menu/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async deleteItem(id) {
    const { data } = await api.delete(`/menu/${id}`);
    return data;
  },

  async toggleAvailability(id) {
    const { data } = await api.patch(`/menu/${id}/toggle-availability`);
    return data;
  },

  async getCategories() {
    const { data } = await api.get('/categories');
    return data;
  },

  async createCategory(categoryData) {
    const { data } = await api.post('/categories', categoryData);
    return data;
  },
};

export const inventoryService = {
  async getInventory(params = {}) {
    const { data } = await api.get('/inventory', { params });
    return data;
  },

  async restock(menuItemId, quantity, reason) {
    const { data } = await api.post(`/inventory/${menuItemId}/restock`, { quantity, reason });
    return data;
  },

  async bulkRestock(items, reason) {
    const { data } = await api.post('/inventory/bulk-restock', { items, reason });
    return data;
  },

  async adjust(menuItemId, quantity, reason) {
    const { data } = await api.post(`/inventory/${menuItemId}/adjust`, { quantity, reason });
    return data;
  },

  async getLogs(params = {}) {
    const { data } = await api.get('/inventory/logs', { params });
    return data;
  },

  async getLowStockAlerts() {
    const { data } = await api.get('/inventory/low-stock');
    return data;
  },
};

export const reportService = {
  async getSalesSummary(params = {}) {
    const { data } = await api.get('/reports/sales-summary', { params });
    return data;
  },

  async getBestSellers(params = {}) {
    const { data } = await api.get('/reports/best-sellers', { params });
    return data;
  },

  async getSalesByCategory(params = {}) {
    const { data } = await api.get('/reports/sales-by-category', { params });
    return data;
  },

  async getOrderTrends(params = {}) {
    const { data } = await api.get('/reports/order-trends', { params });
    return data;
  },

  exportCsv(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    window.open(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/reports/export-csv?${queryString}`, '_blank');
  },
};