import { useState, useEffect, useCallback } from 'react';
import { inventoryService } from '../../Services/orderService';
import LoadingSpinner from '../Common/LoadingSpinner';

const TYPE_STYLES = {
  restock: { bg: 'rgba(6,214,160,0.12)',   color: '#06D6A0', label: '↑ Restock' },
  deduct:  { bg: 'rgba(239,71,111,0.12)',  color: '#EF476F', label: '↓ Deduct'  },
  adjust:  { bg: 'rgba(255,209,102,0.12)', color: '#FFD166', label: '⇄ Adjust'  },
};

const tableOverride = `
  .il-table { color: var(--text-primary) !important; }
  .il-table td, .il-table th { color: var(--text-primary) !important; border-color: var(--border-subtle) !important; background: transparent !important; padding: 10px 12px; vertical-align: middle; }
  .il-table thead th { background: var(--surface-2) !important; color: var(--text-muted) !important; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; }
  .il-table tbody tr:hover td { background: var(--surface-2) !important; }
  .il-input { background: var(--surface-2) !important; border: 1px solid var(--border-subtle) !important; color: var(--text-primary) !important; border-radius: 10px !important; }
  .il-input:focus { background: var(--surface-2) !important; color: var(--text-primary) !important; border-color: #FF6B35 !important; box-shadow: 0 0 0 3px rgba(255,107,53,0.15) !important; }
  .il-input::placeholder { color: var(--text-muted) !important; }
  .il-input option { background: var(--surface-2) !important; color: var(--text-primary) !important; }
`;

export default function InventoryLogPage() {
  const [logs, setLogs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [page, setPage]       = useState(1);
  const [meta, setMeta]       = useState(null);

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const data = await inventoryService.getLogs({ per_page: 50, page: p });
      const raw  = data?.data ?? data ?? [];
      setLogs(Array.isArray(raw) ? raw : []);
      setMeta(data?.meta ?? null);
    } catch (err) {
      console.error('InventoryLog load error:', err);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(page); }, [page]);

  const fmt     = (n) => `₱${parseFloat(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
  const fmtDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const fmtTime = (d) => new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const filtered = logs.filter(log => {
    const matchSearch = search.trim() === '' ||
      (log.menu_item?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (log.reason || '').toLowerCase().includes(search.toLowerCase()) ||
      (log.user?.name || '').toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || log.type === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <>
      <style>{tableOverride}</style>

      <div className="d-flex flex-column gap-4" style={{ animation: 'fadeIn 0.3s ease' }}>

        {/* Header */}
        <div className="d-flex align-items-start justify-content-between flex-wrap gap-3">
          <div>
            <h2 className="fw-bold mb-1" style={{ fontSize: 20, color: 'var(--text-primary)' }}>Inventory Log</h2>
            <p className="mb-0" style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Stock change history — restocks, deductions, and adjustments
            </p>
          </div>
          <button
            className="btn fw-semibold"
            onClick={() => load(page)}
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', borderRadius: 10, fontSize: 13, padding: '8px 16px' }}
          >
            🔄 Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="d-flex gap-2 flex-wrap">
          <input
            type="text"
            className="form-control il-input flex-grow-1"
            placeholder="🔍 Search item, reason, or user..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ padding: '9px 14px', fontSize: 13, maxWidth: 340 }}
          />
          <select
            className="form-select il-input"
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            style={{ padding: '9px 14px', fontSize: 13, maxWidth: 160 }}
          >
            <option value="all">All Types</option>
            <option value="restock">↑ Restock</option>
            <option value="deduct">↓ Deduct</option>
            <option value="adjust">⇄ Adjust</option>
          </select>
        </div>

        {/* Summary chips */}
        <div className="d-flex gap-2 flex-wrap">
          {['restock', 'deduct', 'adjust'].map(type => {
            const count = logs.filter(l => l.type === type).length;
            const s = TYPE_STYLES[type];
            return (
              <div key={type} className="px-3 py-2 rounded-3 d-flex align-items-center gap-2"
                style={{ background: s.bg, border: `1px solid ${s.color}33` }}>
                <span className="fw-bold" style={{ fontSize: 12, color: s.color }}>{s.label}</span>
                <span className="badge rounded-pill fw-bold" style={{ background: s.color, color: 'white', fontSize: 10 }}>{count}</span>
              </div>
            );
          })}
        </div>

        {/* Table */}
        <div className="rounded-3 overflow-hidden" style={{ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)' }}>
          {loading ? (
            <div className="d-flex justify-content-center py-5"><LoadingSpinner /></div>
          ) : filtered.length === 0 ? (
            <div className="d-flex flex-column align-items-center justify-content-center py-5">
              <div style={{ fontSize: 36, marginBottom: 8 }}>📋</div>
              <p className="fw-semibold mb-0" style={{ color: 'var(--text-muted)' }}>No log entries found</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table mb-0 il-table">
                <thead>
                  <tr>
                    {['Date & Time', 'Item', 'Type', 'Qty Changed', 'Stock Before', 'Stock After', 'Reason', 'By'].map(h => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(log => {
                    const s = TYPE_STYLES[log.type] ?? TYPE_STYLES.adjust;
                    return (
                      <tr key={log.id}>
                        <td>
                          <div style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 600 }}>{fmtDate(log.created_at)}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{fmtTime(log.created_at)}</div>
                        </td>
                        <td>
                          <span className="fw-semibold" style={{ fontSize: 13 }}>
                            {log.menu_item?.name ?? '—'}
                          </span>
                        </td>
                        <td>
                          <span className="fw-bold rounded-pill px-2 py-1" style={{ background: s.bg, color: s.color, fontSize: 11 }}>
                            {s.label}
                          </span>
                        </td>
                        <td>
                          <span className="fw-bold" style={{ color: log.type === 'deduct' ? '#EF476F' : '#06D6A0', fontSize: 14 }}>
                            {log.type === 'deduct' ? '−' : '+'}{log.quantity}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{log.stock_before}</span>
                        </td>
                        <td>
                          <span className="fw-semibold" style={{ fontSize: 13, color: 'var(--text-primary)' }}>{log.stock_after}</span>
                        </td>
                        <td>
                          <span style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 180, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {log.reason ?? '—'}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            {log.user?.name ?? 'System'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {meta && meta.last_page > 1 && (
          <div className="d-flex justify-content-center gap-2 flex-wrap">
            <button
              className="btn btn-sm fw-semibold"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', borderRadius: 8 }}
            >
              ← Prev
            </button>
            <span className="d-flex align-items-center px-3" style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Page {meta.current_page} of {meta.last_page}
            </span>
            <button
              className="btn btn-sm fw-semibold"
              onClick={() => setPage(p => Math.min(meta.last_page, p + 1))}
              disabled={page === meta.last_page}
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', borderRadius: 8 }}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </>
  );
}