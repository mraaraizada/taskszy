import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useLottie } from 'lottie-react';
import { monitor } from '../lib/performanceMonitor';
import FeedbackModal from '../components/FeedbackModal';
import DataLoadError from '../components/DataLoadError';
import { listenForFeedbackRequests } from '../lib/feedbackBroadcastService';

function useProfileCardAnim() {
  const [data, setData] = useState(null);
  useEffect(() => { import('../lottie/Profile user card.json').then(m => setData(m.default)); }, []);
  return data;
}
import ManagementSidebar from './ManagementSidebar';
import MemberHeader from '../member/MemberHeader';
import PlanInactiveOverlay from '../components/PlanInactiveOverlay';
import ManagementHome from './pages/ManagementHome';
import ManagementProfile from './pages/ManagementProfile';
import MemberPayments from '../member/pages/MemberPayments';
import MemberWorkDesc from '../member/pages/MemberWorkDesc';
import MemberHelp from '../member/pages/MemberHelp';
import HelpPage from '../pages/HelpPage';
import ManagementHelp from './pages/ManagementHelp';
import MemberProfile from '../member/pages/MemberProfile';
import NotesPage from '../pages/NotesPage';
import TasksPage from '../pages/TasksPage';
import TeamPage from '../pages/TeamPage';
import RolesPage from '../pages/RolesPage';
import {
  SkeletonStyles,
  DashboardSkeleton, MemberPaymentsSkeleton,
  MemberWorkDescSkeleton, NotesSkeleton, MemberProfileSkeleton,
  TasksSkeleton, TeamSkeleton, RolesSkeleton, ManagementHelpSkeleton,
  ManagementProfileSkeleton, Bone,
} from '../components/Skeleton';

const PAGE_CONFIG = {
  home:     { title: 'Dashboard',        subtitle: 'Management overview' },
  tasks:    { title: 'Tasks',            subtitle: 'Manage and track all tasks' },
  team:     { title: 'Team',             subtitle: 'View and manage team members' },
  manage:   { title: 'Management',       subtitle: 'Tags, categories, roles & permissions' },
  payments: { title: 'Payments',         subtitle: 'Your earnings and payment history' },
  workdesc: { title: 'Work Description', subtitle: 'Your role and responsibilities' },
  notes:    { title: 'Scribe',            subtitle: 'Notes, sheets & shared docs' },
  help:     { title: 'Help & Support',   subtitle: 'Get assistance from your admin team' },
  profile:  { title: 'Profile',          subtitle: 'Your personal information' },
};

const SKELETON_MAP = {
  home:     DashboardSkeleton,
  tasks:    TasksSkeleton,
  team:     TeamSkeleton,
  manage:   RolesSkeleton,
  payments: MemberPaymentsSkeleton,
  workdesc: MemberWorkDescSkeleton,
  notes:    NotesSkeleton,
  help:     ManagementHelpSkeleton,
  profile:  ManagementProfileSkeleton,
};

function ProfileUserCardOverlay({ onDone }) {
  const [fading, setFading] = useState(false);
  const animationData = useProfileCardAnim();

  const dismiss = () => {
    setFading(true);
    setTimeout(() => {
      onDone();
    }, 500);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

export default function ManagementApp({ memberId, onLogout, visible, triggerWelcomeAnimation = false }) {
  const [activePage, setActivePage] = useState(() => {
    // Restore last active page from localStorage on refresh
    try {
      return localStorage.getItem('lastActivePageMgmt') || 'home';
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
  const hasMarkedWelcomeSeenRef = useRef(false); // Use ref to persist across renders
  const animationTriggeredRef = useRef(false); // Prevent duplicate animation triggers
  const [selectedScribeId, setSelectedScribeId] = useState(null); // Track scribe to open in NotesPage
  const [pageFilteredData, setPageFilteredData] = useState({}); // Store filtered/paginated data from each page for search
  const [pageExtraProps, setPageExtraProps] = useState({}); // Store extra props for pages (like filterToTaskId)
  const [feedbackRequest, setFeedbackRequest] = useState(null); // Feedback request from admin
  
  // Auto-fix state (must be declared before any conditional returns)
  const [fixing, setFixing] = useState(false);
  const [fixed, setFixed] = useState(false);
  const autoFixAttemptedRef = useRef(false); // Prevent duplicate auto-fix attempts
  
  const { team, dataLoaded, refreshData, setShowDonutWelcome, hasSeenDonutWelcome, currentUser, setCurrentUser, saveMember, workspaceId, currentUid, workspaceName, dataLoadError } = useApp();

  // Track page navigation and persist to localStorage
  useEffect(() => {
    monitor.trackPageLoad(`management_${activePage}`);
    try {
      localStorage.setItem('lastActivePageMgmt', activePage);
    } catch {}
  }, [activePage]);
  
  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = (event) => {
      if (event.state && event.state.page && event.state.app === 'management') {
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
    window.history.replaceState({ page: activePage, app: 'management' }, '', `${basePath}#${activePage}`);
    
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
  const member = team.find(m => m.id === memberId || m.id === String(memberId) || String(m.id) === String(memberId));

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
    

    const unsubscribe = listenForFeedbackRequests(listenerId, (request) => {
      if (request) {
      }
      setFeedbackRequest(request);
    }, userCreatedAt);
    
    return () => {
      unsubscribe();
    };
  }, [workspaceId, currentUid, currentUser?.createdAt, currentUser?.joinedDate]);

  // Track page navigation
  useEffect(() => {
    monitor.trackPageLoad(`management_${activePage}`);
    // Persist active page to localStorage for refresh restoration
    try {
      localStorage.setItem('lastActivePageMgmt', activePage);
    } catch {}
  }, [activePage]);

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

  // Auto-fix missing team entry silently in the background
  useEffect(() => {
    if (dataLoaded && !member && currentUser && workspaceId && !autoFixAttemptedRef.current) {

      autoFixAttemptedRef.current = true; // Mark as attempted to prevent duplicates
      
      const autoFix = async () => {
        try {
          const { getAuth } = await import('firebase/auth');
          const { getProfile } = await import('../lib/userProfileService');
          const auth = getAuth();
          const uid = auth.currentUser?.uid;
          
          if (!uid) return;
          
          // Load user profile to get email
          const userProfile = await getProfile(uid);
          if (!userProfile || !userProfile.email) {

            return;
          }
          
          // Create team entry from current user profile
          const newMember = {
            id: memberId,
            name: currentUser.name || userProfile.name || 'Management',
            email: userProfile.email, // Use email from Firestore profile
            phone: currentUser.phone || userProfile.phone || '',
            location: currentUser.location || 'Not Set',
            role: currentUser.role || 'Management',
            avatar: currentUser.avatar || 'M',
            color: currentUser.color || '#3B5BFC',
            status: 'Active',
            joined: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
            desc: currentUser.desc || '',
            about: currentUser.about || '',
            avatarImg: currentUser.avatarImg || null,
            tasks: 0,
            completed: 0,
            rating: 0,
            uid: uid,
            addedBy: { name: 'System', avatar: 'S', color: '#3B5BFC' }
          };

          saveMember(newMember, null);
        } catch (error) {

        }
      };
      
      autoFix();
    }
  }, [dataLoaded, member, currentUser, workspaceId, memberId, saveMember]);

  // Check if user has seen welcome animation and show it only once
  // This should only trigger AFTER workspace setup is complete
  useEffect(() => {
    // Don't show animations if not visible or no user data
    if (!visible || !currentUser || !currentUid) return;
    
    // Don't show animations during initial loading
    if (initialLoading) return;
    
    if (!hasMarkedWelcomeSeenRef.current) {
      hasMarkedWelcomeSeenRef.current = true;
      
      // Show profile card for first-time users ONLY after workspace setup
      // The profile card will be triggered from App.jsx after setup completes
      if (!hasSeenDonutWelcome) {

        // Don't trigger here - let App.jsx trigger after workspace setup
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, currentUser, currentUid, initialLoading]);

  // Trigger profile card animation when prop changes (after workspace setup)
  useEffect(() => {
    // Prevent duplicate triggers
    if (animationTriggeredRef.current) {

      return;
    }
    
    if (triggerWelcomeAnimation && !hasSeenDonutWelcome && visible) {

      animationTriggeredRef.current = true; // Mark as triggered
      
      // Set initial loading to false first
      setInitialLoading(false);
      // Block dashboard rendering until animation completes
      setWaitingForAnimation(true);
      // Then show profile card after a delay
      setTimeout(() => {
        setShowProfileCard(true);
      }, 500);
    } else if (visible && currentUser && currentUid && !triggerWelcomeAnimation) {
      // Returning user - no animation needed, unblock dashboard immediately

      setWaitingForAnimation(false);
      setInitialLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerWelcomeAnimation, hasSeenDonutWelcome, visible, currentUser, currentUid, dataLoaded]);

  // Wait for data to load before checking member (but skip for returning users)
  if ((!dataLoaded || waitingForAnimation) && initialLoading) {

    return <div style={{ width: '100vw', height: '100vh', background: 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Loading...</div>
    </div>;
  }

  // Set initial loading to false once data is loaded (for returning users)
  if (initialLoading && dataLoaded && !waitingForAnimation) {

    setInitialLoading(false);
  }

  if (!member) {
    // Show loading skeleton while auto-fix creates the team entry

    return <div style={{ width: '100vw', height: '100vh', background: 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Loading...</div>
    </div>;
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
    window.history.pushState({ page: p, app: 'management' }, '', `${basePath}#${p}`);

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
      
      case 'member':
        // Highlight member on team page
        if (activePage === 'team') {
          setPageExtraProps({ filterToMemberId: data.id });
          setPageKey(k => k + 1);
        } else {
          handleNav('team');
          setTimeout(() => {
            setPageExtraProps({ filterToMemberId: data.id });
            setPageKey(k => k + 1);
          }, 100);
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
      case 'tasks':    return <TasksPage hideBudget={true} hideTimeline={true} currentUser={displayMember} managementMode={true} onNavigateToNotes={(scribeId) => { 

        setSelectedScribeId(scribeId); 
        handleNav('notes'); 
      }} setPageFilteredData={setPageFilteredData} filterToTaskId={pageExtraProps.filterToTaskId} />;
      case 'team':     return <TeamPage managementMode={true} currentUser={currentUser} setPageFilteredData={setPageFilteredData} filterToMemberId={pageExtraProps.filterToMemberId} />;
      case 'manage':   return <RolesPage managementMode={true} />;
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
          userRole: 'management',
          memberId: displayMember.id,
          avatar: displayMember.avatar,
          color: displayMember.color,
          avatarImg: displayMember.avatarImg
        }}
        selectedScribeId={selectedScribeId}
        onScribeOpened={() => {

          setSelectedScribeId(null);
        }}
        onNavigateToTask={() => handleNav('tasks')} 
        setPageFilteredData={setPageFilteredData}
      />;
      case 'help':     return <ManagementHelp member={displayMember} setPageFilteredData={setPageFilteredData} filterToHelpId={pageExtraProps.filterToHelpId} />;
      case 'profile':  return <ManagementProfile member={displayMember} />;
      default:         return <ManagementHome member={displayMember} setActivePage={handleNav} onNavigateToNotes={(noteId) => {

        setSelectedScribeId(noteId);
        handleNav('notes');
      }} openTaskId={pageExtraProps.openTaskId} />;
    }
  }

  const SkeletonComp = SKELETON_MAP[activePage] || DashboardSkeleton;

  // Show full shell skeleton on initial login load
  if (initialLoading) {
    return (
      <>
        <SkeletonStyles />
        {/* Management shell skeleton: sidebar (4+5 nav) + header + home content */}
        <div style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden', background: 'var(--bg-main)' }}>
          {/* Sidebar */}
          <aside style={{ width: 230, height: '100vh', background: 'var(--bg-surface)', borderRight: '1.5px solid var(--border-light)', display: 'flex', flexDirection: 'column', padding: '0 12px', flexShrink: 0 }}>
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '22px 8px 20px' }}>
              <Bone w={34} h={34} r={10} style={{ flexShrink: 0 }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <Bone w={70} h={14} />
                <Bone w={72} h={9} />
              </div>
            </div>
            {/* Top nav: 4 items */}
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {[90, 55, 50, 65].map((w, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 11, background: i === 0 ? 'var(--bg-subtle)' : 'transparent' }}>
                  <Bone w={30} h={30} r={9} style={{ flexShrink: 0 }} />
                  <Bone w={w} h={12} />
                </div>
              ))}
            </nav>
            {/* Bottom nav: 5 items */}
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
              {[75, 85, 55, 45, 65].map((w, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 11 }}>
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
              <DashboardSkeleton />
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
      <ManagementSidebar activePage={activePage} setActivePage={handleNav} member={displayMember} onLogout={onLogout} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100%', overflow: 'hidden' }}>
        <MemberHeader title={page.title} subtitle={page.subtitle} member={displayMember} searchAllTasks={true} currentPage={activePage} onSearchResultClick={handleSearchResultClick} pageFilteredData={pageFilteredData} />
        <div
          key={pageKey}
          className="page-enter"
          style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden', position: 'relative' }}
        >
          {pageLoading ? <SkeletonComp /> : renderPage()}
          {activePage !== 'profile' && <PlanInactiveOverlay />}
        </div>
      </div>

      {/* Profile user card overlay */}
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
          
          // Allow dashboard to render now
          setWaitingForAnimation(false);
          
          // Show donut welcome if not seen yet
          if (!hasSeenDonutWelcome) {

            setTimeout(() => setShowDonutWelcome(true), 400);
          }
        }} />
      )}

      {/* Feedback Modal - Shows when admin sends feedback request */}
      {feedbackRequest && displayMember && (
        <FeedbackModal
          feedbackRequest={feedbackRequest}
          organizationId={workspaceId}
          organizationName={workspaceName || 'Your Organization'}
          userId={currentUid}
          userName={displayMember.name}
          userEmail={displayMember.email}
          userPhone={displayMember.phone || ''}
          userRole="management"
        />
      )}
    </div>
  );
}
