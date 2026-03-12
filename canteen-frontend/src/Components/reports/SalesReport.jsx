import { useState, useEffect } from 'react';
import { reportService } from '../../Services/orderService';
import LoadingSpinner from '../Common/LoadingSpinner';
import SalesChart from '../Dashboard/SalesChart';
import CategoryPieChart from '../Dashboard/CategoryPieChart';

const tableOverride = `
  .sr-input { background: var(--surface-2) !important; border: 1px solid var(--border-subtle) !important; color: var(--text-primary) !important; border-radius: 10px !important; font-size: 13px; padding: 8px 12px; }
  .sr-input:focus { background: var(--surface-2) !important; color: var(--text-primary) !important; border-color: #FF6B35 !important; box-shadow: 0 0 0 3px rgba(255,107,53,0.15) !important; }
  .sr-input option { background: var(--surface-2) !important; color: var(--text-primary) !important; }
  .sr-table { color: var(--text-primary) !important; }
  .sr-table td, .sr-table th { color: var(--text-primary) !important; border-color: var(--border-subtle) !important; background: transparent !important; padding: 10px 12px; }
  .sr-table thead th { background: var(--surface-2) !important; color: var(--text-muted) !important; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; }
  .sr-table tbody tr { border-color: var(--border-subtle) !important; }
  .sr-table tbody tr:hover td { background: var(--surface-2) !important; }
`;

export default function SalesReport() {
  const [summary, setSummary]   = useState(null);
  const [revenue, setRevenue]   = useState([]);
  const [category, setCategory] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [period, setPeriod]     = useState('daily');
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);

  useEffect(() => { load(); }, [period, dateFrom, dateTo]);

  const load = async () => {
    setLoading(true);
    try {
      const [salesData, catData, topData] = await Promise.all([
        reportService.getSalesSummary({ period, date_from: dateFrom, date_to: dateTo }),
        reportService.getSalesByCategory({ date_from: dateFrom, date_to: dateTo }),
        reportService.getTopItems({ date_from: dateFrom, date_to: dateTo, limit: 10 }),
      ]);
      setSummary(salesData.summary);
      setRevenue(salesData.revenue_by_period.map(d => ({
        period: d.period_label,
        revenue: parseFloat(d.revenue),
        orders: d.order_count,
      })));
      setCategory(catData.map(d => ({ name: d.category_name, value: parseFloat(d.total_revenue) })));
      setTopItems(topData);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fmt = (n) => `₱${parseFloat(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;

  const statCards = [
    { label: 'Total Revenue',    value: fmt(summary?.total_revenue),            icon: '💰', color: '#FF6B35' },
    { label: 'Total Orders',     value: parseInt(summary?.total_orders || 0),    icon: '📋', color: '#118AB2' },
    { label: 'Avg Order Value',  value: fmt(summary?.average_order_value),       icon: '📊', color: '#06D6A0' },
    { label: 'Total Items Sold', value: parseInt(summary?.total_items_sold || 0), icon: '🍽️', color: '#FFD166' },
  ];

  return (
    <>
      <style>{tableOverride}</style>

      <div className="d-flex flex-column gap-4" style={{ animation: 'fadeIn 0.3s ease' }}>

        {/* Header */}
        <div className="d-flex align-items-start justify-content-between gap-3 flex-wrap">
          <div>
            <h2 className="fw-bold mb-1" style={{ fontSize: 20, color: 'var(--text-primary)' }}>Sales Reports</h2>
            <p className="mb-0" style={{ fontSize: 13, color: 'var(--text-muted)' }}>Revenue and performance analytics</p>
          </div>
          <button
            className="btn fw-semibold"
            onClick={() => reportService.exportCsv({ date_from: dateFrom, date_to: dateTo })}
            style={{
              background: 'rgba(6,214,160,0.1)',
              border: '1px solid rgba(6,214,160,0.3)',
              color: '#06D6A0',
              borderRadius: 10,
              fontSize: 13,
              padding: '8px 16px',
            }}
          >
            ⬇️ Export CSV
          </button>
        </div>

        {/* Filters */}
        <div
          className="rounded-3 p-3 d-flex gap-3 flex-wrap align-items-end"
          style={{ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)' }}
        >
          {[
            { label: 'From', type: 'date', value: dateFrom, onChange: setDateFrom },
            { label: 'To',   type: 'date', value: dateTo,   onChange: setDateTo },
          ].map(f => (
            <div key={f.label}>
              <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                {f.label}
              </label>
              <input type={f.type} className="form-control sr-input" value={f.value} onChange={e => f.onChange(e.target.value)} />
            </div>
          ))}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
              Period
            </label>
            <select className="form-select sr-input" value={period} onChange={e => setPeriod(e.target.value)}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="d-flex justify-content-center py-5"><LoadingSpinner /></div>
        ) : (
          <>
            {/* Stat Cards */}
            <div className="row g-3">
              {statCards.map(card => (
                <div key={card.label} className="col-6 col-xl-3">
                  <div
                    className="rounded-3 p-4"
                    style={{ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)' }}
                  >
                    <div style={{ fontSize: 24, marginBottom: 8 }}>{card.icon}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 4 }}>
                      {card.label}
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: card.color, fontFamily: 'var(--font-display)' }}>
                      {card.value}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Charts */}
            <div className="row g-3">
              <div className="col-12 col-xl-8">
                <SalesChart data={revenue} period={period} onPeriodChange={setPeriod} />
              </div>
              <div className="col-12 col-xl-4">
                <CategoryPieChart data={category} />
              </div>
            </div>

            {/* Top Items Table */}
            <div
              className="rounded-3 p-4"
              style={{ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)' }}
            >
              <h3 className="fw-bold mb-4" style={{ fontSize: 15, color: 'var(--text-primary)' }}>
                🏆 Top Selling Items
              </h3>
              <div className="table-responsive">
                <table className="table mb-0 sr-table">
                  <thead>
                    <tr>
                      {['#', 'Item', 'Category', 'Qty Sold', 'Revenue'].map(h => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {topItems.map((item, i) => (
                      <tr key={item.menu_item_id}>
                        <td>
                          <span style={{ fontSize: 13, color: i < 3 ? '#FFD166' : 'var(--text-muted)', fontWeight: 700 }}>
                            {i < 3 ? ['🥇', '🥈', '🥉'][i] : `#${i + 1}`}
                          </span>
                        </td>
                        <td>
                          <span className="fw-semibold" style={{ fontSize: 13 }}>{item.name}</span>
                        </td>
                        <td>
                          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.category_name}</span>
                        </td>
                        <td>
                          <span
                            className="badge rounded-pill"
                            style={{ background: 'rgba(17,138,178,0.12)', color: '#118AB2', fontSize: 11 }}
                          >
                            {item.total_quantity} sold
                          </span>
                        </td>
                        <td>
                          <span className="fw-bold" style={{ fontSize: 13, color: '#FF6B35' }}>{fmt(item.total_revenue)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}