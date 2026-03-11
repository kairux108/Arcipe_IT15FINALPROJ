import { useState, useEffect } from 'react';
import { reportService, inventoryService } from '../../Services/orderService';
import LoadingSpinner from '../Common/LoadingSpinner';
import SalesChart from './SalesChart';
import CategoryPieChart from './CategoryPieChart';
import OrderTrendChart from './OrderTrendChart';
import styles from './AdminDashboard.module.css';

function StatCard({ title, value, sub, icon, color = 'primary' }) {
  const colorMap = {
    primary: 'var(--brand-primary)',
    success: 'var(--brand-success)',
    info: 'var(--brand-info)',
    warning: 'var(--brand-warning)',
  };

  return (
    <div className={styles.statCard}>
      <div
        className={styles.statIcon}
        style={{
          background: `${colorMap[color]}20`,
          color: colorMap[color],
        }}
      >
        {icon}
      </div>
      <div className={styles.statContent}>
        <div className={styles.statTitle}>{title}</div>
        <div className={styles.statValue}>{value}</div>
        {sub && <div className={styles.statSub}>{sub}</div>}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [summary, setSummary] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [trendsData, setTrendsData] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('daily');

  useEffect(() => {
    loadDashboard();
  }, [period]);

  const today = () => new Date().toISOString().split('T')[0];

  const getDateFrom = (days) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().split('T')[0];
  };

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [salesData, catData, trendsResp, lowStockResp] = await Promise.all([
        reportService.getSalesSummary({
          period,
          date_from: getDateFrom(30),
          date_to: today(),
        }),
        reportService.getSalesByCategory({
          date_from: getDateFrom(30),
          date_to: today(),
        }),
        reportService.getOrderTrends({ days: 30 }),
        inventoryService.getLowStockAlerts(),
      ]);

      setSummary(salesData.summary);

      setRevenueData(
        salesData.revenue_by_period.map(d => ({
          period: d.period_label,
          revenue: parseFloat(d.revenue),
          orders: d.order_count,
        }))
      );

      setCategoryData(
        catData.map(d => ({
          name: d.category_name,
          value: parseFloat(d.total_revenue),
        }))
      );

      setTrendsData(
        trendsResp.map(d => ({
          date: d.date,
          orders: d.order_count,
          revenue: parseFloat(d.revenue),
        }))
      );

      setLowStock(lowStockResp.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n) =>
    `₱${parseFloat(n || 0).toLocaleString('en-PH', {
      minimumFractionDigits: 2,
    })}`;

  if (loading) {
    return (
      <div className={styles.loadingWrap}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>

      {/* Stats Row */}
      <div className={styles.statsGrid}>
        <StatCard
          title="Total Revenue"
          value={fmt(summary?.total_revenue)}
          sub="Last 30 days"
          icon="💰"
          color="primary"
        />
        <StatCard
          title="Total Orders"
          value={parseInt(summary?.total_orders || 0).toLocaleString()}
          sub="Completed orders"
          icon="📋"
          color="success"
        />
        <StatCard
          title="Avg Order Value"
          value={fmt(summary?.average_order_value)}
          sub="Per transaction"
          icon="📊"
          color="info"
        />
        <StatCard
          title="Low Stock Items"
          value={lowStock.length}
          sub="Needs restocking"
          icon="⚠️"
          color="warning"
        />
      </div>

      {/* Charts Row */}
      <div className={styles.chartsRow}>
        <SalesChart
          data={revenueData}
          period={period}
          onPeriodChange={setPeriod}
        />
        <CategoryPieChart data={categoryData} />
      </div>

      {/* Order Trend */}
      <OrderTrendChart data={trendsData} />

      {/* Low Stock Alert */}
      {lowStock.length > 0 && (
        <div className={styles.alertCard}>
          <div className={styles.alertHeader}>
            <span>⚠️</span>
            <h3>Low Stock Alerts ({lowStock.length} items)</h3>
          </div>
          <div className={styles.alertGrid}>
            {lowStock.slice(0, 6).map(item => (
              <div key={item.id} className={styles.alertItem}>
                <div className={styles.alertItemName}>{item.name}</div>
                <div className={styles.alertStock}>
                  <span className="badge badge-danger">
                    {item.stock_quantity} left
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}