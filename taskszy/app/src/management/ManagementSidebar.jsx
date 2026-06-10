import { LayoutDashboard, CheckCircle, Users, Settings2, Wallet, FileText, StickyNote, HelpCircle, User, LogOut } from 'lucide-react';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../context/AppContext';
import Avatar from '../components/Avatar';
import { useLottie } from 'lottie-react';

// Dynamic wallet animation loader
function useWalletAnimation() {
  const [data, setData] = useState(null);
  useEffect(() => { import('../lottie/Wallet animation.json').then(m => setData(m.default)); }, []);
  return data;
}

const NAV_TOP = [
  { id: 'home',     icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'tasks',    icon: CheckCircle,     label: 'Tasks' },
  { id: 'team',     icon: Users,           label: 'Team' },
  { id: 'manage',   icon: Settings2,       label: 'Manage' },
];

const NAV_BOTTOM = [
  { id: 'payments', icon: Wallet,          label: 'Payments' },
  { id: 'workdesc', icon: FileText,        label: 'Description' },
  { id: 'notes',    icon: StickyNote,      label: 'Scribe' },
  { id: 'help',     icon: HelpCircle,      label: 'Help' },
  { id: 'profile',  icon: User,            label: 'Profile' },
];

function NavItem({ item, active, onClick, showDot }) {
  const Icon = item.icon;
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 12px', borderRadius: 11, border: 'none', cursor: 'pointer',
      background: active ? 'linear-gradient(135deg, #EEF2FF, #F0EEFF)' : 'transparent',
      color: active ? '#3B5BFC' : '#6B7280',
      fontWeight: active ? 700 : 500, fontSize: 13,
      transition: 'all 0.15s', width: '100%', textAlign: 'left',
      boxShadow: active ? '0 2px 8px rgba(59,91,252,0.12)' : 'none',
    }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--bg-subtle)'; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
    >
      <div style={{
        width: 30, height: 30, borderRadius: 9, flexShrink: 0,
        background: active ? '#EEF2FF' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={15} strokeWidth={active ? 2.5 : 2} color={active ? '#3B5BFC' : '#6B7280'} />
      </div>
      <span style={{ flex: 1 }}>{item.label}</span>
      {showDot && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#9CA3AF', boxShadow: '0 0 0 2px #F3F4F6', flexShrink: 0 }} />}
      {active && !showDot && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#3B5BFC' }} />}
    </button>
  );
}

export default function ManagementSidebar({ activePage, setActivePage, member, onLogout }) {
  const [confirmLogout, setConfirmLogout] = useState(false);
  const { roles, helpSubmissions, payments, currentUser } = useApp();
  const [hasUnreadDesc, setHasUnreadDesc] = useState(false);
  const pendingHelp = helpSubmissions.filter(s => s.status === 'pending').length;
  
  // ⭐ KEY FIX: Use currentUser directly BUT keep a stable reference to prevent avatar flickering
  // Store the last valid avatarImg so it doesn't disappear during updates
  const prevAvatarRef = useRef(null);
  
  const displayMember = useMemo(() => {
    if (!currentUser) return null;
    
    // If currentUser has avatarImg, update our reference
    if (currentUser.avatarImg) {
      prevAvatarRef.current = currentUser.avatarImg;
    }
    
    // Always use the stored avatarImg if current one is missing
    return {
      ...currentUser,
      avatarImg: currentUser.avatarImg || prevAvatarRef.current
    };
  }, [currentUser?.id, currentUser?.name, currentUser?.avatarImg, currentUser?.avatar, currentUser?.color, currentUser?.role, currentUser?.status]);
  
  // Debug: Log when displayMember changes
  useEffect(() => {

  }, [displayMember?.id, displayMember?.name, displayMember?.avatarImg, displayMember?.avatar, displayMember?.color]);
  
  // Track paid earnings and show animation when it increases
  const [lastSeenPaidAmount, setLastSeenPaidAmount] = useState(null);
  const [showWalletAnimation, setShowWalletAnimation] = useState(false);
  
  // Calculate current paid earnings - FOR MANAGEMENT: show ONLY payments assigned to THIS user
  const myPaidPayments = payments ? payments.filter(p => {
    const isPaid = p.status === 'Paid' || p.isPaid;
    if (!isPaid) return false;
    
    // Check if payment is assigned to this management user
    // Check by memberId
    if (p.memberId && p.memberId === displayMember?.id) return true;
    
    // Check by memberUid
    if (p.memberUid && displayMember?.uid && p.memberUid === displayMember.uid) return true;
    
    // Check assignedTo array
    if (p.assignedTo && Array.isArray(p.assignedTo)) {
      return p.assignedTo.some(a => a.id === displayMember?.id || (a.uid && displayMember?.uid && a.uid === displayMember.uid));
    }
    
    return false;
  }) : [];
  
  const currentPaidAmount = myPaidPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

  // Wallet animation
  const walletAnimData = useWalletAnimation();
  const [walletAnimKey, setWalletAnimKey] = useState(0); // ⭐ Key to force re-render animation
  
  const WalletLottie = () => {
    const { View } = useLottie({
      animationData: walletAnimData ?? null,
      loop: true,
      autoplay: true,
      key: walletAnimKey, // ⭐ Force new animation instance
    });
    return View;
  };

  // Load last seen paid amount from localStorage on mount
  useEffect(() => {
    if (!displayMember?.id) return;
    
    const storageKey = `wallet_seen_${displayMember.id}`;
    const stored = localStorage.getItem(storageKey);

    if (stored) {
      const lastSeen = parseFloat(stored);
      setLastSeenPaidAmount(lastSeen);

      // Show animation if current amount is greater than last seen AND not on payments page
      if (currentPaidAmount > lastSeen && activePage !== 'payments') {

        setShowWalletAnimation(true);
        setWalletAnimKey(k => k + 1); // ⭐ Force animation restart
      } else {

      }
    } else {
      // First time - set current amount as last seen, but show animation if there are paid payments
      setLastSeenPaidAmount(currentPaidAmount);
      localStorage.setItem(storageKey, currentPaidAmount.toString());

      // ⭐ Show animation if there are paid payments (even on first load)
      if (currentPaidAmount > 0 && activePage !== 'payments') {

        setShowWalletAnimation(true);
        setWalletAnimKey(k => k + 1);
      }
    }
  }, [displayMember?.id, currentPaidAmount, activePage]);
  
  // Mark as seen when user clicks on payments page
  useEffect(() => {
    if (activePage === 'payments' && displayMember?.id) {

      setShowWalletAnimation(false);
      
      // Update last seen amount in localStorage
      const storageKey = `wallet_seen_${displayMember.id}`;
      localStorage.setItem(storageKey, currentPaidAmount.toString());
      setLastSeenPaidAmount(currentPaidAmount);

    }
  }, [activePage, displayMember?.id, currentPaidAmount]);

  // Check if there's an unread description update
  useEffect(() => {
    if (!displayMember?.id || !displayMember?.role) return;
    
    // Find the role's work description update timestamp
    const memberRole = roles.find(r => r.name === displayMember.role);
    const roleUpdatedAt = memberRole?.workDescriptionUpdatedAt || 0;
    
    if (roleUpdatedAt > 0 && memberRole?.workDescription) {
      // Check if user has viewed this version of the description
      const storageKey = `desc_viewed_${displayMember.id}_${roleUpdatedAt}`;
      const hasViewed = localStorage.getItem(storageKey) === 'true';

      setHasUnreadDesc(!hasViewed);
    } else {
      setHasUnreadDesc(false);
    }
  }, [displayMember?.id, displayMember?.role, roles]);

  return (
    <div style={{
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

      {/* Admin section */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {NAV_TOP.map(item => (
          <NavItem key={item.id} item={item} active={activePage === item.id} onClick={() => setActivePage(item.id)} />
        ))}
      </nav>

      {/* Personal section */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
        {NAV_BOTTOM.map(item => (
          <NavItem key={item.id} item={item} active={activePage === item.id} onClick={() => setActivePage(item.id)} showDot={(item.id === 'workdesc' && hasUnreadDesc) || (item.id === 'help' && pendingHelp > 0)} />
        ))}
      </nav>

      {/* Wallet Animation - Show only when paid amount increases and not on payments page */}
      {showWalletAnimation && walletAnimData && (
        <div style={{ padding: '0 4px 12px', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: 120, height: 120 }}>
            <WalletLottie />
          </div>
        </div>
      )}

      {/* Member card */}
      {displayMember && (
        <div style={{ padding: '0 4px 20px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #EEF2FF 0%, #F5F3FF 100%)',
            borderRadius: 14, padding: '12px 14px', border: '1.5px solid #E0E7FF',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <Avatar member={displayMember} size={36} style={{ boxShadow: `0 4px 10px ${displayMember.color}55` }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#1A1D2E', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{displayMember.name}</div>
                <div style={{ fontSize: 10, color: '#7C3AED', fontWeight: 700 }}>{displayMember.role}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <div style={{ 
                width: 7, 
                height: 7, 
                borderRadius: '50%', 
                background: displayMember.status === 'Active' ? '#12C479' : '#EF4444', 
                boxShadow: displayMember.status === 'Active' ? '0 0 0 3px #DCFCE7' : '0 0 0 3px #FEE2E2', 
                flexShrink: 0 
              }} />
              <span style={{ 
                fontSize: 11, 
                color: displayMember.status === 'Active' ? '#12C479' : '#EF4444', 
              fontWeight: 700 
            }}>
              {displayMember.status === 'Active' ? 'Active' : 'Inactive'}
            </span>
            <span style={{ fontSize: 10, color: '#B0B8CC', marginLeft: 'auto' }}>Since {displayMember.joined}</span>
          </div>
          {!confirmLogout ? (
            <button onClick={() => setConfirmLogout(true)} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              width: '100%', padding: '7px 10px', borderRadius: 9,
              background: '#FEF2F2', border: '1px solid #FECACA',
              fontSize: 12, fontWeight: 700, color: '#EF4444', cursor: 'pointer',
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
      )}
    </div>
  );
}
