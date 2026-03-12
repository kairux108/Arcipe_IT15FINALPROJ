import { useState, useEffect } from 'react';
import { inventoryService } from '../../Services/orderService';
import LoadingSpinner from '../Common/LoadingSpinner';

export default function LowStockAlert({ limit = 20 }) {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [restocking, setRestocking] = useState(null);
  const [quantities, setQuantities] = useState({});

  const load = async () => {
    try {
      const data = await inventoryService.getLowStockAlerts();
      setItems(data.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleRestock = async (item) => {
    const qty = parseInt(quantities[item.id]) || 50;
    if (qty < 1) return;
    setRestocking(item.id);
    try {
      await inventoryService.restockItem(item.id, qty, 'Quick restock from alert');
      await load();
      setQuantities(prev => ({ ...prev, [item.id]: '' }));
    } catch (err) {
      console.error(err);
    } finally {
      setRestocking(null);
    }
  };

  const stockColor = (qty) => {
    if (qty <= 0)  return { color: '#EF476F', bg: 'rgba(239,71,111,0.12)', label: 'Out of Stock' };
    if (qty <= 5)  return { color: '#EF476F', bg: 'rgba(239,71,111,0.12)', label: 'Critical' };
    if (qty <= 15) return { color: '#FFD166', bg: 'rgba(255,209,102,0.12)', label: 'Low' };
    return         { color: '#06D6A0', bg: 'rgba(6,214,160,0.12)', label: 'OK' };
  };

  if (loading) return <div className="d-flex justify-content-center py-4"><LoadingSpinner /></div>;

  if (items.length === 0) return (
    <div className="rounded-3 p-4 text-center" style={{ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)' }}>
      <div style={{ fontSize: 36, marginBottom: 8 }}>✅</div>
      <p className="fw-semibold mb-0" style={{ color: '#06D6A0' }}>All items are sufficiently stocked!</p>
    </div>
  );

  return (
    <div className="rounded-3 p-4" style={{ background: 'rgba(255,209,102,0.04)', border: '1px solid rgba(255,209,102,0.25)' }}>
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
        <div className="d-flex align-items-center gap-2">
          <span style={{ fontSize: 22 }}>⚠️</span>
          <h3 className="mb-0 fw-bold" style={{ fontSize: 15, color: '#FFD166' }}>
            Low Stock Alerts
          </h3>
          <span className="badge rounded-pill fw-bold" style={{ background: '#FFD166', color: '#0F1923', fontSize: 11 }}>
            {items.length}
          </span>
        </div>
        <button
          className="btn btn-sm fw-semibold"
          onClick={load}
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', borderRadius: 8, fontSize: 12 }}
        >
          🔄 Refresh
        </button>
      </div>

      {/* Items */}
      <div className="d-flex flex-column gap-2">
        {items.slice(0, limit).map(item => {
          const s = stockColor(item.stock_quantity);
          return (
            <div
              key={item.id}
              className="rounded-3 px-3 py-2 d-flex align-items-center gap-3 flex-wrap"
              style={{ background: 'var(--surface-2)', border: `1px solid var(--border-subtle)` }}
            >
              {/* Item name + category */}
              <div className="flex-grow-1" style={{ minWidth: 140 }}>
                <div className="fw-semibold" style={{ fontSize: 13, color: 'var(--text-primary)' }}>{item.name}</div>
                {item.category?.name && (
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.category.name}</div>
                )}
              </div>

              {/* Stock badge */}
              <div className="d-flex align-items-center gap-2">
                <span className="fw-bold rounded-pill px-2 py-1" style={{ background: s.bg, color: s.color, fontSize: 11 }}>
                  {s.label}
                </span>
                <span className="fw-bold" style={{ fontSize: 14, color: s.color, minWidth: 40 }}>
                  {item.stock_quantity} left
                </span>
              </div>

              {/* Quick restock */}
              <div className="d-flex align-items-center gap-2">
                <input
                  type="number"
                  min="1"
                  placeholder="Qty"
                  value={quantities[item.id] || ''}
                  onChange={e => setQuantities(prev => ({ ...prev, [item.id]: e.target.value }))}
                  style={{
                    width: 70, padding: '5px 8px', fontSize: 12, borderRadius: 8,
                    background: 'var(--surface-3)', border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)', outline: 'none',
                  }}
                />
                <button
                  className="btn btn-sm fw-bold"
                  onClick={() => handleRestock(item)}
                  disabled={restocking === item.id}
                  style={{
                    background: '#06D6A0', color: 'white', border: 'none',
                    borderRadius: 8, fontSize: 12, padding: '5px 12px',
                  }}
                >
                  {restocking === item.id
                    ? <span className="spinner-border spinner-border-sm" />
                    : '+ Restock'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}