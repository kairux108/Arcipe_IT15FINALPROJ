import { useState, useEffect } from 'react';
import { orderService } from '../../Services/orderService';
import LoadingSpinner from '../Common/LoadingSpinner';
import styles from './OrderQueue.module.css';

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: '#FFD166', next: 'preparing', nextLabel: 'Start Preparing' },
  preparing: { label: 'Preparing', color: '#118AB2', next: 'ready', nextLabel: 'Mark Ready' },
  ready: { label: 'Ready', color: '#06D6A0', next: 'completed', nextLabel: 'Complete Order' },
};

function OrderCard({ order, onStatusChange }) {
  const config = STATUS_CONFIG[order.status];
  const [updating, setUpdating] = useState(false);

  const handleNext = async () => {
    setUpdating(true);
    try {
      await onStatusChange(order.id, config.next);
    } finally {
      setUpdating(false);
    }
  };

  const elapsed = Math.floor((Date.now() - new Date(order.created_at).getTime()) / 60000);

  return (
    <div className={styles.orderCard} style={{ '--status-color': config.color }}>
      <div className={styles.cardHeader}>
        <div className={styles.orderNum}>{order.order_number}</div>
        <div className={styles.elapsed}>{elapsed}m ago</div>
      </div>

      <div className={styles.statusBar}>
        <div className={styles.statusDot} />
        <span className={styles.statusLabel}>{config.label}</span>
      </div>

      <div className={styles.itemsList}>
        {order.items?.map(item => (
          <div key={item.id} className={styles.orderItem}>
            <span className={styles.itemQty}>{item.quantity}x</span>
            <span className={styles.itemName}>{item.item_name}</span>
            {item.special_instructions && (
              <span className={styles.itemNote} title={item.special_instructions}>📝</span>
            )}
          </div>
        ))}
      </div>

      <div className={styles.cardFooter}>
        <div className={styles.total}>₱{parseFloat(order.total).toFixed(2)}</div>
        {config.next && (
          <button
            className={styles.nextBtn}
            onClick={handleNext}
            disabled={updating}
          >
            {updating ? '...' : config.nextLabel}
          </button>
        )}
      </div>
    </div>
  );
}

export default function OrderQueue() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQueue();
    const interval = setInterval(loadQueue, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const loadQueue = async () => {
    try {
      const data = await orderService.getQueue();
      setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    await orderService.updateStatus(orderId, newStatus);
    await loadQueue();
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><LoadingSpinner /></div>;

  const pending = orders.filter(o => o.status === 'pending');
  const preparing = orders.filter(o => o.status === 'preparing');
  const ready = orders.filter(o => o.status === 'ready');

  const Column = ({ title, color, items }) => (
    <div className={styles.column}>
      <div className={styles.columnHeader} style={{ '--col-color': color }}>
        <div className={styles.columnDot} />
        <span className={styles.columnTitle}>{title}</span>
        <span className={styles.columnCount}>{items.length}</span>
      </div>
      <div className={styles.columnItems}>
        {items.length === 0 ? (
          <div className={styles.emptyCol}>No orders</div>
        ) : (
          items.map(order => (
            <OrderCard key={order.id} order={order} onStatusChange={handleStatusChange} />
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className={styles.queue}>
      <div className={styles.header}>
        <h2>Live Order Queue</h2>
        <button className="btn btn-secondary" onClick={loadQueue}>↻ Refresh</button>
      </div>
      <div className={styles.columns}>
        <Column title="Pending" color="#FFD166" items={pending} />
        <Column title="Preparing" color="#118AB2" items={preparing} />
        <Column title="Ready for Pickup" color="#06D6A0" items={ready} />
      </div>
    </div>
  );
}