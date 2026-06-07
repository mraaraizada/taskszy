import { useState, useEffect, lazy, Suspense } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { onAuthChanged, signOutUser } from './lib/authService';
import { getProfile } from './lib/userProfileService';
import { Toaster } from './components/ui/sonner';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import {
  SkeletonStyles,
  DashboardSkeleton, TeamSkeleton,
  FinancialSkeleton, FeedbackSkeleton, SidebarSkeleton, FullDashboardSkeleton,
} from './components/Skeleton';

// ── Lazy-loaded pages ─────────────────────────────────────────────────────────
import LoginPage from './pages/LoginPage';  // Not lazy - load immediately
const AdminProjectDashboardPage = lazy(() => import('./pages/AdminProjectDashboardPage'));
const TeamPage                 = lazy(() => import('./pages/TeamPage'));
const FeedbackPage             = lazy(() => import('./pages/FeedbackPage'));
const FinancialPage            = lazy(() => import('./pages/FinancialPage'));

const pageConfig = {
  dashboard:   { title: 'Project Dashboard', subtitle: 'Monitor organizations and subscriptions' },
  team:        { title: 'Team',           subtitle: 'View and manage team members' },
  feedback:    { title: 'Feedback',       subtitle: 'Share your thoughts and suggestions' },
  financial:   { title: 'Financial',      subtitle: 'Track budgets and payments' },
};

const SKELETON_MAP = {
  dashboard:   DashboardSkeleton,
  team:        TeamSkeleton,
  feedback:    FeedbackSkeleton,
  financial:   FinancialSkeleton,
};

function renderPage(activeItem) {
  switch (activeItem) {
    case 'team':        return <TeamPage />;
    case 'feedback':    return <FeedbackPage />;
    case 'financial':   return <FinancialPage />;
    default:            return <AdminProjectDashboardPage />;
  }
}

function AppShell() {
  const [auth, setAuth]               = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeItem, setActiveItem]   = useState(() => {
    // Restore last active page from localStorage on refresh or URL hash
    try {
      const hash = window.location.hash.replace('#', '');
      if (hash && ['dashboard', 'team', 'feedback', 'financial'].includes(hash)) {
        return hash;
      }
      return localStorage.getItem('lastActivePageAdmin') || 'dashboard';
    } catch {
      return 'dashboard';
    }
  });
  const [dashVisible, setDashVisible] = useState(true); // Always visible by default
  const [visitedPages, setVisitedPages] = useState({});
  const [loadingPage, setLoadingPage] = useState(null);
  const { refreshData, navigationRequest, setNavigationRequest } = useApp();

  // ── Persistent session via onAuthStateChanged ──
  useEffect(() => {
    const unsubscribe = onAuthChanged(async (user) => {
      if (user) {
        const profile = await getProfile(user.uid);
        if (profile) {
          // dashboardRole maps to "admin" for both superadmin and viewer
          handleLogin('admin', null, profile.email);
        } else {
          setAuthLoading(false);
        }
      } else {
        setAuthLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  const handleLogin = (role, memberId, email) => {
    if (email) localStorage.setItem('userEmail', email);
    setAuth({ role, memberId });
    setAuthLoading(false); // Ensure auth loading is set to false
    setDashVisible(true); // Ensure dashboard is visible
    setVisitedPages({ dashboard: true }); // Mark dashboard as visited immediately
    setLoadingPage(null); // No loading state needed
  };

  const handleLogout = async () => {
    try { await signOutUser(); } catch (err) {  }
    localStorage.removeItem('userEmail');
    localStorage.removeItem('lastActivePageAdmin'); // Clear saved page on logout
    setAuth(null);
    setDashVisible(false);
    setActiveItem('dashboard');
    setVisitedPages({});
    setLoadingPage(null);
  };

  const handleNav = (item) => {
    if (item === activeItem) { refreshData(); return; }
    setActiveItem(item);
    // Update URL hash for browser history
    window.history.pushState({ page: item }, '', `#${item}`);
    // Persist active page to localStorage for refresh restoration
    try {
      localStorage.setItem('lastActivePageAdmin', item);
    } catch {}
    if (!visitedPages[item]) {
      setLoadingPage(item);
      setTimeout(() => {
        setLoadingPage(null);
        setVisitedPages(prev => ({ ...prev, [item]: true }));
      }, 800);
    }
  };

  // Handle browser back/forward button
  useEffect(() => {
    const handlePopState = (event) => {
      const hash = window.location.hash.replace('#', '');
      if (hash && ['dashboard', 'team', 'feedback', 'financial'].includes(hash)) {
        setActiveItem(hash);
        try {
          localStorage.setItem('lastActivePageAdmin', hash);
        } catch {}
      } else {
        setActiveItem('dashboard');
      }
    };

    window.addEventListener('popstate', handlePopState);
    
    // Set initial URL hash if not present
    if (!window.location.hash) {
      window.history.replaceState({ page: activeItem }, '', `#${activeItem}`);
    }

    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeItem]);

  // Listen for navigation requests from child components
  useEffect(() => {

    if (navigationRequest) {

      handleNav(navigationRequest);

      setNavigationRequest(null);
    }
  }, [navigationRequest, setNavigationRequest]);

  // ── Auth loading (waiting for onAuthStateChanged on mount) ──
  if (authLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100vw',
        height: '100vh',
        background: 'var(--bg-main)',
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid var(--border-light)',
            borderTopColor: '#3B5BFC',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
          <div style={{
            fontSize: '14px',
            fontWeight: 600,
            color: 'var(--text-secondary)',
          }}>
            Loading...
          </div>
        </div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!auth) {
    return (
      <LoginPage onLogin={handleLogin} />
    );
  }

  const page = pageConfig[activeItem] || pageConfig['dashboard'];
  const SkeletonComp = SKELETON_MAP[activeItem] || DashboardSkeleton;
  const showSkeleton = loadingPage === activeItem;

  return (
    <div style={{
      display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden',
      background: 'var(--bg-main)',
      opacity: dashVisible ? 1 : 0,
      transform: dashVisible ? 'translateY(0)' : 'translateY(10px)',
      transition: 'opacity 0.4s ease, transform 0.4s ease, background 0.25s ease',
    }}>
      <SkeletonStyles />
      <Sidebar activeItem={activeItem} setActiveItem={handleNav} onLogout={handleLogout} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100%', background: 'var(--bg-main)', overflow: 'hidden', transition: 'background 0.25s ease' }}>
        <Header title={page.title} subtitle={page.subtitle} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
          {showSkeleton
            ? <SkeletonComp />
            : (
              <Suspense fallback={<SkeletonComp />}>
                {renderPage(activeItem)}
              </Suspense>
            )
          }
        </div>
      </div>
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
