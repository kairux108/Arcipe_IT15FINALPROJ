import { useState, useEffect } from 'react';
import { reportService, inventoryService } from '../../Services/orderService';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import LoadingSpinner from '../Common/LoadingSpinner';
import styles from './AdminDashboard.module.css';

const CATEGORY_COLORS = ['#FF6B35', '#FFD166', '#06D6A0', '#118AB2', '#8B5CF6'];

const CUSTOM_TOOLTIP_STYLE = {
  background: 'var(--surface-2)',
  border: '1px solid var(--border-default)',
  borderRadius: '8px',
  padding: '10px 14px',
  fontSize: '13px',
  color: 'var(--text-primary)',
};

function StatCard({ title, value, sub, icon, color = 'primary' }) {
  const colorMap = {
    primary: 'var(--brand-primary)',
    success: 'var(--brand-success)',
    info: 'var(--brand-info)',
    warning: 'var(--brand-warning)',
  };
  return (
    <div className={styles.statCard}>
      <div className={styles.statIcon} style={{ background: `${colorMap[color]}20`, color: colorMap[color] }}>
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

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [salesData, catData, trendsResp, lowStockResp] = await Promise.all([
        reportService.getSalesSummary({ period, date_from: getDateFrom(30), date_to: today() }),
        reportService.getSalesByCategory({ date_from: getDateFrom(30), date_to: today() }),
        reportService.getOrderTrends({ days: 30 }),
        inventoryService.getLowStockAlerts(),
      ]);

      setSummary(salesData.summary);
      setRevenueData(salesData.revenue_by_period.map(d => ({
        period: d.period_label,
        revenue: parseFloat(d.revenue),
        orders: d.order_count,
      })));
      setCategoryData(catData.map(d => ({
        name: d.category_name,
        value: parseFloat(d.total_revenue),
      })));
      setTrendsData(trendsResp.map(d => ({
        date: d.date,
        orders: d.order_count,
        revenue: parseFloat(d.revenue),
      })));
      setLowStock(lowStockResp.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const today = () => new Date().toISOString().split('T')[0];
  const getDateFrom = (days) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().split('T')[0];
  };

  const fmt = (n) => `₱${parseFloat(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;

  if (loading) return (
    <div className={styles.loadingWrap}><LoadingSpinner size="lg" /></div>
  );

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
        {/* Revenue Bar Chart */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3>Revenue Overview</h3>
            <div className={styles.periodTabs}>
              {['daily', 'weekly', 'monthly'].map(p => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`${styles.periodTab} ${period === p ? styles.active : ''}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={revenueData} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis
                dataKey="period"
                tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                axisLine={{ stroke: 'var(--border-subtle)' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={v => `₱${(v/1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={CUSTOM_TOOLTIP_STYLE}
                formatter={(v) => [fmt(v), 'Revenue']}
              />
              <Bar dataKey="revenue" fill="var(--brand-primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category Pie Chart */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3>Sales by Category</h3>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {categoryData.map((_, i) => (
                  <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={CUSTOM_TOOLTIP_STYLE}
                formatter={(v) => [fmt(v), 'Revenue']}
              />
              <Legend
                formatter={(v) => <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{v}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Order Trend Line Chart */}
      <div className={styles.chartCardFull}>
        <div className={styles.chartHeader}>
          <h3>Order Volume (Last 30 Days)</h3>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={trendsData} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis
              dataKey="date"
              tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
              axisLine={{ stroke: 'var(--border-subtle)' }}
              tickLine={false}
              tickFormatter={d => d.slice(5)}
            />
            <YAxis
              tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip contentStyle={CUSTOM_TOOLTIP_STYLE} />
            <Line
              type="monotone"
              dataKey="orders"
              stroke="var(--brand-success)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5, fill: 'var(--brand-success)' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

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
                  <span className={`badge badge-danger`}>{item.stock_quantity} left</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}