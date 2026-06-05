import { Search, X, Zap, Check } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useLottie } from 'lottie-react';
import PlanSelection from './PlanSelection';
import { AdminPasswordModal } from './AdminPasswordModal';
import { useAdminPassword } from '../hooks/useAdminPassword';

// Dynamic lottie loader — Confetti.json is 95KB, load only when needed
function useConfettiAnimation() {
  const [data, setData] = useState(null);
  useEffect(() => { import('../lottie/Confetti.json').then(m => setData(m.default)); }, []);
  return data;
}

const STAGE_COLOR = {
  New: '#9CA3AF', Start: '#3B5BFC', Accept: '#7C3AED',
  Review: '#F97316', Update: '#EF4444', Complete: '#12C479',
};

// Add animations
const planSelectorStyles = `
@keyframes slideInFromRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
`;

export default function Header({ title, subtitle, currentPage, onSearchResultClick, pageFilteredData }) {
  const { tasks, currentUser, planExpiryDate, setPlanExpiryDate, planExpiryTimestamp, currentPlan: contextPlan, setCurrentPlan: setContextPlan, planAlertBlink, isPlanActive, workspaceName, workspaceSub, workspaceLogo, workspaceId, saveWorkspaceSettings, team, notes, helpSubmissions } = useApp();
  const { showPasswordModal, pendingAction, requestAdminPassword, handlePasswordConfirm, handlePasswordCancel } = useAdminPassword();
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef(null);
  const dropRef = useRef(null);

  // Badge state — edit fields are local; display values come from context
  const [badgeOpen, setBadgeOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editSub, setEditSub] = useState('');
  const currentPlan = contextPlan?.name || 'Professional';
  const setCurrentPlan = (name) => setContextPlan(prev => ({ ...(prev || {}), name }));
  const [showPlanSelector, setShowPlanSelector] = useState(false);
  const [canClosePlanSelector, setCanClosePlanSelector] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const badgeRef = useRef(null);

  // Calculate plan status dot color
  const getPlanStatusColor = () => {

    // Check if plan is manually deactivated first (highest priority)
    if (!isPlanActive) {

      return '#EF4444'; // Red for manually deactivated plan
    }
    
    if (currentPlan === 'Free Plan' || !planExpiryDate) {

      return '#EF4444'; // Red for no plan/inactive
    }
    
    const today = new Date();
    const expiry = new Date(planExpiryDate);
    const daysLeft = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

    if (daysLeft <= 0) return '#EF4444'; // Red - expired
    if (daysLeft <= 10) return '#F97316'; // Orange - 10 days or less
    if (daysLeft <= 30) return '#F59E0B'; // Yellow/Orange - 30 days or less (1 month)
    return '#12C479'; // Green - more than 1 month
  };
  const fileInputRef = useRef(null);

  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening';
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  // Context-aware search results based on current page
  const getSearchResults = () => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    // Use page-filtered data if provided, otherwise use global data
    const searchData = pageFilteredData || {};

    switch (currentPage) {
      case 'team':
        // Search team members by name (only visible/paginated members if provided)
        const teamData = searchData.team || team || [];
        return teamData
          .filter(member => member.name?.toLowerCase().includes(q))
          .slice(0, 5)
          .map(member => ({ ...member, type: 'member' }));
      
      case 'tasks':
        // Search tasks by ID or title (only visible/paginated tasks if provided)
        const tasksData = searchData.tasks || tasks || [];
        return tasksData
          .filter(t =>
            t.id.toLowerCase().includes(q) ||
            t.title.toLowerCase().includes(q)
          )
          .slice(0, 5)
          .map(task => ({ ...task, type: 'task' }));
      
      case 'financial':
        // Search tasks by ID or title (only visible/paginated tasks if provided)
        const financialData = searchData.tasks || tasks || [];
        return financialData
          .filter(t =>
            t.id.toLowerCase().includes(q) ||
            t.title.toLowerCase().includes(q)
          )
          .slice(0, 5)
          .map(task => ({ ...task, type: 'task' }));
      
      case 'notes':
        // Search scribes by title
        const notesData = searchData.notes || notes || [];
        return notesData
          .filter(scribe => scribe.title?.toLowerCase().includes(q))
          .slice(0, 5)
          .map(scribe => ({ ...scribe, type: 'scribe' }));
      
      case 'help':
        // Search help articles by title
        const helpData = searchData.help || helpSubmissions || [];
        return helpData
          .filter(article => article.title?.toLowerCase().includes(q))
          .slice(0, 5)
          .map(article => ({ ...article, type: 'help' }));
      
      case 'dashboard':
      case 'roles':
      case 'performance':
      case 'reports':
      case 'settings':
      case 'trash':
      default:
        // No search on other pages
        return [];
    }
  };

  const results = getSearchResults();

  const showDrop = focused && query.trim().length > 0;

  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) {
        setFocused(false);
        setQuery('');
      }
      if (badgeRef.current && !badgeRef.current.contains(e.target)) {
        setBadgeOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function handleSave() {
    requestAdminPassword('update workspace badge', () => {
      saveWorkspaceSettings({
        workspaceName: editName.trim() || workspaceName,
        workspaceSub:  editSub.trim()  || workspaceSub,
      });
      setBadgeOpen(false);
    });
  }

  function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (file) {
      // Show loading state
      const reader = new FileReader();
      reader.onload = (event) => {
        // Temporarily show preview
        saveWorkspaceSettings({ workspaceLogo: event.target.result });
      };
      reader.readAsDataURL(file);

      // Upload to Firebase Storage with compression
      Promise.all([
        import('../lib/storageService'),
        import('../lib/imageCompression')
      ]).then(([{ uploadWorkspaceLogo }, { compressLogo }]) => {

        return compressLogo(file)
          .then(compressedFile => {

            return uploadWorkspaceLogo(compressedFile, workspaceId);
          })
          .then(downloadURL => {

            saveWorkspaceSettings({ workspaceLogo: downloadURL });
          })
          .catch(err => {

            alert('Failed to upload logo. Please try again.');
          });
      });
    }
  }

  function handleUpgradePlan() {
    setShowPlanSelector(true);
    setBadgeOpen(false);
  }

  function handlePlanSelect(plan, billingCycle, couponInfo) {
    // Update plan details immediately
    setCurrentPlan(plan.name);
    
    // Calculate new expiry date
    let expiryDate;
    
    // Check if current plan is active (not expired)
    const isCurrentPlanActive = planExpiryTimestamp 
      ? (typeof planExpiryTimestamp.toMillis === 'function' 
          ? planExpiryTimestamp.toMillis() >= Date.now()
          : new Date(planExpiryTimestamp).getTime() >= Date.now())
      : (planExpiryDate && new Date(planExpiryDate) >= new Date());
    
    // If plan is active, extend from current expiry date
    // If plan is expired or no plan exists, start from today
    if (isCurrentPlanActive && planExpiryDate) {
      expiryDate = new Date(planExpiryDate);
    } else {
      expiryDate = new Date();
    }
    
    // Add duration based on plan type
    if (couponInfo && couponInfo.type === 'duration' && couponInfo.duration) {
      // Duration coupon overrides billing cycle
      const { value, unit } = couponInfo.duration;
      if (unit === 'months') expiryDate.setMonth(expiryDate.getMonth() + value);
      else expiryDate.setDate(expiryDate.getDate() + value);
    } else if (plan.period === 'one-time') {
      // Lifetime plan - set far future date
      expiryDate.setFullYear(expiryDate.getFullYear() + 99);
    } else if (billingCycle === 'yearly') {
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    } else {
      expiryDate.setMonth(expiryDate.getMonth() + 1);
    }
    
    const expiryStr = expiryDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const planData = { id: plan.id, name: plan.name, users: plan.users, color: plan.color, billingCycle };
    
    // Batch all state updates to prevent multiple re-renders and flickering
    // Use microtask to ensure updates happen together
    queueMicrotask(() => {
      setPlanExpiryDate(expiryStr);
      setContextPlan(planData);
      setShowPlanSelector(false);
      setCanClosePlanSelector(true);
      
      // Save to Firestore after state updates
      saveWorkspaceSettings({
        currentPlan: planData,
        planExpiryDate: expiryStr,
        planExpiryTimestamp: expiryDate,
      });
      
      // Show confetti after panel closes
      setTimeout(() => {
        setShowConfetti(true);
      }, 400);
    });
  }

  function handlePlanCancel() {
    setShowPlanSelector(false);
    setCanClosePlanSelector(true);
  }

  return (
    <>
    <style>{planSelectorStyles}</style>
    <div style={{
      height: 64,
      background: 'var(--bg-surface)',
      borderBottom: '1.5px solid var(--border)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 28px', flexShrink: 0, position: 'relative', zIndex: 200,
      transition: 'background 0.25s ease, border-color 0.25s ease',
    }}>

      {/* Left: greeting + date */}
      <div>
        <h1 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
          {greeting}, {currentUser?.name?.split(' ')[0] || 'Admin'}! 👋
        </h1>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{dateStr}</p>
      </div>

      {/* Centre: glassmorphism brand capsule */}
      <div ref={badgeRef} style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', zIndex: 300 }}>
        <div
          onClick={() => { setBadgeOpen(p => !p); setEditName(workspaceName); setEditSub(workspaceSub); }}
          style={{
            display: 'flex', alignItems: 'center', gap: 9,
            padding: '7px 18px 7px 10px', borderRadius: 999,
            background: badgeOpen ? 'rgba(59,91,252,0.13)' : 'rgba(59,91,252,0.07)',
            border: `1.5px solid ${badgeOpen ? 'rgba(59,91,252,0.38)' : 'rgba(59,91,252,0.18)'}`,
            backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
            boxShadow: badgeOpen ? '0 4px 24px rgba(59,91,252,0.22), inset 0 1px 0 rgba(255,255,255,0.22)' : '0 2px 16px rgba(59,91,252,0.10), inset 0 1px 0 rgba(255,255,255,0.18)',
            cursor: 'pointer', userSelect: 'none',
            transition: 'background 0.2s, box-shadow 0.2s, border-color 0.2s, transform 0.2s',
          }}
          onMouseEnter={e => { if (!badgeOpen) { e.currentTarget.style.background = 'rgba(59,91,252,0.13)'; e.currentTarget.style.borderColor = 'rgba(59,91,252,0.38)'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
          onMouseLeave={e => { if (!badgeOpen) { e.currentTarget.style.background = 'rgba(59,91,252,0.07)'; e.currentTarget.style.borderColor = 'rgba(59,91,252,0.18)'; e.currentTarget.style.transform = 'translateY(0)'; } }}
        >
          <div style={{ width: 28, height: 28, borderRadius: 8, background: workspaceLogo ? 'transparent' : 'linear-gradient(135deg, #3B5BFC 0%, #7C3AED 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(59,91,252,0.35)', flexShrink: 0, overflow: 'hidden' }}>
            {workspaceLogo ? (
              <img src={workspaceLogo} alt="Brand" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <Zap size={13} color="#fff" strokeWidth={2.5} fill="#fff" />
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
            <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.2px', background: 'linear-gradient(90deg, #3B5BFC, #7C3AED)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{workspaceName}</span>
            <span style={{ fontSize: 8, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.8px', textTransform: 'uppercase', marginTop: 1 }}>{workspaceSub}</span>
          </div>
          {/* Status Dot */}
          <div style={{ 
            width: 8, 
            height: 8, 
            borderRadius: '50%', 
            background: getPlanStatusColor(),
            boxShadow: `0 0 8px ${getPlanStatusColor()}`,
            marginLeft: 4,
            flexShrink: 0,
            animation: planAlertBlink ? 'planDotBlink 1.2s ease 4' : 'none',
          }} />
          <style>{`@keyframes planDotBlink { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.1;transform:scale(1.6)} }`}</style>
          <style>{`.plan-dot-blink { animation: planDotBlink 0.6s ease 5; }`}</style>
        </div>

        {/* Popdown */}
        {badgeOpen && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 10px)', left: '50%', transform: 'translateX(-50%)',
            width: 280, background: 'var(--bg-surface)',
            border: '1.5px solid var(--border)', borderRadius: 14,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            padding: '16px', display: 'flex', flexDirection: 'column', gap: 12,
          }}>

            {/* Name and Subtitle Inputs with Edit Icon */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div>
                <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Company Name</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {/* Edit Icon Button - Only show for workspace owners */}
                  {!currentUser?.memberId && (
                    <>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        style={{ display: 'none' }}
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        title="Upload brand logo"
                        style={{ width: 32, height: 32, borderRadius: 8, border: '1.5px solid var(--border)', background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, transition: 'all 0.2s' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#3B5BFC'; e.currentTarget.style.background = '#EEF2FF'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-subtle)'; }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                          <circle cx="8.5" cy="8.5" r="1.5"/>
                          <polyline points="21 15 16 10 5 21"/>
                        </svg>
                      </button>
                    </>
                  )}
                  {/* Company Name Input */}
                  <input
                    autoFocus={!currentUser?.memberId}
                    value={editName}
                    onChange={e => !currentUser?.memberId && setEditName(e.target.value)}
                    readOnly={!!currentUser?.memberId}
                    style={{ 
                      flex: 1, 
                      padding: '7px 10px', 
                      borderRadius: 8, 
                      border: `1.5px solid ${currentUser?.memberId ? 'var(--border)' : '#C7D4FF'}`, 
                      background: currentUser?.memberId ? '#F9FAFB' : 'var(--bg-subtle)', 
                      fontSize: 13, 
                      fontWeight: 700, 
                      color: currentUser?.memberId ? 'var(--text-muted)' : 'var(--text-primary)', 
                      outline: 'none', 
                      boxSizing: 'border-box',
                      cursor: currentUser?.memberId ? 'not-allowed' : 'text',
                    }}
                    onFocus={e => !currentUser?.memberId && (e.target.style.borderColor = '#3B5BFC')}
                    onBlur={e => !currentUser?.memberId && (e.target.style.borderColor = '#C7D4FF')}
                  />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Subtitle</label>
                <input
                  value={editSub}
                  onChange={e => !currentUser?.memberId && setEditSub(e.target.value)}
                  readOnly={!!currentUser?.memberId}
                  style={{ 
                    width: '100%', 
                    padding: '7px 10px', 
                    borderRadius: 8, 
                    border: `1.5px solid ${currentUser?.memberId ? 'var(--border)' : '#C7D4FF'}`, 
                    background: currentUser?.memberId ? '#F9FAFB' : 'var(--bg-subtle)', 
                    fontSize: 12, 
                    color: currentUser?.memberId ? 'var(--text-muted)' : 'var(--text-primary)', 
                    outline: 'none', 
                    boxSizing: 'border-box',
                    cursor: currentUser?.memberId ? 'not-allowed' : 'text',
                  }}
                  onFocus={e => !currentUser?.memberId && (e.target.style.borderColor = '#3B5BFC')}
                  onBlur={e => !currentUser?.memberId && (e.target.style.borderColor = '#C7D4FF')}
                  onKeyDown={e => !currentUser?.memberId && e.key === 'Enter' && handleSave()}
                />
              </div>
            </div>

            <div style={{ height: 1, background: 'var(--border-light)' }} />

            {/* Current Plan Section */}
            <div>
              <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Current Plan</label>
              {(() => {
                const isExpired = planExpiryDate && new Date(planExpiryDate) < new Date();
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '10px 12px', borderRadius: 10, background: isExpired ? '#FEF2F2' : 'var(--bg-subtle)', border: `1.5px solid ${isExpired ? '#FCA5A5' : 'var(--border)'}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: isExpired ? '#EF4444' : 'var(--text-primary)' }}>{currentPlan}</span>
                        <span style={{ fontSize: 10, fontWeight: 600, color: isExpired ? '#EF4444' : 'var(--text-muted)' }}>
                          {planExpiryDate ? (
                            typeof planExpiryDate === 'string' && planExpiryDate.includes('T') 
                              ? new Date(planExpiryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                              : planExpiryDate
                          ) : 'No expiry date'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                        {isExpired && <span style={{ fontSize: 9, fontWeight: 700, color: '#EF4444' }}>Plan Inactive</span>}
                        <button
                          onClick={handleUpgradePlan}
                          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 7, border: 'none', background: 'linear-gradient(135deg, #3B5BFC, #7C3AED)', cursor: 'pointer', fontSize: 11, fontWeight: 700, color: '#fff', boxShadow: '0 2px 8px rgba(59,91,252,0.3)', transition: 'transform 0.2s' }}
                          onMouseEnter={e => e.currentTarget.style.transform = 'translateX(2px)'}
                          onMouseLeave={e => e.currentTarget.style.transform = 'translateX(0)'}
                        >
                          Upgrade
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6H10M10 6L6 2M10 6L6 10" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Save Button - Only show for workspace owners */}
            {!currentUser?.memberId && (
              <button
                onClick={handleSave}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px', borderRadius: 9, border: 'none', background: 'linear-gradient(135deg, #3B5BFC, #7C3AED)', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#fff', boxShadow: '0 3px 10px rgba(59,91,252,0.3)', transition: 'transform 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                Update
              </button>
            )}
          </div>
        )}
      </div>

      {/* Right: search + dark toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>

        {/* Task search */}
        <div ref={dropRef} style={{ position: 'relative' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: focused ? 'var(--bg-surface)' : 'var(--input-bg)',
            border: `1.5px solid ${focused ? '#3B5BFC' : 'var(--border)'}`,
            borderRadius: 11, padding: '0 12px', height: 38,
            width: focused ? 280 : 220,
            boxShadow: focused ? '0 0 0 3px rgba(59,91,252,0.1)' : 'none',
            transition: 'all 0.2s ease',
          }}>
            <Search size={14} color={focused ? '#3B5BFC' : 'var(--text-muted)'} style={{ flexShrink: 0 }} />
            <input
              ref={inputRef}
              value={query}
              onChange={e => { if (!isPlanActive) return; setQuery(e.target.value); }}
              onFocus={() => { if (!isPlanActive) { inputRef.current?.blur(); return; } setFocused(true); }}
              placeholder="Search by ID or title…"
              style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 13, color: 'var(--text-primary)', width: '100%' }}
            />
            {query && (
              <button onClick={() => { setQuery(''); inputRef.current?.focus(); }} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
                <X size={13} color="var(--text-muted)" />
              </button>
            )}
          </div>

          {showDrop && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)', right: 0,
              width: 340, background: 'var(--bg-surface)',
              border: '1.5px solid var(--border)', borderRadius: 14,
              boxShadow: 'var(--shadow-md)', overflow: 'hidden',
              animation: 'fadeSlideIn 0.18s ease forwards', zIndex: 300,
            }}>
              {results.length === 0 ? (
                <div style={{ padding: '18px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                  No results found for "<strong>{query}</strong>"
                </div>
              ) : (
                <>
                  {results.map((result, idx) => {
                    if (result.type === 'member') {
                      // Team member result
                      return (
                        <div key={result.id || idx} style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '10px 14px', borderTop: idx > 0 ? '1px solid var(--border-light)' : 'none',
                          transition: 'background 0.12s', cursor: 'pointer',
                        }}
                          onClick={() => {
                            onSearchResultClick?.({ type: 'member', data: result });
                            setQuery('');
                            setFocused(false);
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-subtle)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <div style={{
                            width: 32, height: 32, borderRadius: '50%',
                            background: result.color || '#3B5BFC',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0,
                          }}>
                            {result.avatarImg ? (
                              <img src={result.avatarImg} alt={result.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                            ) : (
                              result.name?.[0]?.toUpperCase() || '?'
                            )}
                          </div>
                          <div style={{ flex: 1, overflow: 'hidden' }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{result.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{result.role}</div>
                          </div>
                        </div>
                      );
                    } else if (result.type === 'scribe') {
                      // Scribe result
                      return (
                        <div key={result.id || idx} style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '10px 14px', borderTop: idx > 0 ? '1px solid var(--border-light)' : 'none',
                          transition: 'background 0.12s', cursor: 'pointer',
                        }}
                          onClick={() => {
                            onSearchResultClick?.({ type: 'scribe', data: result });
                            setQuery('');
                            setFocused(false);
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-subtle)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <div style={{
                            width: 32, height: 32, borderRadius: 8,
                            background: '#F0F2F8',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                          }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3B5BFC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                              <polyline points="14 2 14 8 20 8"/>
                              <line x1="16" y1="13" x2="8" y2="13"/>
                              <line x1="16" y1="17" x2="8" y2="17"/>
                              <polyline points="10 9 9 9 8 9"/>
                            </svg>
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{result.title}</span>
                        </div>
                      );
                    } else if (result.type === 'help') {
                      // Help article result
                      return (
                        <div key={result.id || idx} style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '10px 14px', borderTop: idx > 0 ? '1px solid var(--border-light)' : 'none',
                          transition: 'background 0.12s', cursor: 'pointer',
                        }}
                          onClick={() => {
                            onSearchResultClick?.({ type: 'help', data: result });
                            setQuery('');
                            setFocused(false);
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-subtle)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <div style={{
                            width: 32, height: 32, borderRadius: 8,
                            background: '#FEF3C7',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                          }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10"/>
                              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                              <line x1="12" y1="17" x2="12.01" y2="17"/>
                            </svg>
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{result.title}</span>
                        </div>
                      );
                    } else {
                      // Task result (default)
                      return (
                        <div key={result.id || idx} style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '10px 14px', borderTop: idx > 0 ? '1px solid var(--border-light)' : 'none',
                          transition: 'background 0.12s', cursor: 'pointer',
                        }}
                          onClick={() => {
                            onSearchResultClick?.({ type: 'task', data: result });
                            setQuery('');
                            setFocused(false);
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-subtle)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <span style={{ fontSize: 9, fontWeight: 800, color: '#fff', background: '#3B5BFC', padding: '2px 7px', borderRadius: 5, flexShrink: 0 }}>{result.id}</span>
                          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{result.title}</span>
                          <span style={{
                            fontSize: 10, fontWeight: 700,
                            color: STAGE_COLOR[result.stage],
                            background: STAGE_COLOR[result.stage] + '18',
                            border: `1px solid ${STAGE_COLOR[result.stage]}33`,
                            padding: '2px 8px', borderRadius: 20, flexShrink: 0,
                          }}>{result.stage}</span>
                        </div>
                      );
                    }
                  })}
                </>
              )}
            </div>
          )}
        </div>

      </div>

      {/* Plan Selector Panel - Slides in from right */}
      {showPlanSelector && (
        <>
          {canClosePlanSelector && (
            <div
              onClick={() => setShowPlanSelector(false)}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'transparent',
                zIndex: 9998,
                animation: 'fadeIn 0.3s ease',
              }}
            />
          )}
          <div
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              width: '54%',
              height: '100vh',
              background: '#F0F2F8',
              zIndex: 9999,
              boxShadow: '-4px 0 24px rgba(0,0,0,0.15)',
              animation: 'slideInFromRight 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <PlanSelection
              email={currentUser?.email || ''}
              workspaceId={workspaceId || currentUser?.workspaceId}
              activeTeamMembers={team?.filter(m => m.status === 'Active').length || 0}
              onSelectPlan={handlePlanSelect}
              onBack={() => { if (canClosePlanSelector) setShowPlanSelector(false); }}
              onCancel={handlePlanCancel}
              onProcessingStart={() => setCanClosePlanSelector(false)}
              backText="Back"
              readOnly={true}
            />
          </div>
        </>
      )}
    </div>
      {showPasswordModal && (
        <AdminPasswordModal
          onClose={handlePasswordCancel}
          onConfirm={handlePasswordConfirm}
          action={pendingAction?.actionName || 'update workspace badge'}
        />
      )}

      {/* Fullscreen Confetti Overlay */}
      {showConfetti && <FullscreenConfetti onComplete={() => setShowConfetti(false)} />}
    </>
  );
}

function FullscreenConfetti({ onComplete }) {
  const [fading, setFading] = useState(false);
  const animationData = useConfettiAnimation();

  const dismiss = () => {
    setFading(true);
    setTimeout(onComplete, 500);
  };

  const { View } = useLottie({
    animationData: animationData ?? null,
    loop: false,
    autoplay: !!animationData,
    onComplete: dismiss,
    style: { width: '100vw', height: '100vh', objectFit: 'cover' },
  });

  useEffect(() => {
    const t = setTimeout(dismiss, 4000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        pointerEvents: 'none',
        opacity: fading ? 0 : 1,
        transition: 'opacity 0.5s ease',
      }}
    >
      {View}
    </div>
  );
}
