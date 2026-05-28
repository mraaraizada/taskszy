import { RefreshCw } from 'lucide-react';

/**
 * DataLoadError - Shows a minimal reload button when Firestore data fails to load
 * Prevents excessive Firebase reads by requiring manual retry
 */
export default function DataLoadError({ error, onRetry }) {
  return (
    <div style={{
      position: 'fixed',
      top: 20,
      right: 20,
      zIndex: 9999,
    }}>
      {/* Simple Reload Button */}
      <button
        onClick={onRetry}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          padding: '12px 20px',
          borderRadius: 12,
          border: 'none',
          background: 'linear-gradient(135deg, #EF4444, #DC2626)',
          color: '#fff',
          fontSize: 14,
          fontWeight: 700,
          cursor: 'pointer',
          boxShadow: '0 8px 24px rgba(239, 68, 68, 0.3)',
          transition: 'all 0.2s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 12px 32px rgba(239, 68, 68, 0.4)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(239, 68, 68, 0.3)';
        }}
        title="Click to reload data"
      >
        <RefreshCw size={16} strokeWidth={2.5} />
        Reload
      </button>
    </div>
  );
}
