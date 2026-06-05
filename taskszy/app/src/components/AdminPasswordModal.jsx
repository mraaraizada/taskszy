import { useState } from 'react';
import { Shield, X, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';

export function AdminPasswordModal({ onClose, onConfirm, action = 'perform this action', label = 'Admin Password', userRole = 'admin' }) {
  const { adminPassword } = useApp();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Get the current user's password (loaded from their profile)
    const storedPassword = adminPassword || 'admin123';

    setTimeout(() => {
      if (password === storedPassword) {
        onConfirm();
        onClose();
      } else {
        setError('Incorrect password. Please try again.');
        setPassword('');
        setLoading(false);
      }
    }, 300);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'transparent',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}
    onClick={(e) => e.stopPropagation()}
    >
      <div style={{
        background: 'var(--bg-surface)',
        borderRadius: 16,
        width: '100%',
        maxWidth: 380,
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        border: '1px solid var(--border)',
      }}
      onClick={(e) => e.stopPropagation()}
      >
        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '28px' }}>
          <div style={{ marginBottom: 20 }}>
            <label style={{
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--text-secondary)',
              display: 'block',
              marginBottom: 8,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}>
              {label}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="type"
              autoFocus
              style={{
                width: '100%',
                padding: '12px 16px',
                border: error ? '1.5px solid #EF4444' : '1.5px solid var(--border)',
                borderRadius: 10,
                fontSize: 14,
                color: 'var(--text-primary)',
                outline: 'none',
                background: 'var(--input-bg)',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => e.target.style.borderColor = error ? '#EF4444' : '#3B5BFC'}
              onBlur={(e) => e.target.style.borderColor = error ? '#EF4444' : 'var(--border)'}
            />
            {error && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginTop: 8,
                padding: '8px 12px',
                background: '#FEF2F2',
                borderRadius: 8,
                border: '1px solid #FEE2E2',
              }}>
                <AlertCircle size={14} color="#EF4444" />
                <span style={{ fontSize: 12, color: '#EF4444', fontWeight: 600 }}>
                  {error}
                </span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '12px 18px',
                background: 'var(--bg-subtle)',
                border: '1.5px solid var(--border)',
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 700,
                color: 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!password || loading}
              style={{
                flex: 1,
                padding: '12px 18px',
                background: loading ? '#9CA3AF' : 'linear-gradient(135deg, #3B5BFC, #2142D9)',
                border: 'none',
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 700,
                color: '#fff',
                cursor: loading || !password ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 4px 12px rgba(59,91,252,0.3)',
                opacity: !password ? 0.5 : 1,
              }}
            >
              {loading ? 'Verifying...' : 'Confirm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
