import { TrendingUp } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function CustomerGrowth({ selectedCategory = null, selectedTags = null, dateFrom = '', dateTo = '' }) {
  const { tasks } = useApp();

  // Filter tasks based on selected category, tags, and date range
  const filteredTasks = tasks.filter(t => {
    // Category filter - handle both single value and array
    if (selectedCategory) {
      const categories = Array.isArray(selectedCategory) ? selectedCategory : [selectedCategory];
      if (categories.length > 0 && !categories.includes(t.category?.label)) {
        return false;
      }
    }
    
    // Tags filter
    if (selectedTags && selectedTags.length > 0) {
      const hasMatchingTag = (t.tags || []).some(tag => selectedTags.includes(tag.label));
      if (!hasMatchingTag) return false;
    }
    
    // Date range filter
    if (dateFrom && dateTo) {
      const taskDate = t.createdDate ? new Date(t.createdDate) : new Date(t.deadline);
      const fromDate = new Date(dateFrom);
      const toDate = new Date(dateTo);
      if (taskDate < fromDate || taskDate > toDate) return false;
    }
    
    return true;
  });

  // Always show by tag, not affected by view by option
  const tagMap = {};
  filteredTasks.forEach(t => {
    if (t.tags && t.tags.length > 0) {
      t.tags.forEach(tag => {
        if (!tagMap[tag.label]) tagMap[tag.label] = { name: tag.label, count: 0, color: tag.color };
        tagMap[tag.label].count++;
      });
    }
  });

  // Use real data from tasks - only top 5
  const items = Object.values(tagMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
    
  const max = Math.max(...items.map(i => i.count), 1);
  const total = items.reduce((s, i) => s + i.count, 0);

  return (
    <div className="card animate-fade-slide" style={{ padding: '22px 24px', border: '1.5px solid var(--border)' }}>

      {/* Header */}
      <div style={{ marginBottom: 18 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Task Growth</h2>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Tags by task count</p>
      </div>

      {/* Bubble row */}
      {items.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 0', gap: 8 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingUp size={20} color="var(--text-muted)" strokeWidth={1.5} />
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>No data yet</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>Add tags or categories to tasks to see growth</div>
        </div>
      ) : (
      <>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 10, marginBottom: 20, height: 90 }}>
        {items.map(item => {
          const size = Math.round(32 + (item.count / max) * 52);
          return (
            <div key={item.name} title={`${item.name}: ${item.count}`} style={{
              width: size, height: size, borderRadius: '50%',
              background: item.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              boxShadow: `0 4px 14px ${item.color}44`,
              transition: 'transform 0.2s',
              cursor: 'default',
            }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <span style={{ color: '#fff', fontSize: size > 56 ? 13 : 11, fontWeight: 700 }}>{item.count}</span>
            </div>
          );
        })}
      </div>

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {items.map(item => (
          <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', flex: 1 }}>{item.name}</span>
            <div style={{ width: 70, height: 4, background: 'var(--input-bg)', borderRadius: 4, overflow: 'hidden', flexShrink: 0 }}>
              <div style={{ width: `${(item.count / max) * 100}%`, height: '100%', background: item.color, borderRadius: 4, transition: 'width 1s ease' }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', minWidth: 18, textAlign: 'right' }}>{item.count}</span>
          </div>
        ))}
      </div>
      </>
      )}

    </div>
  );
}
