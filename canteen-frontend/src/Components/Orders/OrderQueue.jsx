import { useState, useEffect, useCallback } from 'react';
import { orderService } from '../../Services/orderService';
import LoadingSpinner from '../Common/LoadingSpinner';

const STATUS_STYLES = {
  pending:   { bg: 'rgba(255,209,102,0.15)', color: '#FFD166', border: '1px solid rgba(255,209,102,0.3)', label: 'Pending' },
  preparing: { bg: 'rgba(17,138,178,0.15)',  color: '#118AB2', border: '1px solid rgba(17,138,178,0.3)',  label: 'Preparing' },
  ready:     { bg: 'rgba(6,214,160,0.15)',   color: '#06D6A0', border: '1px solid rgba(6,214,160,0.3)',   label: 'Ready' },
  completed: { bg: 'rgba(6,214,160,0.06)',   color: '#8FA3B3', border: '1px solid rgba(255,255,255,0.08)', label: 'Completed' },
  cancelled: { bg: 'rgba(239,71,111,0.15)',  color: '#EF476F', border: '1px solid rgba(239,71,111,0.3)',  label: 'Cancelled' },
};

const NEXT = { pending: 'preparing', preparing: 'ready', ready: 'completed' };

const getAmount = (o) => parseFloat(o.total_amount ?? o.total ?? o.grand_total ?? 0) || 0;
const getItems  = (o) => o.items ?? o.order_items ?? [];

const tableOverride = `
  .oq-input { background: var(--surface-2) !important; border: 1px solid var(--border-subtle) !important; color: var(--text-primary) !important; border-radius: 10px !important; }
  .oq-input:focus { background: var(--surface-2) !important; color: var(--text-primary) !important; border-color: #FF6B35 !important; box-shadow: 0 0 0 3px rgba(255,107,53,0.15) !important; }
`;

export default function OrderQueue() {
  const [orders, setOrders]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('all');
  const [expanded, setExpanded] = useState(null);
  const [updating, setUpdating] = useState(null);
  const [search, setSearch]     = useState('');

  const load = useCallback(async () => {
    try {
      // Always use getOrders with no status filter so ALL statuses come back
      const data = await orderService.getOrders({ per_page: 1000 });
      const raw  = data?.data ?? data ?? [];
      const list = Array.isArray(raw) ? raw : [];
      setOrders(list);
    } catch (err) {
      console.error('OrderQueue load error:', err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const iv = setInterval(load, 30000);
    return () => clearInterval(iv);
  }, [load]);

  const handleStatus = async (id, status) => {
    setUpdating(id);
    try {
      await orderService.updateStatus(id, status);
      // Optimistically update local state immediately
      setOrders(prev =>
        prev.map(o => o.id === id ? { ...o, status } : o)
      );
      // Then reload from server to confirm
      await load();
    } catch (err) {
      console.error('Status update error:', err);
      await load(); // reload even on error to sync state
    } finally {
      setUpdating(null);
    }
  };

  const fmt     = (n) => `₱${parseFloat(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
  const fmtTime = (d) => new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const fmtDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const searched = search.trim()
    ? orders.filter(o =>
        String(o.id).includes(search) ||
        (o.user?.name || '').toLowerCase().includes(search.toLowerCase())
      )
    : orders;

  const filtered = filter === 'all' ? searched : searched.filter(o => o.status === filter);

  const counts = ['pending','preparing','ready','completed','cancelled']
    .reduce((a, s) => ({ ...a, [s]: orders.filter(o => o.status === s).length }), {});

  const tabs = [
    { key: 'all',       label: 'All',       count: orders.length },
    { key: 'pending',   label: 'Pending',   count: counts.pending },
    { key: 'preparing', label: 'Preparing', count: counts.preparing },
    { key: 'ready',     label: 'Ready',     count: counts.ready },
    { key: 'completed', label: 'Completed', count: counts.completed },
    { key: 'cancelled', label: 'Cancelled', count: counts.cancelled },
  ];

  return (
    <>
      <style>{tableOverride}</style>

      <div className="d-flex flex-column gap-4" style={{ animation: 'fadeIn 0.3s ease' }}>

        {/* Header */}
        <div className="d-flex align-items-start justify-content-between flex-wrap gap-3">
          <div>
            <h2 className="fw-bold mb-1" style={{ fontSize: 20, color: 'var(--text-primary)' }}>Order Queue</h2>
            <p className="mb-0" style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {orders.length} total orders · auto-refreshes every 30s
            </p>
          </div>
          <button
            className="btn fw-semibold"
            onClick={load}
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', borderRadius: 10, fontSize: 13, padding: '8px 16px' }}
          >
            🔄 Refresh
          </button>
        </div>

        {/* Search */}
        <input
          type="text"
          className="form-control oq-input"
          placeholder="🔍 Search by order # or customer name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 380, padding: '10px 14px', fontSize: 13 }}
        />

        {/* Status Tabs */}
        <div className="d-flex gap-2 flex-wrap">
          {tabs.map(tab => (
            <button
              key={tab.key}
              className="btn btn-sm fw-semibold"
              onClick={() => setFilter(tab.key)}
              style={{
                borderRadius: 20, padding: '6px 14px', fontSize: 12, cursor: 'pointer',
                background: filter === tab.key ? '#FF6B35' : 'var(--surface-2)',
                color:      filter === tab.key ? 'white'   : 'var(--text-muted)',
                border:     filter === tab.key ? 'none'    : '1px solid var(--border-subtle)',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
              <span
                className="ms-2 badge rounded-pill"
                style={{
                  background: filter === tab.key ? 'rgba(255,255,255,0.25)' : 'var(--surface-3)',
                  color:      filter === tab.key ? 'white' : 'var(--text-muted)',
                  fontSize: 10,
                }}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="d-flex justify-content-center py-5"><LoadingSpinner /></div>
        ) : filtered.length === 0 ? (
          <div
            className="d-flex flex-column align-items-center justify-content-center rounded-3 py-5"
            style={{ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)' }}
          >
            <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
            <p className="fw-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
              {filter === 'all' ? 'No orders yet' : `No ${filter} orders`}
            </p>
            <p className="mb-0" style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {filter === 'completed'
                ? 'Orders you mark as completed will appear here'
                : filter === 'cancelled'
                ? 'Cancelled orders will appear here'
                : 'No orders match this filter'}
            </p>
          </div>
        ) : (
          <div className="d-flex flex-column gap-2">
            {filtered.map(order => {
              const s          = STATUS_STYLES[order.status] || STATUS_STYLES.pending;
              const nextStatus = NEXT[order.status];
              const isExpanded = expanded === order.id;
              const amount     = getAmount(order);
              const items      = getItems(order);

              return (
                <div
                  key={order.id}
                  className="rounded-3 overflow-hidden"
                  style={{
                    background: 'var(--surface-card)',
                    border: `1px solid var(--border-subtle)`,
                    borderLeft: `3px solid ${s.color}`,
                    opacity: order.status === 'cancelled' ? 0.75 : 1,
                  }}
                >
                  {/* Order Row */}
                  <div
                    className="d-flex align-items-center gap-3 p-3 flex-wrap"
                    style={{ cursor: 'pointer' }}
                    onClick={() => setExpanded(isExpanded ? null : order.id)}
                  >
                    {/* ID + Time */}
                    <div style={{ minWidth: 90 }}>
                      <div className="fw-bold" style={{ fontSize: 14, color: 'var(--text-primary)' }}>
                        #{order.id}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {fmtDate(order.created_at)} · {fmtTime(order.created_at)}
                      </div>
                    </div>

                    {/* Customer */}
                    <div className="flex-grow-1" style={{ minWidth: 100 }}>
                      <div className="fw-semibold" style={{ fontSize: 13, color: 'var(--text-primary)' }}>
                        {order.user?.name || order.customer_name || 'Walk-in'}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {items.length} item(s)
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="fw-bold" style={{ fontSize: 15, color: '#FF6B35', minWidth: 90 }}>
                      {amount > 0
                        ? fmt(amount)
                        : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>}
                    </div>

                    {/* Status Badge */}
                    <span
                      className="fw-bold"
                      style={{
                        padding: '5px 12px', borderRadius: 99, fontSize: 11,
                        background: s.bg, color: s.color, border: s.border,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {s.label}
                    </span>

                    {/* Advance Status Button */}
                    {nextStatus && (
                      <button
                        className="btn btn-sm fw-bold"
                        onClick={e => { e.stopPropagation(); handleStatus(order.id, nextStatus); }}
                        disabled={updating === order.id}
                        style={{
                          background: '#FF6B35', color: 'white', border: 'none',
                          borderRadius: 8, fontSize: 12, padding: '6px 14px', whiteSpace: 'nowrap',
                        }}
                      >
                        {updating === order.id
                          ? <span className="spinner-border spinner-border-sm" />
                          : `→ ${STATUS_STYLES[nextStatus]?.label}`}
                      </button>
                    )}

                    {/* Chevron */}
                    <span style={{
                      color: 'var(--text-muted)', fontSize: 11,
                      transition: 'transform 0.2s',
                      transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    }}>▼</span>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div
                      className="px-3 pb-3"
                      style={{ borderTop: '1px solid var(--border-subtle)' }}
                    >
                      <div className="pt-3 d-flex flex-column gap-2">

                        {/* Items */}
                        {items.map((item, i) => {
                          const name     = item.menu_item?.name ?? item.name ?? item.item_name ?? 'Item';
                          const itemAmt  = parseFloat(item.subtotal ?? ((item.price ?? 0) * (item.quantity ?? 1)));
                          return (
                            <div
                              key={i}
                              className="d-flex align-items-center justify-content-between rounded-3 px-3 py-2"
                              style={{ background: 'var(--surface-2)' }}
                            >
                              <div>
                                <span className="fw-semibold" style={{ fontSize: 13, color: 'var(--text-primary)' }}>
                                  {name}
                                </span>
                                <span
                                  className="ms-2 badge rounded-pill"
                                  style={{ background: 'rgba(255,107,53,0.12)', color: '#FF6B35', fontSize: 10 }}
                                >
                                  x{item.quantity}
                                </span>
                              </div>
                              <span className="fw-semibold" style={{ fontSize: 13, color: 'var(--text-primary)' }}>
                                {fmt(itemAmt)}
                              </span>
                            </div>
                          );
                        })}

                        {/* Notes */}
                        {order.notes && (
                          <div
                            className="rounded-3 px-3 py-2"
                            style={{ background: 'rgba(255,209,102,0.06)', border: '1px solid rgba(255,209,102,0.2)' }}
                          >
                            <span style={{ fontSize: 12, color: '#FFD166' }}>📝 {order.notes}</span>
                          </div>
                        )}

                        {/* Total + Cancel */}
                        <div className="d-flex align-items-center justify-content-between mt-1">
                          {['pending', 'preparing'].includes(order.status) && (
                            <button
                              className="btn btn-sm fw-semibold"
                              onClick={() => handleStatus(order.id, 'cancelled')}
                              disabled={updating === order.id}
                              style={{
                                background: 'rgba(239,71,111,0.1)',
                                border: '1px solid rgba(239,71,111,0.3)',
                                color: '#EF476F', borderRadius: 8, fontSize: 12,
                              }}
                            >
                              {updating === order.id
                                ? <span className="spinner-border spinner-border-sm" />
                                : 'Cancel Order'}
                            </button>
                          )}

                          {/* Completed/Cancelled timestamp */}
                          {['completed', 'cancelled'].includes(order.status) && (
                            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                              {order.status === 'completed' ? '✅ Completed' : '❌ Cancelled'}
                              {(order.completed_at || order.updated_at) && (
                                <> · {fmtDate(order.completed_at || order.updated_at)}</>
                              )}
                            </span>
                          )}

                          {amount > 0 && (
                            <div className="ms-auto fw-bold" style={{ fontSize: 15, color: '#FF6B35' }}>
                              Total: {fmt(amount)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}