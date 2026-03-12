import { useState, useEffect } from 'react';
import { reportService, inventoryService } from '../../Services/orderService';
import LoadingSpinner from '../Common/LoadingSpinner';
import SalesChart from './SalesChart';
import CategoryPieChart from './CategoryPieChart';
import OrderTrendChart from './OrderTrendChart';

function StatCard({ title, value, sub, icon, color }) {
  const colors = {
    primary: { bg: 'rgba(255,107,53,0.12)',  color: '#FF6B35' },
    success: { bg: 'rgba(6,214,160,0.12)',   color: '#06D6A0' },
    info:    { bg: 'rgba(17,138,178,0.12)',  color: '#118AB2' },
    warning: { bg: 'rgba(255,209,102,0.12)', color: '#FFD166' },
  };
  const c = colors[color] || colors.primary;

  return (
    <div
      className="rounded-3 p-4 h-100"
      style={{ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)' }}
    >
      <div className="d-flex align-items-center gap-3">
        <div
          className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
          style={{ width: 48, height: 48, background: c.bg, fontSize: 22 }}
        >
          {icon}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--text-muted)',
            marginBottom: 4,
          }}>
            {title}
          </div>
          {/* ✅ FIX: clamp so long values like ₱31,208.80 never overflow */}
          <div style={{
            fontSize: 'clamp(15px, 1.6vw, 26px)',
            fontWeight: 800,
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-display)',
            lineHeight: 1.1,
            marginBottom: 4,
            wordBreak: 'break-word',
            overflow: 'hidden',
          }}>
            {value}
          </div>
          {sub && (
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{sub}</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [summary, setSummary]         = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [trendsData, setTrendsData]   = useState([]);
  const [lowStock, setLowStock]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [period, setPeriod]           = useState('daily');

  useEffect(() => { loadDashboard(); }, [period]);

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

  const fmt = (n) => `₱${parseFloat(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
      <LoadingSpinner size="lg" />
    </div>
  );

  return (
    <div className="d-flex flex-column gap-4" style={{ animation: 'fadeIn 0.3s ease' }}>

      {/* Stat Cards */}
      <div className="row g-3">
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard title="Total Revenue"    value={fmt(summary?.total_revenue)}                        sub="Last 30 days"      icon="💰" color="primary" />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard title="Total Orders"     value={parseInt(summary?.total_orders || 0).toLocaleString()} sub="Completed orders"  icon="📋" color="success" />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard title="Avg Order Value"  value={fmt(summary?.average_order_value)}                  sub="Per transaction"   icon="📊" color="info"    />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard title="Low Stock Items"  value={lowStock.length}                                    sub="Needs restocking"  icon="⚠️" color="warning" />
        </div>
      </div>

      {/* Charts Row */}
      <div className="row g-3">
        <div className="col-12 col-xl-8">
          <SalesChart data={revenueData} period={period} onPeriodChange={setPeriod} />
        </div>
        <div className="col-12 col-xl-4">
          <CategoryPieChart data={categoryData} />
        </div>
      </div>

      {/* Order Trend */}
      <OrderTrendChart data={trendsData} />

      {/* Low Stock Alert */}
      {lowStock.length > 0 && (
        <div
          className="rounded-3 p-4"
          style={{ background: 'rgba(255,209,102,0.06)', border: '1px solid rgba(255,209,102,0.25)' }}
        >
          <div className="d-flex align-items-center gap-2 mb-3">
            <span style={{ fontSize: 22 }}>⚠️</span>
            <h3 className="mb-0 fw-bold" style={{ fontSize: 15, color: '#FFD166' }}>
              Low Stock Alerts ({lowStock.length} items)
            </h3>
          </div>
          <div className="row g-2">
            {lowStock.slice(0, 6).map(item => (
              <div key={item.id} className="col-12 col-sm-6 col-md-4">
                <div
                  className="d-flex align-items-center justify-content-between rounded-3 px-3 py-2"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)' }}
                >
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                    {item.name}
                  </span>
                  <span
                    className="badge rounded-pill"
                    style={{ background: 'rgba(239,71,111,0.15)', color: '#EF476F', fontSize: 11 }}
                  >
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