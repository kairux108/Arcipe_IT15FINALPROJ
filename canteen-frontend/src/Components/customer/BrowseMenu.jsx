import { useState, useEffect } from 'react';
import { menuService, orderService } from '../../Services/orderService';
import { useCart } from '../../Context/CartContext';
import LoadingSpinner from '../Common/LoadingSpinner';
import styles from './BrowseMenu.module.css';

export default function BrowseMenu() {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [showReceipt, setShowReceipt] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountPaid, setAmountPaid] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const {
    items, addItem, removeItem, updateQuantity,
    clearCart, subtotal, tax, total, itemCount
  } = useCart();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [menuData, catData] = await Promise.all([
        menuService.getItems({ available: 'true', per_page: 100 }),
        menuService.getCategories(),
      ]);
      setMenuItems(menuData.data || []);
      setCategories(catData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = menuItems.filter(item => {
    const matchesCat = activeCategory === 'all' || item.category_id === parseInt(activeCategory);
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const fmt = (n) => `₱${parseFloat(n || 0).toFixed(2)}`;
  const paid = parseFloat(amountPaid) || 0;
  const change = paid - total;
  const isInsufficientCash = paymentMethod === 'cash' && paid < total && itemCount > 0;
  const canPlace = itemCount > 0 && !submitting && (paymentMethod !== 'cash' || paid >= total);

  const handleOrder = async () => {
    if (!canPlace) return;
    setSubmitting(true);
    setErrorMsg('');
    try {
      const orderData = {
        items: items.map(i => ({
          menu_item_id: i.menu_item_id,
          quantity: i.quantity,
          special_instructions: '',
        })),
        payment_method: paymentMethod,
        amount_paid: paymentMethod === 'cash' ? paid : total,
      };
      const result = await orderService.createOrder(orderData);
      setShowReceipt(result.data);
      clearCart();
      setAmountPaid('');
      setShowCart(false);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Order failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <LoadingSpinner size="lg" />
    </div>
  );

  if (showReceipt) {
    return (
      <div className={styles.receiptPage}>
        <div className={styles.receipt}>
          <div className={styles.receiptIcon}>✅</div>
          <h2>Order Placed!</h2>
          <div className={styles.receiptNum}>{showReceipt.order_number}</div>
          <p className={styles.receiptSub}>Your order is being prepared. Track it in My Orders.</p>
          <div className={styles.receiptDivider} />
          <div className={styles.receiptItems}>
            {showReceipt.items?.map(item => (
              <div key={item.id} className={styles.receiptRow}>
                <span>{item.item_name} ×{item.quantity}</span>
                <span>{fmt(item.subtotal)}</span>
              </div>
            ))}
          </div>
          <div className={styles.receiptDivider} />
          <div className={styles.receiptTotals}>
            <div className={styles.receiptRow}><span>Subtotal</span><span>{fmt(showReceipt.subtotal)}</span></div>
            <div className={styles.receiptRow}><span>VAT (12%)</span><span>{fmt(showReceipt.tax)}</span></div>
            <div className={`${styles.receiptRow} ${styles.totalRow}`}><span>TOTAL</span><span>{fmt(showReceipt.total)}</span></div>
            {showReceipt.change_given > 0 && (
              <div className={`${styles.receiptRow} ${styles.changeRow}`}><span>Change</span><span>{fmt(showReceipt.change_given)}</span></div>
            )}
          </div>
          <button className={`btn btn-primary ${styles.doneBtn}`} onClick={() => setShowReceipt(null)}>
            Browse More
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>

      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Browse Menu</h2>
          <p className={styles.pageSub}>Choose from our freshly prepared items</p>
        </div>
        {itemCount > 0 && (
          <button className={styles.cartFloatBtn} onClick={() => setShowCart(true)}>
            🛒 View Cart
            <span className={styles.cartCount}>{itemCount}</span>
          </button>
        )}
      </div>

      {/* Search */}
      <div className={styles.searchBar}>
        <span>🔍</span>
        <input
          type="search"
          placeholder="Search menu items..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      {/* Category Tabs */}
      <div className={styles.catTabs}>
        <button
          className={`${styles.catTab} ${activeCategory === 'all' ? styles.active : ''}`}
          onClick={() => setActiveCategory('all')}
        >All</button>
        {categories.map(cat => (
          <button
            key={cat.id}
            className={`${styles.catTab} ${activeCategory === cat.id ? styles.active : ''}`}
            onClick={() => setActiveCategory(cat.id)}
          >
            {cat.icon} {cat.name}
          </button>
        ))}
      </div>

      {/* Menu Grid */}
      <div className={styles.menuGrid}>
        {filtered.map(item => {
          const inCart = items.find(i => i.menu_item_id === item.id);
          return (
            <div key={item.id} className={styles.menuCard}>
              <div className={styles.cardEmoji}>{item.category?.icon || '🍽️'}</div>
              <div className={styles.cardBody}>
                <div className={styles.cardName}>{item.name}</div>
                <div className={styles.cardCat}>{item.category?.name}</div>
                {item.description && (
                  <div className={styles.cardDesc}>{item.description}</div>
                )}
                <div className={styles.cardFooter}>
                  <span className={styles.cardPrice}>{fmt(item.price)}</span>
                  <span className={`${styles.stockTag} ${item.stock_quantity <= 10 ? styles.lowStock : ''}`}>
                    {item.stock_quantity <= 0 ? 'Out of stock' : `${item.stock_quantity} left`}
                  </span>
                </div>
              </div>
              <div className={styles.cardActions}>
                {inCart ? (
                  <div className={styles.qtyRow}>
                    <button className={styles.qtyBtn} onClick={() => updateQuantity(item.id, inCart.quantity - 1)}>−</button>
                    <span className={styles.qtyNum}>{inCart.quantity}</span>
                    <button className={styles.qtyBtn} onClick={() => updateQuantity(item.id, inCart.quantity + 1)}>+</button>
                  </div>
                ) : (
                  <button
                    className={styles.addBtn}
                    onClick={() => addItem(item)}
                    disabled={item.stock_quantity <= 0}
                  >
                    {item.stock_quantity <= 0 ? 'Unavailable' : '+ Add to Cart'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className={styles.empty}>
            <div>🍽️</div>
            <p>No items found</p>
          </div>
        )}
      </div>

      {/* Cart Drawer */}
      {showCart && (
        <div className={styles.drawerOverlay} onClick={() => setShowCart(false)}>
          <div className={styles.drawer} onClick={e => e.stopPropagation()}>
            <div className={styles.drawerHeader}>
              <h3>Your Cart</h3>
              <button className={styles.closeBtn} onClick={() => setShowCart(false)}>✕</button>
            </div>

            <div className={styles.drawerItems}>
              {items.map(item => (
                <div key={item.menu_item_id} className={styles.cartItem}>
                  <div className={styles.cartItemInfo}>
                    <div className={styles.cartItemName}>{item.name}</div>
                    <div className={styles.cartItemPrice}>{fmt(item.unit_price)}</div>
                  </div>
                  <div className={styles.cartItemControls}>
                    <div className={styles.qtyRow}>
                      <button className={styles.qtyBtn} onClick={() => updateQuantity(item.menu_item_id, item.quantity - 1)}>−</button>
                      <span className={styles.qtyNum}>{item.quantity}</span>
                      <button className={styles.qtyBtn} onClick={() => updateQuantity(item.menu_item_id, item.quantity + 1)}>+</button>
                    </div>
                    <span className={styles.cartSubtotal}>{fmt(item.subtotal)}</span>
                    <button className={styles.removeBtn} onClick={() => removeItem(item.menu_item_id)}>✕</button>
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.drawerFooter}>
              <div className={styles.totals}>
                <div className={styles.totalRow2}><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
                <div className={styles.totalRow2}><span>VAT (12%)</span><span>{fmt(tax)}</span></div>
                <div className={`${styles.totalRow2} ${styles.grandTotal}`}><span>TOTAL</span><span>{fmt(total)}</span></div>
              </div>

              <div className={styles.section}>
                <div className={styles.sectionLabel}>Payment Method</div>
                <div className={styles.payMethods}>
                  {[
                    { id: 'cash', icon: '💵', label: 'Cash' },
                    { id: 'card', icon: '💳', label: 'Card' },
                    { id: 'digital_wallet', icon: '📱', label: 'E-Wallet' },
                  ].map(m => (
                    <button
                      key={m.id}
                      className={`${styles.payBtn} ${paymentMethod === m.id ? styles.payActive : ''}`}
                      onClick={() => { setPaymentMethod(m.id); setAmountPaid(''); }}
                    >
                      <span>{m.icon}</span>
                      <span>{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {paymentMethod === 'cash' && (
                <div className={styles.section}>
                  <div className={styles.sectionLabel}>Amount Paid</div>
                  <div className={styles.amountWrap}>
                    <span className={styles.peso}>₱</span>
                    <input
                      type="number"
                      className={`${styles.amountInput} ${isInsufficientCash && amountPaid ? styles.insufficient : ''}`}
                      placeholder={`Minimum ₱${total.toFixed(2)}`}
                      value={amountPaid}
                      onChange={e => setAmountPaid(e.target.value)}
                      min={total}
                      step="0.01"
                    />
                  </div>
                  {paid >= total && paid > 0 && (
                    <div className={styles.changeBox}>
                      <span>Change</span>
                      <span className={styles.changeAmt}>{fmt(change)}</span>
                    </div>
                  )}
                  {isInsufficientCash && amountPaid !== '' && (
                    <div className={styles.warnBox}>
                      ⚠️ Need {fmt(total - paid)} more
                    </div>
                  )}
                  <div className={styles.quickAmounts}>
                    {[
                      Math.ceil(total / 50) * 50,
                      Math.ceil(total / 100) * 100,
                      Math.ceil(total / 500) * 500,
                    ].filter((v, i, arr) => arr.indexOf(v) === i && v >= total)
                     .slice(0, 3)
                     .map(amt => (
                      <button key={amt} className={styles.quickBtn} onClick={() => setAmountPaid(amt.toString())}>
                        ₱{amt}
                      </button>
                    ))}
                    <button className={styles.quickBtn} onClick={() => setAmountPaid(total.toFixed(2))}>Exact</button>
                  </div>
                </div>
              )}

              {errorMsg && <div className={styles.errorMsg}>⚠️ {errorMsg}</div>}

              <button
                className={`${styles.orderBtn} ${!canPlace ? styles.orderBtnDisabled : ''}`}
                onClick={handleOrder}
                disabled={!canPlace}
              >
                {submitting ? '⟳ Processing...'
                  : !itemCount ? 'Cart is empty'
                  : isInsufficientCash ? `Enter ₱${total.toFixed(2)} or more`
                  : `Place Order • ${fmt(total)}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating cart button for mobile */}
      {itemCount > 0 && !showCart && (
        <button className={styles.floatingCart} onClick={() => setShowCart(true)}>
          🛒 {itemCount} item{itemCount > 1 ? 's' : ''} · {fmt(total)}
        </button>
      )}
    </div>
  );
}