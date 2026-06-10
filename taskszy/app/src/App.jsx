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
  switch (activeItem) {
    case 'tasks':       return <TasksPage onNavigateToNotes={() => handleNav('notes')} onNavigateToManage={() => handleNav('roles')} onNavigateToFinancial={(taskId) => handleNav('financial', { prefilledTaskId: taskId })} setPageFilteredData={setPageFilteredData} filterToTaskId={extraProps.filterToTaskId} {...extraProps} />;
    case 'team':        return <TeamPage onNavigateToManage={() => handleNav('roles')} setPageFilteredData={setPageFilteredData} currentUser={currentUser} {...extraProps} />;
    case 'financial':   
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
  const [loginInProgress, setLoginInProgress] = useState(false); // Track if login is in progress (for rendering)
  const [pageExtraProps, setPageExtraProps] = useState({}); // Store extra props for pages (like prefilledTaskId)
  const [selectedScribeId, setSelectedScribeId] = useState(null); // Track scribe to open in NotesPage
  const [pageFilteredData, setPageFilteredData] = useState({}); // Store filtered/paginated data from each page for search
  const [feedbackRequest, setFeedbackRequest] = useState(null); // Feedback request from admin

  // Track page navigation
  useEffect(() => {
    monitor.trackPageLoad(`admin_${activeItem}`);
    // Persist active page to localStorage for refresh restoration
    try {
      localStorage.setItem('lastActivePage', activeItem);
    } catch (err) {
    }
  }, [activeItem]);
  
  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = (event) => {
      // Prevent going back to website - stay within app
      const currentPath = window.location.pathname;
      if (!currentPath.includes('/app')) {
        // User navigated outside /app - push state but DON'T reload the page
        // This prevents the hard reload that was breaking first login attempts
        const hash = window.location.hash.replace('#', '') || activeItem;
        window.history.pushState({ page: hash }, '', '/app#' + hash);
        // Removed: window.location.href = '/app#' + activeItem; // CAUSES PAGE RELOAD
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
    // BUT: Only do this if we're already authenticated to avoid interfering with login
    if (window.history.state === null || !window.history.state.isAppEntry) {
      // Check if we're in the middle of authentication - if so, skip history manipulation
      // This prevents interfering with login flow
      if (authStateRef.current !== 'authenticating' && !loginInProgressRef.current) {
        window.history.pushState({ isAppEntry: true, page: 'dashboard' }, '', `${basePath}#dashboard`);
      }
    }
    
    // Replace current state with active page
    // Only do this if we're not in the middle of authentication
    if (authStateRef.current !== 'authenticating' && !loginInProgressRef.current) {
      window.history.replaceState({ page: activeItem }, '', `${basePath}#${activeItem}`);
    }
    
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
    // Try multiple sources: createdAt, joinedDate, or joined timestamp
    let userCreatedAt = null;
    
    if (currentUser?.createdAt) {
      if (currentUser.createdAt.toDate) {
        userCreatedAt = currentUser.createdAt.toDate();
      } else if (currentUser.createdAt instanceof Date) {
        userCreatedAt = currentUser.createdAt;
      } else if (typeof currentUser.createdAt === 'number') {
        userCreatedAt = new Date(currentUser.createdAt);
      }
    } else if (currentUser?.joinedDate) {
      if (currentUser.joinedDate.toDate) {
        userCreatedAt = currentUser.joinedDate.toDate();
      } else if (currentUser.joinedDate instanceof Date) {
        userCreatedAt = currentUser.joinedDate;
      }
    }
    
    // If still no date, try to fetch from Firestore users document
    if (!userCreatedAt && currentUid) {
      import('./lib/firebase').then(({ db }) => {
        import('firebase/firestore').then(({ doc, getDoc }) => {
          getDoc(doc(db, 'users', currentUid)).then(userDoc => {
            if (userDoc.exists()) {
              const userData = userDoc.data();
              
              if (userData.createdAt) {
                let fetchedCreatedAt = null;
                if (userData.createdAt.toDate) {
                  fetchedCreatedAt = userData.createdAt.toDate();
                } else if (userData.createdAt instanceof Date) {
                  fetchedCreatedAt = userData.createdAt;
                } else if (typeof userData.createdAt === 'number') {
                  fetchedCreatedAt = new Date(userData.createdAt);
                }
                
                if (fetchedCreatedAt) {
                  // Re-initialize the listener with the correct date
                  // This will trigger the useEffect again with updated currentUser
                  setCurrentUser(prev => ({
                    ...prev,
                    createdAt: userData.createdAt
                  }));
                }
              }
            }
          }).catch(err => {
          });
        });
      });
    }
    

    // Don't require currentUid - listener can work without it
    // currentUid is only needed for dismissing feedback, not for receiving it

    const unsubscribe = listenForFeedbackRequests(listenerId, (request) => {
      if (request) {
      }
      setFeedbackRequest(request);
    }, userCreatedAt);
    
    return () => {
      unsubscribe();
    };
  }, [workspaceId, currentUid, currentUser?.createdAt, currentUser?.joinedDate]);

  // ── Authentication State Machine ──
  // Possible states: 'idle' | 'checking' | 'authenticating' | 'authenticated' | 'logging_out'
  const authStateRef = useRef('checking'); // Start with checking since we're loading auth state
  const loginHandledRef = useRef(false);
  const loginInProgressRef = useRef(false); // Track if login is currently in progress
  const lastLoginAttemptRef = useRef(0); // Track timestamp of last login attempt to prevent rapid duplicates
  const logoutInProgressRef = useRef(false);
  const expiredLogoutRef = useRef(false); // true only when logout was triggered by session expiry
  const authInitializedRef = useRef(false); // Track if onAuthStateChanged has fired at least once

  // Expose refs globally so LoginPage can set them before calling onLogin
  useEffect(() => {
    window.kiroAuthState = authStateRef;
    window.kiroLoginInProgress = loginInProgressRef;
    window.kiroLoginHandled = loginHandledRef;
    window.kiroLastLoginAttempt = lastLoginAttemptRef;
  }, []);

  useEffect(() => {
    const SESSION_TIMEOUT_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

    const unsubscribe = onAuthChanged(async (user) => {
      // Mark that auth has initialized (fired at least once)
      authInitializedRef.current = true;

      // STATE MACHINE: Handle logout state first
      if (authStateRef.current === 'logging_out') {
        return;
      }
      
      // STATE MACHINE: If LoginPage is actively handling authentication, skip completely
      if (authStateRef.current === 'authenticating' || loginInProgressRef.current) {
        return;
      }
      
      // Handle logged out state
      if (!user) {
        authStateRef.current = 'idle';
        
        // Only set authLoading to false if we're not in a transition state
        if (!loginInProgressRef.current && !logoutInProgressRef.current) {
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

          // Check if admin without plan or setup - show LoginPage for completion
          const isRelogin = expiredLogoutRef.current || sessionExpired;
          
          // CRITICAL: If LoginPage set loginHandledRef, it means LoginPage is handling this login
          // Do NOT interfere - just return and let LoginPage complete the flow
          if (loginHandledRef.current) {
            return;
          }
          
          
          // For admins without plan, redirect to LoginPage which will show plan selection
          if (userRole === 'admin' && !hasPlan && !isRelogin) {
            authStateRef.current = 'idle';
            setIsPlanSelectionActive(true);
            setNeedsPlanCheck(true);
            setAuthLoading(false);
            setAuth(null);
            return;
          }
          
          // For admins without setup, redirect to LoginPage
          if (userRole === 'admin' && !completedSetup && !isRelogin) {
            authStateRef.current = 'idle';
            setNeedsPlanCheck(true);
            setAuthLoading(false);
            setAuth(null);
            return;
          }
          
          // If this is a re-login after session expiry, mark setup as complete
          if (isRelogin && completedSetup === false) {
            completedSetup = true;
          }

          // Set currentUid IMMEDIATELY before any async operations
          setCurrentUid(user.uid);
          if (profile.workspaceId) {
            setWorkspaceId(profile.workspaceId);
          }
          
          // Check if we should proceed with auto-login
          const currentTime = Date.now();
          const recentLogin = lastLoginAttemptRef.current && (currentTime - lastLoginAttemptRef.current) < 2000;
          
          if (!recentLogin && !isPlanSelectionActive) {
            authStateRef.current = 'authenticating';
            handleLogin(userRole, profile.memberId, profile.email, profile.workspaceId || null, completedSetup, false, 'auto-login');
          } else {
            
            // LoginPage already called handleLogin, so we just need to ensure state is correct
            // Don't call handleLogin again to avoid duplicate execution
            if (profile.workspaceId) setWorkspaceId(profile.workspaceId);
            
            // Important: Set authState to authenticated so the render logic knows we're logged in
            authStateRef.current = 'authenticated';
            
            // Don't set authLoading to false here - let handleLogin do it
            // because handleLogin might still be executing
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
      const activityTime = Date.now();
      if (activityTime - lastWrite < ACTIVITY_THROTTLE) return;
      lastWrite = activityTime;
      updateDoc(doc(db, 'users', currentUid), {
        lastActivityTime: serverTimestamp(),
      }).catch(() => {}); // Silently fail if Firestore is in invalid state
    };
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach(e => window.addEventListener(e, updateActivity, { passive: true }));
    return () => events.forEach(e => window.removeEventListener(e, updateActivity));
  }, [currentUid]);

  const handleLogin = async (role, memberId, email, workspaceIdParam = null, completedSetup = null, isNewSignup = false, source = 'unknown') => {
    // STATE MACHINE: Prevent duplicate calls ONLY if loginInProgressRef is true
    if (loginInProgressRef.current) {
      return;
    }
    
    // Check if handleLogin was called very recently (within 500ms) - prevents rapid duplicates
    // BUT: Only block if this is an auto-login call and LoginPage already called handleLogin
    const loginTimestamp = Date.now();
    if (source === 'auto-login' && lastLoginAttemptRef.current > 0 && (loginTimestamp - lastLoginAttemptRef.current) < 2000) {
      return;
    }
    lastLoginAttemptRef.current = loginTimestamp;
    
    // STATE MACHINE: Ensure we're in authenticating state
    if (authStateRef.current !== 'authenticating') {
      authStateRef.current = 'authenticating';
    }
    loginInProgressRef.current = true;
    setLoginInProgress(true);
    loginHandledRef.current = true;
    
    // Set authLoading to true during login to prevent flicker
    setAuthLoading(true);
    
    // Clear plan selection active flag - user is now logging in
    setIsPlanSelectionActive(false);
    
    // Clear session expired state
    expiredLogoutRef.current = false;
    setSessionExpired(false);
    
    // Clear any auth state change flags to prevent onAuthStateChanged from interfering
    setNeedsPlanCheck(false);
    
    // Set currentUid immediately at the start of handleLogin
    const { getAuth } = await import('firebase/auth');
    const uid = getAuth().currentUser?.uid;
    if (uid) {
      setCurrentUid(uid);
    } else {
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
    setInitialLoading(true);
    setVisitedPages(new Set());
    setAuth({ role, memberId });
    setDashVisible(true); // Set dashVisible IMMEDIATELY, not in setTimeout
    
    // CRITICAL: Keep authStateRef as 'authenticating' during the entire process
    // This prevents onAuthStateChanged from interfering while handleLogin is executing
    // We'll transition to 'authenticated' in the setTimeout after all states are ready
    
    // CRITICAL: Do NOT set authLoading to false yet - keep it true until we're ready to show dashboard
    // This prevents the login page from flashing if a re-render happens before auth is set
    // We'll set it to false in the setTimeout after all other states are set
    
    // Use setTimeout with 0 to batch the next state updates
    setTimeout(() => {
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
      
      // CRITICAL: Transition to 'authenticated' state BEFORE clearing authLoading
      // This ensures render logic knows authentication is complete
      authStateRef.current = 'authenticated';
      
      // NOW set authLoading to false - after all auth state is set and ready
      setAuthLoading(false);
      
      // Clear login progress flags
      loginInProgressRef.current = false;
      setLoginInProgress(false);
      
      // Clear loginHandledRef after a delay to allow subsequent page reloads to auto-login
      setTimeout(() => {
        loginHandledRef.current = false;
      }, 2000);
    }, 50);
  };

  const handleLogout = async (expired = false) => {
    
    // STATE MACHINE: Transition to logging_out state
    authStateRef.current = 'logging_out';
    expiredLogoutRef.current = false;
    setSessionExpired(false);
    logoutInProgressRef.current = true;
    loginInProgressRef.current = false;
    setLoginInProgress(false);
    loginHandledRef.current = false;
    lastLoginAttemptRef.current = 0; // Reset timestamp to allow immediate re-login
    setIsPlanSelectionActive(false);
    
    // CRITICAL: Set authLoading to true FIRST to show loading skeleton
    setAuthLoading(true);
    
    // Wait for React to re-render with skeleton before clearing auth
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // CRITICAL: Clear auth and user data AFTER skeleton is showing
    const uidToClean = currentUid;
    setAuth(null);
    setCurrentUid(null);
    setWorkspaceId(null);
    setCurrentUser(null);
    
    // Reset UI state immediately to prevent WorkspaceSetup/Dashboard from showing
    setDashVisible(false);
    setShowWorkspaceSetup(false);
    setInitialLoading(false);
    setVisitedPages(new Set());
    setActiveItem('dashboard');
    setWorkspace(null);
    setShowMgmtPwdPrompt(false);
    setShowDonutWelcome(false);
    setNeedsPlanCheck(false);
    
    // Wait for React to process the state update and cleanup listeners
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Clear all localStorage cache related to app state
    try {
      localStorage.removeItem('lastActivePage');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('workspaceId');
      // Don't clear teamMemberFormCache - that's for form persistence
    } catch (err) {
    }
    
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
    
    // STATE MACHINE: Transition to idle state BEFORE showing login page
    authStateRef.current = 'idle';
    logoutInProgressRef.current = false;
    
    // Wait for state to propagate
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Finally, show login page
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
  // Show loading skeleton if we're waiting for initial auth state
  if (authLoading && !auth) {
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
    return (
      <Suspense fallback={<div style={{ width: '100vw', height: '100vh', background: '#F0F2F8' }} />}>
        <AuthActionPage />
      </Suspense>
    );
  }

  // ── Data load error - show manual retry button ──
  if (dataLoadError) {
    return <DataLoadError error={dataLoadError} onRetry={refreshData} />;
  }

  // ── Not logged in ──
  // Check auth state machine to determine what to show
  // CRITICAL: Show login page ONLY when:
  // 1. No auth object exists
  // 2. Auth state is idle (not in any transition)
  // 3. Not currently showing loading
  // 4. Not in the middle of a login attempt
  const shouldShowLoginPage = !auth && authStateRef.current === 'idle' && !authLoading && !loginInProgress;
  
  // Show loading skeleton if:
  // - We're in a transitional auth state (checking/authenticating/logging_out)
  // - OR loginInProgress is true
  // - BUT NOT if auth is already set (authenticated users shouldn't see skeleton)
  const shouldShowLoadingSkeleton = !auth && (authStateRef.current === 'checking' || authStateRef.current === 'authenticating' || authStateRef.current === 'logging_out' || loginInProgress);
  
  if (shouldShowLoadingSkeleton) {
    return (
      <>
        <SkeletonStyles />
        <AppShellSkeleton />
      </>
    );
  }
  
  if (shouldShowLoginPage) {
    return (
      <LoginPage onLogin={handleLogin} sessionExpired={sessionExpired} onClearExpired={() => setSessionExpired(false)} checkPlanOnMount={needsPlanCheck} />
    );
  }
  
  // If we have auth but authLoading is still true, clear it
  // This is a safety check to prevent getting stuck in loading state
  if (auth && authLoading && authStateRef.current === 'authenticated') {
    setTimeout(() => setAuthLoading(false), 0);
  }

  // ── Member role ──
  if (auth?.role === 'member') {
    return (
      <Suspense fallback={<div style={{ width: '100vw', height: '100vh', background: '#F0F2F8' }} />}>
        <MemberApp memberId={auth.memberId} onLogout={handleLogout} visible={dashVisible} />
      </Suspense>
    );
  }

  // ── Management role ──
  if (auth?.role === 'management') {
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
            // Prevent duplicate triggers
            if (mgmtAnimationTriggeredRef.current) {
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
    return (
      <>
        <SkeletonStyles />
        <AppShellSkeleton page={activeItem} />
      </>
    );
  }

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
