import { useState, useEffect } from 'react';
import { menuService, orderService } from '../../Services/orderService';
import { useCart } from '../../Context/CartContext';
import LoadingSpinner from '../Common/LoadingSpinner';

const styles = `
  .bm-card { background: var(--surface-card); border: 1px solid var(--border-subtle); border-radius: 14px; transition: all 0.15s ease; overflow: hidden; }
  .bm-card:hover { border-color: #FF6B35; transform: translateY(-2px); box-shadow: 0 6px 20px rgba(255,107,53,0.15); }
  .bm-card.in-cart { border-color: #FF6B35; background: rgba(255,107,53,0.06); box-shadow: 0 0 0 2px rgba(255,107,53,0.15); }
  .bm-input { background: var(--surface-2) !important; border: 1px solid var(--border-subtle) !important; color: var(--text-primary) !important; border-radius: 10px !important; }
  .bm-input:focus { background: var(--surface-2) !important; color: var(--text-primary) !important; border-color: #FF6B35 !important; box-shadow: 0 0 0 3px rgba(255,107,53,0.15) !important; }
  .bm-input::placeholder { color: var(--text-muted) !important; }
  .bm-input option { background: var(--surface-2) !important; color: var(--text-primary) !important; }
  .cat-pill { padding: 6px 16px; border-radius: 99px; font-size: 12px; font-weight: 600; cursor: pointer; white-space: nowrap; transition: all 0.15s ease; border: 1px solid var(--border-subtle); background: var(--surface-2); color: var(--text-muted); }
  .cat-pill:hover { color: var(--text-primary); border-color: var(--border-default); }
  .cat-pill.active { background: #FF6B35; color: white; border-color: #FF6B35; box-shadow: 0 2px 12px rgba(255,107,53,0.3); }
  .qty-btn { width: 28px; height: 28px; border-radius: 7px; background: var(--surface-3); border: none; color: var(--text-primary); font-size: 15px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; flex-shrink: 0; }
  .qty-btn:hover { background: #FF6B35; color: white; }
  .cart-row { background: var(--surface-2); border: 1px solid var(--border-subtle); border-radius: 10px; padding: 10px 12px; display: flex; align-items: center; gap: 10px; }
  .pay-btn { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 10px 6px; border-radius: 10px; font-size: 11px; font-weight: 600; cursor: pointer; border: 1px solid var(--border-subtle); background: var(--surface-2); color: var(--text-muted); transition: all 0.15s; }
  .pay-btn:hover { color: var(--text-primary); border-color: var(--border-default); }
  .pay-btn.active { background: rgba(255,107,53,0.1); color: #FF6B35; border-color: #FF6B35; }
  .amount-wrap { background: var(--surface-2); border: 1px solid var(--border-subtle); border-radius: 10px; overflow: hidden; display: flex; align-items: center; transition: all 0.15s; }
  .amount-wrap:focus-within { border-color: #FF6B35; box-shadow: 0 0 0 3px rgba(255,107,53,0.15); }
  .amount-wrap.invalid:focus-within { border-color: #EF476F; box-shadow: 0 0 0 3px rgba(239,71,111,0.15); }
  .amount-input { background: transparent !important; border: none !important; outline: none !important; color: var(--text-primary) !important; font-size: 18px; font-weight: 700; padding: 12px 14px; flex: 1; width: 100%; font-family: inherit; box-shadow: none !important; }
  .amount-input::placeholder { color: var(--text-muted); font-size: 14px; font-weight: 400; }
  .quick-btn { padding: 5px 12px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; border: 1px solid var(--border-subtle); background: var(--surface-3); color: var(--text-secondary); transition: all 0.15s; }
  .quick-btn:hover { background: #FF6B35; color: white; border-color: #FF6B35; }
  .cart-badge { position: absolute; top: -6px; right: -6px; width: 20px; height: 20px; background: #FF6B35; color: white; border-radius: 50%; font-size: 10px; font-weight: 700; display: flex; align-items: center; justify-content: center; }
`;

export default function BrowseMenu() {
  const [menuItems, setMenuItems]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCat, setActiveCat]   = useState('all');
  const [search, setSearch]         = useState('');
  const [loading, setLoading]       = useState(true);

  // Cart drawer state
  const [cartOpen, setCartOpen]     = useState(false);

  // Checkout modal state
  const [showCheckout, setShowCheckout] = useState(false);
  const [payMethod, setPayMethod]       = useState('cash');
  const [amountPaid, setAmountPaid]     = useState('');
  const [submitting, setSubmitting]     = useState(false);
  const [errorMsg, setErrorMsg]         = useState('');
  const [receipt, setReceipt]           = useState(null);

  const {
    cart, items,
    addToCart, addItem,
    removeFromCart, removeItem,
    updateQty, updateQuantity,
    clearCart,
    cartTotal, subtotal, total: ctxTotal,
    itemCount,
  } = useCart();

  // Normalize aliases
  const cartItems  = cart || items || [];
  const addFn      = addToCart || addItem;
  const removeFn   = removeFromCart || removeItem;
  const updateFn   = updateQty || updateQuantity;
  const baseTotal  = cartTotal || subtotal || ctxTotal || 0;

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [menuData, catData] = await Promise.all([
        // ✅ FIX: per_page:200 so ALL items come back, not just the default 15/20
        menuService.getItems({ available: 1, per_page: 200 }),
        menuService.getCategories(),
      ]);
      setMenuItems(menuData.data ?? menuData ?? []);
      setCategories(catData ?? []);
    } catch (err) {
      console.error('BrowseMenu load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = menuItems.filter(item => {
    const matchCat    = activeCat === 'all' || item.category_id == activeCat;
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch && item.is_available;
  });

  const fmt    = (n) => `₱${parseFloat(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
  const tax    = baseTotal * 0.12;
  const total  = baseTotal + tax;
  const paid   = parseFloat(amountPaid) || 0;
  const change = paid - total;

  const insufficientCash = payMethod === 'cash' && itemCount > 0 && amountPaid !== '' && paid < total;

  // ✅ FIX: Same canPlace logic as POS — cash requires sufficient amount
  const canPlace = itemCount > 0 && !submitting && (
    payMethod !== 'cash' || (amountPaid !== '' && paid >= total)
  );

  // Quick amount suggestions (same as POS)
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
        items: cartItems.map(c => ({ menu_item_id: c.id, quantity: c.quantity })),
        payment_method: payMethod,
        amount_paid: payMethod === 'cash' ? paid : total,
        notes: '',
      });
      setReceipt(result.data ?? result);
      clearCart();
      setAmountPaid('');
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Order failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNewOrder = () => {
    setReceipt(null);
    setShowCheckout(false);
    setAmountPaid('');
    setPayMethod('cash');
    setErrorMsg('');
    setCartOpen(false);
  };

  // ── RECEIPT SCREEN ──
  if (receipt) {
    const rItems  = receipt.items || receipt.order_items || [];
    const rTotal  = parseFloat(receipt.total_amount || receipt.total || 0);
    const rPaid   = parseFloat(receipt.amount_paid || 0);
    const rChange = parseFloat(receipt.change_given || receipt.change || 0);

    return (
      <>
        <style>{styles}</style>
        <div className="d-flex align-items-center justify-content-center" style={{ minHeight: 'calc(100vh - 140px)' }}>
          <div className="rounded-4 p-4 text-center" style={{
            background: 'var(--surface-card)', border: '1px solid var(--border-default)',
            width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <div style={{ fontSize: 52, marginBottom: 8 }}>✅</div>
            <h2 className="fw-bold mb-1" style={{ fontSize: 22, color: 'var(--text-primary)' }}>Order Placed!</h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
              Your order is being prepared. Track it in <strong style={{ color: 'var(--text-secondary)' }}>My Orders</strong>.
            </p>
            {(receipt.order_number || receipt.id) && (
              <div className="d-inline-block mb-3 px-3 py-1 rounded-pill fw-bold" style={{ background: '#FF6B35', color: 'white', fontSize: 13 }}>
                {receipt.order_number || `Order #${receipt.id}`}
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
              🛍️ Continue Shopping
            </button>
          </div>
        </div>
      </>
    );
  }

  // ── CHECKOUT MODAL ──
  const CheckoutModal = () => (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-end align-items-md-center justify-content-center"
      style={{ zIndex: 9999, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) setShowCheckout(false); }}
    >
      <div className="rounded-4 p-4 w-100" style={{
        background: 'var(--surface-card)', border: '1px solid var(--border-default)',
        maxWidth: 440, maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
      }}>
        {/* Header */}
        <div className="d-flex align-items-center justify-content-between mb-4">
          <h3 className="fw-bold mb-0" style={{ fontSize: 18, color: 'var(--text-primary)' }}>🧾 Checkout</h3>
          <button onClick={() => setShowCheckout(false)}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>

        {/* Order Summary */}
        <div className="mb-3 rounded-3 overflow-hidden" style={{ border: '1px solid var(--border-subtle)' }}>
          {cartItems.map((item, i) => (
            <div key={item.id} className="d-flex justify-content-between align-items-center px-3 py-2"
              style={{ borderBottom: i < cartItems.length - 1 ? '1px solid var(--border-subtle)' : 'none', background: 'var(--surface-2)' }}>
              <div>
                <span className="fw-semibold" style={{ fontSize: 13, color: 'var(--text-primary)' }}>{item.name}</span>
                <span className="ms-2 badge rounded-pill" style={{ background: 'rgba(255,107,53,0.12)', color: '#FF6B35', fontSize: 10 }}>x{item.quantity}</span>
              </div>
              <span className="fw-semibold" style={{ fontSize: 13, color: 'var(--text-primary)' }}>{fmt(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="d-flex flex-column gap-1 mb-4">
          <div className="d-flex justify-content-between" style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            <span>Subtotal</span><span>{fmt(baseTotal)}</span>
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
        <div className="mb-3">
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

        {/* ✅ FIX: Cash amount input — same as POS */}
        {payMethod === 'cash' && (
          <div className="mb-3">
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 8 }}>
              Amount to Pay
            </div>

            <div className={`amount-wrap${insufficientCash ? ' invalid' : ''}`}>
              <span className="fw-bold px-3" style={{ color: 'var(--text-muted)', fontSize: 16, borderRight: '1px solid var(--border-subtle)', paddingTop: 12, paddingBottom: 12 }}>₱</span>
              <input
                type="number"
                className="amount-input"
                placeholder={`Min. ${fmt(total)}`}
                value={amountPaid}
                onChange={e => { setAmountPaid(e.target.value); setErrorMsg(''); }}
                min={0}
                step="0.01"
              />
              {amountPaid && (
                <button onClick={() => setAmountPaid('')}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', padding: '0 12px', cursor: 'pointer', fontSize: 14 }}>✕</button>
              )}
            </div>

            {/* Quick amounts */}
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

            {/* Feedback banners */}
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
                💡 Enter the amount you will pay
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {errorMsg && (
          <div className="rounded-3 px-3 py-2 mb-3" style={{ background: 'rgba(239,71,111,0.08)', border: '1px solid rgba(239,71,111,0.3)', fontSize: 13, color: '#EF476F' }}>
            ⚠️ {errorMsg}
          </div>
        )}

        {/* ✅ FIX: Place Order button — disabled unless canPlace */}
        <button
          className="btn fw-bold w-100"
          onClick={handlePlaceOrder}
          disabled={!canPlace}
          style={{
            background: canPlace ? 'linear-gradient(135deg,#FF6B35,#e85a25)' : 'var(--surface-3)',
            color: canPlace ? 'white' : 'var(--text-muted)',
            border: 'none', borderRadius: 12, padding: '14px', fontSize: 15,
            cursor: canPlace ? 'pointer' : 'not-allowed',
            boxShadow: canPlace ? '0 4px 20px rgba(255,107,53,0.3)' : 'none',
            transition: 'all 0.2s ease',
          }}
        >
          {submitting ? (
            <span className="d-flex align-items-center justify-content-center gap-2">
              <span className="spinner-border spinner-border-sm" />
              Placing Order...
            </span>
          ) : !itemCount ? (
            'No items in cart'
          ) : payMethod === 'cash' && amountPaid === '' ? (
            '💵 Enter amount to confirm'
          ) : insufficientCash ? (
            `⚠️ Need ${fmt(total - paid)} more`
          ) : (
            `✅ Place Order · ${fmt(total)}`
          )}
        </button>
      </div>
    </div>
  );

  // ── MAIN BROWSE PAGE ──
  return (
    <>
      <style>{styles}</style>

      {showCheckout && <CheckoutModal />}

      <div className="d-flex flex-column gap-4" style={{ animation: 'fadeIn 0.3s ease' }}>

        {/* Header */}
        <div className="d-flex align-items-start justify-content-between flex-wrap gap-3">
          <div>
            <h2 className="fw-bold mb-1" style={{ fontSize: 20, color: 'var(--text-primary)' }}>Browse Menu</h2>
            <p className="mb-0" style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {filtered.length} item{filtered.length !== 1 ? 's' : ''} available
            </p>
          </div>

          {/* Cart Button */}
          <button
            className="btn fw-bold position-relative"
            onClick={() => setCartOpen(o => !o)}
            style={{
              background: itemCount > 0 ? 'linear-gradient(135deg,#FF6B35,#e85a25)' : 'var(--surface-2)',
              color: itemCount > 0 ? 'white' : 'var(--text-secondary)',
              border: itemCount > 0 ? 'none' : '1px solid var(--border-subtle)',
              borderRadius: 12, padding: '10px 20px', fontSize: 14,
              boxShadow: itemCount > 0 ? '0 4px 20px rgba(255,107,53,0.3)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            🛒 Cart
            {itemCount > 0 && (
              <span className="cart-badge">{itemCount}</span>
            )}
          </button>
        </div>

        {/* Search + Category Select */}
        <div className="d-flex gap-2 flex-wrap">
          <input
            type="text"
            className="form-control bm-input flex-grow-1"
            placeholder="🔍 Search menu..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ padding: '10px 14px', fontSize: 13, minWidth: 160 }}
          />
          <select
            className="form-select bm-input"
            value={activeCat}
            onChange={e => setActiveCat(e.target.value)}
            style={{ padding: '10px 14px', fontSize: 13, maxWidth: 180 }}
          >
            <option value="all">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {/* Category Pills */}
        <div className="d-flex gap-2 flex-wrap">
          <button className={`cat-pill${activeCat === 'all' ? ' active' : ''}`} onClick={() => setActiveCat('all')}>All</button>
          {categories.map(c => (
            <button key={c.id} className={`cat-pill${activeCat == c.id ? ' active' : ''}`} onClick={() => setActiveCat(c.id.toString())}>
              {c.name}
            </button>
          ))}
        </div>

        {/* Menu Grid */}
        {loading ? (
          <div className="d-flex justify-content-center py-5"><LoadingSpinner /></div>
        ) : filtered.length === 0 ? (
          <div className="d-flex flex-column align-items-center justify-content-center rounded-3 py-5"
            style={{ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🍽️</div>
            <p className="fw-semibold mb-0" style={{ color: 'var(--text-muted)' }}>No items found</p>
          </div>
        ) : (
          <div className="row g-3">
            {filtered.map(item => {
              const inCart = cartItems.find(c => c.id === item.id);
              return (
                <div key={item.id} className="col-6 col-md-4 col-lg-3">
                  <div className={`bm-card h-100 d-flex flex-column${inCart ? ' in-cart' : ''}`}>
                    {/* Image */}
                    <div className="d-flex align-items-center justify-content-center"
                      style={{ height: 120, background: 'var(--surface-2)', position: 'relative' }}>
                      {item.image_url
                        ? <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <span style={{ fontSize: 40 }}>🍽️</span>
                      }
                      {inCart && (
                        <div style={{
                          position: 'absolute', top: 8, right: 8,
                          background: '#FF6B35', color: 'white', borderRadius: 99,
                          padding: '2px 8px', fontSize: 11, fontWeight: 700,
                        }}>
                          x{inCart.quantity} in cart
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-3 d-flex flex-column flex-grow-1">
                      <span className="badge rounded-pill mb-1" style={{
                        background: 'rgba(255,107,53,0.12)', color: '#FF6B35',
                        fontSize: 10, alignSelf: 'flex-start',
                      }}>
                        {item.category?.name || 'Uncategorized'}
                      </span>
                      <div className="fw-bold mb-1" style={{ fontSize: 14, color: 'var(--text-primary)' }}>{item.name}</div>
                      {item.description && (
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {item.description}
                        </div>
                      )}
                      <div className="fw-bold mt-auto mb-2" style={{ fontSize: 16, color: '#FF6B35' }}>{fmt(item.price)}</div>

                      {/* Add / Qty controls */}
                      {!inCart ? (
                        <button
                          className="btn fw-bold w-100"
                          onClick={() => addFn(item)}
                          style={{
                            background: 'linear-gradient(135deg,#FF6B35,#e85a25)',
                            color: 'white', border: 'none', borderRadius: 10,
                            padding: '9px', fontSize: 13,
                            boxShadow: '0 3px 12px rgba(255,107,53,0.3)',
                          }}
                        >
                          Add to Cart
                        </button>
                      ) : (
                        <div className="d-flex align-items-center justify-content-between gap-2">
                          <div className="d-flex align-items-center gap-2">
                            <button className="qty-btn" onClick={() => updateFn(item.id, inCart.quantity - 1)}>−</button>
                            <span className="fw-bold" style={{ fontSize: 14, color: 'var(--text-primary)', minWidth: 20, textAlign: 'center' }}>{inCart.quantity}</span>
                            <button className="qty-btn" onClick={() => updateFn(item.id, inCart.quantity + 1)}>+</button>
                          </div>
                          <button
                            onClick={() => removeFn(item.id)}
                            style={{ background: 'none', border: 'none', color: '#EF476F', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: '4px 6px' }}
                          >
                            ✕ Remove
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Cart Drawer (slide-up panel) ── */}
        {cartOpen && (
          <div
            className="position-fixed bottom-0 start-0 w-100"
            style={{ zIndex: 9998, maxHeight: '70vh', background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: '20px 20px 0 0', boxShadow: '0 -8px 40px rgba(0,0,0,0.3)', overflowY: 'auto' }}
          >
            <div className="p-3 d-flex flex-column gap-3">
              {/* Drawer Header */}
              <div className="d-flex align-items-center justify-content-between">
                <h4 className="fw-bold mb-0" style={{ fontSize: 16, color: 'var(--text-primary)' }}>🛒 Your Cart ({itemCount})</h4>
                <button onClick={() => setCartOpen(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 20, cursor: 'pointer' }}>✕</button>
              </div>

              {/* Cart Items */}
              {cartItems.length === 0 ? (
                <div className="text-center py-4" style={{ color: 'var(--text-muted)', fontSize: 13 }}>Your cart is empty</div>
              ) : (
                <>
                  <div className="d-flex flex-column gap-2">
                    {cartItems.map(item => (
                      <div key={item.id} className="cart-row">
                        <div className="flex-grow-1">
                          <div className="fw-semibold" style={{ fontSize: 13, color: 'var(--text-primary)' }}>{item.name}</div>
                          <div style={{ fontSize: 11, color: '#FF6B35', fontWeight: 600 }}>{fmt(item.price)}</div>
                        </div>
                        <div className="d-flex align-items-center gap-1">
                          <button className="qty-btn" onClick={() => updateFn(item.id, item.quantity - 1)}>−</button>
                          <span className="fw-bold" style={{ minWidth: 22, textAlign: 'center', fontSize: 13, color: 'var(--text-primary)' }}>{item.quantity}</span>
                          <button className="qty-btn" onClick={() => updateFn(item.id, item.quantity + 1)}>+</button>
                        </div>
                        <span className="fw-bold" style={{ fontSize: 13, color: 'var(--text-primary)', minWidth: 60, textAlign: 'right' }}>
                          {fmt(item.price * item.quantity)}
                        </span>
                        <button onClick={() => removeFn(item.id)}
                          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 14, cursor: 'pointer' }}
                          onMouseEnter={e => e.currentTarget.style.color = '#EF476F'}
                          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                        >✕</button>
                      </div>
                    ))}
                  </div>

                  {/* Total + Checkout */}
                  <div className="d-flex justify-content-between align-items-center rounded-3 px-3 py-2"
                    style={{ background: 'rgba(255,107,53,0.08)', border: '1px solid rgba(255,107,53,0.2)' }}>
                    <span className="fw-bold" style={{ fontSize: 15, color: 'var(--text-primary)' }}>Total (incl. VAT)</span>
                    <span className="fw-bold" style={{ fontSize: 18, color: '#FF6B35' }}>{fmt(total)}</span>
                  </div>

                  <div className="d-flex gap-2">
                    <button
                      className="btn fw-semibold"
                      onClick={clearCart}
                      style={{ flex: 1, background: 'rgba(239,71,111,0.1)', border: '1px solid rgba(239,71,111,0.3)', color: '#EF476F', borderRadius: 10, fontSize: 13 }}
                    >
                      Clear
                    </button>
                    <button
                      className="btn fw-bold"
                      onClick={() => { setCartOpen(false); setShowCheckout(true); }}
                      style={{ flex: 3, background: 'linear-gradient(135deg,#FF6B35,#e85a25)', color: 'white', border: 'none', borderRadius: 10, padding: '11px', fontSize: 14, boxShadow: '0 4px 16px rgba(255,107,53,0.3)' }}
                    >
                      Proceed to Checkout →
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}