import { useState, useEffect } from 'react';
import { orderService } from '../../Services/orderService';
import LoadingSpinner from '../Common/LoadingSpinner';
import styles from './MyOrders.module.css';

const STATUS_CONFIG = {
  pending:   { label: 'Pending',   cls: 'badge-warning', icon: '⏳' },
  preparing: { label: 'Preparing', cls: 'badge-info',    icon: '👨‍🍳' },
  ready:     { label: 'Ready',     cls: 'badge-success', icon: '✅' },
  completed: { label: 'Completed', cls: 'badge-default', icon: '✓'  },
  cancelled: { label: 'Cancelled', cls: 'badge-danger',  icon: '✕'  },
};

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadOrders = async () => {
    try {
      const data = await orderService.getMyOrders({ per_page: 50 });
      setOrders(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n) => `₱${parseFloat(n || 0).toFixed(2)}`;

  const active = orders.filter(o => ['pending', 'preparing', 'ready'].includes(o.status));
  const past = orders.filter(o => ['completed', 'cancelled'].includes(o.status));

  const OrderCard = ({ order }) => {
    const status = STATUS_CONFIG[order.status];
    const isExpanded = expanded === order.id;

    return (
      <div className={`${styles.orderCard} ${styles[order.status]}`}>
        <div className={styles.cardTop} onClick={() => setExpanded(isExpanded ? null : order.id)}>
          <div className={styles.cardLeft}>
            <div className={styles.statusIcon}>{status.icon}</div>
            <div>
              <div className={styles.orderNum}>{order.order_number}</div>
              <div className={styles.orderDate}>
                {new Date(order.created_at).toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric', year: 'numeric',
                  hour: '2-digit', minute: '2-digit'
                })}
              </div>
            </div>
          </div>
          <div className={styles.cardRight}>
            <span className={`badge ${status.cls}`}>{status.label}</span>
            <div className={styles.orderTotal}>{fmt(order.total)}</div>
            <span className={styles.chevron}>{isExpanded ? '▲' : '▼'}</span>
          </div>
        </div>

        {isExpanded && (
          <div className={styles.cardDetails}>
            <div className={styles.itemsList}>
              {order.items?.map(item => (
                <div key={item.id} className={styles.orderItem}>
                  <span className={styles.itemQty}>{item.quantity}×</span>
                  <span className={styles.itemName}>{item.item_name}</span>
                  <span className={styles.itemPrice}>{fmt(item.subtotal)}</span>
                </div>
              ))}
            </div>
            <div className={styles.detailTotals}>
              <div className={styles.detailRow}><span>Subtotal</span><span>{fmt(order.subtotal)}</span></div>
              <div className={styles.detailRow}><span>VAT (12%)</span><span>{fmt(order.tax)}</span></div>
              <div className={`${styles.detailRow} ${styles.detailTotal}`}><span>TOTAL</span><span>{fmt(order.total)}</span></div>
              <div className={styles.detailRow}><span>Payment</span><span style={{ textTransform: 'capitalize' }}>{order.payment_method?.replace('_', ' ')}</span></div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <LoadingSpinner size="lg" />
    </div>
  );

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>My Orders</h2>
          <p className={styles.pageSub}>Track your current and past orders</p>
        </div>
        <button className="btn btn-secondary" onClick={loadOrders}>↻ Refresh</button>
      </div>

      {orders.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>📋</div>
          <h3>No orders yet</h3>
          <p>Your orders will appear here once you place one.</p>
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionDot} style={{ background: 'var(--brand-success)' }} />
                <h3>Active Orders</h3>
                <span className={styles.sectionCount}>{active.length}</span>
              </div>
              <div className={styles.ordersList}>
                {active.map(o => <OrderCard key={o.id} order={o} />)}
              </div>
            </div>
          )}

          {past.length > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionDot} style={{ background: 'var(--text-muted)' }} />
                <h3>Order History</h3>
                <span className={styles.sectionCount}>{past.length}</span>
              </div>
              <div className={styles.ordersList}>
                {past.map(o => <OrderCard key={o.id} order={o} />)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}