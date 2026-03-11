import { useState, useEffect } from 'react';
import { menuService, orderService } from '../../Services/orderService';
import { useCart } from '../../Context/CartContext';
import LoadingSpinner from '../Common/LoadingSpinner';
import styles from './POSInterface.module.css';

export default function POSInterface() {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountPaid, setAmountPaid] = useState('');
  const [showReceipt, setShowReceipt] = useState(null);
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

  const handleSubmitOrder = async () => {
    if (!canPlace) return;
    setSubmitting(true);
    setErrorMsg('');
    try {
      const orderData = {
        items: items.map(i => ({
          menu_item_id: i.menu_item_id,
          quantity: i.quantity,
          special_instructions: i.special_instructions || '',
        })),
        payment_method: paymentMethod,
        amount_paid: paymentMethod === 'cash' ? paid : total,
      };
      const result = await orderService.createOrder(orderData);
      setShowReceipt(result.data);
      clearCart();
      setAmountPaid('');
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
          <h2 className={styles.receiptTitle}>Order Confirmed!</h2>
          <div className={styles.receiptOrderNum}>{showReceipt.order_number}</div>

          <div className={styles.receiptDivider} />

          <div className={styles.receiptItems}>
            {showReceipt.items?.map(item => (
              <div key={item.id} className={styles.receiptRow}>
                <span>{item.item_name} <span className={styles.receiptQty}>×{item.quantity}</span></span>
                <span>{fmt(item.subtotal)}</span>
              </div>
            ))}
          </div>

          <div className={styles.receiptDivider} />

          <div className={styles.receiptTotals}>
            <div className={styles.receiptRow}>
              <span>Subtotal</span><span>{fmt(showReceipt.subtotal)}</span>
            </div>
            <div className={styles.receiptRow}>
              <span>VAT (12%)</span><span>{fmt(showReceipt.tax)}</span>
            </div>
            <div className={`${styles.receiptRow} ${styles.receiptTotal}`}>
              <span>TOTAL</span><span>{fmt(showReceipt.total)}</span>
            </div>
            {showReceipt.amount_paid && (
              <div className={styles.receiptRow}>
                <span>Amount Paid</span><span>{fmt(showReceipt.amount_paid)}</span>
              </div>
            )}
            {showReceipt.change_given > 0 && (
              <div className={`${styles.receiptRow} ${styles.receiptChange}`}>
                <span>Change</span><span>{fmt(showReceipt.change_given)}</span>
              </div>
            )}
          </div>

          <button
            className={`btn btn-primary ${styles.newOrderBtn}`}
            onClick={() => setShowReceipt(null)}
          >
            + New Order
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pos}>

      {/* ── LEFT: Menu Panel ── */}
      <div className={styles.menuPanel}>

        {/* Search */}
        <div className={styles.searchBar}>
          <span className={styles.searchIcon}>🔍</span>
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
          >
            All
          </button>
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
              <button
                key={item.id}
                className={`${styles.menuCard} ${inCart ? styles.inCart : ''}`}
                onClick={() => addItem(item)}
              >
                <div className={styles.menuEmoji}>{item.category?.icon || '🍽️'}</div>
                <div className={styles.menuName}>{item.name}</div>
                <div className={styles.menuFooter}>
                  <span className={styles.menuPrice}>{fmt(item.price)}</span>
                  <span className={`${styles.stockTag} ${item.stock_quantity <= 10 ? styles.lowStock : ''}`}>
                    {item.stock_quantity}
                  </span>
                </div>
                {inCart && (
                  <div className={styles.cartBadge}>{inCart.quantity}</div>
                )}
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div className={styles.empty}>
              <div>🍽️</div>
              <p>No items found</p>
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT: Order Panel ── */}
      <div className={styles.orderPanel}>

        {/* Header */}
        <div className={styles.orderHeader}>
          <div>
            <div className={styles.orderTitle}>Current Order</div>
            {itemCount > 0 && (
              <div className={styles.orderCount}>{itemCount} item{itemCount > 1 ? 's' : ''}</div>
            )}
          </div>
          {itemCount > 0 && (
            <button className={styles.clearBtn} onClick={clearCart}>Clear all</button>
          )}
        </div>

        {/* Cart Items */}
        <div className={styles.cartItems}>
          {items.length === 0 ? (
            <div className={styles.cartEmpty}>
              <div className={styles.cartEmptyIcon}>🛒</div>
              <p>No items added yet</p>
              <span>Click on menu items to add them</span>
            </div>
          ) : (
            items.map(item => (
              <div key={item.menu_item_id} className={styles.cartItem}>
                <div className={styles.cartItemLeft}>
                  <div className={styles.cartItemName}>{item.name}</div>
                  <div className={styles.cartItemUnit}>{fmt(item.unit_price)} each</div>
                </div>
                <div className={styles.cartItemRight}>
                  <div className={styles.qtyControls}>
                    <button
                      className={styles.qtyBtn}
                      onClick={() => updateQuantity(item.menu_item_id, item.quantity - 1)}
                    >−</button>
                    <span className={styles.qtyNum}>{item.quantity}</span>
                    <button
                      className={styles.qtyBtn}
                      onClick={() => updateQuantity(item.menu_item_id, item.quantity + 1)}
                    >+</button>
                  </div>
                  <div className={styles.cartItemSubtotal}>{fmt(item.subtotal)}</div>
                  <button
                    className={styles.removeBtn}
                    onClick={() => removeItem(item.menu_item_id)}
                  >✕</button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Order Summary + Payment */}
        <div className={styles.orderFooter}>

          {/* Totals */}
          <div className={styles.totals}>
            <div className={styles.totalRow}>
              <span>Subtotal</span>
              <span>{fmt(subtotal)}</span>
            </div>
            <div className={styles.totalRow}>
              <span>VAT (12%)</span>
              <span>{fmt(tax)}</span>
            </div>
            <div className={`${styles.totalRow} ${styles.grandTotal}`}>
              <span>TOTAL</span>
              <span>{fmt(total)}</span>
            </div>
          </div>

          {/* Payment Method */}
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
                  onClick={() => { setPaymentMethod(m.id); setAmountPaid(''); setErrorMsg(''); }}
                >
                  <span>{m.icon}</span>
                  <span>{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Amount Paid - only for cash */}
          {paymentMethod === 'cash' && (
            <div className={styles.section}>
              <div className={styles.sectionLabel}>Amount Paid</div>
              <div className={styles.amountInput}>
                <span className={styles.peso}>₱</span>
                <input
                  type="number"
                  placeholder={`Minimum ₱${total.toFixed(2)}`}
                  value={amountPaid}
                  onChange={e => { setAmountPaid(e.target.value); setErrorMsg(''); }}
                  min={total}
                  step="0.01"
                  className={`${styles.amountField} ${isInsufficientCash && amountPaid ? styles.insufficient : ''}`}
                />
              </div>

              {/* Change display */}
              {paid > 0 && paid >= total && (
                <div className={styles.changeBox}>
                  <span>Change</span>
                  <span className={styles.changeAmt}>{fmt(change)}</span>
                </div>
              )}

              {/* Insufficient warning */}
              {isInsufficientCash && amountPaid !== '' && (
                <div className={styles.insufficientWarn}>
                  ⚠️ Insufficient amount. Need {fmt(total - paid)} more.
                </div>
              )}

              {/* Quick amount buttons */}
              {itemCount > 0 && (
                <div className={styles.quickAmounts}>
                  {[
                    Math.ceil(total / 50) * 50,
                    Math.ceil(total / 100) * 100,
                    Math.ceil(total / 500) * 500,
                  ].filter((v, i, arr) => arr.indexOf(v) === i && v >= total)
                   .slice(0, 3)
                   .map(amt => (
                    <button
                      key={amt}
                      className={styles.quickBtn}
                      onClick={() => setAmountPaid(amt.toString())}
                    >
                      ₱{amt}
                    </button>
                  ))}
                  <button
                    className={styles.quickBtn}
                    onClick={() => setAmountPaid(total.toFixed(2))}
                  >
                    Exact
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Error */}
          {errorMsg && (
            <div className={styles.errorMsg}>⚠️ {errorMsg}</div>
          )}

          {/* Place Order Button */}
          <button
            className={`${styles.placeBtn} ${!canPlace ? styles.placeBtnDisabled : ''}`}
            onClick={handleSubmitOrder}
            disabled={!canPlace}
          >
            {submitting ? (
              <><span className="animate-spin">⟳</span> Processing...</>
            ) : !itemCount ? (
              'Add items to order'
            ) : isInsufficientCash ? (
              `Enter ₱${total.toFixed(2)} or more`
            ) : (
              `Confirm Order • ${fmt(total)}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}