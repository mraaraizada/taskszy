export default function StatCard({ icon: Icon, iconBg, title, value, sub, change, changeType, delay = 0, featured = false, compact = false }) {
  const isUp = changeType === 'up';

  return (
    <div
      className="card animate-fade-slide"
      style={{
        padding: compact ? '18px 20px' : '24px 26px',
        animationDelay: `${delay}ms`,
        background: featured 
          ? 'linear-gradient(135deg, #3B5BFC 0%, #2142D9 100%)' 
          : 'var(--bg-surface)',
        display: 'flex',
        alignItems: 'center',
        gap: compact ? '16px' : '20px',
        minHeight: compact ? '90px' : '110px',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'pointer',
        boxShadow: featured 
          ? '0 4px 20px rgba(59, 91, 252, 0.25)' 
          : '0 2px 8px rgba(0, 0, 0, 0.04)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = featured 
          ? '0 12px 32px rgba(59, 91, 252, 0.35)' 
          : '0 8px 24px rgba(0, 0, 0, 0.08)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = featured 
          ? '0 4px 20px rgba(59, 91, 252, 0.25)' 
          : '0 2px 8px rgba(0, 0, 0, 0.04)';
      }}
    >
      {/* Background decoration */}
      {!featured && (
        <div style={{
          position: 'absolute',
          top: -20,
          right: -20,
          width: 100,
          height: 100,
          background: iconBg || '#EEF2FF',
          borderRadius: '50%',
          opacity: 0.3,
          filter: 'blur(40px)',
          pointerEvents: 'none',
        }} />
      )}

      {/* Left side: Icon with gradient border */}
      <div style={{ position: 'relative' }}>
        <div
          style={{
            width: compact ? 52 : 64,
            height: compact ? 52 : 64,
            background: featured 
              ? 'rgba(255, 255, 255, 0.15)' 
              : `linear-gradient(135deg, ${iconBg || '#EEF2FF'}, ${iconBg || '#E0E7FF'})`,
            borderRadius: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            position: 'relative',
            boxShadow: featured 
              ? '0 4px 16px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)' 
              : '0 4px 12px rgba(59, 91, 252, 0.08)',
            border: featured 
              ? '1px solid rgba(255, 255, 255, 0.2)' 
              : 'none',
          }}
        >
          <Icon 
            size={compact ? 22 : 28} 
            color={featured ? '#fff' : '#3B5BFC'} 
            strokeWidth={2.5} 
          />
        </div>
        {/* Pulse effect for featured cards */}
        {featured && (
          <div style={{
            position: 'absolute',
            inset: -4,
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: 18,
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            pointerEvents: 'none',
          }} />
        )}
      </div>

      {/* Right side: Content */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        gap: compact ? 4 : 6,
        minWidth: 0,
      }}>
        {/* Number and change badge */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'baseline', 
          justifyContent: 'space-between',
          gap: 8,
        }}>
          <p
            className="animate-count"
            style={{
              fontSize: compact ? 26 : 32,
              fontWeight: 700,
              color: featured ? '#fff' : 'var(--text-primary)',
              letterSpacing: 'normal',
              lineHeight: 1.2,
            }}
          >
            {value}
          </p>
          {change && (
            <span
              style={{
                background: featured
                  ? 'rgba(255, 255, 255, 0.2)'
                  : isUp
                    ? 'linear-gradient(135deg, #ECFDF5, #D1FAE5)'
                    : 'linear-gradient(135deg, #FEF2F2, #FEE2E2)',
                color: featured 
                  ? '#fff' 
                  : isUp 
                    ? '#059669' 
                    : '#DC2626',
                fontSize: 11,
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: 20,
                border: featured 
                  ? '1px solid rgba(255, 255, 255, 0.3)' 
                  : isUp 
                    ? '1px solid #A7F3D0' 
                    : '1px solid #FECACA',
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                whiteSpace: 'nowrap',
                boxShadow: isUp 
                  ? '0 2px 8px rgba(5, 150, 105, 0.15)' 
                  : '0 2px 8px rgba(220, 38, 38, 0.15)',
              }}
            >
              {isUp ? '↑' : '↓'} {change}
            </span>
          )}
        </div>

        {/* Title */}
        <p style={{ 
          fontSize: compact ? 13 : 14, 
          fontWeight: 700, 
          color: featured ? 'rgba(255, 255, 255, 0.95)' : 'var(--text-primary)',
          letterSpacing: '-0.2px',
          lineHeight: 1.3,
        }}>
          {title}
        </p>

        {/* Subtitle */}
        {sub && (
          <p style={{ 
            fontSize: 11, 
            fontWeight: 500,
            color: featured ? 'rgba(255, 255, 255, 0.7)' : 'var(--text-muted)',
            lineHeight: 1.4,
          }}>
            {sub}
          </p>
        )}
      </div>

      {/* Shine effect on hover */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: '-100%',
        width: '100%',
        height: '100%',
        background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)',
        transition: 'left 0.5s',
        pointerEvents: 'none',
      }} className="shine-effect" />

      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(1.05);
          }
        }
        .card:hover .shine-effect {
          left: 100%;
        }
      `}</style>
    </div>
  );
}
