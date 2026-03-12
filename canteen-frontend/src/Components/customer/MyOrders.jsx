import { useState, useEffect, useCallback } from 'react';
import { orderService } from '../../Services/orderService';
import LoadingSpinner from '../Common/LoadingSpinner';

// ✅ FIX: Try ALL possible field names the backend might return
const getAmount = (o) => parseFloat(o.total_amount ?? o.total ?? o.grand_total ?? o.amount ?? 0) || 0;
const getItems  = (o) => o.items ?? o.order_items ?? [];

const STATUS_STYLES = {
  pending:   { bg: 'rgba(255,209,102,0.15)', color: '#FFD166', border: '1px solid rgba(255,209,102,0.3)', label: 'Pending' },
  preparing: { bg: 'rgba(17,138,178,0.15)',  color: '#118AB2', border: '1px solid rgba(17,138,178,0.3)',  label: 'Preparing' },
  ready:     { bg: 'rgba(6,214,160,0.15)',   color: '#06D6A0', border: '1px solid rgba(6,214,160,0.3)',   label: 'Ready For Pickup' },
  completed: { bg: 'rgba(100,116,139,0.12)', color: '#8FA3B3', border: '1px solid rgba(255,255,255,0.08)', label: 'Completed' },
  cancelled: { bg: 'rgba(239,71,111,0.15)',  color: '#EF476F', border: '1px solid rgba(239,71,111,0.3)',  label: 'Cancelled' },
};

const styles = `
  .mo-input { background: var(--surface-2) !important; border: 1px solid var(--border-subtle) !important; color: var(--text-primary) !important; border-radius: 10px !important; }
  .mo-input:focus { background: var(--surface-2) !important; color: var(--text-primary) !important; border-color: #FF6B35 !important; box-shadow: 0 0 0 3px rgba(255,107,53,0.15) !important; }
  .mo-input::placeholder { color: var(--text-muted) !important; }
  .mo-card { background: var(--surface-card); border: 1px solid var(--border-subtle); border-radius: 12px; overflow: hidden; transition: box-shadow 0.15s; }
  .mo-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.15); }
`;

export default function MyOrders() {
  const [orders, setOrders]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('all');
  const [expanded, setExpanded] = useState(null);
  const [cancelling, setCancelling] = useState(null);

  const load = useCallback(async () => {
    try {
      const data = await orderService.getMyOrders({ per_page: 200 });
      const raw  = data?.data ?? data ?? [];
      setOrders(Array.isArray(raw) ? raw : []);
    } catch (err) {
      console.error('MyOrders load error:', err);
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

  const handleCancel = async (id) => {
    setCancelling(id);
    try {
      await orderService.cancelOrder(id, 'Cancelled by customer');
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'cancelled' } : o));
      await load();
    } catch (err) {
      console.error('Cancel error:', err);
    } finally {
      setCancelling(null);
    }
  };

  const fmt     = (n) => `₱${parseFloat(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
  const fmtTime = (d) => new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const fmtDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const counts = ['pending','preparing','ready','completed','cancelled']
    .reduce((a, s) => ({ ...a, [s]: orders.filter(o => o.status === s).length }), {});

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  const tabs = [
    { key: 'all',       label: 'All',             count: orders.length },
    { key: 'pending',   label: 'Pending',         count: counts.pending },
    { key: 'preparing', label: 'Preparing',       count: counts.preparing },
    { key: 'ready',     label: 'Ready For Pickup',count: counts.ready },
    { key: 'completed', label: 'Completed',       count: counts.completed },
    { key: 'cancelled', label: 'Cancelled',       count: counts.cancelled },
  ];

  return (
    <>
      <style>{styles}</style>

      <div className="d-flex flex-column gap-4" style={{ animation: 'fadeIn 0.3s ease' }}>

        {/* Header */}
        <div className="d-flex align-items-start justify-content-between flex-wrap gap-3">
          <div>
            <h2 className="fw-bold mb-1" style={{ fontSize: 20, color: 'var(--text-primary)' }}>My Orders</h2>
            <p className="mb-0" style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Auto-refreshes every 30 seconds
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
              {tab.count > 0 && (
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
              )}
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
              {filter === 'all' ? 'Your orders will appear here after you place one.' : `You have no ${filter} orders right now.`}
            </p>
          </div>
        ) : (
          <div className="d-flex flex-column gap-2">
            {filtered.map(order => {
              const s          = STATUS_STYLES[order.status] ?? STATUS_STYLES.pending;
              const isExpanded = expanded === order.id;
              const amount     = getAmount(order);   // ✅ FIXED: tries all field names
              const orderItems = getItems(order);

              return (
                <div
                  key={order.id}
                  className="mo-card"
                  style={{
                    borderLeft: `3px solid ${s.color}`,
                    opacity: order.status === 'cancelled' ? 0.75 : 1,
                  }}
                >
                  {/* Row */}
                  <div
                    className="d-flex align-items-center gap-3 p-3 flex-wrap"
                    style={{ cursor: 'pointer' }}
                    onClick={() => setExpanded(isExpanded ? null : order.id)}
                  >
                    {/* ID + Date */}
                    <div style={{ minWidth: 100 }}>
                      <div className="fw-bold" style={{ fontSize: 14, color: 'var(--text-primary)' }}>
                        #{order.id}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {fmtDate(order.created_at)}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {fmtTime(order.created_at)}
                      </div>
                    </div>

                    {/* Item count */}
                    <div className="flex-grow-1" style={{ minWidth: 80 }}>
                      <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                        {orderItems.length} item(s)
                      </span>
                    </div>

                    {/* Status */}
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

                    {/* ✅ FIXED: amount now shows correct value */}
                    <div className="fw-bold" style={{ fontSize: 15, color: '#FF6B35', minWidth: 80, textAlign: 'right' }}>
                      {fmt(amount)}
                    </div>

                    {/* Chevron */}
                    <span style={{
                      color: 'var(--text-muted)', fontSize: 11,
                      transition: 'transform 0.2s',
                      transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    }}>▼</span>
                  </div>

                  {/* Expanded */}
                  {isExpanded && (
                    <div className="px-3 pb-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                      <div className="pt-3 d-flex flex-column gap-2">

                        {/* Items */}
                        {orderItems.length === 0 ? (
                          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>No item details available.</p>
                        ) : orderItems.map((item, i) => {
                          const name    = item.menu_item?.name ?? item.name ?? item.item_name ?? 'Item';
                          const itemAmt = parseFloat(item.subtotal ?? ((item.price ?? 0) * (item.quantity ?? 1))) || 0;
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

                        {/* Total row */}
                        <div className="d-flex align-items-center justify-content-between mt-1 flex-wrap gap-2">

                          {/* Cancel button — only for pending orders */}
                          {order.status === 'pending' && (
                            <button
                              className="btn btn-sm fw-semibold"
                              onClick={e => { e.stopPropagation(); handleCancel(order.id); }}
                              disabled={cancelling === order.id}
                              style={{
                                background: 'rgba(239,71,111,0.1)',
                                border: '1px solid rgba(239,71,111,0.3)',
                                color: '#EF476F', borderRadius: 8, fontSize: 12,
                              }}
                            >
                              {cancelling === order.id
                                ? <span className="spinner-border spinner-border-sm" />
                                : '✕ Cancel Order'}
                            </button>
                          )}

                          {/* Ready for pickup banner */}
                          {order.status === 'ready' && (
                            <div
                              className="rounded-3 px-3 py-2 fw-bold"
                              style={{ background: 'rgba(6,214,160,0.08)', border: '1px solid rgba(6,214,160,0.3)', color: '#06D6A0', fontSize: 13 }}
                            >
                              🔔 Your order is ready! Please pick it up at the counter.
                            </div>
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

                          {/* Total */}
                          <div className="ms-auto d-flex flex-column align-items-end">
                            <div className="fw-bold" style={{ fontSize: 16, color: '#FF6B35' }}>
                              Total: {fmt(amount)}
                            </div>
                            {order.payment_method && (
                              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                                via {order.payment_method === 'digital_wallet' ? 'E-Wallet' : order.payment_method.charAt(0).toUpperCase() + order.payment_method.slice(1)}
                              </div>
                            )}
                          </div>
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