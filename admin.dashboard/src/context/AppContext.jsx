import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';

// ── Shared Constants ──────────────────────────────────────────────────────────
export const STAGES = ['New', 'Start', 'Issue', 'Review A', 'Review B', 'Update', 'Complete'];
export const STAGE_COLORS = { New: '#9CA3AF', Start: '#3B5BFC', Issue: '#EF4444', 'Review A': '#F97316', 'Review B': '#7C3AED', Update: '#D97706', Complete: '#12C479' };
export const STAGE_BG = { New: '#F3F4F6', Start: '#EEF2FF', Issue: '#FEF2F2', 'Review A': '#FFF7ED', 'Review B': '#F5F3FF', Update: '#FFFBEB', Complete: '#ECFDF5' };

export const TAGS = [
  { label: 'Instagram', emoji: '📷', color: '#E1306C', bg: '#FDF2F8' },
  { label: 'YouTube',   emoji: '▶️',  color: '#FF0000', bg: '#FFF0F0' },
  { label: 'Facebook',  emoji: '👥',  color: '#1877F2', bg: '#EFF6FF' },
  { label: 'Twitter',   emoji: '🐦',  color: '#1DA1F2', bg: '#E7F5FD' },
  { label: 'Design',    emoji: '🎨',  color: '#7C3AED', bg: '#F5F3FF' },
  { label: 'Content',   emoji: '✍️',  color: '#059669', bg: '#ECFDF5' },
  { label: 'Marketing', emoji: '📢',  color: '#F97316', bg: '#FFF7ED' },
];

export const CATEGORIES = [
  { label: 'Development',  emoji: '💻', color: '#3B5BFC', bg: '#EEF2FF' },
  { label: 'Design',       emoji: '🎨', color: '#7C3AED', bg: '#F5F3FF' },
  { label: 'Marketing',    emoji: '📢', color: '#F97316', bg: '#FFF7ED' },
  { label: 'Finance',      emoji: '💰', color: '#059669', bg: '#ECFDF5' },
  { label: 'Operations',   emoji: '⚙️', color: '#6B7280', bg: '#F3F4F6' },
  { label: 'Research',     emoji: '🔬', color: '#0891B2', bg: '#ECFEFF' },
  { label: 'Content',      emoji: '✍️', color: '#D97706', bg: '#FFFBEB' },
  { label: 'Support',      emoji: '🛟', color: '#DC2626', bg: '#FEF2F2' },
];

export const PERMISSION_GROUPS = [
  { category: 'Task Management',    color: '#3B5BFC', bg: '#EEF2FF', perms: ['Create tasks','View all tasks','View assigned tasks only','Edit task title','Edit task description','Edit task deadline','Edit task budget','Delete tasks','Update own stage','Update any stage','Complete tasks','Assign team members','Remove team members'] },
  { category: 'Team Management',    color: '#7C3AED', bg: '#F5F3FF', perms: ['Add team members','Edit team members','View all team members','View members on assigned tasks','Assign roles','Deactivate members','Delete members','View private admin notes'] },
  { category: 'Financial',          color: '#12C479', bg: '#ECFDF5', perms: ['View all financials','View own payments only','View team payments','View task budgets','Edit budgets','Process payments','Generate financial reports','Export payment data'] },
  { category: 'System',             color: '#F97316', bg: '#FFF7ED', perms: ['Create roles','Edit roles','Delete roles','Manage permissions','System settings','View audit logs'] },
  { category: 'Dashboard & Reports',color: '#06B6D4', bg: '#ECFEFF', perms: ['View own dashboard','View admin dashboard','View own analytics','View team analytics','Generate reports'] },
  { category: 'Notifications',      color: '#EF4444', bg: '#FEF2F2', perms: ['Receive task notifications','Receive payment notifications','Receive team notifications','Receive system notifications'] },
];

const ADMIN_PERMS = Object.fromEntries(PERMISSION_GROUPS.map(g => [g.category, [...g.perms]]));

// User accounts for login
export const USERS = [
  { email: 'admin@taskzy.io', password: 'admin123', role: 'admin', memberId: null },
  { email: 'adminuser@taskzy.io', password: 'admin123', role: 'admin', memberId: null },
  { email: 'sarah@taskzy.io', password: 'sarah123', role: 'management', memberId: 1 },
  { email: 'marcus@taskzy.io', password: 'marcus123', role: 'member', memberId: 2 },
  { email: 'teammembera@taskzy.io', password: 'member123', role: 'member', memberId: 3 },
  { email: 'managementz@taskzy.io', password: 'management123', role: 'management', memberId: 4 },
];

// Initial roles with default Admin role
export const INITIAL_ROLES = [
  { 
    id: 1, 
    name: 'Admin', 
    description: 'Full system access with all permissions granted. Can manage users, roles, tasks, and system settings.', 
    color: '#7C3AED', 
    roleType: 'Admin', 
    members: 1, 
    permissions: ADMIN_PERMS 
  },
];
export const ADMIN_A_ROLES = [
  { id: 1,  name: 'Admin',            description: 'Full system access — all permissions granted',          color: '#3B5BFC', roleType: 'Management',  members: 1, permissions: ADMIN_PERMS },
];

const INITIAL_TEAM = [];

const INITIAL_TASKS = [];

const INITIAL_ACTIVITY = [];

const INITIAL_HELP_SUBMISSIONS = [];

const INITIAL_TASK_REQUESTS = [];

// ── Context ────────────────────────────────────────────────────────────────────
// ── Context ────────────────────────────────────────────────────────────────────
const AppContext = createContext(null);

export function AppProvider({ children }) {
  // Check logged in user email
  const userEmail = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : null;
  
  // Determine current user based on email
  const getCurrentUserProfile = () => {
    switch(userEmail) {
      case 'adminuser@taskzy.io':
        return { name: 'Admin A', role: 'Administrator', avatar: 'AA', color: '#3B5BFC', userRole: 'admin' };
      case 'sarah@taskzy.io':
        return { name: 'Sarah', role: 'Management', avatar: 'S', color: '#7C3AED', userRole: 'management' };
      case 'marcus@taskzy.io':
        return { name: 'Marcus', role: 'Developer', avatar: 'M', color: '#12C479', userRole: 'member' };
      case 'teammembera@taskzy.io':
        return { name: 'Team Member A', role: 'Team Member', avatar: 'TA', color: '#F97316', userRole: 'member' };
      case 'managementz@taskzy.io':
        return { name: 'Management Z', role: 'Management', avatar: 'MZ', color: '#06B6D4', userRole: 'management' };
      default:
        return { name: 'Admin', role: 'Administrator', avatar: 'A', color: '#3B5BFC', userRole: 'admin' };
    }
  };
  
  const [currentUser, setCurrentUser] = useState(getCurrentUserProfile());
  
  // Data loading state - tracks if initial data has been loaded
  const [dataLoaded, setDataLoaded] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  const [tasks, setTasks]   = useState([]);
  const [team, setTeam]     = useState([]);
  const [activity, setActivity] = useState([]);
  const [taskRequests, setTaskRequests] = useState([]);
  const [trashedItems, setTrashedItems] = useState([]);
  const [scheduledTasks, setScheduledTasks] = useState([]);
  const [helpSubmissions, setHelpSubmissions] = useState([]);
  const [unreadDescMembers, setUnreadDescMembers] = useState(new Set());
  const [roles, setRoles]   = useState(INITIAL_ROLES);
  
  // Organization data states for Admin Project Dashboard
  const [organizations, setOrganizations] = useState([]);
  const [monthlyGrowth, setMonthlyGrowth] = useState([]);
  const [yearlyGrowth, setYearlyGrowth] = useState([]);
  const [planDistribution, setPlanDistribution] = useState([]);
  
  // Global search state for filtering organizations across all pages
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  
  // Selected organization ID for navigation from Dashboard to Team page
  const [selectedOrganizationId, setSelectedOrganizationId] = useState(null);
  
  // Navigation request state (to trigger navigation from child components)
  const [navigationRequest, setNavigationRequest] = useState(null);
  
  const [darkMode, setDarkMode] = useState(() => {
    try { return localStorage.getItem('darkMode') === 'true'; } catch { return false; }
  });
  const [adminPassword, setAdminPassword] = useState(() => {
    try { return localStorage.getItem('adminPassword') || 'admin123'; } catch { return 'admin123'; }
  });

  const updateAdminPassword = useCallback((newPwd) => {
    setAdminPassword(newPwd);
    try { localStorage.setItem('adminPassword', newPwd); } catch {}
  }, []);

  // Migrate existing tasks to have createdDate and history
  useEffect(() => {
    setTasks(prev => {
      const needsMigration = prev.some(task => !task.history || !task.createdDate);
      if (!needsMigration) return prev;
      
      return prev.map(task => {
        if (!task.history || !task.createdDate) {
          const createdDate = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000); // Random date within last 30 days
          return {
            ...task,
            createdDate: task.createdDate || createdDate,
            history: task.history || [
              {
                stage: 'New',
                date: createdDate,
                user: 'Admin',
                action: 'created',
              }
            ]
          };
        }
        return task;
      });
    });
  }, []);

  // Simulate initial data loading - mark as loaded after a delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setDataLoaded(true);
    }, 1000); // 1 second delay for initial load
    return () => clearTimeout(timer);
  }, []);
  
  // Initialize organization data - empty for real Firebase data
  useEffect(() => {
    setOrganizations([]);
    setMonthlyGrowth([]);
    setYearlyGrowth([]);
    setPlanDistribution([]);
  }, []);

  // Refresh data function - forces reload of organizations
  const refreshData = useCallback(() => {

    loadOrganizations(true); // Force refresh bypasses cache
    setRefreshTrigger(prev => prev + 1);
  }, []);
  
  // Load organizations from Firebase with caching and change detection
  const loadOrganizations = useCallback(async (forceRefresh = false) => {
    // Prevent multiple simultaneous loads
    if (loadOrganizations.loading) {

      return;
    }

    loadOrganizations.loading = true;
    
    try {
      const { getOrganizationsPaginated, getOrganizationStatsOptimized } = await import('../lib/optimizedOrganizationService');

      const result = await getOrganizationsPaginated({ pageSize: 100, forceRefresh });
      const stats = await getOrganizationStatsOptimized();

      // Only update state if data actually changed - use deep comparison
      setOrganizations(prevOrgs => {
        // Skip update if arrays are identical (same reference from cache)
        if (prevOrgs === result.organizations) {

          return prevOrgs;
        }
        
        // Deep comparison for content changes
        const hasChanged = prevOrgs.length !== result.organizations.length || 
                          JSON.stringify(prevOrgs) !== JSON.stringify(result.organizations);
        
        if (hasChanged) {

          return result.organizations;
        }

        return prevOrgs;
      });
      
      // Use memoized calculations for growth data - only calculate if orgs changed

      const monthlyData = calculateMonthlyGrowth(result.organizations);
      const yearlyData = calculateYearlyGrowth(result.organizations);
      const planDist = calculatePlanDistribution(stats);
      
      // Only update if data changed
      setMonthlyGrowth(prev => {
        const changed = JSON.stringify(prev) !== JSON.stringify(monthlyData);
        return changed ? monthlyData : prev;
      });
      
      setYearlyGrowth(prev => {
        const changed = JSON.stringify(prev) !== JSON.stringify(yearlyData);
        return changed ? yearlyData : prev;
      });
      
      setPlanDistribution(prev => {
        const changed = JSON.stringify(prev) !== JSON.stringify(planDist);
        return changed ? planDist : prev;
      });

    } catch (error) {

      toast.error('Failed to load organizations');
    } finally {
      loadOrganizations.loading = false;

    }
  }, []);
  
  // Set up real-time listener for organizations (auto-refresh on changes) - only when authenticated
  useEffect(() => {
    // Only setup listener if user is logged in
    if (!userEmail) {

      return;
    }
    
    let unsubscribe = null;
    let isSubscribed = true;
    
    const setupListener = async () => {
      try {
        const { collection, onSnapshot } = await import('firebase/firestore');
        const { db } = await import('../lib/firebase');

        const workspacesRef = collection(db, 'workspaces');
        
        // ⭐ OPTIMIZATION: Throttle listener updates to reduce re-renders
        let throttleTimeout = null;
        
        unsubscribe = onSnapshot(workspacesRef, (snapshot) => {
          if (!isSubscribed) return;
          
          // Clear existing timeout
          if (throttleTimeout) {
            clearTimeout(throttleTimeout);
          }
          
          // ⭐ OPTIMIZATION: Debounce rapid changes (wait 2 seconds before refreshing)
          throttleTimeout = setTimeout(() => {

            loadOrganizations(true); // Force refresh when data changes
          }, 2000);
        }, (error) => {

        });
      } catch (error) {

      }
    };
    
    setupListener();
    
    return () => {
      isSubscribed = false;
      if (unsubscribe) {

        unsubscribe();
      }
    };
  }, [loadOrganizations, userEmail]);
  
  // Memoized calculation functions
  const calculateMonthlyGrowth = (orgs) => {
    const monthlyData = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = month.toLocaleDateString('en-US', { month: 'short' });
      const count = orgs.filter(o => {
        const joinDate = new Date(o.joinDate);
        return joinDate.getMonth() === month.getMonth() && joinDate.getFullYear() === month.getFullYear();
      }).length;
      monthlyData.push({ month: monthName, count });
    }
    return monthlyData;
  };
  
  const calculateYearlyGrowth = (orgs) => {
    const yearlyData = [];
    const now = new Date();
    for (let i = 2; i >= 0; i--) {
      const year = now.getFullYear() - i;
      const count = orgs.filter(o => new Date(o.joinDate).getFullYear() === year).length;
      yearlyData.push({ year: year.toString(), count });
    }
    return yearlyData;
  };
  
  const calculatePlanDistribution = (stats) => {
    return [
      { name: 'Starter', value: stats.byPlan.Starter || 0, color: '#3B5BFC' },
      { name: 'Professional', value: stats.byPlan.Professional || 0, color: '#7C3AED' },
      { name: 'Business', value: stats.byPlan.Business || 0, color: '#12C479' },
      { name: 'Enterprise', value: stats.byPlan.Enterprise || 0, color: '#F97316' },
      { name: 'Free', value: stats.byPlan.Free || 0, color: '#9CA3AF' },
    ].filter(plan => plan.value > 0);
  };
  
  
  // Load organizations on mount ONLY if user is authenticated
  useEffect(() => {
    // Only load organizations if user is logged in (has email in localStorage)
    if (userEmail) {
      loadOrganizations();
    } else {

    }
  }, [loadOrganizations, userEmail]);

  // Separate effect for manual refresh trigger (doesn't reload organizations automatically)
  useEffect(() => {
    if (refreshTrigger > 0) {
      // Only log that refresh was triggered, don't auto-reload

    }
  }, [refreshTrigger]);

  useEffect(() => {
    try { localStorage.setItem('darkMode', darkMode); } catch {}
    if (darkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [darkMode]);

  const toggleDarkMode = useCallback(() => setDarkMode(v => !v), []);

  // ── Activity helpers ─────────────────────────────────────────────────────
  const addActivity = useCallback((type, title, sub, amount = null, up = null) => {
    setActivity(prev => [{
      id: Date.now(),
      type, title, sub, amount, up,
      time: new Date(),
    }, ...prev.slice(0, 19)]);
  }, []);

  // Format time as relative string (e.g., "2 mins ago", "3 hours ago")
  const fmt = useCallback((date) => {
    const now = new Date();
    const diff = Math.floor((now - new Date(date)) / 1000); // seconds
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} mins ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;
    return new Date(date).toLocaleDateString();
  }, []);

  // ── Task actions ─────────────────────────────────────────────────────────
  const createTask = useCallback((task, createdBy = null) => {
    const now = new Date();
    const actor = createdBy ? createdBy.name : 'Admin';
    const source = createdBy?.source ? ` via ${createdBy.source}` : '';
    const taskWithHistory = {
      ...task,
      paid: false,
      createdDate: now,
      history: [
        {
          stage: task.stage || 'New',
          date: now,
          user: actor,
          action: 'created',
          note: source || undefined,
        }
      ]
    };
    setTasks(prev => [taskWithHistory, ...prev]);
    addActivity('new', 'Task Created', `${task.id} — ${task.title}`);
  }, [addActivity]);

  const updateTask = useCallback((taskId, updatedTask, editedBy = null) => {
    const actor = editedBy ? editedBy.name : 'Admin';
    const now = new Date();
    setTasks(prev => prev.map(t => t.id === taskId ? {
      ...t, ...updatedTask,
      history: [...(t.history || []), { stage: t.stage, date: now, user: actor, action: 'edit' }],
    } : t));
    addActivity('edit', 'Task Updated', `${taskId} — ${updatedTask.title}`);
  }, [addActivity]);

  // Update the whole task stage (admin bulk action) AND optionally a specific member's stage
  const updateTaskStage = useCallback((taskId, newStage, memberId = null, actorName = null, issueNote = null) => {
    const task = tasks.find(t => t.id === taskId);
    const now = new Date();

    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      
      const historyEntry = {
        stage: newStage,
        date: now,
        user: actorName || (memberId ? (t.members.find(m => m.id === memberId)?.name || 'Member') : 'Admin'),
        action: 'updated',
        note: issueNote || undefined,
      };
      
      const updatedHistory = [...(t.history || []), historyEntry];
      
      // Store issue note if provided
      const updatedIssueNote = issueNote ? issueNote : t.issueNote;
      
      if (memberId !== null) {
        // Update only a specific member's stage
        const updatedMembers = t.members.map(m => m.id === memberId ? { ...m, stage: newStage } : m);
        // Task's overall stage = the highest/most advanced stage among members
        // For simplicity, derive task stage from majority/highest member stage
        const stageOrder = ['New', 'Start', 'Issue', 'Review A', 'Review B', 'Update', 'Complete'];
        const stages = updatedMembers.map(m => m.stage);
        // Use the most recent/active stage - take the lowest-indexed (least advanced) to show work still in progress
        const minIdx = Math.min(...stages.map(s => stageOrder.indexOf(s)));
        const taskStage = stageOrder[minIdx] || t.stage;
        const isPaid = taskStage === 'Complete';
        return { ...t, stage: taskStage, paid: t.paid || isPaid, members: updatedMembers, history: updatedHistory, issueNote: updatedIssueNote };
      } else {
        // Bulk update all members (skip members on hold)
        const isPaid = newStage === 'Complete';
        return { 
          ...t, 
          stage: newStage, 
          paid: t.paid || isPaid, 
          members: t.members.map(m => m.isOnHold ? m : { ...m, stage: newStage }), 
          history: updatedHistory,
          issueNote: updatedIssueNote
        };
      }
    }));

    // Show toast notification for stage updates
    if (task) {
      const memberName = memberId ? task.members.find(m => m.id === memberId)?.name : null;
      const description = memberName 
        ? `${memberName} updated ${taskId} to ${newStage}`
        : `${taskId} — ${task.title}`;
      
      toast(`Task stage updated to ${newStage}`, {
        description,
        duration: 3000,
      });
    }

    if (newStage === 'Complete') {
      if (task) addActivity('complete', 'Task Completed', `${taskId} — ${task.title}`, `+₹ ${task.totalBudget.toLocaleString()}`, true);
    } else if (newStage === 'Review A' || newStage === 'Review B') {
      if (task) addActivity('review', 'Submitted for Review', `${taskId} — ${task.title}`);
    } else if (newStage === 'Update') {
      if (task) addActivity('update', 'Update Requested', `${taskId} — ${task.title}`);
    } else if (newStage === 'Issue') {
      if (task) addActivity('issue', 'Issue Reported', `${taskId} — ${task.title}`);
    } else if (newStage === 'Start') {
      if (task) addActivity('start', 'Task Started', `${taskId} — ${task.title}`);
    }
  }, [tasks, addActivity]);

  const deleteTask = useCallback((taskId, deletedBy = null) => {
    const task = tasks.find(t => t.id === taskId);
    setTasks(prev => prev.filter(t => t.id !== taskId));
    if (task) {
      setTrashedItems(prev => [{ ...task, _trashType: 'task', _deletedBy: deletedBy, _deletedAt: new Date() }, ...prev]);
      addActivity('delete', 'Task Deleted', `${taskId} — ${task.title}`);
    }
  }, [tasks, addActivity]);

  const pauseTask = useCallback((taskId) => {
    const task = tasks.find(t => t.id === taskId);
    const now = new Date();
    setTasks(prev => prev.map(t => t.id === taskId ? {
      ...t,
      paused: true,
      pausedOn: now,
      history: [...(t.history || []), { stage: t.stage, date: now, user: 'Admin', action: 'paused' }],
    } : t));
    if (task) addActivity('pause', 'Task On Hold', `${taskId} — ${task.title}`);
  }, [tasks, addActivity]);

  const resumeTask = useCallback((taskId) => {
    const task = tasks.find(t => t.id === taskId);
    const now = new Date();
    setTasks(prev => prev.map(t => t.id === taskId ? {
      ...t,
      paused: false,
      pausedOn: null,
      history: [...(t.history || []), { stage: t.stage, date: now, user: 'Admin', action: 'resumed' }],
    } : t));
    if (task) addActivity('resume', 'Task Activated', `${taskId} — ${task.title}`);
  }, [tasks, addActivity]);

  const markTaskPaid = useCallback((taskId, paidBy = null, source = null) => {
    const task = tasks.find(t => t.id === taskId);
    const now = new Date();
    const actor = paidBy ? paidBy.name : 'Admin';
    const historyEntry = {
      stage: 'Complete',
      date: now,
      user: actor,
      action: 'paid',
      note: source || undefined,
    };
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          stage: 'Complete',
          paid: true,
          paidOn: now,
          members: t.members.map(m => ({ ...m, stage: 'Complete' })),
          history: [...(t.history || []), historyEntry]
        };
      }
      return t;
    }));
    if (task) addActivity('payment', 'Payment Processed', `${taskId} — ${task.title}`, `+₹ ${task.totalBudget.toLocaleString()}`, true);
  }, [tasks, addActivity]);

  // ── Team actions ─────────────────────────────────────────────────────────
  const saveMember = useCallback((member, addedBy = null) => {
    setTeam(prev => {
      const exists = prev.find(m => m.id === member.id);
      if (exists) {
        const old = prev.find(m => m.id === member.id);
        if (old.desc !== member.desc) {
          setUnreadDescMembers(s => new Set([...s, member.id]));
        }
        addActivity('edit', 'Member Updated', `${member.name} — ${member.role}`);
        return prev.map(m => m.id === member.id ? member : m);
      } else {
        const newMember = addedBy ? { ...member, addedBy } : member;
        addActivity('member', 'Member Added', `${member.name} — ${member.role}`);
        return [...prev, newMember];
      }
    });
  }, [addActivity]);

  const markDescRead = useCallback((memberId) => {
    setUnreadDescMembers(s => { const n = new Set(s); n.delete(memberId); return n; });
  }, []);

  const toggleMemberStatus = useCallback((memberId) => {
    setTeam(prev => prev.map(m => {
      if (m.id !== memberId) return m;
      const newStatus = m.status === 'Active' ? 'Inactive' : 'Active';
      addActivity(newStatus === 'Inactive' ? 'deactivate' : 'activate',
        newStatus === 'Inactive' ? 'Member Deactivated' : 'Member Activated',
        `${m.name} — ${m.role}`);
      return { ...m, status: newStatus };
    }));
  }, [addActivity]);

  // ── Derived financial data ────────────────────────────────────────────────
  const financials = (() => {
    const totalInvestment = tasks.reduce((s, t) => s + t.totalBudget, 0);
    const moneyPaid = tasks.filter(t => t.paid || t.stage === 'Complete').reduce((s, t) => s + t.totalBudget, 0);
    const moneyDue = totalInvestment - moneyPaid;
    const paidRate = totalInvestment ? Math.round((moneyPaid / totalInvestment) * 100) : 0;

    // Member earnings derived from tasks
    const memberEarningsMap = {};
    tasks.forEach(task => {
      task.members.forEach(m => {
        if (!memberEarningsMap[m.id]) {
          memberEarningsMap[m.id] = { id: m.id, name: m.name, avatar: m.avatar, color: m.color, total: 0, paid: 0, pending: 0 };
        }
        memberEarningsMap[m.id].total += m.budget;
        if (task.paid || task.stage === 'Complete') memberEarningsMap[m.id].paid += m.budget;
        else memberEarningsMap[m.id].pending += m.budget;
      });
    });
    const memberEarnings = Object.values(memberEarningsMap).sort((a, b) => b.total - a.total);

    return { totalInvestment, moneyPaid, moneyDue, paidRate, memberEarnings };
  })();

  // ── Dashboard stats ────────────────────────────────────────────────────────
  const dashStats = {
    activeTasks: tasks.filter(t => t.stage !== 'Complete').length,
    totalTasks: tasks.length,
    completedTasks: tasks.filter(t => t.stage === 'Complete').length,
    teamMembers: team.length,
    activeMembers: team.filter(m => m.status === 'Active').length,
    totalInvestment: financials.totalInvestment,
    moneyDue: financials.moneyDue,
    reviewPending: tasks.filter(t => t.stage === 'Review').length,
    stageBreakdown: STAGES.reduce((acc, s) => ({ ...acc, [s]: tasks.filter(t => t.stage === s).length }), {}),
  };

  // ── Task Request actions ─────────────────────────────────────────────────
  const addTaskRequest = useCallback((request) => {
    setTaskRequests(prev => [{ ...request, id: Date.now(), timestamp: new Date(), status: 'pending' }, ...prev]);
  }, []);

  const approveTaskRequest = useCallback((requestId, approvedBy = null) => {
    setTaskRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'approved', isCreated: true, approvedBy } : r));
  }, []);

  const completeTaskRequest = useCallback((requestId, approvedBy = null) => {
    setTaskRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'completed', isComplete: true, approvedBy: r.approvedBy || approvedBy } : r));
  }, []);

  const addTaskHistoryEntry = useCallback((taskId, entry) => {
    setTasks(prev => prev.map(t => t.id === taskId
      ? { ...t, history: [...(t.history || []), entry] }
      : t
    ));
  }, []);

  const addScheduledTask = useCallback((task) => {
    setScheduledTasks(prev => [{ ...task, isScheduled: true, createdAt: new Date() }, ...prev]);
  }, []);

  const removeScheduledTask = useCallback((taskId) => {
    setScheduledTasks(prev => prev.filter(t => t.id !== taskId));
  }, []);

  const addToTrash = useCallback((item) => {
    setTrashedItems(prev => [{ ...item, _deletedAt: new Date() }, ...prev]);
  }, []);

  const restoreFromTrash = useCallback((itemId) => {
    const item = trashedItems.find(i => i.id === itemId);
    if (!item) return;
    if (item._trashType === 'task') {
      const { _trashType, _deletedBy, _deletedAt, ...task } = item;
      setTasks(prev => [task, ...prev]);
    }
    setTrashedItems(prev => prev.filter(i => i.id !== itemId));
  }, [trashedItems]);

  const permanentlyDelete = useCallback((itemId) => {
    setTrashedItems(prev => prev.filter(i => i.id !== itemId));
  }, []);

  const clearTrash = useCallback(() => setTrashedItems([]), []);

  const deleteTaskRequest = useCallback((requestId) => {
    setTaskRequests(prev => prev.filter(r => r.id !== requestId));
  }, []);

  // Provide TAGS and CATEGORIES for all users
  const contextTags = TAGS;
  const contextCategories = CATEGORIES;
  // Manual refresh function for organizations (force refresh from Firebase)
  const refreshOrganizations = useCallback(async () => {

    await loadOrganizations(true); // Force refresh bypasses cache
  }, [loadOrganizations]);

  return (
    <AppContext.Provider value={{
      currentUser, setCurrentUser,
      tasks, team, activity, financials, dashStats, taskRequests, scheduledTasks, trashedItems, roles,
      helpSubmissions, setHelpSubmissions,
      unreadDescMembers, markDescRead,
      createTask, updateTask, updateTaskStage, deleteTask, markTaskPaid, pauseTask, resumeTask, addTaskHistoryEntry,
      saveMember, toggleMemberStatus,
      saveRoles: setRoles,
      addTaskRequest, approveTaskRequest, completeTaskRequest, deleteTaskRequest, addScheduledTask, removeScheduledTask, addToTrash, restoreFromTrash, permanentlyDelete, clearTrash,
      addActivity, fmt,
      STAGES, STAGE_COLORS, STAGE_BG, TAGS: contextTags, CATEGORIES: contextCategories, PERMISSION_GROUPS,
      darkMode, toggleDarkMode,
      adminPassword, updateAdminPassword,
      dataLoaded, // Export data loading state
      refreshData, // Export refresh function
      refreshTrigger, // Export refresh trigger for components to react to
      // Organization data for Admin Project Dashboard
      organizations, setOrganizations,
      monthlyGrowth, setMonthlyGrowth,
      yearlyGrowth, setYearlyGrowth,
      planDistribution, setPlanDistribution,
      refreshOrganizations, // Export manual refresh function
      // Global search
      globalSearchQuery, setGlobalSearchQuery,
      // Selected organization for navigation
      selectedOrganizationId, setSelectedOrganizationId,
      // Navigation request
      navigationRequest, setNavigationRequest,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
