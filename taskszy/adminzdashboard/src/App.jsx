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
  const [activeItem, setActiveItem]   = useState('dashboard');
  const [dashVisible, setDashVisible] = useState(false);
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
        }
      }
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleLogin = (role, memberId, email) => {
    if (email) localStorage.setItem('userEmail', email);
    setAuth({ role, memberId });
    setVisitedPages({});
    setLoadingPage('dashboard');
    setTimeout(() => setDashVisible(true), 50);
    setTimeout(() => {
      setLoadingPage(null);
      setVisitedPages({ dashboard: true });
    }, 900);
  };

  const handleLogout = async () => {
    try { await signOutUser(); } catch (err) {  }
    localStorage.removeItem('userEmail');
    setAuth(null);
    setDashVisible(false);
    setActiveItem('dashboard');
    setVisitedPages({});
    setLoadingPage(null);
  };

  const handleNav = (item) => {
    if (item === activeItem) { refreshData(); return; }
    setActiveItem(item);
    if (!visitedPages[item]) {
      setLoadingPage(item);
      setTimeout(() => {
        setLoadingPage(null);
        setVisitedPages(prev => ({ ...prev, [item]: true }));
      }, 800);
    }
  };

  // Listen for navigation requests from child components
  useEffect(() => {

    if (navigationRequest) {

      handleNav(navigationRequest);

      setNavigationRequest(null);
    }
  }, [navigationRequest, setNavigationRequest]);

  // ── Auth loading (waiting for onAuthStateChanged on mount) ──
  if (authLoading) {
    return <FullDashboardSkeleton />;
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
