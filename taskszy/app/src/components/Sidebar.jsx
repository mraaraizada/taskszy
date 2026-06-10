import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, CheckSquare, Users, Wallet,
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
      { icon: CheckSquare,     label: 'Tasks',       id: 'tasks' },
      { icon: Users,           label: 'Team',        id: 'team' },
    ],
  },
  {
    label: 'MANAGEMENT',
    items: [
      { icon: Wallet,      label: 'Payments',   id: 'financial' },
      { icon: Settings2,   label: 'Manage',  id: 'roles' },
      { icon: TrendingUp,  label: 'Performance', id: 'performance' },
    ],
  },
  {
    label: 'PERSONAL',
    items: [
      { icon: StickyNote, label: 'Scribe', id: 'notes' },
      { icon: HelpCircle, label: 'Help',  id: 'help' },
    ],
  },
  {
    label: 'SYSTEM',
    items: [
      { icon: User, label: 'Profile', id: 'settings' },
    ],
  },
];

export default function Sidebar({ activeItem, setActiveItem, onLogout }) {
  const [confirmLogout, setConfirmLogout] = useState(false);
  const { helpSubmissions, isPlanActive, triggerPlanBlink, currentUser, currentUid } = useApp();
  const { showPasswordModal, pendingAction, requestAdminPassword, handlePasswordConfirm, handlePasswordCancel } = useAdminPassword();
  const pendingHelp = helpSubmissions.filter(s => s.status === 'pending').length;

  // Use currentUser directly from AppContext - it already has all profile data loaded
  // No need for separate profile loading or enrichedUser state

  const handleNavClick = (id) => {
    // Block ALL navigation when plan is inactive (including profile/settings)
    if (!isPlanActive) { 
      triggerPlanBlink(); 
      return; 
    }
    setActiveItem(id);
  }

  return (
    <aside data-tour="sidebar" style={{
      width: 230, height: '100vh', background: 'var(--bg-surface)',
      borderRight: '1.5px solid var(--border)', display: 'flex', flexDirection: 'column',
      padding: '0 12px', flexShrink: 0,
      transition: 'background 0.25s ease, border-color 0.25s ease',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '22px 8px 20px' }}>
        <img 
          src="/logo.png" 
          alt="TasksZy Logo" 
          onError={(e) => {
            // Fallback to gradient badge if logo image fails to load
            e.target.style.display = 'none';
            e.target.nextElementSibling.style.display = 'flex';
          }}
          style={{ 
            width: 34, 
            height: 34, 
            borderRadius: 10,
            objectFit: 'contain',
            flexShrink: 0,
          }} 
        />
        <div style={{
          width: 34, height: 34, borderRadius: 10,
          background: 'linear-gradient(135deg, #3B5BFC, #7C3AED)',
          display: 'none',
          alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 14px rgba(59,91,252,0.4)', flexShrink: 0,
        }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 8L7 4L11 8L7 12L3 8Z" fill="white" opacity="0.7"/>
            <path d="M7 4L11 8L13 6L9 2L7 4Z" fill="white"/>
          </svg>
        </div>
        <div>
          <span style={{ fontWeight: 800, fontSize: 17, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>TasksZy</span>
          <div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 600, marginTop: -1 }}>Organize Better, Scale Faster</div>
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
                  <button key={item.id} onClick={() => handleNavClick(item.id)} style={{
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

      {/* Admin user card + logout */}
      <div style={{ padding: '0 4px 20px' }}>
        <div style={{
          background: 'linear-gradient(135deg, #EEF2FF 0%, #F5F3FF 100%)',
          borderRadius: 14, padding: '12px 14px', border: '1.5px solid #E0E7FF',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: currentUser?.avatarImg ? 'transparent' : `linear-gradient(135deg, ${currentUser?.color || '#3B5BFC'}, #7C3AED)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 800, color: '#fff', flexShrink: 0,
              boxShadow: '0 4px 10px rgba(59,91,252,0.35)',
              overflow: 'hidden',
            }}>
              {currentUser?.avatarImg ? (
                <img src={currentUser.avatarImg} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
              ) : (
                currentUser?.avatar || 'A'
              )}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#1A1D2E', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentUser?.name || 'Admin'}</div>
              <div style={{ fontSize: 10, color: '#7C3AED', fontWeight: 700 }}>{currentUser?.role || 'Administrator'}</div>
            </div>
          </div>
          
          {/* Status + since date */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <div style={{ 
              width: 7, 
              height: 7, 
              borderRadius: '50%', 
              background: '#12C479', 
              boxShadow: '0 0 0 3px #DCFCE7', 
              flexShrink: 0 
            }} />
            <span style={{ 
              fontSize: 11, 
              color: '#12C479', 
              fontWeight: 700 
            }}>
              Active
            </span>
            <span style={{ fontSize: 10, color: '#B0B8CC', marginLeft: 'auto' }}>
              Since {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
            </span>
          </div>

          {!confirmLogout ? (
            <button
              onClick={() => setConfirmLogout(true)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                width: '100%', padding: '7px 10px', borderRadius: 9,
                background: '#FEF2F2', border: '1px solid #FECACA',
                fontSize: 12, fontWeight: 700, color: '#EF4444', cursor: 'pointer',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#FEE2E2'}
              onMouseLeave={e => e.currentTarget.style.background = '#FEF2F2'}
            >
              <LogOut size={13} /> Logout
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#FEF2F2', borderRadius: 9, padding: '6px 8px', border: '1px solid #FECACA' }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#EF4444', flex: 1 }}>Sure?</span>
              <button onClick={() => setConfirmLogout(false)} style={{ background: '#fff', border: '1px solid #E8EAEF', borderRadius: 6, padding: '4px 8px', fontSize: 11, fontWeight: 700, color: '#6B7280', cursor: 'pointer' }}>No</button>
            </div>
          )}
        </div>
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
