import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useLottie } from 'lottie-react';
import { monitor } from '../lib/performanceMonitor';
import { listenForFeedbackRequests } from '../lib/feedbackBroadcastService';
import FeedbackModal from '../components/FeedbackModal';
import DataLoadError from '../components/DataLoadError';

function useProfileCardAnim() {
  const [data, setData] = useState(null);
  useEffect(() => { import('../lottie/Profile user card.json').then(m => setData(m.default)); }, []);
  return data;
}
import MemberSidebar from './MemberSidebar';
import MemberHeader from './MemberHeader';
import PlanInactiveOverlay from '../components/PlanInactiveOverlay';
import MemberHome from './pages/MemberHome';
import MemberTasks from './pages/MemberTasks';
import MemberPayments from './pages/MemberPayments';
import MemberWorkDesc from './pages/MemberWorkDesc';
import MemberHelp from './pages/MemberHelp';
import MemberProfile from './pages/MemberProfile';
import NotesPage from '../pages/NotesPage';
import {
  SkeletonStyles,
  MemberHomeSkeleton, MemberTasksSkeleton, MemberPaymentsSkeleton,
  MemberWorkDescSkeleton, NotesSkeleton, MemberProfileSkeleton, MemberHelpSkeleton,
  Bone,
} from '../components/Skeleton';

const PAGE_CONFIG = {
  home:     { title: 'My Dashboard',    subtitle: 'Your personal workspace' },
  tasks:    { title: 'My Tasks',         subtitle: 'Track and update your assigned work' },
  payments: { title: 'Payments',         subtitle: 'Your earnings and payment history' },
  workdesc: { title: 'Work Description', subtitle: 'Your role and responsibilities' },
  notes:    { title: 'Scribe',            subtitle: 'Notes, sheets & shared docs' },
  help:     { title: 'Help & Support',   subtitle: 'Get assistance from your admin team' },
  profile:  { title: 'Profile',          subtitle: 'Your personal information' },
};

const MEMBER_SKELETON_MAP = {
  home:     MemberHomeSkeleton,
  tasks:    MemberTasksSkeleton,
  payments: MemberPaymentsSkeleton,
  workdesc: MemberWorkDescSkeleton,
  notes:    NotesSkeleton,
  help:     MemberHelpSkeleton,
  profile:  MemberProfileSkeleton,
};

function ProfileUserCardOverlay({ onDone }) {
  const [fading, setFading] = useState(false);
  const animationData = useProfileCardAnim();

  const dismiss = () => {
    setFading(true);
    setTimeout(onDone, 500);
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
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
        background: 'rgba(15,20,40,0.35)',
        pointerEvents: 'none',
        opacity: fading ? 0 : 1,
        transition: 'opacity 0.5s ease',
      }}
    >
      {View}
    </div>
  );
}

export default function MemberApp({ memberId, onLogout, visible }) {
  const [activePage, setActivePage] = useState(() => {
    // Restore last active page from localStorage on refresh
    try {
      return localStorage.getItem('lastActivePageMember') || 'home';
    } catch {
      return 'home';
    }
  });
  const [pageLoading, setPageLoading] = useState(false);
  const [pageKey, setPageKey] = useState(0);
  const [visitedPages, setVisitedPages] = useState(new Set(['home']));
  const [initialLoading, setInitialLoading] = useState(true);
  const [showProfileCard, setShowProfileCard] = useState(false);
  const [waitingForAnimation, setWaitingForAnimation] = useState(false); // Track if we're waiting for first-time animation
  const hasMarkedWelcomeSeenRef = useRef(false); // Use ref instead of state to persist across renders
  const [selectedScribeId, setSelectedScribeId] = useState(null); // Track scribe to open in NotesPage
  const [pageFilteredData, setPageFilteredData] = useState({}); // Store filtered/paginated data from each page for search
  const [pageExtraProps, setPageExtraProps] = useState({}); // Store extra props for pages (like filterToTaskId)
  const [feedbackRequest, setFeedbackRequest] = useState(null); // Feedback request from admin
  
  // Auto-fix state (must be declared before any conditional returns)
  const [fixing, setFixing] = useState(false);
  const [fixed, setFixed] = useState(false);
  const autoFixAttemptedRef = useRef(false); // Prevent duplicate auto-fix attempts
  
  const { team, dataLoaded, refreshData, setShowDonutWelcome, hasSeenDonutWelcome, workspaceId, currentUser, setCurrentUser, currentUid, workspaceName, dataLoadError } = useApp();
  
  // Track page navigation and persist to localStorage
  useEffect(() => {
    monitor.trackPageLoad(`member_${activePage}`);
    try {
      localStorage.setItem('lastActivePageMember', activePage);
    } catch {}
  }, [activePage]);
  
  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = (event) => {
      if (event.state && event.state.page && event.state.app === 'member') {
        setActivePage(event.state.page);
      } else {
        const hash = window.location.hash.replace('#', '');
        if (hash && hash !== activePage) {
          setActivePage(hash);
        }
      }
    };
    
    window.addEventListener('popstate', handlePopState);
    
    // Set initial history state
    const currentPath = window.location.pathname;
    const basePath = currentPath.includes('/app') ? '/app' : '';
    window.history.replaceState({ page: activePage, app: 'member' }, '', `${basePath}#${activePage}`);
    
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
  
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
    
    console.log('[MemberApp] Feedback listener - userCreatedAt:', userCreatedAt);

    const unsubscribe = listenForFeedbackRequests(listenerId, (request) => {
      console.log('[MemberApp] Feedback request received:', request ? 'YES' : 'NO');
      if (request) {
        console.log('[MemberApp] Should show:', !userCreatedAt || request.createdAt >= userCreatedAt);
      }
      setFeedbackRequest(request);
    }, userCreatedAt);
    
    return () => {
      console.log('[MemberApp] Feedback listener cleanup');
      unsubscribe();
    };
  }, [workspaceId, currentUid, currentUser?.createdAt, currentUser?.joinedDate]);
  
  // Track page navigation
  useEffect(() => {
    monitor.trackPageLoad(`member_${activePage}`);
    // Persist active page to localStorage for refresh restoration
    try {
      localStorage.setItem('lastActivePageMember', activePage);
    } catch {}
  }, [activePage]);
  
  // Try both number and string comparison since Firestore might convert types
  const member = team.find(m => m.id === memberId || m.id === String(memberId) || String(m.id) === String(memberId));

  // Use stable displayMember with caching to prevent flickering
  const [displayMember, setDisplayMember] = useState(() => {
    // Initialize with currentUser if available, otherwise use member
    const initial = currentUser?.memberId === memberId ? currentUser : member;
    // Never initialize with null/undefined - keep previous value
    return initial || null;
  });
  
  // Update displayMember only when data actually changes
  useEffect(() => {
    const newMember = currentUser?.memberId === memberId ? currentUser : member;
    
    // CRITICAL: Don't update if newMember is null/undefined - this prevents flickering
    // when currentUid temporarily becomes null during initialization
    if (!newMember || !newMember.id) {

      return;
    }
    
    setDisplayMember(prev => {
      // Only update if data actually changed
      if (!prev || 
          prev.id !== newMember.id ||
          prev.name !== newMember.name ||
          prev.avatarImg !== newMember.avatarImg ||
          prev.role !== newMember.role ||
          prev.status !== newMember.status) {

        return newMember;
      }

      return prev;
    });
  }, [currentUser, member, memberId]);

  // Note: Auto-fix disabled - team members should be created by admin/management only
  // Members don't have permission to create team documents per Firestore rules

  // Check if user has seen welcome animation and show it only once
  useEffect(() => {
    // Show profile card animation for first-time users
    if (!visible || !currentUser || !currentUid) return;
    
    // Wait for profile data to load from Firestore before checking
    // hasSeenWelcomeAnimation can be: undefined (not loaded), false (new user), true (returning user)
    if (currentUser.hasSeenWelcomeAnimation === undefined) {

      return;
    }
    
    if (!hasMarkedWelcomeSeenRef.current) {
      hasMarkedWelcomeSeenRef.current = true;
      
      // Show profile card animation for first-time users who haven't seen welcome animation
      const hasSeenWelcome = currentUser.hasSeenWelcomeAnimation === true;

      if (!hasSeenWelcome) {

        setWaitingForAnimation(true); // Block dashboard rendering
        setTimeout(() => {

          setShowProfileCard(true);
          // Keep waitingForAnimation true until profile card completes
        }, 500);
      } else {

        // For returning users, skip both animation and initial loading
        setWaitingForAnimation(false);
        setInitialLoading(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, currentUser, currentUid, dataLoaded]);

  // Wait for data to load before checking member (but skip for returning users)
  if ((!dataLoaded || waitingForAnimation) && initialLoading) {

    return (
      <>
        <SkeletonStyles />
        {/* Member shell skeleton: sidebar (6 nav items) + header + home content */}
        <div style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden', background: 'var(--bg-main)' }}>
          {/* Sidebar */}
          <aside style={{ width: 230, height: '100vh', background: 'var(--bg-surface)', borderRight: '1.5px solid var(--border-light)', display: 'flex', flexDirection: 'column', padding: '0 12px', flexShrink: 0 }}>
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '22px 8px 20px' }}>
              <Bone w={34} h={34} r={10} style={{ flexShrink: 0 }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <Bone w={70} h={14} />
                <Bone w={60} h={9} />
              </div>
            </div>
            {/* 6 nav items */}
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
              {[90, 75, 85, 55, 45, 65].map((w, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 11, background: i === 0 ? 'var(--bg-subtle)' : 'transparent' }}>
                  <Bone w={30} h={30} r={9} style={{ flexShrink: 0 }} />
                  <Bone w={w} h={12} />
                </div>
              ))}
            </nav>
            {/* Member card */}
            <div style={{ padding: '0 4px 20px' }}>
              <div style={{ background: 'var(--bg-subtle)', borderRadius: 14, padding: '12px 14px', border: '1.5px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Bone w={36} h={36} r={18} style={{ flexShrink: 0 }} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <Bone w={110} h={13} />
                    <Bone w={80} h={10} />
                  </div>
                </div>
                <Bone w="100%" h={28} r={9} />
              </div>
            </div>
          </aside>
          {/* Main content */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ padding: '20px 28px', borderBottom: '1.5px solid var(--border-light)', background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div>
                <Bone w={140} h={20} style={{ marginBottom: 6 }} />
                <Bone w={200} h={13} />
              </div>
              <Bone w={36} h={36} r={18} />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
              <MemberHomeSkeleton />
            </div>
          </div>
        </div>
        
        {/* Show profile card overlay on top of skeleton if it's ready */}
        {showProfileCard && (
          <ProfileUserCardOverlay onDone={async () => { 
            setShowProfileCard(false);
            
            // Mark welcome animation as seen
            if (currentUid && currentUser?.hasSeenWelcomeAnimation !== true) {
              try {
                const { updateProfile } = await import('../lib/userProfileService');
                await updateProfile(currentUid, { hasSeenWelcomeAnimation: true });

                setCurrentUser(prev => ({
                  ...prev,
                  hasSeenWelcomeAnimation: true
                }));
              } catch (err) {

              }
            }
            
            // After animation completes, show the dashboard
            setWaitingForAnimation(false);
            setInitialLoading(false);
            
            // Show donut welcome if not seen yet
            if (!hasSeenDonutWelcome) {

              setTimeout(() => setShowDonutWelcome(true), 400);
            }
          }} />
        )}
      </>
    );
  }

  // Set initial loading to false once data is loaded (for returning users ONLY)
  // Don't do this if we haven't checked for welcome animation yet
  if (initialLoading && dataLoaded && !waitingForAnimation && hasMarkedWelcomeSeenRef.current) {

    setInitialLoading(false);
  }

  if (!member) {
    // Show loading skeleton while auto-fix creates the team entry

    return (
      <>
        <SkeletonStyles />
        {/* Member shell skeleton: sidebar (6 nav items) + header + home content */}
        <div style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden', background: 'var(--bg-main)' }}>
          {/* Sidebar */}
          <aside style={{ width: 230, height: '100vh', background: 'var(--bg-surface)', borderRight: '1.5px solid var(--border-light)', display: 'flex', flexDirection: 'column', padding: '0 12px', flexShrink: 0 }}>
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '22px 8px 20px' }}>
              <Bone w={34} h={34} r={10} style={{ flexShrink: 0 }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <Bone w={70} h={14} />
                <Bone w={60} h={9} />
              </div>
            </div>
            {/* 6 nav items */}
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
              {[90, 75, 85, 55, 45, 65].map((w, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 11, background: i === 0 ? 'var(--bg-subtle)' : 'transparent' }}>
                  <Bone w={30} h={30} r={9} style={{ flexShrink: 0 }} />
                  <Bone w={w} h={12} />
                </div>
              ))}
            </nav>
            {/* Member card */}
            <div style={{ padding: '0 4px 20px' }}>
              <div style={{ background: 'var(--bg-subtle)', borderRadius: 14, padding: '12px 14px', border: '1.5px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Bone w={36} h={36} r={18} style={{ flexShrink: 0 }} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <Bone w={110} h={13} />
                    <Bone w={80} h={10} />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Bone w={7} h={7} r={4} />
                  <Bone w={45} h={11} />
                  <Bone w={70} h={10} style={{ marginLeft: 'auto' }} />
                </div>
                <Bone w="100%" h={30} r={9} />
              </div>
            </div>
          </aside>
          {/* Right: header + home skeleton */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100%', background: 'var(--bg-main)', overflow: 'hidden' }}>
            <div style={{ height: 64, flexShrink: 0, background: 'var(--bg-surface)', borderBottom: '1.5px solid var(--border-light)', display: 'flex', alignItems: 'center', padding: '0 28px', gap: 12 }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <Bone w={120} h={16} />
                <Bone w={180} h={11} />
              </div>
              <Bone w={220} h={36} r={10} />
              <Bone w={36} h={36} r={18} />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
              <MemberHomeSkeleton />
            </div>
          </div>
        </div>
      </>
    );
  }

  const page = PAGE_CONFIG[activePage] || PAGE_CONFIG.home;

  const handleNav = (p) => {
    if (p === activePage) {
      refreshData();
      return;
    }

    // Update browser history for back button support
    const currentPath = window.location.pathname;
    const basePath = currentPath.includes('/app') ? '/app' : '';
    window.history.pushState({ page: p, app: 'member' }, '', `${basePath}#${p}`);

    // Clear page extra props when navigating to a different page
    setPageExtraProps({});

    if (!visitedPages.has(p)) {
      // First visit — show skeleton
      setPageLoading(true);
      setTimeout(() => {
        setActivePage(p);
        setTimeout(() => {
          setPageLoading(false);
          setVisitedPages(prev => new Set([...prev, p]));
        }, 500);
      }, 50);
    } else {
      setPageKey(k => k + 1);
      setActivePage(p);
    }
  };
  
  const handleSearchResultClick = ({ type, data }) => {

    switch (type) {
      case 'task':
        if (activePage === 'home') {
          // On home page, open task modal directly
          setPageExtraProps({ openTaskId: data.id });
          setPageKey(k => k + 1);
        } else if (activePage === 'tasks' || activePage === 'payments') {
          // Show ONLY this task in the table
          setPageExtraProps({ filterToTaskId: data.id });
          setPageKey(k => k + 1);
        } else {
          // Navigate to tasks page and show only this task
          handleNav('tasks');
          setTimeout(() => {
            setPageExtraProps({ filterToTaskId: data.id });
            setPageKey(k => k + 1);
          }, 100);
        }
        break;
      
      case 'scribe':
        // Open scribe in notes page
        setSelectedScribeId(data.id);
        if (activePage !== 'notes') {
          handleNav('notes');
        } else {
          setPageKey(k => k + 1);
        }
        break;
      
      case 'help':
        // Show help submission on help page
        if (activePage === 'help') {
          setPageExtraProps({ filterToHelpId: data.id });
          setPageKey(k => k + 1);
        } else {
          handleNav('help');
          setTimeout(() => {
            setPageExtraProps({ filterToHelpId: data.id });
            setPageKey(k => k + 1);
          }, 100);
        }
        break;
    }
  };

  function renderPage() {
    switch (activePage) {
      case 'tasks':    return <MemberTasks    member={displayMember} onNavigateToNotes={(scribeId) => { 

        setSelectedScribeId(scribeId); 
        handleNav('notes'); 
      }} setPageFilteredData={setPageFilteredData} filterToTaskId={pageExtraProps.filterToTaskId} />;
      case 'payments': return <MemberPayments member={displayMember} setPageFilteredData={setPageFilteredData} filterToTaskId={pageExtraProps.filterToTaskId} />;
      case 'workdesc': return <MemberWorkDesc member={displayMember} />;
      case 'notes':    return <NotesPage 
        deletedBy={{ 
          id: displayMember.id, 
          name: displayMember.name, 
          role: displayMember.role, 
          avatar: displayMember.avatar, 
          color: displayMember.color 
        }} 
        currentUser={{ 
          id: displayMember.id, 
          uid: displayMember.uid || currentUid || currentUser?.uid, // Try multiple sources for uid
          name: displayMember.name, 
          role: displayMember.role, 
          userRole: 'member',
          memberId: displayMember.id,
          avatar: displayMember.avatar,
          color: displayMember.color,
          avatarImg: displayMember.avatarImg
        }}
        selectedScribeId={selectedScribeId}
        onScribeOpened={() => {

          setSelectedScribeId(null);
        }}
        setPageFilteredData={setPageFilteredData}
      />;
      case 'help':     return <MemberHelp setPageFilteredData={setPageFilteredData} />;
      case 'profile':  return <MemberProfile  member={displayMember} />;
      default:         return <MemberHome     member={displayMember} setActivePage={handleNav} onNavigateToNotes={(scribeId) => { 

        setSelectedScribeId(scribeId); 
        handleNav('notes'); 
      }} openTaskId={pageExtraProps.openTaskId} />;
    }
  }

  const SkeletonComp = MEMBER_SKELETON_MAP[activePage] || MemberHomeSkeleton;

  // Show full shell skeleton on initial login load
  if (initialLoading) {
    return (
      <>
        <SkeletonStyles />
        {/* Member shell skeleton: sidebar (6 nav items) + header + home content */}
        <div style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden', background: 'var(--bg-main)' }}>
          {/* Sidebar */}
          <aside style={{ width: 230, height: '100vh', background: 'var(--bg-surface)', borderRight: '1.5px solid var(--border-light)', display: 'flex', flexDirection: 'column', padding: '0 12px', flexShrink: 0 }}>
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '22px 8px 20px' }}>
              <Bone w={34} h={34} r={10} style={{ flexShrink: 0 }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <Bone w={70} h={14} />
                <Bone w={60} h={9} />
              </div>
            </div>
            {/* 6 nav items */}
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
              {[90, 75, 85, 55, 45, 65].map((w, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 11, background: i === 0 ? 'var(--bg-subtle)' : 'transparent' }}>
                  <Bone w={30} h={30} r={9} style={{ flexShrink: 0 }} />
                  <Bone w={w} h={12} />
                </div>
              ))}
            </nav>
            {/* Member card */}
            <div style={{ padding: '0 4px 20px' }}>
              <div style={{ background: 'var(--bg-subtle)', borderRadius: 14, padding: '12px 14px', border: '1.5px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Bone w={36} h={36} r={18} style={{ flexShrink: 0 }} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <Bone w={110} h={13} />
                    <Bone w={80} h={10} />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Bone w={7} h={7} r={4} />
                  <Bone w={45} h={11} />
                  <Bone w={70} h={10} style={{ marginLeft: 'auto' }} />
                </div>
                <Bone w="100%" h={30} r={9} />
              </div>
            </div>
          </aside>
          {/* Right: header + home skeleton */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100%', background: 'var(--bg-main)', overflow: 'hidden' }}>
            <div style={{ height: 64, flexShrink: 0, background: 'var(--bg-surface)', borderBottom: '1.5px solid var(--border-light)', display: 'flex', alignItems: 'center', padding: '0 28px', gap: 12 }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <Bone w={120} h={16} />
                <Bone w={180} h={11} />
              </div>
              <Bone w={220} h={36} r={10} />
              <Bone w={36} h={36} r={18} />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
              <MemberHomeSkeleton />
            </div>
          </div>
        </div>
      </>
    );
  }

  // ── Data load error - show manual retry button ──
  if (dataLoadError) {
    return <DataLoadError error={dataLoadError} onRetry={refreshData} />;
  }

  return (
    <div style={{
      display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden',
      background: 'var(--bg-main)',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(10px)',
      transition: 'opacity 0.4s ease, transform 0.4s ease, background 0.25s ease',
    }}>
      <SkeletonStyles />
      <MemberSidebar activePage={activePage} setActivePage={handleNav} member={displayMember} onLogout={onLogout} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100%', overflow: 'hidden' }}>
        <MemberHeader title={page.title} subtitle={page.subtitle} member={displayMember} currentPage={activePage} onSearchResultClick={handleSearchResultClick} pageFilteredData={pageFilteredData} />
        <div
          key={pageKey}
          className="page-enter"
          style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden', position: 'relative' }}
        >
          {pageLoading ? <SkeletonComp /> : renderPage()}
          {activePage !== 'profile' && <PlanInactiveOverlay />}
        </div>
      </div>
      
      {/* Feedback Modal */}
      <FeedbackModal
        feedbackRequest={feedbackRequest}
        organizationId={workspaceId || 'unknown'}
        organizationName={workspaceName || 'Unknown Workspace'}
        userId={currentUid}
        userName={displayMember?.name || currentUser?.name || 'Unknown User'}
        userEmail={currentUser?.email || 'unknown@email.com'}
        userPhone={currentUser?.phone || displayMember?.phone || ''}
        userRole={displayMember?.role || 'member'}
      />
    </div>
  );
}
