// Reusable receipt component — pass an `order` object and an `onClose` callback
// Usage: <OrderReceipt order={orderData} onClose={() => setReceipt(null)} onNewOrder={handleNewOrder} />

export default function OrderReceipt({ order, onClose, onNewOrder, mode = 'cashier' }) {
  if (!order) return null;

  const items   = order.items || order.order_items || [];
  const total   = parseFloat(order.total_amount || order.total || 0);
  const paid    = parseFloat(order.amount_paid || 0);
  const change  = parseFloat(order.change_given || order.change || 0);
  const tax     = parseFloat(order.tax || 0);
  const sub     = parseFloat(order.subtotal || (total - tax) || 0);

  const fmt = (n) => `₱${parseFloat(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
  const fmtDate = (d) => new Date(d).toLocaleString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  const payLabel = {
    cash:           '💵 Cash',
    card:           '💳 Card',
    digital_wallet: '📱 E-Wallet',
  }[order.payment_method] || order.payment_method;

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      style={{ zIndex: 9999, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget && onClose) onClose(); }}
    >
      <div
        className="rounded-4 p-4"
        style={{
          background: 'var(--surface-card)',
          border: '1px solid var(--border-default)',
          width: '100%',
          maxWidth: 420,
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
        }}
      >
        {/* Receipt Header */}
        <div className="text-center mb-4">
          <div style={{ fontSize: 48, marginBottom: 8 }}>✅</div>
          <h2 className="fw-bold mb-1" style={{ fontSize: 20, color: 'var(--text-primary)' }}>
            {mode === 'cashier' ? 'Order Confirmed!' : 'Order Placed!'}
          </h2>
          {(order.order_number || order.id) && (
            <div className="d-inline-block px-3 py-1 rounded-pill fw-bold mt-1"
              style={{ background: '#FF6B35', color: 'white', fontSize: 13 }}>
              {order.order_number || `Order #${order.id}`}
            </div>
          )}
          {order.created_at && (
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
              {fmtDate(order.created_at)}
            </div>
          )}
        </div>

        {/* Items */}
        <div className="rounded-3 mb-3 overflow-hidden" style={{ border: '1px solid var(--border-subtle)' }}>
          <div className="px-3 py-2" style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
              Order Items
            </span>
          </div>
          {items.map((item, i) => {
            const name    = item.menu_item?.name || item.name || item.item_name || 'Item';
            const itemSub = parseFloat(item.subtotal || (item.price * item.quantity) || 0);
            return (
              <div key={i} className="d-flex justify-content-between align-items-center px-3 py-2"
                style={{
                  borderBottom: i < items.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                  background: 'var(--surface-card)',
                }}>
                <div>
                  <span className="fw-semibold" style={{ fontSize: 13, color: 'var(--text-primary)' }}>{name}</span>
                  <span className="ms-2 badge rounded-pill" style={{ background: 'rgba(255,107,53,0.12)', color: '#FF6B35', fontSize: 10 }}>
                    x{item.quantity}
                  </span>
                  {item.price && (
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{fmt(item.price)} each</div>
                  )}
                </div>
                <span className="fw-semibold" style={{ fontSize: 13, color: 'var(--text-primary)' }}>{fmt(itemSub)}</span>
              </div>
            );
          })}
        </div>

        {/* Totals */}
        <div className="d-flex flex-column gap-2 mb-4">
          {sub > 0 && (
            <div className="d-flex justify-content-between" style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              <span>Subtotal</span><span>{fmt(sub)}</span>
            </div>
          )}
          {tax > 0 && (
            <div className="d-flex justify-content-between" style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              <span>VAT (12%)</span><span>{fmt(tax)}</span>
            </div>
          )}
          <div className="d-flex justify-content-between align-items-center rounded-3 px-3 py-2"
            style={{ background: 'rgba(255,107,53,0.08)', border: '1px solid rgba(255,107,53,0.2)' }}>
            <span className="fw-bold" style={{ fontSize: 15, color: 'var(--text-primary)' }}>TOTAL</span>
            <span className="fw-bold" style={{ fontSize: 22, color: '#FF6B35' }}>{fmt(total)}</span>
          </div>
          {order.payment_method && (
            <div className="d-flex justify-content-between" style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              <span>Payment</span><span>{payLabel}</span>
            </div>
          )}
          {paid > 0 && (
            <div className="d-flex justify-content-between" style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              <span>Amount Paid</span><span>{fmt(paid)}</span>
            </div>
          )}
          {change > 0 && (
            <div className="d-flex justify-content-between rounded-3 px-3 py-2"
              style={{ background: 'rgba(6,214,160,0.08)', border: '1px solid rgba(6,214,160,0.2)', fontSize: 14, fontWeight: 700, color: '#06D6A0' }}>
              <span>Change</span><span>{fmt(change)}</span>
            </div>
          )}
        </div>

        {/* Notes */}
        {order.notes && (
          <div className="rounded-3 px-3 py-2 mb-4"
            style={{ background: 'rgba(255,209,102,0.06)', border: '1px solid rgba(255,209,102,0.2)' }}>
            <span style={{ fontSize: 12, color: '#FFD166' }}>📝 {order.notes}</span>
          </div>
        )}

        {/* Customer message */}
        {mode === 'customer' && (
          <div className="rounded-3 px-3 py-2 mb-4 text-center"
            style={{ background: 'rgba(17,138,178,0.08)', border: '1px solid rgba(17,138,178,0.2)' }}>
            <span style={{ fontSize: 13, color: '#118AB2', fontWeight: 600 }}>
              🔔 We'll notify you when your order is ready for pickup!
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="d-flex gap-2">
          {onClose && (
            <button
              className="btn fw-semibold"
              onClick={onClose}
              style={{ flex: 1, background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', borderRadius: 10, padding: '11px' }}
            >
              Close
            </button>
          )}
          {onNewOrder && (
            <button
              className="btn fw-bold"
              onClick={onNewOrder}
              style={{ flex: 2, background: 'linear-gradient(135deg,#FF6B35,#e85a25)', color: 'white', border: 'none', borderRadius: 10, padding: '11px', fontSize: 14, boxShadow: '0 4px 16px rgba(255,107,53,0.3)' }}
            >
              {mode === 'cashier' ? '+ New Order' : '🛍️ Continue Shopping'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}