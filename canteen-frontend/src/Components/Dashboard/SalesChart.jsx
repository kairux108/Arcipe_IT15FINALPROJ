import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const TOOLTIP_STYLE = {
  background: 'var(--surface-2)',
  border: '1px solid var(--border-default)',
  borderRadius: 10,
  padding: '10px 14px',
  fontSize: 13,
  color: 'var(--text-primary)',
};

export default function SalesChart({ data = [], period, onPeriodChange }) {
  const fmt = (v) => `₱${(v / 1000).toFixed(0)}k`;

  return (
    <div
      className="rounded-3 p-4 h-100"
      style={{ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)' }}
    >
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
        <h3 className="mb-0 fw-bold" style={{ fontSize: 15, color: 'var(--text-primary)' }}>
          Revenue Overview
        </h3>
        <div
          className="d-flex rounded-3 p-1 gap-1"
          style={{ background: 'var(--surface-2)' }}
        >
          {['daily', 'weekly', 'monthly'].map(p => (
            <button
              key={p}
              className="btn btn-sm"
              onClick={() => onPeriodChange(p)}
              style={{
                padding: '4px 12px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                background: period === p ? '#FF6B35' : 'transparent',
                color: period === p ? 'white' : 'var(--text-muted)',
                border: 'none',
                transition: 'all 0.15s ease',
                textTransform: 'capitalize',
              }}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
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
            tickFormatter={fmt}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={(v) => [`₱${parseFloat(v).toLocaleString()}`, 'Revenue']}
          />
          <Bar dataKey="revenue" fill="#FF6B35" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}