import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { onAuthChanged, signOutUser } from './lib/authService';
import { getProfile, stampLogin, clearSession } from './lib/userProfileService';
import { db } from './lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useLottie } from 'lottie-react';
import { Toaster } from './components/ui/sonner';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import WorkspaceSetup from './components/WorkspaceSetup';
import FeedbackModal from './components/FeedbackModal';
import DataLoadError from './components/DataLoadError';
import { MultiStepLoader } from './components/ui/multi-step-loader';
import {
  SkeletonStyles,
  DashboardSkeleton, TasksSkeleton, TeamSkeleton,
  FinancialSkeleton, RolesSkeleton, ReportsSkeleton,
  PerformanceSkeleton, NotesSkeleton, HelpSkeleton, SettingsSkeleton,
  AppShellSkeleton,
} from './components/Skeleton';
import { monitor } from './lib/performanceMonitor';
import { listenForFeedbackRequests } from './lib/feedbackBroadcastService';

// Load migration tools (available in console)
import './lib/migrationRunner';

// Load feature flags (available in console)
import './lib/featureFlags';

// ── Dynamically loaded lottie JSONs (keep them out of the main bundle) ────────
function useWelcomeAnimation() {
  const [data, setData] = useState(null);
  useEffect(() => { import('./lottie/Welcome.json').then(m => setData(m.default)); }, []);
  return data;
}
function useProfileCardAnimation() {
  const [data, setData] = useState(null);
  useEffect(() => { import('./lottie/Profile user card.json').then(m => setData(m.default)); }, []);
  return data;
}
function useProfileUserCardAnimation() {
  const [data, setData] = useState(null);
  useEffect(() => { import('./lottie/Profile user card.json').then(m => setData(m.default)); }, []);
  return data;
}

// ── Lazy-loaded pages (each becomes its own chunk) ────────────────────────────
import LoginPage from './pages/LoginPage';  // Not lazy - load immediately
const AuthActionPage = lazy(() => import('./pages/AuthActionPage'));
const TasksPage      = lazy(() => import('./pages/TasksPage'));
const TeamPage       = lazy(() => import('./pages/TeamPage'));
const FinancialPage  = lazy(() => import('./pages/FinancialPage'));
const RolesPage      = lazy(() => import('./pages/RolesPage'));
const SettingsPage   = lazy(() => import('./pages/SettingsPage'));
const PerformancePage = lazy(() => import('./pages/PerformancePage'));
const ReportsPage    = lazy(() => import('./pages/ReportsPage'));
const NotesPage      = lazy(() => import('./pages/NotesPage'));
const HelpPage       = lazy(() => import('./pages/HelpPage'));
const TrashPage      = lazy(() => import('./pages/TrashPage'));
const SheetPage      = lazy(() => import('./pages/SheetPage'));
const ManagementApp  = lazy(() => import('./management/ManagementApp'));
const MemberApp      = lazy(() => import('./member/MemberApp'));

// ── Page metadata ─────────────────────────────────────────────────────────────
const pageConfig = {
  dashboard:   { title: 'Dashboard',     subtitle: 'Welcome back, Admin!' },
  tasks:       { title: 'Tasks',          subtitle: 'Manage and track all tasks' },
  team:        { title: 'Team',           subtitle: 'View and manage team members' },
  financial:   { title: 'Financial',      subtitle: 'Track budgets and payments' },
  roles:       { title: 'Management',     subtitle: 'Tags, categories, roles & permissions' },
  performance: { title: 'Performance',    subtitle: 'Team performance metrics and goals' },
  reports:     { title: 'Reports',        subtitle: 'Analytics and insights' },
  notes:       { title: 'Scribe',         subtitle: 'Notes, sheets & shared docs' },
  sheet:       { title: 'Sheet',          subtitle: 'Spreadsheet editor' },
  help:        { title: 'Help & Support', subtitle: 'Team help requests and support' },
  settings:    { title: 'Settings',       subtitle: 'Customize your workspace' },
  trash:       { title: 'Archive',        subtitle: 'Deleted tasks and notes' },
};

const SKELETON_MAP = {
  dashboard:   DashboardSkeleton,
  tasks:       TasksSkeleton,
  team:        TeamSkeleton,
  financial:   FinancialSkeleton,
  roles:       RolesSkeleton,
  performance: PerformanceSkeleton,
  reports:     ReportsSkeleton,
  notes:       NotesSkeleton,
  help:        HelpSkeleton,
  settings:    SettingsSkeleton,
  trash:       NotesSkeleton,
};

// ── Page renderer ─────────────────────────────────────────────────────────────
function renderPage(activeItem, handleNav, extraProps = {}, onNavigateToNotes, setPageFilteredData, currentUser = null) {
  console.log('[App.jsx renderPage] Rendering page:', activeItem, 'with props:', extraProps);
  switch (activeItem) {
    case 'tasks':       return <TasksPage onNavigateToNotes={() => handleNav('notes')} onNavigateToManage={() => handleNav('roles')} onNavigateToFinancial={(taskId) => handleNav('financial', { prefilledTaskId: taskId })} setPageFilteredData={setPageFilteredData} filterToTaskId={extraProps.filterToTaskId} {...extraProps} />;
    case 'team':        return <TeamPage onNavigateToManage={() => handleNav('roles')} setPageFilteredData={setPageFilteredData} currentUser={currentUser} {...extraProps} />;
    case 'financial':   
      console.log('[App.jsx renderPage] Rendering FinancialPage with props:', { prefilledTaskId: extraProps.prefilledTaskId, filterToTaskId: extraProps.filterToTaskId });
      return <FinancialPage prefilledTaskId={extraProps.prefilledTaskId} filterToTaskId={extraProps.filterToTaskId} setPageFilteredData={setPageFilteredData} />;
    case 'roles':       return <RolesPage />;
    case 'performance': return <PerformancePage />;
    case 'reports':     return <ReportsPage />;
    case 'notes':       return <NotesPage onNavigateToTask={() => handleNav('tasks')} selectedScribeId={extraProps.selectedScribeId} onScribeOpened={extraProps.onScribeOpened} setPageFilteredData={setPageFilteredData} />;
    case 'sheet':       return <SheetPage />;
    case 'help':        return <HelpPage setPageFilteredData={setPageFilteredData} />;
    case 'trash':       return <TrashPage />;
    case 'settings':    return <SettingsPage />;
    default:            return <Dashboard {...extraProps} onNavigateToNotes={onNavigateToNotes} />;
  }
}

// ── Overlays ──────────────────────────────────────────────────────────────────
function ProfileWelcomeOverlay({ onDone }) {
  const [fading, setFading] = useState(false);
  const animationData = useProfileCardAnimation();
  const dismiss = () => { setFading(true); setTimeout(onDone, 500); };
  const { View } = useLottie({
    animationData: animationData ?? null,
    loop: false, autoplay: !!animationData, onComplete: dismiss,
    style: { width: '100vw', height: '100vh' },
  });
  useEffect(() => { const t = setTimeout(dismiss, 4000); return () => clearTimeout(t); }, []);
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(255,255,255,0.95)', pointerEvents: 'none',
      opacity: fading ? 0 : 1, transition: 'opacity 0.5s ease',
    }}>{animationData ? View : null}</div>
  );
}

function WelcomeOverlay({ onDone }) {
  const [fading, setFading] = useState(false);
  const animationData = useWelcomeAnimation();
  const dismiss = () => { setFading(true); setTimeout(onDone, 400); };
  const { View } = useLottie({
    animationData: animationData ?? null,
    loop: false, autoplay: !!animationData, onComplete: dismiss,
    style: { width: '100vw', height: '100vh' },
  });
  useEffect(() => { const t = setTimeout(dismiss, 4000); return () => clearTimeout(t); }, []);
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
      background: 'rgba(15,20,40,0.35)', pointerEvents: 'none',
      opacity: fading ? 0 : 1, transition: 'opacity 0.4s ease',
    }}>{animationData ? View : null}</div>
  );
}

function ProfileUserCardOverlay({ onDone }) {
  const [fading, setFading] = useState(false);
  const animationData = useProfileUserCardAnimation();
  const dismiss = () => { setFading(true); setTimeout(onDone, 500); };
  const { View } = useLottie({
    animationData: animationData ?? null,
    loop: false, autoplay: !!animationData, onComplete: dismiss,
    style: { width: '100vw', height: '100vh', objectFit: 'cover' },
  });
  useEffect(() => { const t = setTimeout(dismiss, 4000); return () => clearTimeout(t); }, []);
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
      background: 'rgba(15,20,40,0.35)', pointerEvents: 'none',
      opacity: fading ? 0 : 1, transition: 'opacity 0.5s ease',
    }}>{animationData ? View : null}</div>
  );
}

function PlanInactiveOverlay() {
  const { triggerPlanBlink } = useApp();
  return (
    <div
      onClick={() => triggerPlanBlink()}
      style={{ position: 'absolute', inset: 0, zIndex: 500, cursor: 'default', background: 'transparent' }}
    />
  );
}

// ── Management Password Prompt ────────────────────────────────────────────────
function MgmtPasswordPrompt({ onComplete }) {
  const { adminPassword } = useApp();
  const [pwd, setPwd] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [focus, setFocus] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (pwd === adminPassword) {
      onComplete();
    } else {
      setError('Incorrect password. Please try again.');
      setPwd('');
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(4px)', background: 'rgba(15,20,40,0.35)',
    }}>
      <div style={{
        background: '#fff', borderRadius: 24, padding: '40px 44px 36px',
        width: '100%', maxWidth: 420,
        boxShadow: '0 24px 64px rgba(59,91,252,0.12)',
        animation: 'wsSetupIn 0.4s cubic-bezier(0.22,1,0.36,1) both',
      }}>
        <style>{`@keyframes wsSetupIn { from { opacity:0; transform:translateY(24px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }`}</style>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, #7C3AED, #3B5BFC)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1A1D2E', letterSpacing: '-0.5px', marginBottom: 4 }}>Management Access</h2>
        <p style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 24 }}>Enter the admin password to access the management dashboard.</p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ position: 'relative' }}>
            <input
              autoFocus
              type={show ? 'text' : 'password'}
              value={pwd}
              onChange={e => { setPwd(e.target.value); setError(''); }}
              placeholder="Admin password"
              style={{
                width: '100%', height: 48, borderRadius: 10, boxSizing: 'border-box',
                border: `1.5px solid ${error ? '#FECACA' : focus ? '#7C3AED' : '#E5E7EB'}`,
                padding: '0 44px 0 16px', fontSize: 14, color: '#1A1D2E', outline: 'none',
                background: focus ? '#F9F5FF' : '#FAFBFF',
                boxShadow: focus ? '0 0 0 3px rgba(124,58,237,0.10)' : 'none',
                transition: 'border-color 0.2s, background 0.2s',
              }}
              onFocus={() => setFocus(true)}
              onBlur={() => setFocus(false)}
            />
            <button type="button" onClick={() => setShow(v => !v)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#9CA3AF' }}>
              {show
                ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              }
            </button>
          </div>
          {error && (
            <div style={{ background: '#FEF2F2', border: '1.5px solid #FECACA', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#DC2626', fontWeight: 500 }}>
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={!pwd}
            style={{ width: '100%', height: 50, borderRadius: 12, border: 'none', background: pwd ? 'linear-gradient(135deg, #7C3AED, #3B5BFC)' : '#E5E7EB', color: pwd ? '#fff' : '#9CA3AF', fontSize: 15, fontWeight: 700, cursor: pwd ? 'pointer' : 'default', boxShadow: pwd ? '0 6px 20px rgba(124,58,237,0.3)' : 'none', transition: 'all 0.2s' }}
          >
            Enter Dashboard
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Main shell ────────────────────────────────────────────────────────────────
function AppShell() {
  const [auth, setAuth]               = useState(null);
  const [authLoading, setAuthLoading] = useState(true); // Start as true - checking auth
  const [activeItem, setActiveItem]   = useState(() => {
    // Restore page from URL hash first, then localStorage on refresh
    try {
      const hash = window.location.hash.replace('#', '');
      if (hash && ['dashboard', 'tasks', 'team', 'financial', 'roles', 'performance', 'reports', 'notes', 'sheet', 'help', 'settings', 'trash'].includes(hash)) {
        return hash;
      }
      return localStorage.getItem('lastActivePage') || 'dashboard';
    } catch {
      return 'dashboard';
    }
  });
  const [dashVisible, setDashVisible] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);
  const [pageKey, setPageKey]         = useState(0);
  const [visitedPages, setVisitedPages] = useState(new Set());
  const [openCreateOnMount, setOpenCreateOnMount] = useState(false);
  const [showWorkspaceSetup, setShowWorkspaceSetup] = useState(false);
  const [workspace, setWorkspace]     = useState(null);
  const [showLoader, setShowLoader]   = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showMgmtPwdPrompt, setShowMgmtPwdPrompt] = useState(false);
  const [triggerMgmtAnimation, setTriggerMgmtAnimation] = useState(false); // Trigger management animations after setup
  const [sessionExpired, setSessionExpired] = useState(false);
  const [needsPlanCheck, setNeedsPlanCheck] = useState(false); // Force LoginPage to check for plan
  const [isPlanSelectionActive, setIsPlanSelectionActive] = useState(false); // Track if plan selection is showing
  const [pageExtraProps, setPageExtraProps] = useState({}); // Store extra props for pages (like prefilledTaskId)
  const [selectedScribeId, setSelectedScribeId] = useState(null); // Track scribe to open in NotesPage
  const [pageFilteredData, setPageFilteredData] = useState({}); // Store filtered/paginated data from each page for search
  const [feedbackRequest, setFeedbackRequest] = useState(null); // Feedback request from admin

  // Track page navigation
  useEffect(() => {
    console.log('[App.jsx Navigation] Page changed to:', activeItem);
    monitor.trackPageLoad(`admin_${activeItem}`);
    // Persist active page to localStorage for refresh restoration
    try {
      localStorage.setItem('lastActivePage', activeItem);
      console.log('[App.jsx Navigation] Saved to localStorage:', activeItem);
    } catch (err) {
      console.error('[App.jsx Navigation] Failed to save to localStorage:', err);
    }
  }, [activeItem]);
  
  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = (event) => {
      // Prevent going back to website - stay within app
      const currentPath = window.location.pathname;
      if (!currentPath.includes('/app')) {
        // User navigated outside /app - redirect back to app
        window.history.pushState({ page: activeItem }, '', '/app#' + activeItem);
        window.location.href = '/app#' + activeItem;
        return;
      }
      
      if (event.state && event.state.page) {
        setActiveItem(event.state.page);
      } else {
        // Check URL hash for page
        const hash = window.location.hash.replace('#', '');
        if (hash && hash !== activeItem) {
          setActiveItem(hash);
        }
      }
    };
    
    window.addEventListener('popstate', handlePopState);
    
    // Set initial history state and add a sentinel entry to prevent going back to website
    const currentPath = window.location.pathname;
    const basePath = currentPath.includes('/app') ? '/app' : '';
    
    // Add a sentinel entry at the start of history to block going back to website
    if (window.history.state === null || !window.history.state.isAppEntry) {
      window.history.pushState({ isAppEntry: true, page: 'dashboard' }, '', `${basePath}#dashboard`);
    }
    
    // Replace current state with active page
    window.history.replaceState({ page: activeItem }, '', `${basePath}#${activeItem}`);
    
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
  
  // Track first-ever setup locally so the welcome animation isn't skipped
  const isFirstSetupRef = useRef(false);
  const mgmtAnimationTriggeredRef = useRef(false); // Prevent duplicate management animation triggers

  // Debug: Log when showWorkspaceSetup changes
  useEffect(() => {

  }, [showWorkspaceSetup]);

  const SESSION_TIMEOUT_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
  const ACTIVITY_THROTTLE  = 5 * 60 * 1000;            // 5 minutes

  const loadingStates = [
    { text: 'Setting up your workspace...' },
    { text: 'Loading your projects...' },
    { text: 'Syncing team members...' },
    { text: 'Preparing your dashboard...' },
    { text: 'Almost there...' },
  ];

  const { dataLoaded, refreshData, isPlanActive, setShowDonutWelcome, setCurrentUser, currentUser, currentUid, setCurrentUid, setWorkspaceId, hasSeenDonutWelcome, hasCompletedSetup, saveWorkspaceSettings, workspaceId, workspaceName, dataLoadError } = useApp();

  // ── Listen for feedback requests from admin ──
  useEffect(() => {
    // Always use workspaceId if available, otherwise use 'ALL' to catch broadcasts to all organizations
    const listenerId = workspaceId || 'ALL';
    
    // Get user's join date to filter out old broadcasts
    const userCreatedAt = currentUser?.createdAt?.toDate ? currentUser.createdAt.toDate() : null;

    // Don't require currentUid - listener can work without it
    // currentUid is only needed for dismissing feedback, not for receiving it

    const unsubscribe = listenForFeedbackRequests(listenerId, (request) => {

      setFeedbackRequest(request);
    }, userCreatedAt);
    
    return () => {

      unsubscribe();
    };
  }, [workspaceId, currentUid, currentUser]);

  // ── Persistent session via onAuthStateChanged ──
  // Use a ref to track if login was already handled by LoginPage
  // to prevent double-trigger on signup (Firebase fires onAuthStateChanged immediately after createUser)
  const loginHandledRef = useRef(false);
  const loginInProgressRef = useRef(false); // Track if login is currently in progress
  const logoutInProgressRef = useRef(false);
  const expiredLogoutRef = useRef(false); // true only when logout was triggered by session expiry

  useEffect(() => {
    const SESSION_TIMEOUT_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

    const unsubscribe = onAuthChanged(async (user) => {

      // Skip if logout is in progress — prevents false expiry detection
      if (logoutInProgressRef.current) {

        // Don't process anything during logout - wait for logout to complete
        return;
      }
      
      // Skip if login is in progress — let LoginPage handle it
      if (loginInProgressRef.current) {

        // Don't set authLoading to false yet - let handleLogin complete
        return;
      }
      
      if (!user) {
        // No user - logged out state

        // If logout is in progress, this is expected - don't do anything
        if (logoutInProgressRef.current) {

          // Don't process anything during logout
          return;
        }
        
        // If login is in progress and user becomes null, this might be a race condition
        // Wait for login to complete instead of showing login page
        if (loginInProgressRef.current) {

          // Don't set authLoading to false yet - let handleLogin complete
          return;
        }
        
        // User is logged out - set authLoading to false to show login page
        // But only if we're not in the middle of logout or login
        if (!logoutInProgressRef.current && !loginInProgressRef.current) {
          setAuthLoading(false);
        }
        return;
      }
      
      // User is authenticated - proceed with profile loading

      if (user) {
        const profile = await getProfile(user.uid);
        if (profile) {
          const now = Date.now();
          const sinceActivity = profile.lastActivityTime ? now - profile.lastActivityTime.toMillis() : 0;

          // Session expires ONLY if inactive for 7 days (no loginTime check)
          // BUT: Skip expiry check if user just logged in (loginTime is recent)
          // This prevents "Session Expired" error on fresh login after many days
          const sinceLogin = profile.loginTime ? now - profile.loginTime.toMillis() : Infinity;
          const isRecentLogin = sinceLogin < 60000; // Logged in within last 60 seconds
          
          if (sinceActivity >= SESSION_TIMEOUT_MS && !isRecentLogin) {
            expiredLogoutRef.current = true;
            logoutInProgressRef.current = true;
            await signOutUser();
            if (currentUid) clearSession(currentUid).catch(() => {});
            logoutInProgressRef.current = false;
            setSessionExpired(true);
            setAuthLoading(false);
            return;
          }

          if (profile.workspaceId) setWorkspaceId(profile.workspaceId);

          // Check user's own hasCompletedSetup flag (per-user, not workspace)
          let completedSetup = profile.hasCompletedSetup === true;
          
          // ⭐ Determine user role and normalize it
          // Map Firestore profile.role to userRole (admin/management/member)
          let userRole = 'member'; // default
          
          if (profile.workspaceId && profile.workspaceId === `ws_${user.uid}`) {
            // User's workspace ID matches their UID - they are the owner/admin
            userRole = 'admin';

          } else if (profile.role) {
            // Map profile.role to userRole
            const roleLower = profile.role.toLowerCase();
            if (roleLower === 'admin' || roleLower.includes('admin')) {
              userRole = 'admin';
            } else if (roleLower === 'management' || roleLower.includes('management') || roleLower.includes('manager')) {
              userRole = 'management';
            } else {
              userRole = 'member';
            }

          }

          let hasPlan = false;
          
          if (profile.workspaceId) {
            try {
              // Check workspace doc for plan selection AND setup completion
              const workspaceSnap = await getDoc(doc(db, 'workspaces', profile.workspaceId));
              if (workspaceSnap.exists()) {
                const wsData = workspaceSnap.data();
                hasPlan = wsData?.plan?.id != null;
                
                // Check workspace's hasCompletedSetup flag (most reliable source)
                const workspaceSetupComplete = wsData?.settings?.hasCompletedSetup === true;

                // For workspace owners (admins), use workspace's setup flag
                // For other users, use their own profile flag
                if (profile.workspaceId === `ws_${user.uid}`) {
                  // User is workspace owner - use workspace setup flag
                  completedSetup = workspaceSetupComplete;

                } else {
                  // User is not owner - use their own profile flag
                  completedSetup = profile.hasCompletedSetup === true;

                }
                
                // Store workspace settings for pre-filling setup form
                // Only pre-fill if workspace has been set up before (has name)
                if (wsData?.settings && wsData.settings.workspaceName) {
                  const workspaceData = {
                    workspaceName: wsData.settings.workspaceName || '',
                    workspaceSub: wsData.settings.workspaceSub || '',
                    workspaceLogo: wsData.settings.workspaceLogo || null,
                  };

                  setWorkspace(workspaceData);
                } else {

                  setWorkspace(null);
                }
              } else {
                // Workspace document doesn't exist - first time setup needed

                completedSetup = false;
              }
            } catch (err) {

              // On error, assume setup not complete to be safe
              completedSetup = false;
            }
          }

          // If admin without completed setup OR without a plan, don't auto-login via onAuthStateChanged
          // Instead, show LoginPage which will handle plan selection if needed
          // EXCEPTION: If this is a session re-login (user was already logged in before), always let them through
          const isRelogin = expiredLogoutRef.current || sessionExpired;
          
          // For admins without plan or setup, we need to show LoginPage so they can complete the flow
          // But we should NOT block them if they're in the middle of the flow (loginInProgressRef)
          if (userRole === 'admin' && (!completedSetup || !hasPlan) && !isRelogin) {
            // Don't call handleLogin - let LoginPage handle it
            // LoginPage will show plan selection if needed
            console.log('[App.jsx onAuthStateChanged] Admin needs plan/setup - showing LoginPage with plan check');
            setIsPlanSelectionActive(true); // Mark that plan selection is active
            setNeedsPlanCheck(true); // Tell LoginPage to check for plan
            setAuthLoading(false);
            setAuth(null); // Clear auth to show LoginPage
            return;
          }
          
          // If this is a re-login after session expiry, always mark setup as complete
          // to prevent showing workspace setup again
          if (isRelogin && completedSetup === false) {
            completedSetup = true;

          }

          // CRITICAL: Set currentUid IMMEDIATELY before any async operations
          // This ensures Firestore listeners have the uid when they initialize

          setCurrentUid(user.uid);

          // Also set workspaceId immediately
          if (profile.workspaceId) {

            setWorkspaceId(profile.workspaceId);
          }
          
          // Only call handleLogin if it hasn't been handled by LoginPage
          // loginHandledRef is set to true after LoginPage completes login
          // On reload, loginHandledRef is false, so handleLogin will be called
          // CRITICAL: Also check loginInProgressRef to prevent race condition during login
          // ALSO: Don't call handleLogin if plan selection is currently active
          if (!loginHandledRef.current && !loginInProgressRef.current && !isPlanSelectionActive) {

            // Don't set authLoading to false yet - let handleLogin do it after setting auth state
            handleLogin(userRole, profile.memberId, profile.email, profile.workspaceId || null, completedSetup, false);
          } else {
            // LoginPage already handled login OR login is in progress OR plan selection is active

            if (loginInProgressRef.current) {

            }
            if (isPlanSelectionActive) {
              console.log('[App.jsx onAuthStateChanged] Skipping handleLogin - plan selection is active');
            }
            // Ensure workspace is set even if we skip handleLogin
            if (profile.workspaceId) setWorkspaceId(profile.workspaceId);
            // Only set authLoading to false if we're NOT going to call handleLogin
            setAuthLoading(false);
          }
        }
      } else {
        // No user - logged out state

        // Set authLoading to false to show login page
        setAuthLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (initialLoading && dataLoaded) {
      setInitialLoading(false);
      setVisitedPages(new Set(['dashboard']));
    }
  }, [dataLoaded, initialLoading]);

  // ── Activity tracker — throttled lastActivityTime update ──────────────────
  useEffect(() => {
    if (!currentUid) return;
    let lastWrite = 0;
    const updateActivity = () => {
      // Double-check currentUid is still valid before writing
      if (!currentUid) return;
      const now = Date.now();
      if (now - lastWrite < ACTIVITY_THROTTLE) return;
      lastWrite = now;
      updateDoc(doc(db, 'users', currentUid), {
        lastActivityTime: serverTimestamp(),
      }).catch(() => {}); // Silently fail if Firestore is in invalid state
    };
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach(e => window.addEventListener(e, updateActivity, { passive: true }));
    return () => events.forEach(e => window.removeEventListener(e, updateActivity));
  }, [currentUid]);

  const handleLogin = async (role, memberId, email, workspaceIdParam = null, completedSetup = null, isNewSignup = false) => {
    console.log('[App.jsx handleLogin] Starting login:', { role, memberId, email, workspaceIdParam, completedSetup, isNewSignup });
    const callStack = new Error().stack;

    // Prevent duplicate calls - if login is already in progress, ignore
    if (loginInProgressRef.current) {
      console.warn('[App.jsx handleLogin] Login already in progress - ignoring');
      return;
    }
    
    // Mark that login is in progress IMMEDIATELY to prevent race conditions
    loginInProgressRef.current = true;
    loginHandledRef.current = true;
    console.log('[App.jsx handleLogin] Marked login as in progress');
    
    // Set authLoading to true during login to prevent flicker
    setAuthLoading(true);
    
    // Clear plan selection active flag - user is now logging in
    setIsPlanSelectionActive(false);
    
    // Clear session expired state
    expiredLogoutRef.current = false;
    setSessionExpired(false);
    
    // Set currentUid immediately at the start of handleLogin
    const { getAuth } = await import('firebase/auth');
    const uid = getAuth().currentUser?.uid;
    if (uid) {
      console.log('[App.jsx handleLogin] Setting currentUid:', uid);
      setCurrentUid(uid);
    } else {
      console.warn('[App.jsx handleLogin] No Firebase Auth user found');
    }
    
    // Load workspace data if needed (for management/admin users who need WorkspaceSetup)
    if ((role === 'admin' || role === 'management') && workspaceIdParam && !workspace) {

      try {
        const workspaceSnap = await getDoc(doc(db, 'workspaces', workspaceIdParam));
        if (workspaceSnap.exists()) {
          const wsData = workspaceSnap.data();
          if (wsData?.settings && wsData.settings.workspaceName) {
            const workspaceData = {
              workspaceName: wsData.settings.workspaceName || '',
              workspaceSub: wsData.settings.workspaceSub || '',
              workspaceLogo: wsData.settings.workspaceLogo || null,
            };

            setWorkspace(workspaceData);
          } else {

            setWorkspace(null);
          }
        }
      } catch (err) {

        // Don't block login - workspace data can be loaded later if needed
      }
    }
    
    if (email) {
      if (workspaceIdParam) setWorkspaceId(workspaceIdParam);
      
      // Load user profile from Firestore to get name and phone
      if (uid) {
        const { getProfile } = await import('./lib/userProfileService');
        try {
          const profileData = await getProfile(uid);
          if (profileData) {
            let actualRoleName = role === 'admin' ? 'Administrator' : role === 'management' ? 'Management' : 'Team Member';
            
            // For all users, fetch their actual role name from team collection if they have a memberId
            if (profileData.workspaceId && profileData.memberId) {
              try {
                const memberDoc = await getDoc(doc(db, `workspaces/${profileData.workspaceId}/team/${profileData.memberId}`));
                if (memberDoc.exists()) {
                  actualRoleName = memberDoc.data().role || actualRoleName;
                }
              } catch (err) {

              }
            }
            
            const profile = {
              uid: uid, // Add Firebase Auth uid
              name: profileData.name || email.split('@')[0],
              email: profileData.email || email,
              phone: profileData.phone || '',
              role: actualRoleName,
              avatar: (profileData.name || email)[0].toUpperCase(),
              avatarImg: profileData.avatarImg || null, // Add profile picture
              color: profileData.color || '#3B5BFC', // ⭐ Use profile color if available
              userRole: role || profileData.role || 'member', // Fallback to profileData.role if role param is missing
              memberId: profileData.memberId || null, // Add memberId to identify team members
              hasSeenWelcomeAnimation: profileData.hasSeenWelcomeAnimation === true ? true : false,
            };

            setCurrentUser(profile);
          }
        } catch (err) {
          // Fallback if profile fetch fails
          const profile = { 
            uid: uid, // Add Firebase Auth uid
            name: email.split('@')[0], 
            email,
            phone: '',
            role: role === 'admin' ? 'Administrator' : role === 'management' ? 'Management' : 'Team Member', 
            avatar: email[0].toUpperCase(), 
            color: '#3B5BFC', // ⭐ Default color for fallback
            userRole: role,
            hasSeenWelcomeAnimation: false,
          };
          setCurrentUser(profile);
        }
      }
    }
    
    // Set all auth-related states together to minimize re-renders
    console.log('[App.jsx handleLogin] Setting auth state:', { role, memberId });
    setInitialLoading(true);
    setVisitedPages(new Set());
    setAuth({ role, memberId });
    
    // Set authLoading to false AFTER setting auth to prevent login page flash
    setAuthLoading(false);
    console.log('[App.jsx handleLogin] Auth state set, authLoading = false');
    
    // Use setTimeout with 0 to batch the next state updates
    setTimeout(() => {
      setDashVisible(true);
      
      // Mark login as complete
      loginInProgressRef.current = false;
      
      if (role === 'admin') {
        // Note: LoginPage already validates that admin has selected a plan
        // No need to check again here - trust LoginPage's validation
        
        // Show workspace setup if:
        // 1. isNewSignup === true (brand new admin, first time setup)
        // 2. completedSetup === false (workspace not set up yet)
        // Otherwise, go directly to dashboard (returning admin)
        const shouldShowSetup = isNewSignup || completedSetup === false;

        if (shouldShowSetup) {

          setShowWorkspaceSetup(true);
        } else {

          // Returning admin with completed setup - go straight to dashboard
          setShowWorkspaceSetup(false); // Explicitly set to false
          setInitialLoading(false);
          setVisitedPages(new Set(['dashboard']));
          
          // Trigger donut welcome if not seen yet (for returning users who skip animations)

          if (!hasSeenDonutWelcome) {

            // Wait for dashboard to fully render before showing donut
            setTimeout(() => {

              setShowDonutWelcome(true);
            }, 1500);
          } else {

          }
        }
      } else if (role === 'management') {
        // Management users also go through workspace setup (pre-filled + password)
        // Only show setup for first-time management users
        const shouldShowSetup = isNewSignup || completedSetup === false;

        if (shouldShowSetup) {

          setShowWorkspaceSetup(true);
        } else {

          // Returning management user - go straight to dashboard
          setShowWorkspaceSetup(false);
          setInitialLoading(false);
          setVisitedPages(new Set(['dashboard']));
          
          // Trigger donut welcome if not seen yet

          if (!hasSeenDonutWelcome) {

            setTimeout(() => {

              setShowDonutWelcome(true);
            }, 1500);
          } else {

          }
        }
      } else {

        setInitialLoading(false);
        setVisitedPages(new Set(['dashboard']));
      }
      
      // Login process complete
      loginInProgressRef.current = false;
    }, 50);
  };

  const handleLogout = async (expired = false) => {

    expiredLogoutRef.current = false; // manual logout — never expired
    setSessionExpired(false);
    logoutInProgressRef.current = true;
    loginInProgressRef.current = false; // Reset login progress flag
    loginHandledRef.current = false; // Reset login handled flag
    setIsPlanSelectionActive(false); // Clear plan selection flag
    
    // CRITICAL: Clear currentUid FIRST to trigger listener cleanup in AppContext

    const uidToClean = currentUid;
    setCurrentUid(null);
    setWorkspaceId(null);
    setCurrentUser(null);
    
    // Clear all localStorage cache related to app state
    try {
      localStorage.removeItem('lastActivePage');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('workspaceId');
      // Don't clear teamMemberFormCache - that's for form persistence
    } catch (err) {
      console.error('[handleLogout] Error clearing localStorage:', err);
    }
    
    // Wait for React to process the state update and cleanup listeners
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Clear session fields in Firestore before signing out
    if (uidToClean) {
      try { 

        await clearSession(uidToClean); 
      } catch (err) {

      }
    }
    
    // Sign out from Firebase
    try { 

      await signOutUser(); 
    } catch (err) { 

    }
    
    // Wait a bit for Firebase to propagate the logout
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // Reset ALL application state to initial values
    setAuth(null);
    setDashVisible(false);
    setInitialLoading(false);
    setVisitedPages(new Set());
    setActiveItem('dashboard');
    setShowWorkspaceSetup(false);
    setWorkspace(null);
    setShowMgmtPwdPrompt(false);
    setShowDonutWelcome(false);
    setNeedsPlanCheck(false);
    
    // IMPORTANT: Set logoutInProgressRef to false BEFORE setting authLoading to false
    // This allows onAuthChanged to process the logout properly
    logoutInProgressRef.current = false;
    
    // Wait a tiny bit for the flag to propagate
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Set authLoading to false after all cleanup to show login page
    setAuthLoading(false);

  };

  const handleNav = (item, extraProps = {}) => {
    if (item === activeItem) { refreshData(); return; }
    
    // Update browser history for back button support
    const currentPath = window.location.pathname;
    const basePath = currentPath.includes('/app') ? '/app' : '';
    window.history.pushState({ page: item }, '', `${basePath}#${item}`);
    
    // Store extra props for the target page (empty object clears previous props)
    setPageExtraProps(extraProps);
    
    if (!visitedPages.has(item)) {
      setPageLoading(true);
      setTimeout(() => {
        setActiveItem(item);
        setTimeout(() => {
          setPageLoading(false);
          setVisitedPages(prev => new Set([...prev, item]));
        }, 500);
      }, 50);
    } else {
      setPageKey(k => k + 1);
      setActiveItem(item);
    }
  };

  const handleSearchResultClick = ({ type, data }) => {

    switch (type) {
      case 'task':
        if (activeItem === 'dashboard') {
          // Open task detail modal
          setPageExtraProps({ openTaskId: data.id });
          setPageKey(k => k + 1);
        } else if (activeItem === 'tasks' || activeItem === 'financial') {
          // Show ONLY this task in the table (filter to single entry)
          setPageExtraProps({ filterToTaskId: data.id });
          setPageKey(k => k + 1);
        } else if (activeItem === 'roles') {
          // Navigate to tasks page and show only this task
          handleNav('tasks');
          setTimeout(() => {
            setPageExtraProps({ filterToTaskId: data.id });
            setPageKey(k => k + 1);
          }, 100);
        } else if (activeItem === 'performance') {
          // Navigate to tasks page and show only this task
          handleNav('tasks');
          setTimeout(() => {
            setPageExtraProps({ filterToTaskId: data.id });
            setPageKey(k => k + 1);
          }, 100);
        }
        break;
      
      case 'member':
        // Highlight team member card ONLY (stay on team page, don't open modal)
        setTimeout(() => {
          const memberCard = document.querySelector(`[data-member-id="${data.id}"]`);
          if (memberCard) {
            memberCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Add highlight effect
            const originalBoxShadow = memberCard.style.boxShadow;
            memberCard.style.boxShadow = '0 0 0 3px rgba(59,91,252,0.3)';
            setTimeout(() => { 
              memberCard.style.boxShadow = originalBoxShadow; 
            }, 2000);
          }
        }, 100);
        break;
      
      case 'scribe':
        // Open scribe in notes page (stay on notes page)
        setPageExtraProps({ selectedScribeId: data.id });
        setPageKey(k => k + 1);
        break;
      
      case 'help':
        // Highlight help article (stay on help page)
        setTimeout(() => {
          const helpCard = document.querySelector(`[data-help-id="${data.id}"]`);
          if (helpCard) {
            helpCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            helpCard.style.boxShadow = '0 0 0 3px rgba(245,158,11,0.3)';
            setTimeout(() => { helpCard.style.boxShadow = ''; }, 2000);
          }
        }, 100);
        break;
    }
  };

  // ── Auth loading (waiting for onAuthStateChanged on mount) ──
  if (authLoading) {
    console.log('[App.jsx Render] Auth loading - showing skeleton');
    return (
      <>
        <SkeletonStyles />
        <AppShellSkeleton />
      </>
    );
  }

  // ── Check for auth action URL (password reset, email verification, etc.) ──
  const urlParams = new URLSearchParams(window.location.search);
  const mode = urlParams.get('mode');
  const oobCode = urlParams.get('oobCode');
  
  if (mode && oobCode) {
    console.log('[App.jsx Render] Auth action detected:', mode);
    return (
      <Suspense fallback={<div style={{ width: '100vw', height: '100vh', background: '#F0F2F8' }} />}>
        <AuthActionPage />
      </Suspense>
    );
  }

  // ── Data load error - show manual retry button ──
  if (dataLoadError) {
    console.error('[App.jsx Render] Data load error:', dataLoadError);
    return <DataLoadError error={dataLoadError} onRetry={refreshData} />;
  }

  // ── Not logged in ──
  if (!auth) {
    console.log('[App.jsx Render] Not logged in - showing LoginPage');
    return (
      <LoginPage onLogin={handleLogin} sessionExpired={sessionExpired} onClearExpired={() => setSessionExpired(false)} checkPlanOnMount={needsPlanCheck} />
    );
  }

  // ── Member role ──
  if (auth.role === 'member') {
    console.log('[App.jsx Render] Rendering MemberApp for memberId:', auth.memberId);
    return (
      <Suspense fallback={<div style={{ width: '100vw', height: '100vh', background: '#F0F2F8' }} />}>
        <MemberApp memberId={auth.memberId} onLogout={handleLogout} visible={dashVisible} />
      </Suspense>
    );
  }

  // ── Management role ──
  if (auth.role === 'management') {
    console.log('[App.jsx Render] Rendering ManagementApp for management user');
    return (
      <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
        {/* Management Dashboard (blurred when setup/loader is showing) */}
        <div style={{
          width: '100%', height: '100%',
          opacity: dashVisible ? 1 : 0,
          transform: dashVisible ? 'translateY(0)' : 'translateY(10px)',
          transition: 'opacity 0.7s ease, transform 0.7s ease',
          filter: showWorkspaceSetup || showLoader ? 'blur(4px) brightness(0.85)' : 'none',
          pointerEvents: showWorkspaceSetup || showLoader ? 'none' : 'auto',
        }}>
          <Suspense fallback={<div style={{ width: '100vw', height: '100vh', background: '#F0F2F8' }} />}>
            <ManagementApp 
              memberId={auth.memberId} 
              onLogout={handleLogout} 
              visible={dashVisible}
              triggerWelcomeAnimation={triggerMgmtAnimation}
            />
          </Suspense>
        </div>

        {/* WorkspaceSetup overlay */}
        {showWorkspaceSetup && (
          <WorkspaceSetup
            existingWorkspace={workspace}
            isManagement={true}
            onComplete={(ws) => {
              console.log('[App.jsx WorkspaceSetup] Setup completed for management:', ws);
              setWorkspace(ws);
              setShowWorkspaceSetup(false);
              isFirstSetupRef.current = true; // Mark first setup for welcome animation
              setShowLoader(true);
            }}
          />
        )}

        {/* Loader overlay */}
        <MultiStepLoader
          loadingStates={loadingStates}
          loading={showLoader}
          duration={1200}
          loop={false}
          onComplete={() => {
            setShowLoader(false);
            console.log('[App.jsx Loader] Loader complete for management');
            // Prevent duplicate triggers
            if (mgmtAnimationTriggeredRef.current) {
              console.log('[App.jsx Loader] Management animation already triggered');
              setDashVisible(true);
              return;
            }
            
            // Show welcome animation only on very first setup (ref set by WorkspaceSetup)
            if (isFirstSetupRef.current) {
              isFirstSetupRef.current = false;
              mgmtAnimationTriggeredRef.current = true; // Mark as triggered
              
              // Check if user has seen donut welcome animation

              if (!hasSeenDonutWelcome) {

                // Trigger profile card animation in ManagementApp
                setTriggerMgmtAnimation(true);
              } else {

              }
            }
            
            setDashVisible(true);
          }}
        />

        {/* Welcome animation overlay - ProfileUserCardOverlay for management */}
        {showWelcome && (
          <ProfileUserCardOverlay onDone={() => {

            setShowWelcome(false);
            // Trigger donut welcome after dashboard has had time to render

            if (!hasSeenDonutWelcome) {

              setTimeout(() => setShowDonutWelcome(true), 600);
            } else {

            }
          }} />
        )}
      </div>
    );
  }

  // ── Admin role ──
  console.log('[App.jsx Render] Rendering admin dashboard - activeItem:', activeItem);
  const page = pageConfig[activeItem] || pageConfig['dashboard'];
  const SkeletonComp = SKELETON_MAP[activeItem] || DashboardSkeleton;

  const handleCreateTaskFromDashboard = () => {
    setOpenCreateOnMount(true);
    handleNav('tasks');
  };

  const extraProps = activeItem === 'tasks'
    ? { openCreateOnMount, onCreateMounted: () => setOpenCreateOnMount(false), currentUser }
    : activeItem === 'dashboard'
    ? { onCreateTask: handleCreateTaskFromDashboard }
    : activeItem === 'team'
    ? { currentUser }
    : {};

  if (initialLoading) {
    console.log('[App.jsx Render] Initial loading - showing skeleton for:', activeItem);
    return (
      <>
        <SkeletonStyles />
        <AppShellSkeleton page={activeItem} />
      </>
    );
  }

  console.log('[App.jsx Render] Rendering admin dashboard with dashVisible:', dashVisible, 'pageLoading:', pageLoading);
  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <div style={{
        display: 'flex', width: '100%', height: '100%',
        background: 'var(--bg-main)',
        opacity: dashVisible ? 1 : 0,
        transform: dashVisible ? 'translateY(0)' : 'translateY(10px)',
        transition: 'opacity 0.7s ease, transform 0.7s ease, background 0.25s ease',
        filter: showWorkspaceSetup || showLoader ? 'blur(4px) brightness(0.85)' : 'none',
        pointerEvents: showWorkspaceSetup || showLoader ? 'none' : 'auto',
      }}>
        <SkeletonStyles />
        <Sidebar activeItem={activeItem} setActiveItem={handleNav} onLogout={handleLogout} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100%', background: 'var(--bg-main)', overflow: 'hidden', transition: 'background 0.25s ease', position: 'relative' }}>
          <Header 
            title={page.title} 
            subtitle={page.subtitle} 
            currentPage={activeItem}
            onSearchResultClick={handleSearchResultClick}
            pageFilteredData={pageFilteredData}
          />
          <div
            key={pageKey}
            className="page-enter"
            style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden', position: 'relative' }}
          >
            {pageLoading
              ? <SkeletonComp />
              : (
                <Suspense fallback={<SkeletonComp />}>
                  {renderPage(activeItem, handleNav, { 
                    ...extraProps, 
                    ...pageExtraProps,
                    selectedScribeId,
                    onScribeOpened: () => {

                      setSelectedScribeId(null);
                    }
                  }, (noteId) => {

                    setSelectedScribeId(noteId);
                    handleNav('notes');
                  }, setPageFilteredData, currentUser)}
                </Suspense>
              )
            }
            {!isPlanActive && activeItem !== 'settings' && <PlanInactiveOverlay />}
          </div>
        </div>
      </div>

      {showWorkspaceSetup && (
        <WorkspaceSetup
          existingWorkspace={workspace}
          isManagement={auth?.role === 'management'}
          onComplete={(ws) => {

            setWorkspace(ws);
            setShowWorkspaceSetup(false);
            isFirstSetupRef.current = true; // mark first setup for welcome animation
            setShowLoader(true);
          }}
        />
      )}

      {showMgmtPwdPrompt && (
        <MgmtPasswordPrompt
          onComplete={() => {
            setShowMgmtPwdPrompt(false);
            setShowLoader(true);
          }}
        />
      )}

      <MultiStepLoader
        loadingStates={loadingStates}
        loading={showLoader}
        duration={1200}
        loop={false}
        onComplete={() => {
          setShowLoader(false);

          // Show welcome animation only on very first setup (ref set by WorkspaceSetup)
          // OR if user hasn't seen the welcome animation before
          if (isFirstSetupRef.current) {
            isFirstSetupRef.current = false;
            
            // Check if user has seen welcome animation
            const hasSeenWelcome = currentUser?.hasSeenWelcomeAnimation;

            if (!hasSeenWelcome) {

              setShowWelcome(true);
              
              // Mark as seen in Firestore
              const markWelcomeSeen = async () => {
                try {
                  const { getAuth } = await import('firebase/auth');
                  const { updateProfile } = await import('./lib/userProfileService');
                  const auth = getAuth();
                  const uid = auth.currentUser?.uid;
                  
                  if (uid) {
                    await updateProfile(uid, { hasSeenWelcomeAnimation: true });

                    // Update currentUser state immediately so it doesn't show again
                    setCurrentUser(prev => ({
                      ...prev,
                      hasSeenWelcomeAnimation: true
                    }));
                  }
                } catch (error) {

                }
              };
              
              markWelcomeSeen();
            }
          }
        }}
      />

      {showWelcome && (
        <WelcomeOverlay onDone={() => {

          setShowWelcome(false);
          // Trigger donut welcome after dashboard has had time to render

          if (!hasSeenDonutWelcome) {

            setTimeout(() => setShowDonutWelcome(true), 600);
          } else {

          }
        }} />
      )}

      {/* Feedback Modal - Shows when admin sends feedback request */}
      {feedbackRequest && currentUser && (
        <FeedbackModal
          feedbackRequest={feedbackRequest}
          organizationId={workspaceId}
          organizationName={workspaceName || 'Your Organization'}
          userId={currentUid}
          userName={currentUser.name}
          userEmail={currentUser.email}
          userPhone={currentUser.phone || ''}
          userRole={currentUser.role}
        />
      )}
      
      {/* Debug: Show feedback request state */}
      {}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
      <Toaster />
    </AppProvider>
  );
}
