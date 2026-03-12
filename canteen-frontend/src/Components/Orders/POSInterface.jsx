import { useState, useEffect } from 'react';
import { menuService, orderService } from '../../Services/orderService';
import { useCart } from '../../Context/CartContext';
import LoadingSpinner from '../Common/LoadingSpinner';

const tableOverride = `
  .pos-menu-card { background: var(--surface-card); border: 1px solid var(--border-subtle); border-radius: 14px; cursor: pointer; transition: all 0.15s ease; position: relative; overflow: hidden; }
  .pos-menu-card:hover { border-color: #FF6B35; transform: translateY(-2px); box-shadow: 0 6px 20px rgba(255,107,53,0.15); }
  .pos-menu-card.in-cart { border-color: #FF6B35; background: rgba(255,107,53,0.06); box-shadow: 0 0 0 2px rgba(255,107,53,0.15); }
  .pos-input { background: var(--surface-2) !important; border: 1px solid var(--border-subtle) !important; color: var(--text-primary) !important; border-radius: 10px !important; }
  .pos-input:focus { background: var(--surface-2) !important; color: var(--text-primary) !important; border-color: #FF6B35 !important; box-shadow: 0 0 0 3px rgba(255,107,53,0.15) !important; }
  .pos-input.invalid:focus { border-color: #EF476F !important; box-shadow: 0 0 0 3px rgba(239,71,111,0.15) !important; }
  .pos-input::placeholder { color: var(--text-muted) !important; }
  .pos-input option { background: var(--surface-2) !important; color: var(--text-primary) !important; }
  .pos-amount-wrap { background: var(--surface-2); border: 1px solid var(--border-subtle); border-radius: 10px; overflow: hidden; display: flex; align-items: center; transition: all 0.15s; }
  .pos-amount-wrap:focus-within { border-color: #FF6B35; box-shadow: 0 0 0 3px rgba(255,107,53,0.15); }
  .pos-amount-wrap.invalid:focus-within { border-color: #EF476F; box-shadow: 0 0 0 3px rgba(239,71,111,0.15); }
  .pos-amount-input { background: transparent !important; border: none !important; outline: none !important; color: var(--text-primary) !important; font-size: 18px; font-weight: 700; padding: 12px 14px; flex: 1; width: 100%; font-family: inherit; box-shadow: none !important; }
  .pos-amount-input::placeholder { color: var(--text-muted); font-size: 14px; font-weight: 400; }
  .cat-tab { padding: 6px 16px; border-radius: 99px; font-size: 12px; font-weight: 600; cursor: pointer; white-space: nowrap; transition: all 0.15s ease; border: 1px solid var(--border-subtle); background: var(--surface-2); color: var(--text-muted); }
  .cat-tab:hover { color: var(--text-primary); border-color: var(--border-default); }
  .cat-tab.active { background: #FF6B35; color: white; border-color: #FF6B35; box-shadow: 0 2px 12px rgba(255,107,53,0.3); }
  .pay-btn { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 10px 6px; border-radius: 10px; font-size: 11px; font-weight: 600; cursor: pointer; border: 1px solid var(--border-subtle); background: var(--surface-2); color: var(--text-muted); transition: all 0.15s; }
  .pay-btn:hover { color: var(--text-primary); border-color: var(--border-default); }
  .pay-btn.active { background: rgba(255,107,53,0.1); color: #FF6B35; border-color: #FF6B35; }
  .quick-btn { padding: 5px 12px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; border: 1px solid var(--border-subtle); background: var(--surface-3); color: var(--text-secondary); transition: all 0.15s; }
  .quick-btn:hover { background: #FF6B35; color: white; border-color: #FF6B35; }
  .cart-item-row { background: var(--surface-2); border: 1px solid var(--border-subtle); border-radius: 10px; padding: 10px 12px; display: flex; align-items: center; gap: 10px; animation: fadeIn 0.15s ease; }
  .qty-btn { width: 26px; height: 26px; border-radius: 6px; background: var(--surface-3); border: none; color: var(--text-primary); font-size: 14px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; flex-shrink: 0; }
  .qty-btn:hover { background: #FF6B35; color: white; }
`;

export default function POSInterface() {
  const [menuItems, setMenuItems]     = useState([]);
  const [categories, setCategories]   = useState([]);
  const [activeCat, setActiveCat]     = useState('all');
  const [search, setSearch]           = useState('');
  const [loading, setLoading]         = useState(true);
  const [payMethod, setPayMethod]     = useState('cash');
  const [amountPaid, setAmountPaid]   = useState('');
  const [submitting, setSubmitting]   = useState(false);
  const [receipt, setReceipt]         = useState(null);
  const [errorMsg, setErrorMsg]       = useState('');

  const {
    cart, addToCart, removeFromCart, updateQty, clearCart, cartTotal, itemCount
  } = useCart();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [menuData, catData] = await Promise.all([
        menuService.getItems({ available: 1, per_page: 100 }),
        menuService.getCategories(),
      ]);
      setMenuItems(menuData.data || menuData || []);
      setCategories(catData || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const filtered = menuItems.filter(item => {
    const matchCat    = activeCat === 'all' || item.category_id == activeCat;
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch && item.is_available;
  });

  const fmt   = (n) => `₱${parseFloat(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
  const paid  = parseFloat(amountPaid) || 0;
  const tax   = cartTotal * 0.12;
  const total = cartTotal + tax;
  const change = paid - total;

  const insufficientCash = payMethod === 'cash' && itemCount > 0 && amountPaid !== '' && paid < total;
  const canPlace = itemCount > 0 && !submitting && (payMethod !== 'cash' || (amountPaid !== '' && paid >= total));

  // Quick amount suggestions
  const quickAmounts = itemCount > 0 ? [
    Math.ceil(total / 50) * 50,
    Math.ceil(total / 100) * 100,
    Math.ceil(total / 500) * 500,
  ].filter((v, i, arr) => arr.indexOf(v) === i && v >= total).slice(0, 3) : [];

  const handlePlaceOrder = async () => {
    if (!canPlace) return;
    setSubmitting(true);
    setErrorMsg('');
    try {
      const result = await orderService.createOrder({
        items: cart.map(c => ({ menu_item_id: c.id, quantity: c.quantity })),
        payment_method: payMethod,
        amount_paid: payMethod === 'cash' ? paid : total,
        notes: '',
      });
      setReceipt(result.data || result);
      clearCart();
      setAmountPaid('');
      await loadData();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Order failed. Please try again.');
    } finally { setSubmitting(false); }
  };

  const handleNewOrder = () => {
    setReceipt(null);
    setAmountPaid('');
    setPayMethod('cash');
    setErrorMsg('');
  };

  // ── RECEIPT SCREEN ──
  if (receipt) {
    const rItems  = receipt.items || receipt.order_items || [];
    const rTotal  = parseFloat(receipt.total_amount || receipt.total || 0);
    const rChange = parseFloat(receipt.change_given || receipt.change || 0);
    const rPaid   = parseFloat(receipt.amount_paid || 0);

    return (
      <>
        <style>{tableOverride}</style>
        <div className="d-flex align-items-center justify-content-center" style={{ minHeight: 'calc(100vh - 140px)' }}>
          <div className="rounded-4 p-4 text-center" style={{ background: 'var(--surface-card)', border: '1px solid var(--border-default)', width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ fontSize: 52, marginBottom: 8 }}>✅</div>
            <h2 className="fw-bold mb-1" style={{ fontSize: 22, color: 'var(--text-primary)' }}>Order Confirmed!</h2>
            {(receipt.order_number || receipt.id) && (
              <div className="d-inline-block mb-3 px-3 py-1 rounded-pill fw-bold" style={{ background: '#FF6B35', color: 'white', fontSize: 13 }}>
                {receipt.order_number || `#${receipt.id}`}
              </div>
            )}

            {/* Items */}
            <div className="rounded-3 mb-3 text-start" style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)' }}>
              {rItems.map((item, i) => {
                const name = item.menu_item?.name || item.name || item.item_name || 'Item';
                const sub  = parseFloat(item.subtotal || (item.price * item.quantity) || 0);
                return (
                  <div key={i} className="d-flex justify-content-between align-items-center px-3 py-2"
                    style={{ borderBottom: i < rItems.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                    <div>
                      <span className="fw-semibold" style={{ fontSize: 13, color: 'var(--text-primary)' }}>{name}</span>
                      <span className="ms-2 badge rounded-pill" style={{ background: 'rgba(255,107,53,0.12)', color: '#FF6B35', fontSize: 10 }}>
                        x{item.quantity}
                      </span>
                    </div>
                    <span className="fw-semibold" style={{ fontSize: 13, color: 'var(--text-primary)' }}>{fmt(sub)}</span>
                  </div>
                );
              })}
            </div>

            {/* Totals */}
            <div className="d-flex flex-column gap-2 mb-4 text-start">
              {receipt.subtotal && (
                <div className="d-flex justify-content-between" style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  <span>Subtotal</span><span>{fmt(receipt.subtotal)}</span>
                </div>
              )}
              {receipt.tax && (
                <div className="d-flex justify-content-between" style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  <span>VAT (12%)</span><span>{fmt(receipt.tax)}</span>
                </div>
              )}
              <div className="d-flex justify-content-between align-items-center rounded-3 px-3 py-2"
                style={{ background: 'rgba(255,107,53,0.08)', border: '1px solid rgba(255,107,53,0.2)' }}>
                <span className="fw-bold" style={{ fontSize: 15, color: 'var(--text-primary)' }}>TOTAL</span>
                <span className="fw-bold" style={{ fontSize: 20, color: '#FF6B35' }}>{fmt(rTotal)}</span>
              </div>
              {rPaid > 0 && (
                <div className="d-flex justify-content-between" style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  <span>Amount Paid</span><span>{fmt(rPaid)}</span>
                </div>
              )}
              {rChange > 0 && (
                <div className="d-flex justify-content-between rounded-3 px-3 py-2"
                  style={{ background: 'rgba(6,214,160,0.08)', border: '1px solid rgba(6,214,160,0.2)', fontSize: 14, fontWeight: 700, color: '#06D6A0' }}>
                  <span>Change</span><span>{fmt(rChange)}</span>
                </div>
              )}
            </div>

            <button
              className="btn fw-bold w-100"
              onClick={handleNewOrder}
              style={{ background: 'linear-gradient(135deg,#FF6B35,#e85a25)', color: 'white', border: 'none', borderRadius: 12, padding: '13px', fontSize: 15, boxShadow: '0 4px 20px rgba(255,107,53,0.3)' }}
            >
              + New Order
            </button>
          </div>
        </div>
      </>
    );
  }

  // ── MAIN POS ──
  return (
    <>
      <style>{tableOverride}</style>

      <div className="row g-3" style={{ height: 'calc(100vh - 110px)', minHeight: 0 }}>

        {/* ── LEFT: Menu Panel ── */}
        <div className="col-12 col-lg-7 d-flex flex-column gap-3 h-100" style={{ minHeight: 0 }}>

          {/* Search + Category Filter */}
          <div className="d-flex gap-2 flex-wrap">
            <input
              type="text"
              className="form-control pos-input flex-grow-1"
              placeholder="🔍 Search menu items..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ padding: '10px 14px', fontSize: 13, minWidth: 160 }}
            />
            <select
              className="form-select pos-input"
              value={activeCat}
              onChange={e => setActiveCat(e.target.value)}
              style={{ padding: '10px 14px', fontSize: 13, maxWidth: 160 }}
            >
              <option value="all">All Categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* Category Pills */}
          <div className="d-flex gap-2 flex-wrap">
            <button className={`cat-tab${activeCat === 'all' ? ' active' : ''}`} onClick={() => setActiveCat('all')}>All</button>
            {categories.map(c => (
              <button key={c.id} className={`cat-tab${activeCat == c.id ? ' active' : ''}`} onClick={() => setActiveCat(c.id.toString())}>
                {c.name}
              </button>
            ))}
          </div>

          {/* Menu Grid */}
          <div className="flex-grow-1 overflow-auto pe-1">
            {loading ? (
              <div className="d-flex justify-content-center py-5"><LoadingSpinner /></div>
            ) : filtered.length === 0 ? (
              <div className="d-flex flex-column align-items-center justify-content-center py-5 rounded-3"
                style={{ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>🍽️</div>
                <p className="fw-semibold mb-0" style={{ color: 'var(--text-muted)' }}>No items found</p>
              </div>
            ) : (
              <div className="row g-2">
                {filtered.map(item => {
                  const inCart = cart.find(c => c.id === item.id);
                  return (
                    <div key={item.id} className="col-6 col-md-4 col-xl-3">
                      <div
                        className={`pos-menu-card p-3 h-100 d-flex flex-column${inCart ? ' in-cart' : ''}`}
                        onClick={() => addToCart(item)}
                      >
                        {/* In-cart badge */}
                        {inCart && (
                          <div className="position-absolute top-0 end-0 m-2 d-flex align-items-center justify-content-center rounded-circle fw-bold"
                            style={{ width: 22, height: 22, background: '#FF6B35', color: 'white', fontSize: 11 }}>
                            {inCart.quantity}
                          </div>
                        )}

                        {/* Image / Emoji */}
                        <div className="d-flex align-items-center justify-content-center rounded-3 mb-2"
                          style={{ height: 64, background: 'var(--surface-2)', fontSize: 28 }}>
                          {item.image_url
                            ? <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
                            : '🍽️'}
                        </div>

                        <div className="fw-semibold text-truncate mb-1" style={{ fontSize: 12, color: 'var(--text-primary)' }}>
                          {item.name}
                        </div>

                        <div className="d-flex align-items-center justify-content-between mt-auto">
                          <span className="fw-bold" style={{ fontSize: 13, color: '#FF6B35' }}>{fmt(item.price)}</span>
                          <span className="badge rounded-pill" style={{
                            background: item.stock_quantity <= 10 ? 'rgba(239,71,111,0.12)' : 'rgba(255,255,255,0.06)',
                            color: item.stock_quantity <= 10 ? '#EF476F' : 'var(--text-muted)',
                            fontSize: 10,
                          }}>
                            {item.stock_quantity}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Order Panel ── */}
        <div className="col-12 col-lg-5 d-flex flex-column h-100 rounded-3 p-3"
          style={{ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', minHeight: 0 }}>

          {/* Cart Header */}
          <div className="d-flex align-items-center justify-content-between mb-3 flex-shrink-0">
            <div>
              <h3 className="fw-bold mb-0" style={{ fontSize: 16, color: 'var(--text-primary)' }}>🛒 Current Order</h3>
              {itemCount > 0 && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{itemCount} item(s)</div>}
            </div>
            {itemCount > 0 && (
              <button
                className="btn btn-sm fw-semibold"
                onClick={clearCart}
                style={{ background: 'rgba(239,71,111,0.1)', border: '1px solid rgba(239,71,111,0.3)', color: '#EF476F', borderRadius: 8, fontSize: 12 }}
              >
                Clear All
              </button>
            )}
          </div>

          {/* Cart Items */}
          <div className="flex-grow-1 overflow-auto d-flex flex-column gap-2 mb-3">
            {cart.length === 0 ? (
              <div className="d-flex flex-column align-items-center justify-content-center h-100 text-center">
                <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.4 }}>🛒</div>
                <p className="fw-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>No items yet</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Click menu items to add them</p>
              </div>
            ) : cart.map(item => (
              <div key={item.id} className="cart-item-row">
                <div className="flex-grow-1 min-width-0">
                  <div className="fw-semibold text-truncate" style={{ fontSize: 13, color: 'var(--text-primary)' }}>{item.name}</div>
                  <div style={{ fontSize: 11, color: '#FF6B35', fontWeight: 600 }}>{fmt(item.price)}</div>
                </div>
                <div className="d-flex align-items-center gap-1 flex-shrink-0">
                  <button className="qty-btn" onClick={() => updateQty(item.id, item.quantity - 1)}>−</button>
                  <span className="fw-bold text-center" style={{ minWidth: 24, fontSize: 13, color: 'var(--text-primary)' }}>{item.quantity}</span>
                  <button className="qty-btn" onClick={() => updateQty(item.id, item.quantity + 1)}>+</button>
                </div>
                <span className="fw-bold flex-shrink-0" style={{ fontSize: 13, color: 'var(--text-primary)', minWidth: 60, textAlign: 'right' }}>
                  {fmt(item.price * item.quantity)}
                </span>
                <button onClick={() => removeFromCart(item.id)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 14, cursor: 'pointer', padding: '0 2px', flexShrink: 0 }}
                  onMouseEnter={e => e.currentTarget.style.color = '#EF476F'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                >✕</button>
              </div>
            ))}
          </div>

          {/* Footer — Totals + Payment */}
          {itemCount > 0 && (
            <div className="flex-shrink-0 d-flex flex-column gap-3" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 16 }}>

              {/* Totals */}
              <div className="d-flex flex-column gap-1">
                <div className="d-flex justify-content-between" style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  <span>Subtotal</span><span>{fmt(cartTotal)}</span>
                </div>
                <div className="d-flex justify-content-between" style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  <span>VAT (12%)</span><span>{fmt(tax)}</span>
                </div>
                <div className="d-flex justify-content-between align-items-center rounded-3 px-3 py-2 mt-1"
                  style={{ background: 'rgba(255,107,53,0.08)', border: '1px solid rgba(255,107,53,0.2)' }}>
                  <span className="fw-bold" style={{ fontSize: 15, color: 'var(--text-primary)' }}>TOTAL</span>
                  <span className="fw-bold" style={{ fontSize: 20, color: '#FF6B35' }}>{fmt(total)}</span>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 8 }}>
                  Payment Method
                </div>
                <div className="d-flex gap-2">
                  {[
                    { id: 'cash',           icon: '💵', label: 'Cash' },
                    { id: 'card',           icon: '💳', label: 'Card' },
                    { id: 'digital_wallet', icon: '📱', label: 'E-Wallet' },
                  ].map(m => (
                    <button
                      key={m.id}
                      className={`pay-btn${payMethod === m.id ? ' active' : ''}`}
                      onClick={() => { setPayMethod(m.id); setAmountPaid(''); setErrorMsg(''); }}
                    >
                      <span style={{ fontSize: 18 }}>{m.icon}</span>
                      <span>{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Cash Amount Input */}
              {payMethod === 'cash' && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 8 }}>
                    Amount Received
                  </div>

                  {/* Amount input */}
                  <div className={`pos-amount-wrap${insufficientCash ? ' invalid' : ''}`}>
                    <span className="fw-bold px-3" style={{ color: 'var(--text-muted)', fontSize: 16, borderRight: '1px solid var(--border-subtle)', paddingTop: 12, paddingBottom: 12 }}>₱</span>
                    <input
                      type="number"
                      className="pos-amount-input"
                      placeholder={`Min. ${fmt(total)}`}
                      value={amountPaid}
                      onChange={e => { setAmountPaid(e.target.value); setErrorMsg(''); }}
                      min={0}
                      step="0.01"
                    />
                    {amountPaid && (
                      <button
                        onClick={() => setAmountPaid('')}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', padding: '0 12px', cursor: 'pointer', fontSize: 14 }}
                      >✕</button>
                    )}
                  </div>

                  {/* Quick amount buttons */}
                  <div className="d-flex gap-2 flex-wrap mt-2">
                    {quickAmounts.map(amt => (
                      <button key={amt} className="quick-btn" onClick={() => setAmountPaid(amt.toString())}>
                        ₱{amt.toLocaleString()}
                      </button>
                    ))}
                    <button className="quick-btn" onClick={() => setAmountPaid(total.toFixed(2))}>
                      Exact
                    </button>
                  </div>

                  {/* Feedback messages */}
                  {amountPaid !== '' && !insufficientCash && paid >= total && (
                    <div className="rounded-3 px-3 py-2 mt-2 d-flex justify-content-between align-items-center"
                      style={{ background: 'rgba(6,214,160,0.08)', border: '1px solid rgba(6,214,160,0.2)' }}>
                      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Change</span>
                      <span className="fw-bold" style={{ fontSize: 16, color: '#06D6A0' }}>{fmt(change)}</span>
                    </div>
                  )}

                  {insufficientCash && (
                    <div className="rounded-3 px-3 py-2 mt-2 d-flex justify-content-between align-items-center"
                      style={{ background: 'rgba(239,71,111,0.08)', border: '1px solid rgba(239,71,111,0.3)' }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#EF476F' }}>
                        ⚠️ Need {fmt(total - paid)} more
                      </span>
                      <span style={{ fontSize: 12, color: '#EF476F' }}>{fmt(paid)} / {fmt(total)}</span>
                    </div>
                  )}

                  {amountPaid === '' && (
                    <div className="mt-2" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      💡 Enter amount received to confirm order
                    </div>
                  )}
                </div>
              )}

              {/* Error */}
              {errorMsg && (
                <div className="rounded-3 px-3 py-2" style={{ background: 'rgba(239,71,111,0.08)', border: '1px solid rgba(239,71,111,0.3)', fontSize: 13, color: '#EF476F' }}>
                  ⚠️ {errorMsg}
                </div>
              )}

              {/* Place Order Button */}
              <button
                className="btn fw-bold w-100"
                onClick={handlePlaceOrder}
                disabled={!canPlace}
                style={{
                  background: canPlace
                    ? 'linear-gradient(135deg,#FF6B35,#e85a25)'
                    : 'var(--surface-3)',
                  color: canPlace ? 'white' : 'var(--text-muted)',
                  border: 'none',
                  borderRadius: 12,
                  padding: '14px',
                  fontSize: 15,
                  cursor: canPlace ? 'pointer' : 'not-allowed',
                  boxShadow: canPlace ? '0 4px 20px rgba(255,107,53,0.3)' : 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                {submitting ? (
                  <span className="d-flex align-items-center justify-content-center gap-2">
                    <span className="spinner-border spinner-border-sm" />
                    Processing...
                  </span>
                ) : !itemCount ? (
                  'Add items to order'
                ) : payMethod === 'cash' && amountPaid === '' ? (
                  '💵 Enter amount to confirm'
                ) : insufficientCash ? (
                  `⚠️ Need ${fmt(total - paid)} more`
                ) : (
                  `✅ Confirm Order · ${fmt(total)}`
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}