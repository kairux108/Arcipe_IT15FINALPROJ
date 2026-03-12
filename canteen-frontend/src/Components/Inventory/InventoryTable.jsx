import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';
import { inventoryService } from '../../Services/orderService';
import LoadingSpinner from '../Common/LoadingSpinner';

const LOW_STOCK_THRESHOLD = 15;
const CRITICAL_THRESHOLD  = 5;

const stockStatus = (qty) => {
  if (qty <= 0)                   return { label: 'Out of Stock', bg: 'rgba(239,71,111,0.15)',  color: '#EF476F', border: '1px solid rgba(239,71,111,0.3)' };
  if (qty <= CRITICAL_THRESHOLD)  return { label: 'Critical',     bg: 'rgba(239,71,111,0.15)',  color: '#EF476F', border: '1px solid rgba(239,71,111,0.3)' };
  if (qty <= LOW_STOCK_THRESHOLD) return { label: 'Low',          bg: 'rgba(255,209,102,0.15)', color: '#FFD166', border: '1px solid rgba(255,209,102,0.3)' };
  return                                 { label: 'OK',            bg: 'rgba(6,214,160,0.15)',   color: '#06D6A0', border: '1px solid rgba(6,214,160,0.3)' };
};

const tableOverride = `
  .inv-table { color: var(--text-primary) !important; background: transparent !important; }
  .inv-table thead tr { background: var(--surface-2) !important; }
  .inv-table thead th { color: var(--text-muted) !important; background: var(--surface-2) !important; border-color: var(--border-subtle) !important; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; padding: 10px 16px; }
  .inv-table tbody td { color: var(--text-primary) !important; background: transparent !important; border-color: var(--border-subtle) !important; vertical-align: middle; }
  .inv-table tbody tr:hover td { background: rgba(255,107,53,0.04) !important; }
  .inv-input { background: var(--surface-2) !important; border: 1px solid var(--border-subtle) !important; color: var(--text-primary) !important; border-radius: 10px !important; }
  .inv-input:focus { background: var(--surface-2) !important; color: var(--text-primary) !important; border-color: #FF6B35 !important; box-shadow: 0 0 0 3px rgba(255,107,53,0.15) !important; }
  .inv-select { background: var(--surface-2) !important; border: 1px solid var(--border-subtle) !important; color: var(--text-primary) !important; border-radius: 10px !important; }
`;

export default function InventoryTable() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = user?.role ?? 'admin';

  const [inventory, setInventory]         = useState([]);
  const [loading, setLoading]             = useState(true);
  const [search, setSearch]               = useState('');
  const [restockItem, setRestockItem]     = useState(null);
  const [restockQty, setRestockQty]       = useState('');
  const [restockReason, setRestockReason] = useState('');
  const [saving, setSaving]               = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const data = await inventoryService.getInventory({ per_page: 200 });
      setInventory(data.data || data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRestock = async () => {
    if (!restockQty || parseInt(restockQty) <= 0) return;
    setSaving(true);
    try {
      await inventoryService.restockItem(restockItem.id, parseInt(restockQty), restockReason);
      setRestockItem(null);
      setRestockQty('');
      setRestockReason('');
      await load();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const filtered = (inventory || []).filter(i =>
    (i.name || '').toLowerCase().includes(search.toLowerCase())
  );

  const fmt      = (n) => `₱${parseFloat(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
  const critical = (inventory || []).filter(i => i.stock_quantity <= CRITICAL_THRESHOLD).length;
  const low      = (inventory || []).filter(i => i.stock_quantity > CRITICAL_THRESHOLD && i.stock_quantity <= LOW_STOCK_THRESHOLD).length;

  return (
    <>
      <style>{tableOverride}</style>

      <div className="d-flex flex-column gap-4" style={{ animation: 'fadeIn 0.3s ease' }}>

        {/* Header */}
        <div className="d-flex align-items-start justify-content-between flex-wrap gap-3">
          <div>
            <h2 className="fw-bold mb-1" style={{ fontSize: 20, color: 'var(--text-primary)' }}>Inventory</h2>
            <p className="mb-0" style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {critical > 0 && <span style={{ color: '#EF476F', fontWeight: 600 }}>{critical} critical · </span>}
              {low > 0      && <span style={{ color: '#FFD166', fontWeight: 600 }}>{low} low · </span>}
              {inventory.length} total items
            </p>
          </div>
          <div className="d-flex gap-2">
            {/* View Log button */}
            <button
              className="btn fw-semibold"
              onClick={() => navigate(`/${role}/inventory/log`)}
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', borderRadius: 10, fontSize: 13, padding: '8px 16px' }}
            >
              📋 View Log
            </button>
            <button
              className="btn fw-semibold"
              onClick={load}
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', borderRadius: 10, fontSize: 13, padding: '8px 16px' }}
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Search */}
        <input
          type="text"
          className="form-control inv-input"
          placeholder="🔍 Search inventory..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 340, padding: '10px 14px', fontSize: 13 }}
        />

        {/* Table Card */}
        <div className="rounded-3 overflow-hidden" style={{ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)' }}>
          {loading ? (
            <div className="d-flex justify-content-center py-5"><LoadingSpinner /></div>
          ) : (
            <div className="table-responsive">
              <table className="table mb-0 inv-table">
                <thead>
                  <tr>
                    {['Item', 'Category', 'Price', 'Stock', 'Threshold', 'Status', 'Action'].map(h => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-5" style={{ color: 'var(--text-muted)' }}>No items found</td>
                    </tr>
                  ) : filtered.map(item => {
                    const st        = stockStatus(item.stock_quantity);
                    const threshold = item.low_stock_threshold ?? LOW_STOCK_THRESHOLD;
                    return (
                      <tr key={item.id}>
                        <td className="fw-semibold">{item.name}</td>
                        <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{item.category?.name || '—'}</td>
                        <td className="fw-bold" style={{ color: '#FF6B35' }}>{fmt(item.price)}</td>
                        <td>
                          <span className="fw-bold" style={{ fontSize: 15 }}>{item.stock_quantity}</span>
                          <span style={{ color: 'var(--text-muted)', fontSize: 12, marginLeft: 4 }}>units</span>
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>≤ {threshold} units</td>
                        <td>
                          <span className="fw-bold" style={{
                            display: 'inline-block', padding: '4px 12px', borderRadius: 99, fontSize: 12,
                            background: st.bg, color: st.color, border: st.border,
                          }}>
                            {st.label}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn btn-sm fw-semibold"
                            onClick={() => { setRestockItem(item); setRestockQty(''); setRestockReason(''); }}
                            style={{ background: 'rgba(6,214,160,0.1)', border: '1px solid rgba(6,214,160,0.3)', color: '#06D6A0', borderRadius: 8, fontSize: 12, padding: '5px 14px' }}
                          >
                            + Restock
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Restock Modal */}
      {restockItem && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 1060 }}
          onClick={() => setRestockItem(null)}
        >
          <div
            className="rounded-4 p-4"
            style={{ background: 'var(--surface-card)', border: '1px solid var(--border-default)', width: '100%', maxWidth: 420, margin: '0 16px', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="d-flex align-items-center justify-content-between mb-4">
              <h3 className="fw-bold mb-0" style={{ fontSize: 17, color: 'var(--text-primary)' }}>
                Restock: {restockItem.name}
              </h3>
              <button
                className="btn d-flex align-items-center justify-content-center"
                onClick={() => setRestockItem(null)}
                style={{ width: 30, height: 30, background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)', borderRadius: 8, fontSize: 13, padding: 0 }}
              >✕</button>
            </div>

            <div className="row g-2 mb-4">
              {[
                { label: 'Current Stock', value: `${restockItem.stock_quantity} units`, color: stockStatus(restockItem.stock_quantity).color },
                { label: 'Threshold',     value: `≤ ${restockItem.low_stock_threshold ?? LOW_STOCK_THRESHOLD} units`, color: 'var(--text-muted)' },
              ].map(s => (
                <div key={s.label} className="col-6">
                  <div className="rounded-3 p-3" style={{ background: 'var(--surface-2)' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{s.label}</div>
                    <div className="fw-bold" style={{ fontSize: 15, color: s.color }}>{s.value}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="d-flex flex-column gap-3">
              <div>
                <label className="form-label" style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
                  Add Quantity *
                </label>
                <input
                  type="number" min="1" placeholder="e.g. 50"
                  className="form-control inv-input"
                  value={restockQty}
                  onChange={e => setRestockQty(e.target.value)}
                  style={{ padding: '10px 14px', fontSize: 14 }}
                />
              </div>
              <div>
                <label className="form-label" style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
                  Reason (optional)
                </label>
                <input
                  type="text" placeholder="e.g. Weekly delivery"
                  className="form-control inv-input"
                  value={restockReason}
                  onChange={e => setRestockReason(e.target.value)}
                  style={{ padding: '10px 14px', fontSize: 14 }}
                />
              </div>

              {restockQty && parseInt(restockQty) > 0 && (
                <div className="rounded-3 p-3" style={{ background: 'rgba(6,214,160,0.08)', border: '1px solid rgba(6,214,160,0.2)', fontSize: 13, color: '#06D6A0' }}>
                  New stock: <strong>{restockItem.stock_quantity + parseInt(restockQty)} units</strong>
                  {' '}→ Status: <strong>{stockStatus(restockItem.stock_quantity + parseInt(restockQty)).label}</strong>
                </div>
              )}

              <div className="d-flex gap-2 mt-2">
                <button className="btn fw-semibold flex-fill"
                  onClick={() => setRestockItem(null)}
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', borderRadius: 10 }}>
                  Cancel
                </button>
                <button className="btn fw-bold flex-fill"
                  onClick={handleRestock}
                  disabled={saving || !restockQty || parseInt(restockQty) <= 0}
                  style={{ background: '#06D6A0', color: '#0F1923', border: 'none', borderRadius: 10 }}>
                  {saving ? <span className="spinner-border spinner-border-sm" /> : '+ Add Stock'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}