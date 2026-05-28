import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart2 } from 'lucide-react';
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

export default function TaskCompletionChart({ selectedCategory = null, selectedTags = null, dateFrom = null, dateTo = null }) {
  const { tasks } = useApp();

  const now = new Date();
  
  // Generate real data from actual tasks - filter by selected category or tags AND date range
  const generateRealData = () => {
    const months = [];
    
    // Determine date range
    let startDate, endDate;
    if (dateFrom && dateTo) {
      startDate = new Date(dateFrom);
      endDate = new Date(dateTo);
    } else {
      // Default: last 7 months
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 6);
      endDate = now;
    }
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setMonth(now.getMonth() - i);
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
      
      // Skip months outside the date range
      if (dateFrom && dateTo) {
        if (monthEnd < startDate || monthStart > endDate) {
          continue;
        }
      }
      
      // Filter tasks that exist in this month
      // Include all tasks that were created before or during this month
      let monthTasks = tasks.filter((t) => {
        const createdDate = t.createdDate ? new Date(t.createdDate) : null;
        const deadline = t.deadline ? new Date(t.deadline) : null;
        
        // Include task if:
        // 1. It was created before or during this month, OR
        // 2. It has a deadline in this month
        if (createdDate && createdDate <= monthEnd) return true;
        if (deadline && deadline >= monthStart && deadline <= monthEnd) return true;
        
        return false;
      });
      
      // Apply category filter if selected
      if (selectedCategory) {
        monthTasks = monthTasks.filter((t) => t.category?.label === selectedCategory);
      }
      // Apply tags filter if selected
      else if (selectedTags && selectedTags.length > 0) {
        monthTasks = monthTasks.filter((t) => 
          (t.tags || []).some((tag) => selectedTags.includes(tag.label))
        );
      }
      
      // Calculate task statuses
      const completed = monthTasks.filter((t) => t.stage === 'Complete').length;
      
      const overdue = monthTasks.filter((t) => {
        if (t.stage === 'Complete') return false;
        const deadline = t.deadline ? new Date(t.deadline) : null;
        // Task is overdue if deadline passed and not completed
        return deadline && deadline < now;
      }).length;
      
      const onHold = monthTasks.filter((t) => {
        if (t.stage === 'Complete') return false;
        return t.isPaused === true;
      }).length;
      
      const active = monthTasks.filter((t) => {
        if (t.stage === 'Complete') return false;
        if (t.isPaused === true) return false;
        const deadline = t.deadline ? new Date(t.deadline) : null;
        // Task is active if not completed, not paused, and either no deadline or deadline hasn't passed
        return !deadline || deadline >= now;
      }).length;
      
      months.push({
        month: MONTHS[d.getMonth()],
        total: monthTasks.length,
        completed,
        overdue,
        onHold,
        active,
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
        </div>
      </div>

      {tasks.length === 0 ? (
        <div style={{ height: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BarChart2 size={20} color="var(--text-muted)" strokeWidth={1.5} />
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>No task data yet</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Create tasks to see monthly completion trends</div>
        </div>
      ) : (
      <ResponsiveContainer width="100%" height={200} minWidth={0} minHeight={200}>
        <BarChart data={data} barCategoryGap="20%" barGap={8}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />
          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} allowDecimals={false} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59,91,252,0.05)', radius: 4 }} />
          <Bar dataKey="completed" name="Completed" fill="#12C479" radius={[0, 0, 0, 0]} stackId="a" barSize={50} />
          <Bar dataKey="overdue" name="Overdue" fill="#EF4444" radius={[0, 0, 0, 0]} stackId="a" barSize={50} />
          <Bar dataKey="onHold" name="On Hold" fill="#F97316" radius={[0, 0, 0, 0]} stackId="a" barSize={50} />
          <Bar dataKey="active" name="Active" fill="#7C3AED" radius={[5, 5, 0, 0]} stackId="a" barSize={50} />
        </BarChart>
      </ResponsiveContainer>
      )}
    </div>
  );
}
