import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const TOOLTIP_STYLE = {
  background: 'var(--surface-2)',
  border: '1px solid var(--border-default)',
  borderRadius: 10,
  padding: '10px 14px',
  fontSize: 13,
  color: 'var(--text-primary)',
};

export default function OrderTrendChart({ data = [] }) {
  return (
    <div
      className="rounded-3 p-4"
      style={{ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)' }}
    >
      <h3 className="fw-bold mb-4" style={{ fontSize: 15, color: 'var(--text-primary)' }}>
        Order Volume (Last 30 Days)
      </h3>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
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
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Line
            type="monotone"
            dataKey="orders"
            stroke="#06D6A0"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 5, fill: '#06D6A0' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}