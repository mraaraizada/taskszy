export default function StatCard({ icon: Icon, iconBg, title, value, sub, change, changeType, delay = 0, featured = false, compact = false }) {
  const isUp = changeType === 'up';

  return (
    <div
      className="card animate-fade-slide flex flex-col justify-between"
      style={{
        padding: compact ? '14px 16px' : '20px 22px',
        animationDelay: `${delay}ms`,
        background: featured ? 'linear-gradient(135deg, #3B5BFC 0%, #2142D9 100%)' : 'var(--bg-surface)',
      }}
    >
      <div className="flex items-start justify-between" style={{ marginBottom: compact ? 8 : 12 }}>
        <div
          className="flex items-center justify-center rounded-xl"
          style={{
            width: compact ? 32 : 40,
            height: compact ? 32 : 40,
            background: featured ? 'rgba(255,255,255,0.18)' : (iconBg || '#EEF2FF'),
            flexShrink: 0,
          }}
        >
          <Icon size={compact ? 14 : 18} color={featured ? '#fff' : '#3B5BFC'} strokeWidth={2} />
        </div>
        {change && (
          <span
            style={featured
              ? { background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 20 }
              : isUp
                ? { background: '#E8FBF1', color: '#12C479', fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 20 }
                : { background: '#FFF1F1', color: '#FF4D4F', fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 20 }
            }
          >
            {isUp ? '+' : ''}{change}
          </span>
        )}
      </div>

      <div>
        <p
          className="animate-count"
          style={{
            fontSize: compact ? 20 : 26,
            fontWeight: 800,
            color: featured ? '#fff' : 'var(--text-primary)',
            letterSpacing: '-0.5px',
            lineHeight: 1,
            marginBottom: 3,
          }}
        >
          {value}
        </p>
        <p style={{ fontSize: compact ? 11 : 13, fontWeight: 600, color: featured ? 'rgba(255,255,255,0.85)' : 'var(--text-primary)', marginBottom: 1 }}>
          {title}
        </p>
        {sub && (
          <p style={{ fontSize: 10, color: featured ? 'rgba(255,255,255,0.6)' : 'var(--text-muted)' }}>
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}
