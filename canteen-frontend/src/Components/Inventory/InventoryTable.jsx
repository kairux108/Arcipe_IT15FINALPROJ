import { useState, useEffect } from 'react';
import { inventoryService } from '../../Services/orderService';
import LoadingSpinner from '../Common/LoadingSpinner';
import styles from './InventoryTable.module.css';

export default function InventoryTable() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);
  const [restockModal, setRestockModal] = useState(null);
  const [restockQty, setRestockQty] = useState('');
  const [restockReason, setRestockReason] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadInventory();
  }, [showLowStock]);

  const loadInventory = async () => {
    setLoading(true);
    try {
      const data = await inventoryService.getInventory({
        low_stock: showLowStock ? 'true' : undefined,
        search: search || undefined,
        per_page: 50,
      });
      setItems(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadInventory();
  };

  const handleRestock = async () => {
    if (!restockQty || !restockModal) return;
    setSaving(true);
    try {
      await inventoryService.restock(restockModal.id, parseInt(restockQty), restockReason || 'Manual restock');
      setRestockModal(null);
      setRestockQty('');
      setRestockReason('');
      loadInventory();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to restock');
    } finally {
      setSaving(false);
    }
  };

  const getStockStatus = (item) => {
    if (item.stock_quantity <= 0) return { label: 'Out of Stock', cls: 'badge-danger' };
    if (item.stock_quantity <= item.low_stock_threshold) return { label: 'Low Stock', cls: 'badge-warning' };
    return { label: 'In Stock', cls: 'badge-success' };
  };

  return (
    <div className={styles.inventory}>
      <div className={styles.toolbar}>
        <form onSubmit={handleSearch} className={styles.searchForm}>
          <input
            type="search"
            className="form-input"
            placeholder="🔍 Search items..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button type="submit" className="btn btn-secondary">Search</button>
        </form>
        <div className={styles.filters}>
          <button
            className={`btn ${showLowStock ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setShowLowStock(s => !s)}
          >
            ⚠️ Low Stock Only
          </button>
          <button className="btn btn-secondary" onClick={loadInventory}>↻ Refresh</button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><LoadingSpinner /></div>
      ) : (
        <div className={styles.tableWrap}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Category</th>
                <th>Stock Qty</th>
                <th>Threshold</th>
                <th>Status</th>
                <th>Price</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => {
                const status = getStockStatus(item);
                return (
                  <tr key={item.id}>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{item.name}</td>
                    <td>{item.category?.name || '—'}</td>
                    <td>
                      <span style={{
                        fontWeight: 700,
                        color: item.stock_quantity <= 0 ? 'var(--brand-danger)' :
                               item.stock_quantity <= item.low_stock_threshold ? 'var(--brand-warning)' :
                               'var(--text-primary)'
                      }}>
                        {item.stock_quantity}
                      </span>
                    </td>
                    <td>{item.low_stock_threshold}</td>
                    <td>
                      <span className={`badge ${status.cls}`}>{status.label}</span>
                    </td>
                    <td>₱{parseFloat(item.price).toFixed(2)}</td>
                    <td>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '5px 12px', fontSize: 12 }}
                        onClick={() => setRestockModal(item)}
                      >
                        + Restock
                      </button>
                    </td>
                  </tr>
                );
              })}
              {items.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No inventory items found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Restock Modal */}
      {restockModal && (
        <div className={styles.modalOverlay} onClick={() => setRestockModal(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3>Restock: {restockModal.name}</h3>
            <p className={styles.currentStock}>Current stock: <strong>{restockModal.stock_quantity}</strong></p>
            <div className="form-group">
              <label className="form-label">Quantity to Add</label>
              <input
                type="number"
                className="form-input"
                placeholder="Enter quantity"
                value={restockQty}
                onChange={e => setRestockQty(e.target.value)}
                min="1"
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="form-label">Reason (optional)</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., Weekly delivery"
                value={restockReason}
                onChange={e => setRestockReason(e.target.value)}
              />
            </div>
            <div className={styles.modalActions}>
              <button className="btn btn-secondary" onClick={() => setRestockModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleRestock} disabled={!restockQty || saving}>
                {saving ? 'Saving...' : 'Confirm Restock'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}