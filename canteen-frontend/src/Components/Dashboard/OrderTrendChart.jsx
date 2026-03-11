import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const TOOLTIP_STYLE = {
  background: 'var(--surface-2)',
  border: '1px solid var(--border-default)',
  borderRadius: '8px',
  padding: '10px 14px',
  fontSize: '13px',
  color: 'var(--text-primary)',
};

export default function OrderTrendChart({ data = [] }) {
  return (
    <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '20px' }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>Order Volume (Last 30 Days)</h3>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={{ stroke: 'var(--border-subtle)' }} tickLine={false} tickFormatter={d => d.slice(5)} />
          <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Line type="monotone" dataKey="orders" stroke="var(--brand-success)" strokeWidth={2} dot={false} activeDot={{ r: 5, fill: 'var(--brand-success)' }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}