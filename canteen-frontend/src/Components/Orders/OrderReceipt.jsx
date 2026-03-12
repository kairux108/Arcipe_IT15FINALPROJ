export default function OrderReceipt({ order, onClose }) {
  const fmt = (n) => `₱${parseFloat(n||0).toLocaleString('en-PH',{minimumFractionDigits:2})}`;

  return (
    <div
      className="rounded-4 p-4"
      style={{
        background: 'var(--surface-card)',
        border: '1px solid var(--border-default)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
      }}
    >
      {/* Header */}
      <div className="text-center mb-4">
        <div style={{ fontSize: 40, marginBottom: 8 }}>✅</div>
        <h3 className="fw-bold mb-1" style={{ fontSize: 20, color: 'var(--text-primary)' }}>
          Order Placed!
        </h3>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          Order #{order.id} · {new Date(order.created_at).toLocaleString()}
        </p>
        <span
          className="badge rounded-pill px-3 py-2"
          style={{ background: 'rgba(255,209,102,0.12)', color: '#FFD166', fontSize: 12, fontWeight: 700 }}
        >
          {order.status?.toUpperCase()}
        </span>
      </div>

      {/* Items */}
      <div
        className="rounded-3 mb-3"
        style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)' }}
      >
        {order.items?.map((item, i) => (
          <div
            key={i}
            className="d-flex align-items-center justify-content-between px-3 py-2"
            style={{ borderBottom: i < order.items.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}
          >
            <div>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                {item.menu_item?.name || item.name}
              </span>
              <span
                className="ms-2 badge rounded-pill"
                style={{ background: 'rgba(255,107,53,0.12)', color: '#FF6B35', fontSize: 10 }}
              >
                x{item.quantity}
              </span>
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
              {fmt(item.subtotal || item.price * item.quantity)}
            </span>
          </div>
        ))}
      </div>

      {/* Total */}
      <div
        className="d-flex align-items-center justify-content-between rounded-3 px-3 py-3 mb-4"
        style={{ background: 'rgba(255,107,53,0.08)', border: '1px solid rgba(255,107,53,0.2)' }}
      >
        <span className="fw-bold" style={{ fontSize: 15, color: 'var(--text-primary)' }}>Total</span>
        <span style={{ fontSize: 22, fontWeight: 800, color: '#FF6B35', fontFamily: 'var(--font-display)' }}>
          {fmt(order.total_amount)}
        </span>
      </div>

      <button
        className="btn fw-bold w-100"
        onClick={onClose}
        style={{
          background: '#FF6B35',
          color: 'white',
          border: 'none',
          borderRadius: 10,
          padding: '12px',
          fontSize: 14,
        }}
      >
        New Order
      </button>
    </div>
  );
}