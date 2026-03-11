import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#FF6B35', '#FFD166', '#06D6A0', '#118AB2', '#8B5CF6'];

const TOOLTIP_STYLE = {
  background: 'var(--surface-2)',
  border: '1px solid var(--border-default)',
  borderRadius: '8px',
  padding: '10px 14px',
  fontSize: '13px',
  color: 'var(--text-primary)',
};

export default function CategoryPieChart({ data = [] }) {
  return (
    <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '20px' }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>Sales by Category</h3>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={80}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={(v) => [`₱${parseFloat(v).toLocaleString()}`, 'Revenue']}
          />
          <Legend
            formatter={(v) => (
              <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{v}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}