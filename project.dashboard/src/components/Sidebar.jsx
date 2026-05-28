import { useState } from 'react';
import {
  LayoutDashboard, CheckSquare, Building2, Wallet,
  Settings2, Settings, TrendingUp,
  StickyNote, LogOut, User, HelpCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AdminPasswordModal } from './AdminPasswordModal';
import { useAdminPassword } from '../hooks/useAdminPassword';

const menuSections = [
  {
    label: 'MAIN',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard',  id: 'dashboard' },
      { icon: Building2, label: 'Organization', id: 'team' },
      { icon: Wallet, label: 'Payments', id: 'financial' },
    ],
  },
  {
    label: 'SYSTEM',
    items: [
      { icon: HelpCircle, label: 'Feedback', id: 'feedback' },
    ],
  },
];

export default function Sidebar({ activeItem, setActiveItem, onLogout }) {
  const [confirmLogout, setConfirmLogout] = useState(false);
  const { helpSubmissions } = useApp();
  const { showPasswordModal, pendingAction, requestAdminPassword, handlePasswordConfirm, handlePasswordCancel } = useAdminPassword();
  const pendingHelp = helpSubmissions.filter(s => s.status === 'pending').length;

  return (
    <aside style={{
      width: 230, height: '100vh', background: 'var(--bg-surface)',
      borderRight: '1.5px solid var(--border)', display: 'flex', flexDirection: 'column',
      padding: '0 12px', flexShrink: 0,
      transition: 'background 0.25s ease, border-color 0.25s ease',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '22px 8px 20px' }}>
        <div style={{
          width: 34, height: 34, borderRadius: 10,
          background: 'linear-gradient(135deg, #3B5BFC, #7C3AED)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 14px rgba(59,91,252,0.4)', flexShrink: 0,
        }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 8L7 4L11 8L7 12L3 8Z" fill="white" opacity="0.7"/>
            <path d="M7 4L11 8L13 6L9 2L7 4Z" fill="white"/>
          </svg>
        </div>
        <div>
          <span style={{ fontWeight: 800, fontSize: 17, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>Taskzy</span>
          <div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 600, marginTop: -1 }}>Admin</div>
        </div>
      </div>

      {/* Nav sections */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, overflowY: 'auto' }}>
        {menuSections.map(section => (
          <div key={section.label}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {section.items.map(item => {
                const Icon = item.icon;
                const active = activeItem === item.id;
                return (
                  <button key={item.id} onClick={() => setActiveItem(item.id)} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px', borderRadius: 11, border: 'none', cursor: 'pointer',
                    background: active ? 'linear-gradient(135deg, #EEF2FF, #F0EEFF)' : 'transparent',
                    color: active ? '#3B5BFC' : '#6B7280',
                    fontWeight: active ? 700 : 500, fontSize: 13,
                    transition: 'all 0.15s',
                    boxShadow: active ? '0 2px 8px rgba(59,91,252,0.12)' : 'none',
                    width: '100%', textAlign: 'left',
                  }}
                    onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--bg-subtle)'; }}
                    onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <div style={{
                      width: 30, height: 30, borderRadius: 9, flexShrink: 0,
                      background: active ? '#EEF2FF' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'background 0.15s',
                    }}>
                      <Icon size={15} strokeWidth={active ? 2.5 : 2} color={active ? '#3B5BFC' : '#6B7280'} />
                    </div>
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {item.id === 'help' && pendingHelp > 0 && (
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#9CA3AF', boxShadow: '0 0 0 2px #F3F4F6', flexShrink: 0 }} />
                    )}
                    {active && item.id !== 'help' && (
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#3B5BFC' }} />
                    )}
                    {active && item.id === 'help' && pendingHelp === 0 && (
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#3B5BFC' }} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Logout button */}
      <div style={{ padding: '0 4px 20px' }}>
        {!confirmLogout ? (
          <button
            onClick={() => setConfirmLogout(true)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              width: '100%', padding: '12px 16px', borderRadius: 12,
              background: '#FEF2F2', border: '1.5px solid #FECACA',
              fontSize: 13, fontWeight: 700, color: '#EF4444', cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#FEE2E2';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = '#FEF2F2';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <LogOut size={16} strokeWidth={2.5} /> Logout
          </button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#FEF2F2', borderRadius: 12, padding: '10px 12px', border: '1.5px solid #FECACA' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#EF4444', flex: 1 }}>Sure?</span>
            <button onClick={onLogout} style={{ background: '#EF4444', border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>Yes</button>
            <button onClick={() => setConfirmLogout(false)} style={{ background: '#fff', border: '1px solid #E8EAEF', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 700, color: '#6B7280', cursor: 'pointer' }}>No</button>
          </div>
        )}
      </div>
      {showPasswordModal && (
        <AdminPasswordModal
          onClose={handlePasswordCancel}
          onConfirm={handlePasswordConfirm}
          action={pendingAction?.actionName || 'perform this action'}
        />
      )}
    </aside>
  );
}
