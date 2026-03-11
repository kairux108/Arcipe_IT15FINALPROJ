import { useState, useEffect } from 'react';
import { menuService, orderService } from '../../Services/orderService';
import { useCart } from '../../context/CartContext';
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

  const { items, addItem, removeItem, updateQuantity, clearCart, subtotal, tax, total, itemCount } = useCart();

  useEffect(() => {
    loadData();
  }, []);

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

  const handleSubmitOrder = async () => {
    if (!items.length) return;
    setSubmitting(true);

    try {
      const orderData = {
        items: items.map(i => ({
          menu_item_id: i.menu_item_id,
          quantity: i.quantity,
          special_instructions: i.special_instructions || '',
        })),
        payment_method: paymentMethod,
        amount_paid: paymentMethod === 'cash' ? parseFloat(amountPaid) || total : total,
      };

      const result = await orderService.createOrder(orderData);
      setShowReceipt(result.data);
      clearCart();
      setAmountPaid('');
    } catch (err) {
      alert(err.response?.data?.message || 'Order failed');
    } finally {
      setSubmitting(false);
    }
  };

  const fmt = (n) => `₱${parseFloat(n).toFixed(2)}`;
  const change = paymentMethod === 'cash' && amountPaid ? Math.max(0, parseFloat(amountPaid) - total) : 0;

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><LoadingSpinner /></div>;

  if (showReceipt) {
    return (
      <div className={styles.receiptWrap}>
        <div className={styles.receipt}>
          <div className={styles.receiptHeader}>
            <div className={styles.receiptIcon}>✅</div>
            <h2>Order Placed!</h2>
            <p className={styles.orderNumber}>{showReceipt.order_number}</p>
          </div>
          <div className={styles.receiptItems}>
            {showReceipt.items?.map(item => (
              <div key={item.id} className={styles.receiptItem}>
                <span>{item.item_name} x{item.quantity}</span>
                <span>{fmt(item.subtotal)}</span>
              </div>
            ))}
          </div>
          <div className={styles.receiptTotals}>
            <div className={styles.receiptRow}><span>Subtotal</span><span>{fmt(showReceipt.subtotal)}</span></div>
            <div className={styles.receiptRow}><span>VAT (12%)</span><span>{fmt(showReceipt.tax)}</span></div>
            <div className={`${styles.receiptRow} ${styles.receiptTotal}`}>
              <span>TOTAL</span><span>{fmt(showReceipt.total)}</span>
            </div>
            {showReceipt.change_given > 0 && (
              <div className={`${styles.receiptRow} ${styles.change}`}>
                <span>Change</span><span>{fmt(showReceipt.change_given)}</span>
              </div>
            )}
          </div>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setShowReceipt(null)}>
            New Order
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pos}>
      {/* Menu Panel */}
      <div className={styles.menuPanel}>
        <div className={styles.menuHeader}>
          <input
            type="search"
            className="form-input"
            placeholder="🔍 Search menu items..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
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
        </div>

        <div className={styles.menuGrid}>
          {filtered.map(item => (
            <button
              key={item.id}
              className={styles.menuCard}
              onClick={() => addItem(item)}
            >
              <div className={styles.menuCardInner}>
                <div className={styles.menuEmoji}>{item.category?.icon || '🍽️'}</div>
                <div className={styles.menuName}>{item.name}</div>
                <div className={styles.menuPrice}>{fmt(item.price)}</div>
                <div className={`${styles.stockBadge} ${item.stock_quantity <= 10 ? styles.lowStock : ''}`}>
                  {item.stock_quantity} left
                </div>
              </div>
              <div className={styles.addBtn}>+</div>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className={styles.empty}>No items found</div>
          )}
        </div>
      </div>

      {/* Cart Panel */}
      <div className={styles.cartPanel}>
        <div className={styles.cartHeader}>
          <h3>Current Order</h3>
          {itemCount > 0 && (
            <button className="btn-ghost btn" onClick={clearCart} style={{ color: 'var(--brand-danger)', fontSize: 13 }}>
              Clear all
            </button>
          )}
        </div>

        <div className={styles.cartItems}>
          {items.length === 0 ? (
            <div className={styles.cartEmpty}>
              <div>🛒</div>
              <p>No items added yet</p>
              <p>Click on menu items to add them</p>
            </div>
          ) : (
            items.map(item => (
              <div key={item.menu_item_id} className={styles.cartItem}>
                <div className={styles.cartItemInfo}>
                  <div className={styles.cartItemName}>{item.name}</div>
                  <div className={styles.cartItemPrice}>{fmt(item.unit_price)}</div>
                </div>
                <div className={styles.cartItemControls}>
                  <button onClick={() => updateQuantity(item.menu_item_id, item.quantity - 1)}>−</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.menu_item_id, item.quantity + 1)}>+</button>
                  <div className={styles.cartItemSubtotal}>{fmt(item.subtotal)}</div>
                  <button className={styles.removeBtn} onClick={() => removeItem(item.menu_item_id)}>✕</button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className={styles.cartFooter}>
          <div className={styles.orderSummary}>
            <div className={styles.summaryRow}><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
            <div className={styles.summaryRow}><span>VAT (12%)</span><span>{fmt(tax)}</span></div>
            <div className={`${styles.summaryRow} ${styles.totalRow}`}>
              <span>TOTAL</span><span>{fmt(total)}</span>
            </div>
          </div>

          <div className={styles.paymentSection}>
            <div className="form-group">
              <label className="form-label">Payment Method</label>
              <div className={styles.paymentMethods}>
                {['cash', 'card', 'digital_wallet'].map(m => (
                  <button
                    key={m}
                    className={`${styles.payMethod} ${paymentMethod === m ? styles.active : ''}`}
                    onClick={() => setPaymentMethod(m)}
                  >
                    {m === 'cash' ? '💵' : m === 'card' ? '💳' : '📱'}
                    {m.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {paymentMethod === 'cash' && (
              <div className="form-group">
                <label className="form-label">Amount Paid</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="0.00"
                  value={amountPaid}
                  onChange={e => setAmountPaid(e.target.value)}
                  min={total}
                  step="0.01"
                />
                {amountPaid && (
                  <div className={styles.changeDisplay}>
                    Change: <strong style={{ color: 'var(--brand-success)' }}>{fmt(change)}</strong>
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            className={`btn btn-primary ${styles.placeOrderBtn}`}
            disabled={!items.length || submitting || (paymentMethod === 'cash' && parseFloat(amountPaid) < total)}
            onClick={handleSubmitOrder}
          >
            {submitting ? <><span className="animate-spin">⟳</span> Processing...</> : `Place Order • ${fmt(total)}`}
          </button>
        </div>
      </div>
    </div>
  );
}