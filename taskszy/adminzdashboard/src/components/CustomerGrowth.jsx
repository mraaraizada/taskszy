import { useApp } from '../context/AppContext';

export default function CustomerGrowth({ groupBy = 'tag' }) {
  const { tasks } = useApp();

  const tagMap = {};
  tasks.forEach(t => {
    (t.tags || []).forEach(tag => {
      if (!tagMap[tag.label]) tagMap[tag.label] = { name: tag.label, count: 0, color: tag.color };
      tagMap[tag.label].count++;
    });
  });

  const catMap = {};
  tasks.forEach(t => {
    const cat = t.category?.label || 'Other';
    const color = t.category?.color || '#C7D4FF';
    if (!catMap[cat]) catMap[cat] = { name: cat, count: 0, color };
    catMap[cat].count++;
  });

  // Use real data from tasks
  const items = Object.values(groupBy === 'tag' ? tagMap : catMap).sort((a, b) => b.count - a.count);
    
  const max = Math.max(...items.map(i => i.count), 1);
  const total = items.reduce((s, i) => s + i.count, 0);

  return (
    <div className="card animate-fade-slide" style={{ padding: '22px 24px', border: '1.5px solid var(--border)' }}>

      {/* Header */}
      <div style={{ marginBottom: 18 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Task Growth</h2>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{groupBy === 'tag' ? 'Tags' : 'Categories'} by task count</p>
      </div>

      {/* Bubble row */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 10, marginBottom: 20, height: 90 }}>
        {items.slice(0, 5).map(item => {
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
        {items.slice(0, 5).map(item => (
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

    </div>
  );
}
