import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useApp } from '../context/AppContext';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', borderRadius: 10, padding: '10px 14px', boxShadow: '0 4px 16px rgba(0,0,0,0.12)', border: '1px solid #E5E7EB' }}>
      <p style={{ color: '#9CA3AF', fontSize: 11, marginBottom: 6 }}>{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color, fontSize: 12, fontWeight: 600, marginBottom: 2 }}>
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
};

export default function TaskCompletionChart({ groupBy = 'tag' }) {
  const { tasks } = useApp();

  const now = new Date();
  
  // Generate real data from actual tasks
  const generateRealData = () => {
    const months = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setMonth(now.getMonth() - i);
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      
      const monthTasks = tasks.filter(t => {
        const createdDate = new Date(t.createdDate || t.deadline);
        return createdDate >= monthStart && createdDate <= monthEnd;
      });
      
      months.push({
        month: MONTHS[d.getMonth()],
        total: monthTasks.length,
        completed: monthTasks.filter(t => t.stage === 'Complete').length,
        overdue: monthTasks.filter(t => new Date(t.deadline) < now && t.stage !== 'Complete').length,
        onHold: monthTasks.filter(t => t.isPaused).length || 0,
        active: monthTasks.filter(t => t.stage !== 'Complete' && t.stage !== 'New' && !t.isPaused).length,
        archive: 0, // Can be calculated from trashedItems if needed
      });
    }
    return months;
  };

  const data = generateRealData();

  return (
    <div className="card animate-fade-slide" style={{ padding: '22px 24px', animationDelay: '200ms', border: '1.5px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
            Task Completion
          </h2>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Monthly task status breakdown</p>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#12C479', display: 'inline-block' }} />
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Completed</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444', display: 'inline-block' }} />
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Overdue</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#F97316', display: 'inline-block' }} />
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>On Hold</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#7C3AED', display: 'inline-block' }} />
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Active</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#6B7280', display: 'inline-block' }} />
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Archive</span>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200} minWidth={0} minHeight={200}>
        <BarChart data={data} barCategoryGap="20%" barGap={8}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />
          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} allowDecimals={false} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59,91,252,0.05)', radius: 4 }} />
          <Bar dataKey="completed" name="Completed" fill="#12C479" radius={[0, 0, 0, 0]} stackId="a" barSize={50} />
          <Bar dataKey="overdue" name="Overdue" fill="#EF4444" radius={[0, 0, 0, 0]} stackId="a" barSize={50} />
          <Bar dataKey="onHold" name="On Hold" fill="#F97316" radius={[0, 0, 0, 0]} stackId="a" barSize={50} />
          <Bar dataKey="active" name="Active" fill="#7C3AED" radius={[0, 0, 0, 0]} stackId="a" barSize={50} />
          <Bar dataKey="archive" name="Archive" fill="#6B7280" radius={[5, 5, 0, 0]} stackId="a" barSize={50} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
