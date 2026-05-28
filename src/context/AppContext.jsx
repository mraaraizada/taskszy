import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { notify } from '../lib/notify';
import {
  collection, doc, onSnapshot, query, orderBy, where,
  setDoc, updateDoc, deleteDoc, addDoc, serverTimestamp,
  getDoc, getDocs, limit,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { updateProfile as updateUserProfile } from '../lib/userProfileService';
import { getUserAccessLevel, getTasksQuery, getTeamQuery, getActivityQuery, logDataAccess } from '../lib/dataAccessService';
import { getFeatureFlag } from '../lib/featureFlags';
import { monitor } from '../lib/performanceMonitor';
import { cache, cacheFirestoreData, getCachedFirestoreData, invalidateFirestoreCache } from '../lib/cacheService';
import { listenerRegistry, throttleListener, readStats } from '../lib/readOptimizer';
import { updateNoteWithConflictResolution } from '../lib/conflictResolution';
import { subscribeToDashboardAggregation, rebuildDashboardAggregation } from '../lib/aggregationService';

// Module load timestamp for debugging cache issues
console.log('🔄 AppContext.jsx loaded at:', new Date().toISOString(), '- Cache invalidation is ACTIVE');

// ── Shared Constants ──────────────────────────────────────────────────────────
export const STAGES = ['New', 'Start', 'Issue', 'Review A', 'Review B', 'Update', 'Complete'];
export const STAGE_COLORS = { New: '#9CA3AF', Start: '#3B5BFC', Issue: '#EF4444', 'Review A': '#F97316', 'Review B': '#7C3AED', Update: '#D97706', Complete: '#12C479' };
export const STAGE_BG = { New: '#F3F4F6', Start: '#EEF2FF', Issue: '#FEF2F2', 'Review A': '#FFF7ED', 'Review B': '#F5F3FF', Update: '#FFFBEB', Complete: '#ECFDF5' };

export const TAGS = [];

export const CATEGORIES = [];

const INITIAL_TAGS = [];
const INITIAL_CATEGORIES = [];

export const PERMISSION_GROUPS = [
  { category: 'Task Management',    color: '#3B5BFC', bg: '#EEF2FF', perms: ['Create tasks','View all tasks','View assigned tasks only','Edit task title','Edit task description','Edit task deadline','Edit task budget','Delete tasks','Update own stage','Update any stage','Complete tasks','Assign team members','Remove team members'] },
  { category: 'Team Management',    color: '#7C3AED', bg: '#F5F3FF', perms: ['Add team members','Edit team members','View all team members','View members on assigned tasks','Assign roles','Deactivate members','Delete members','View private admin notes'] },
  { category: 'Financial',          color: '#12C479', bg: '#ECFDF5', perms: ['View all financials','View own payments only','View team payments','View task budgets','Edit budgets','Process payments','Generate financial reports','Export payment data'] },
  { category: 'System',             color: '#F97316', bg: '#FFF7ED', perms: ['Create roles','Edit roles','Delete roles','Manage permissions','System settings','View audit logs'] },
  { category: 'Dashboard & Reports',color: '#06B6D4', bg: '#ECFEFF', perms: ['View own dashboard','View admin dashboard','View own analytics','View team analytics','Generate reports'] },
  { category: 'Notifications',      color: '#EF4444', bg: '#FEF2F2', perms: ['Receive task notifications','Receive payment notifications','Receive team notifications','Receive system notifications'] },
];

const ADMIN_PERMS = Object.fromEntries(PERMISSION_GROUPS.map(g => [g.category, [...g.perms]]));

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

const INITIAL_BROADCASTS = [];

const INITIAL_ACTIVITY = [];

const INITIAL_HELP_SUBMISSIONS = [];

const INITIAL_TASK_REQUESTS = [];

// ── Context ────────────────────────────────────────────────────────────────────
// ── Context ────────────────────────────────────────────────────────────────────
const AppContext = createContext(null);

// ── Mock task-linked scribes ──────────────────────────────────────────────────
const INITIAL_TASK_SCRIBES = [];

export function AppProvider({ children }) {
  const [currentUser, setCurrentUser] = useState({ 
    name: 'User', 
    role: 'Member', 
    avatar: 'U', 
    color: '#3B5BFC', 
    userRole: undefined // Will be set during login (admin/management/member)
    // Don't set hasSeenWelcomeAnimation here - let it be undefined until loaded from Firestore
  });

  // currentUid — set after login, used for per-user Firestore writes
  // Initialize from localStorage to prevent null state on reload
  const [currentUid, setCurrentUid] = useState(() => {
    if (typeof window !== 'undefined') {
      const cachedUid = localStorage.getItem('currentUid');
      if (cachedUid) {
        console.log('🔑 AppContext: Initializing currentUid from localStorage:', cachedUid);
        return cachedUid;
      }
    }
    return null;
  });
  
  // Wrap setCurrentUid to add logging and localStorage persistence
  const setCurrentUidWithLog = useCallback((uid) => {
    console.log('🔑 AppContext: setCurrentUid called with:', uid);
    console.log('🔑 AppContext: Previous currentUid was:', currentUid);
    
    // Persist to localStorage
    if (typeof window !== 'undefined') {
      if (uid) {
        localStorage.setItem('currentUid', uid);
        console.log('🔑 AppContext: Saved currentUid to localStorage');
      } else {
        localStorage.removeItem('currentUid');
        console.log('🔑 AppContext: Removed currentUid from localStorage');
      }
    }
    
    setCurrentUid(uid);
    console.log('🔑 AppContext: setCurrentUid state update queued');
  }, [currentUid]);
  
  // Log when currentUid actually changes
  useEffect(() => {
    console.log('🔑 AppContext: currentUid changed to:', currentUid);
  }, [currentUid]);

  // workspaceId — set after login from Firebase Auth profile, no localStorage
  const [workspaceId, setWorkspaceId] = useState(null);

  // Data loading state
  const [dataLoaded, setDataLoaded] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [dataLoadError, setDataLoadError] = useState(null); // Track data loading errors
  const [retryCount, setRetryCount] = useState(0); // Track retry attempts
  const MAX_AUTO_RETRIES = 2; // Maximum automatic retries before requiring manual retry
  
  // Core data state — populated by Firestore listeners when workspaceId is set
  const [tasks, setTasks]   = useState(INITIAL_TASKS);
  const [team, setTeam]     = useState(INITIAL_TEAM);
  const [activity, setActivity] = useState(INITIAL_ACTIVITY);
  const [taskRequests, setTaskRequests] = useState([]);
  const [trashedItems, setTrashedItems] = useState([]);
  const [scheduledTasks, setScheduledTasks] = useState([]);
  const [helpSubmissions, setHelpSubmissions] = useState([]);
  const [unreadDescMembers, setUnreadDescMembers] = useState(new Set());
  const [roles, setRoles]   = useState(INITIAL_ROLES);
  const [tags, setTags]     = useState(INITIAL_TAGS);
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  const [notes, setNotes]   = useState(INITIAL_TASK_SCRIBES);
  const [broadcasts, setBroadcasts] = useState(INITIAL_BROADCASTS);
  const [payments, setPayments] = useState([]); // ⭐ PHASE 2: Payment state

  // ── Workspace path helper — declared early so all callbacks can reference it ──
  const wsPath = workspaceId ? `workspaces/${workspaceId}` : null;

  // ── Real-time user profile listener ──────────────────────────────────────
  // Listen to user's own profile document for real-time updates
  useEffect(() => {
    if (!currentUid) {
      console.log('⏳ User profile listener: Waiting for currentUid...');
      return;
    }
    
    const listenerKey = `user_profile_${currentUid}`;
    
    // Check if listener already exists
    if (listenerRegistry.has(listenerKey)) {
      console.log('⚠️ User profile listener already exists, skipping');
      return;
    }
    
    console.log('👤 Setting up user profile listener for uid:', currentUid);
    
    const userRef = doc(db, 'users', currentUid);
    const unsubscribe = onSnapshot(userRef, async (snap) => {
      if (!snap.exists()) return;
      
      const profileData = snap.data();
      console.log('📥 User profile updated from Firestore:', {
        uid: currentUid,
        name: profileData.name,
        email: profileData.email,
        role: profileData.role,
        memberId: profileData.memberId,
        workspaceId: profileData.workspaceId,
        forceLogout: profileData.forceLogout,
        sessionToken: profileData.sessionToken ? 'present' : 'missing'
      });
      
      // Check session token - logout if it doesn't match (another device logged in)
      if (typeof window !== 'undefined' && profileData.sessionToken) {
        const localToken = localStorage.getItem('sessionToken');
        if (localToken && localToken !== profileData.sessionToken) {
          console.log('🚪 Session token mismatch - another device logged in');
          
          // Sign out and reload
          const { signOutUser } = await import('../lib/authService');
          await signOutUser();
          window.location.href = '/login?reason=another-device';
          return;
        }
      }
      
      // Check if user has been deactivated and needs to be logged out
      if (profileData.forceLogout === true) {
        console.log('🚪 Force logout detected - user has been deactivated');
        
        // Clear the forceLogout flag
        await updateDoc(userRef, { forceLogout: false }).catch(err => 
          console.error('Failed to clear forceLogout flag:', err)
        );
        
        // Sign out and reload
        const { signOutUser } = await import('../lib/authService');
        await signOutUser();
        window.location.href = '/login?reason=deactivated';
        return;
      }
      
      // For all users, fetch their actual role name from team collection if they have a memberId
      if (profileData.workspaceId && profileData.memberId) {
        try {
          const memberDoc = await getDoc(doc(db, `workspaces/${profileData.workspaceId}/team/${profileData.memberId}`));
          if (memberDoc.exists()) {
            const memberData = memberDoc.data();
            
            console.log('📥 Fetched team member data:', {
              memberId: profileData.memberId,
              role: memberData.role,
              name: memberData.name,
              '⚠️ SETTING DISPLAY ROLE TO': memberData.role
            });
            
            // Use the actual role from team data - ALWAYS, no fallback
            // Include ALL profile fields so dashboards don't need to load them separately
            setCurrentUser(prev => ({
              ...prev,
              id: parseInt(profileData.memberId),
              uid: currentUid,
              name: profileData.name || prev.name,
              email: profileData.email || prev.email,
              phone: profileData.phone || prev.phone || '',
              location: profileData.location || memberData.location || '',
              about: profileData.about || memberData.about || '',
              avatarImg: profileData.avatarImg || memberData.avatarImg || null,
              role: memberData.role, // ALWAYS use team role, never fall back
              avatar: memberData.avatar || (profileData.name || prev.name)[0].toUpperCase(),
              color: memberData.color || prev.color || '#3B5BFC',
              status: memberData.status || 'Active', // Add status from team data
              joined: memberData.joined || prev.joined, // Add joined date from team data
              // ⭐ CRITICAL: Preserve userRole from previous state - it was set during login
              // userRole determines which dashboard to show and data access level
              userRole: prev.userRole,
              hasSeenWelcomeAnimation: profileData.hasSeenWelcomeAnimation === true,
              memberId: profileData.memberId,
            }));
            
            console.log('✅ User state updated with complete profile data:', {
              role: memberData.role,
              status: memberData.status || 'Active',
              hasLocation: !!(profileData.location || memberData.location),
              hasAbout: !!(profileData.about || memberData.about),
              hasAvatarImg: !!(profileData.avatarImg || memberData.avatarImg)
            });
            return;
          }
        } catch (err) {
          console.warn('Could not fetch team member data:', err);
        }
      }
      
      // Fallback update without team member data - keep previous role
      // Include all profile fields
      setCurrentUser(prev => ({
        ...prev,
        uid: currentUid,
        name: profileData.name || prev.name,
        email: profileData.email || prev.email,
        phone: profileData.phone || prev.phone || '',
        location: profileData.location || prev.location || '',
        about: profileData.about || prev.about || '',
        avatarImg: profileData.avatarImg || prev.avatarImg || null,
        // Keep previous role - don't override
        avatar: (profileData.name || prev.name)[0].toUpperCase(),
        color: prev.color || '#3B5BFC', // ⭐ Ensure color is preserved
        // ⭐ CRITICAL: Preserve userRole from previous state - it was set during login
        userRole: prev.userRole,
        hasSeenWelcomeAnimation: profileData.hasSeenWelcomeAnimation === true,
        memberId: profileData.memberId,
      }));
      
      // If memberId is missing but we can find the user in the team, update it
      if (!profileData.memberId && profileData.workspaceId) {
        console.log('⚠️ memberId missing in user profile, attempting to find and set it...');
        // This will be handled by a separate effect that watches the team collection
      }
    }, (error) => {
      console.error('❌ User profile listener error:', error);
    });
    
    // Register listener to prevent duplicates
    listenerRegistry.register(listenerKey, unsubscribe);
    
    return () => {
      listenerRegistry.unregister(listenerKey);
    };
  }, [currentUid]);
  
  // ── Auto-set memberId if missing ──────────────────────────────────────────
  // If user profile doesn't have memberId, find it from team collection and update
  useEffect(() => {
    // Skip if user is workspace owner (admin) - they don't need a memberId
    const isWorkspaceOwner = workspaceId && currentUid && workspaceId === `ws_${currentUid}`;
    
    // Only run if we have all required data and memberId is missing
    if (!currentUid || !workspaceId || !currentUser || currentUser.memberId || team.length === 0 || isWorkspaceOwner) {
      if (currentUser?.memberId) {
        console.log('✅ memberId already set:', currentUser.memberId);
      } else if (isWorkspaceOwner) {
        console.log('👑 Workspace owner - memberId not required');
      }
      return;
    }
    
    const checkAndSetMemberId = async () => {
      try {
        console.log('🔍 Auto-setting memberId for user:', currentUser.email || currentUser.name);
        console.log('👥 Searching in team:', team.map(m => ({ id: m.id, name: m.name, email: m.email })));
        
        // Find member in team data by email (most reliable) or name
        const matchingMember = team.find(m => 
          (currentUser.email && m.email === currentUser.email) ||
          (currentUser.name && m.name === currentUser.name)
        );
        
        if (matchingMember) {
          const memberId = matchingMember.id; // Keep as string to match task member IDs
          console.log('✅ Found matching team member - setting memberId:', memberId);
          
          // Update user profile in Firestore
          await updateDoc(doc(db, 'users', currentUid), { memberId });
          console.log('✅ memberId saved to Firestore user profile');
          
          // Also update local state immediately to trigger listener re-initialization
          setCurrentUser(prev => ({
            ...prev,
            memberId: memberId
          }));
          console.log('✅ memberId updated in local state - listeners should re-initialize');
        } else {
          console.log('⚠️ No matching team member found for:', currentUser.email || currentUser.name, '- This is normal for workspace owners');
        }
      } catch (error) {
        console.error('❌ Error auto-setting memberId:', error);
      }
    };
    
    checkAndSetMemberId();
  }, [currentUid, workspaceId, currentUser?.email, currentUser?.name, currentUser?.memberId, team.length]);

  // ── Update current user from team data when memberId is set ──────────────
  // This runs whenever team data or memberId changes
  useEffect(() => {
    if (!currentUser?.memberId || team.length === 0) return;
    
    // Find the team member that matches the current user's memberId
    const currentMember = team.find(m => parseInt(m.id) === parseInt(currentUser.memberId));
    
    if (currentMember) {
      console.log('👤 Updating user profile from team data:', {
        memberId: currentMember.id,
        name: currentMember.name,
        role: currentMember.role,
        status: currentMember.status || 'Active',
        '📝 DESC FIELD': currentMember.desc,
        '📝 HAS DESC': !!currentMember.desc
      });
      
      // Update current user with ALL team member data
      setCurrentUser(prev => ({
        ...prev,
        id: parseInt(currentMember.id),
        uid: prev.uid || currentUid,
        name: currentMember.name || prev.name,
        avatar: currentMember.avatar || prev.avatar,
        color: currentMember.color || prev.color,
        role: currentMember.role || prev.role,
        phone: currentMember.phone || prev.phone,
        location: currentMember.location || prev.location || '',
        about: currentMember.about || prev.about || '',
        desc: currentMember.desc || prev.desc || '', // Add work description from team data
        avatarImg: currentMember.avatarImg || prev.avatarImg || null,
        status: currentMember.status || 'Active', // Add status field from team data
        joined: currentMember.joined || prev.joined, // Add joined date from team data
        // ⭐ CRITICAL: Preserve userRole from previous state
        userRole: prev.userRole,
      }));
    } else {
      console.log('⚠️ No team member found with memberId:', currentUser.memberId);
    }
  }, [currentUser?.memberId, team, currentUid]);

  // ── Enrich task member data with latest team information ──────────────────
  // This ensures task modals show current avatar, name, role, color for each member
  const enrichmentRef = useRef({ lastTeamUpdate: 0, lastTasksCount: 0 });
  
  useEffect(() => {
    if (tasks.length === 0 || team.length === 0) return;
    
    // Create a signature to detect if we need to re-enrich
    // Include avatarImg to detect profile picture changes
    const teamSignature = team.map(t => `${t.id}-${t.name}-${t.avatar}-${t.role}-${t.avatarImg || 'no-img'}`).join('|');
    
    const needsEnrichment = enrichmentRef.current.lastTeamUpdate !== teamSignature;
    
    if (!needsEnrichment) {
      return; // Skip if nothing changed
    }
    
    console.log('🔄 Enriching task member data with latest team info');
    
    // Use setTasks with callback to get current tasks state
    setTasks(currentTasks => {
      const enrichedTasks = currentTasks.map(task => {
        if (!task.members || task.members.length === 0) return task;
        
        // Enrich each member with latest data from team array
        const enrichedMembers = task.members.map(taskMember => {
          const teamMember = team.find(t => String(t.id) === String(taskMember.id));
          
          if (teamMember) {
            // Merge team data into task member (keep task-specific fields like stage, budget, memberDesc)
            return {
              ...taskMember,
              name: teamMember.name,
              avatar: teamMember.avatar,
              color: teamMember.color,
              role: teamMember.role,
              avatarImg: teamMember.avatarImg || taskMember.avatarImg,
              uid: teamMember.uid || taskMember.uid,
              // Keep task-specific fields
              id: taskMember.id,
              stage: taskMember.stage,
              budget: taskMember.budget,
              memberDesc: taskMember.memberDesc,
              isOnHold: taskMember.isOnHold
            };
          }
          
          return taskMember; // Return unchanged if no team member found
        });
        
        return {
          ...task,
          members: enrichedMembers
        };
      });
      
      return enrichedTasks;
    });
    
    // Update the ref to prevent re-enrichment
    enrichmentRef.current = {
      lastTeamUpdate: teamSignature
    };
  }, [team]); // Only run when team changes

  // ── Check for unread work descriptions based on role updates ──────────────
  useEffect(() => {
    if (team.length === 0 || roles.length === 0) return;
    
    console.log('🔍 Checking for unread descriptions:', {
      teamCount: team.length,
      rolesCount: roles.length
    });
    
    const unreadSet = new Set();
    
    team.forEach(member => {
      const memberRole = roles.find(r => r.name === member.role);
      console.log(`👤 Checking ${member.name} (${member.role}):`, {
        hasRole: !!memberRole,
        hasWorkDesc: !!memberRole?.workDescription,
        roleUpdatedAt: memberRole?.workDescriptionUpdatedAt || 0,
        userReadAt: member.descReadAt || 0,
        workDesc: memberRole?.workDescription?.substring(0, 30) || 'none'
      });
      
      if (memberRole?.workDescription && memberRole.workDescriptionUpdatedAt) {
        const roleUpdatedAt = memberRole.workDescriptionUpdatedAt;
        const userReadAt = member.descReadAt || 0;
        
        console.log(`  📊 Timestamps for ${member.name}:`, {
          roleUpdatedAt,
          userReadAt,
          isNewer: roleUpdatedAt > userReadAt,
          shouldShowDot: roleUpdatedAt > userReadAt
        });
        
        // Show dot if role was updated after user last read it
        // If user never read it (userReadAt = 0), and role has an update timestamp, show dot
        if (roleUpdatedAt > userReadAt) {
          unreadSet.add(member.id);
          console.log(`🔔 Unread description for ${member.name}:`, {
            roleUpdatedAt: new Date(roleUpdatedAt).toLocaleString(),
            userReadAt: userReadAt > 0 ? new Date(userReadAt).toLocaleString() : 'Never read'
          });
        }
      }
    });
    
    console.log('📊 Final unread members:', Array.from(unreadSet));
    
    // Only update if the Set has actually changed
    setUnreadDescMembers(prev => {
      const prevArray = Array.from(prev).sort();
      const newArray = Array.from(unreadSet).sort();
      const hasChanged = JSON.stringify(prevArray) !== JSON.stringify(newArray);
      
      if (hasChanged) {
        console.log('🔄 Unread members changed:', { prev: prevArray, new: newArray });
        return unreadSet;
      }
      
      console.log('✅ Unread members unchanged, keeping previous Set');
      return prev;
    });
  }, [team, roles]);

  // ── Firestore real-time listeners ─────────────────────────────────────────
  useEffect(() => {
    if (!workspaceId) {
      // No workspace yet — mark as loaded so the app doesn't hang on skeleton
      setDataLoaded(true);
      return;
    }
    
    // ⭐ CRITICAL: For non-admin users, wait until memberId is available before initializing listeners
    // This prevents filtering with the wrong userId (Firebase UID instead of memberId)
    const initialUserAccessLevel = getUserAccessLevel(currentUser);
    const isWorkspaceOwner = workspaceId && currentUid && workspaceId === `ws_${currentUid}`;
    
    console.log('🔍 Listener initialization check:', {
      isWorkspaceOwner,
      initialUserAccessLevel,
      hasMemberId: !!currentUser?.memberId,
      memberId: currentUser?.memberId,
      currentUid,
      userRole: currentUser?.userRole,
      role: currentUser?.role
    });
    
    // Admin users should get immediate access like workspace owners
    const isAdminUser = initialUserAccessLevel === 'admin';
    
    if (!isWorkspaceOwner && !isAdminUser && !currentUser?.memberId) {
      console.log('⏳ Waiting for memberId before initializing listeners...', {
        userAccessLevel: initialUserAccessLevel,
        hasMemberId: !!currentUser?.memberId,
        currentUid
      });
      return; // Don't initialize listeners yet
    }
    
    console.log('✅ Ready to initialize listeners:', {
      workspaceId,
      userAccessLevel: initialUserAccessLevel,
      isWorkspaceOwner,
      isAdminUser,
      memberId: currentUser?.memberId,
      currentUid
    });

    const wsPath = `workspaces/${workspaceId}`;
    const unsubs = [];
    let isSubscribed = true;

    console.log('🔥 Setting up Firestore listeners for workspace:', workspaceId);

    // Workspace settings listener - Load workspace name, subtitle, logo
    const wsListenerKey = `workspace_settings_${workspaceId}`;
    if (!listenerRegistry.has(wsListenerKey)) {
      const wsUnsub = onSnapshot(
        doc(db, wsPath),
        throttleListener((snap) => {
          if (!isSubscribed) return;
          
          if (snap.exists()) {
            const wsData = snap.data();
            const settings = wsData.settings || {};
            
            console.log('🏢 Workspace settings loaded:', {
              name: settings.workspaceName,
              sub: settings.workspaceSub,
              hasLogo: !!settings.workspaceLogo,
              hasCompletedSetup: settings.hasCompletedSetup
            });
            
            // Update workspace settings in state
            if (settings.workspaceName) setWorkspaceName(settings.workspaceName);
            if (settings.workspaceSub) setWorkspaceSub(settings.workspaceSub);
            if (settings.workspaceLogo !== undefined) setWorkspaceLogo(settings.workspaceLogo);
            if (settings.hasCompletedSetup !== undefined) setHasCompletedSetup(settings.hasCompletedSetup);
          }
        }, 1000), // Throttle to 1 second
        (error) => {
          monitor.trackError(error, 'workspace_settings_listener');
          console.error('❌ Workspace settings listener error:', error);
        }
      );
      listenerRegistry.register(wsListenerKey, wsUnsub);
      unsubs.push(() => listenerRegistry.unregister(wsListenerKey));
    }

    // Determine user access level for optimized queries
    // ⭐ CRITICAL FIX: Check if user is workspace owner (admin) by comparing workspaceId with uid
    // Reuse the initialUserAccessLevel from above
    let userAccessLevel = initialUserAccessLevel;
    
    console.log('🔐 Workspace owner check:', {
      workspaceId,
      currentUid,
      expectedWorkspaceId: `ws_${currentUid}`,
      isMatch: workspaceId === `ws_${currentUid}`,
      initialUserAccessLevel
    });
    
    // Override access level if user is workspace owner
    if (workspaceId && currentUid && workspaceId === `ws_${currentUid}`) {
      console.log('👑 User is workspace owner - overriding access level to ADMIN');
      userAccessLevel = 'admin';
    }
    
    const userId = currentUser.memberId || currentUid;
    console.log('🔐 User access level:', userAccessLevel, 'for user:', userId);
    console.log('🔐 User ID determination:', {
      'currentUser.memberId': currentUser?.memberId,
      'currentUid': currentUid,
      'userId (final)': userId,
      'Will use': currentUser?.memberId ? 'memberId' : 'Firebase UID'
    });
    console.log('🔐 Current user details:', { 
      uid: currentUid, 
      memberId: currentUser?.memberId, 
      userRole: currentUser?.userRole,
      role: currentUser?.role,
      name: currentUser?.name,
      workspaceId: workspaceId,
      isOwner: workspaceId === `ws_${currentUid}`,
      '⚠️ COMPUTED ACCESS LEVEL': userAccessLevel,
      '⚠️ WILL FILTER?': userAccessLevel === 'member' ? 'YES - MEMBER FILTERING' : userAccessLevel === 'manager' ? 'YES - MANAGER FILTERING' : 'NO - ADMIN (ALL TASKS)'
    });
    
    // Check feature flags
    const useServerFiltering = getFeatureFlag('serverSideTaskFiltering');
    console.log('🚩 Server-side filtering:', useServerFiltering ? 'ENABLED' : 'DISABLED');
    
    // Log data access for monitoring
    logDataAccess(currentUid, userAccessLevel, 'setup_listeners', { workspaceId, useServerFiltering });

    // Tasks - Use scoped query based on user access level
    // Use only workspaceId for listener key to prevent duplicate listeners
    // ⭐ IMPORTANT: Include userId in listener key so it re-initializes when memberId becomes available
    const tasksListenerKey = `tasks_${workspaceId}_${userId}`;
    if (!listenerRegistry.has(tasksListenerKey)) {
      const tasksQueryRef = getTasksQuery(workspaceId, userId, userAccessLevel, { useServerFiltering });
      const tasksUnsub = onSnapshot(
        tasksQueryRef,
        throttleListener((snap) => {
          if (!isSubscribed) return;
          
          // Track reads
          monitor.trackRead('tasks', snap.docs.length);
          
          let loadedTasks = snap.docs.map(d => {
            const data = d.data();
            
            // ⭐ CRITICAL: Clean and validate stage values to prevent duplicates
            const cleanStage = (data.stage || 'New').trim();
            const validStage = STAGES.includes(cleanStage) ? cleanStage : 'New';
            
            // Clean member stages as well
            const cleanMembers = (data.members || []).map(m => {
              const memberStage = (m.stage || 'New').trim();
              const validMemberStage = STAGES.includes(memberStage) ? memberStage : 'New';
              
              if (memberStage !== validMemberStage) {
                console.warn('⚠️ Invalid member stage detected:', {
                  taskId: d.id,
                  memberId: m.id,
                  memberName: m.name,
                  invalidStage: m.stage,
                  cleanedStage: validMemberStage
                });
              }
              
              return {
                ...m,
                stage: validMemberStage // Ensure stage is always set
              };
            });
            
            if (data.stage !== validStage) {
              console.warn('⚠️ Invalid task stage detected:', {
                taskId: d.id,
                invalidStage: data.stage,
                cleanedStage: validStage
              });
            }
            
            return {
              ...data,
              id: d.id,
              stage: validStage,
              members: cleanMembers,
              // Convert Firestore Timestamp to Date
              createdDate: data.createdDate?.toDate ? data.createdDate.toDate() : data.createdDate,
              // Convert history dates to Date objects
              history: data.history?.map(h => ({
                ...h,
                date: h.date?.toDate ? h.date.toDate() : h.date
              })) || []
            };
          });
          
          // Client-side filtering for members (only if server-side filtering is disabled)
          // ⚠️ IMPORTANT: Admin users should NEVER be filtered - they see ALL tasks
          if (userAccessLevel === 'admin') {
            console.log(`👑 ADMIN user - no filtering applied, showing all ${loadedTasks.length} tasks`);
          } else if (userAccessLevel === 'member' && userId && !useServerFiltering) {
            const beforeFilter = loadedTasks.length;
            console.log(`🔍 Starting client-side filtering for userId: ${userId}`);
            console.log(`🔍 Current user info:`, {
              uid: currentUid,
              memberId: currentUser?.memberId,
              userRole: currentUser?.userRole,
              name: currentUser?.name,
              userId: userId
            });
            console.log(`🔍 Sample task members:`, loadedTasks[0]?.members?.map(m => ({ id: m.id, name: m.name })));
            console.log(`🔍 Sample task memberIds:`, loadedTasks[0]?.memberIds);
            
            loadedTasks = loadedTasks.filter(task => {
              // Check if user is in the members array by memberId
              // userId here should be currentUser.memberId (not Firebase UID)
              const isMember = task.members?.some(m => String(m.id) === String(userId));
              
              // Also check memberIds array if it exists
              const isInMemberIds = task.memberIds?.some(id => String(id) === String(userId));
              
              const shouldShow = isMember || isInMemberIds;
              if (!shouldShow && task.id) {
                console.log(`🔍 Task ${task.id} filtered out - not a member`, {
                  userId,
                  'userId type': typeof userId,
                  taskMembers: task.members?.map(m => ({ id: m.id, idType: typeof m.id, name: m.name })),
                  taskMemberIds: task.memberIds,
                  isMember,
                  isInMemberIds,
                  '⚠️ userId matches any member?': task.members?.some(m => m.id == userId || String(m.id) === String(userId))
                });
              } else if (shouldShow) {
                console.log(`✅ Task ${task.id} VISIBLE - user is assigned`, {
                  userId,
                  isMember,
                  isInMemberIds
                });
              }
              
              return shouldShow;
            });
            console.log(`🔍 CLIENT-SIDE filtered tasks: ${beforeFilter} → ${loadedTasks.length} tasks`);
          } else if (userAccessLevel === 'member' && useServerFiltering) {
            console.log(`⚡ SERVER-SIDE filtering active - no client filtering needed`);
          }
          
          // ⭐ PHASE 6: Client-side filtering for management users
          if (userAccessLevel === 'manager' && userId) {
            const beforeFilter = loadedTasks.length;
            console.log(`🔍 Starting management filtering for userId: ${userId}, currentUid: ${currentUid}`);
            
            loadedTasks = loadedTasks.filter(task => {
              // Show tasks created by THIS specific management user
              const createdByThisUser = task.createdBy?.uid === currentUid || task.createdBy?.memberId === userId;
              
              // Show tasks where management user is assigned
              const isAssigned = task.members?.some(m => String(m.id) === String(userId));
              const isInMemberIds = task.memberIds?.some(id => String(id) === String(userId));
              
              // Show if either condition is true
              const shouldShow = createdByThisUser || isAssigned || isInMemberIds;
              
              if (!shouldShow && task.id) {
                console.log(`🔍 Task ${task.id} filtered out:`, {
                  taskTitle: task.title,
                  createdByUid: task.createdBy?.uid,
                  createdByMemberId: task.createdBy?.memberId,
                  currentUid: currentUid,
                  userId: userId,
                  createdByThisUser,
                  isAssigned,
                  isInMemberIds
                });
              } else if (shouldShow) {
                console.log(`✅ Task ${task.id} VISIBLE:`, {
                  taskTitle: task.title,
                  createdByThisUser,
                  isAssigned,
                  isInMemberIds
                });
              }
              
              return shouldShow;
            });
            console.log(`🔍 MANAGEMENT filtered tasks: ${beforeFilter} → ${loadedTasks.length} tasks`);
          }
          
          console.log(`📊 Loaded ${loadedTasks.length} tasks for ${userAccessLevel} user`);
          
          // Cache the tasks data
          cacheFirestoreData('tasks', workspaceId, loadedTasks);
          
          setTasks(loadedTasks);
        }, 500), // Throttle to 500ms
        (error) => {
          monitor.trackError(error, 'tasks_listener');
          console.error('❌ Tasks listener error:', error);
          
          // Set error state instead of silently retrying
          if (retryCount < MAX_AUTO_RETRIES) {
            console.warn(`⚠️ Firestore error - auto-retry ${retryCount + 1}/${MAX_AUTO_RETRIES}`);
            setRetryCount(prev => prev + 1);
          } else {
            console.error('❌ Max auto-retries reached - manual retry required');
            setDataLoadError({
              message: 'Failed to load tasks data',
              code: error.code,
              canRetry: true
            });
          }
        }
      );
      listenerRegistry.register(tasksListenerKey, tasksUnsub);
      unsubs.push(() => listenerRegistry.unregister(tasksListenerKey));
    }

    // Team - Use scoped query based on user access level
    // Use only workspaceId for listener key to prevent duplicate listeners
    // ⭐ IMPORTANT: Include userId in listener key so it re-initializes when memberId becomes available
    const teamListenerKey = `team_${workspaceId}_${userId}`;
    if (!listenerRegistry.has(teamListenerKey)) {
      const teamQueryRef = getTeamQuery(workspaceId, userId, userAccessLevel);
      const teamUnsub = onSnapshot(
        teamQueryRef,
        throttleListener(async (snap) => {
          if (!isSubscribed) return;
          
          // Track reads
          monitor.trackRead('team', snap.docs.length);
          
          const teamData = snap.docs.map(d => ({ ...d.data(), id: d.id }));
          console.log(`👥 Loaded ${teamData.length} team members (OPTIMIZED)`);
          
          // ⭐ OPTIMIZATION: Skip enrichment for large teams (>50 members)
          // Enrichment is expensive - only do it for small teams
          const shouldEnrich = teamData.length <= 50;
          
          let enrichedTeamData = teamData;
          
          if (shouldEnrich) {
            // ⭐ ENRICHMENT: Fetch profile data from users collection if missing in team collection
            // This ensures all profile fields are always up-to-date even if team collection is stale
            enrichedTeamData = await Promise.all(teamData.map(async (member) => {
              let enrichedMember = { ...member };
              
              // If any profile field is missing in team collection, try to fetch from users collection
              const needsEnrichment = !member.avatarImg || !member.phone || !member.location || !member.about;
              
              if (needsEnrichment && member.uid) {
                try {
                  const userDocRef = doc(db, 'users', member.uid);
                  const userSnap = await getDoc(userDocRef);
                  if (userSnap.exists()) {
                    const userData = userSnap.data();
                    
                    // Collect fields to sync back to team collection
                    const teamUpdates = {};
                    let hasUpdates = false;
                    
                    // Sync avatarImg
                    if (!member.avatarImg && userData.avatarImg) {
                      enrichedMember.avatarImg = userData.avatarImg;
                      teamUpdates.avatarImg = userData.avatarImg;
                      hasUpdates = true;
                    }
                    
                    // Sync name
                    if (userData.name && userData.name !== member.name) {
                      enrichedMember.name = userData.name;
                      enrichedMember.avatar = userData.name.charAt(0).toUpperCase();
                      teamUpdates.name = userData.name;
                      teamUpdates.avatar = userData.name.charAt(0).toUpperCase();
                      hasUpdates = true;
                    }
                    
                    // Sync phone
                    if (!member.phone && userData.phone) {
                    enrichedMember.phone = userData.phone;
                    teamUpdates.phone = userData.phone;
                    hasUpdates = true;
                  }
                  
                  // Sync location
                  if (!member.location && userData.location) {
                    enrichedMember.location = userData.location;
                    teamUpdates.location = userData.location;
                    hasUpdates = true;
                  }
                  
                  // Sync about
                  if (!member.about && userData.about) {
                    enrichedMember.about = userData.about;
                    teamUpdates.about = userData.about;
                    hasUpdates = true;
                  }
                  
                  // ⭐ Sync all updates back to team collection for future use
                  if (hasUpdates) {
                    const teamDocRef = doc(db, `workspaces/${workspaceId}/team`, String(member.id));
                    teamUpdates.updatedAt = serverTimestamp();
                    await updateDoc(teamDocRef, teamUpdates).catch(err => console.warn('⚠️ Failed to sync profile to team:', err));
                    console.log('✅ Synced profile data from users to team:', { 
                      memberId: member.id, 
                      name: member.name,
                      syncedFields: Object.keys(teamUpdates).filter(k => k !== 'updatedAt')
                    });
                  }
                }
              } catch (error) {
                console.warn('⚠️ Failed to fetch profile from users collection:', error);
              }
            }
            
            return {
              ...enrichedMember,
              status: enrichedMember.status || 'Active', // Default to Active if not set
              // ⭐ Don't add cache-busting timestamp - it causes avatar flickering
              avatarImg: enrichedMember.avatarImg || null
            };
          }));
          }
          
          console.log(`✅ Team data ready: ${enrichedTeamData.length} members`);
          console.log('🖼️ Team avatars:', enrichedTeamData.map(m => ({ name: m.name, hasAvatar: !!m.avatarImg, uid: m.uid })));
          
          setTeam(enrichedTeamData);
        }, 1000), // Throttle to 1 second to reduce listener frequency
        (error) => {
          monitor.trackError(error, 'team_listener');
          console.error('❌ Team listener error:', error);
          
          // Set error state instead of silently retrying
          if (retryCount < MAX_AUTO_RETRIES) {
            console.warn(`⚠️ Firestore error - auto-retry ${retryCount + 1}/${MAX_AUTO_RETRIES}`);
            setRetryCount(prev => prev + 1);
          } else {
            console.error('❌ Max auto-retries reached - manual retry required');
            setDataLoadError({
              message: 'Failed to load team data',
              code: error.code,
              canRetry: true
            });
          }
        }
      );
      listenerRegistry.register(teamListenerKey, teamUnsub);
      unsubs.push(() => listenerRegistry.unregister(teamListenerKey));
    }

    // Activity - Use scoped query based on user access level (OPTIMIZED: last 15)
    // Use only workspaceId for listener key to prevent duplicate listeners
    // ⭐ OPTIMIZATION: Reduced from 20 to 15 for faster loading
    // ⭐ IMPORTANT: Include userId in listener key so it re-initializes when memberId becomes available
    const activityListenerKey = `activity_${workspaceId}_${userId}`;
    if (!listenerRegistry.has(activityListenerKey)) {
      const activityQueryRef = getActivityQuery(workspaceId, userId, userAccessLevel, 15);
      const activityUnsub = onSnapshot(
        activityQueryRef,
        throttleListener((snap) => {
          if (!isSubscribed) return;
          
          // Track reads
          monitor.trackRead('activity', snap.docs.length);
          
          const activities = snap.docs.map(d => {
            const data = d.data();
            return {
              ...data,
              id: d.id,
              // Convert Firestore timestamp to Date object
              time: data.time?.toDate ? data.time.toDate() : new Date(data.time)
            };
          });
          console.log(`📊 Loaded ${activities.length} activities (OPTIMIZED: limit 15)`);
          
          // Cache the activity data
          cacheFirestoreData('activity', workspaceId, activities);
          
          setActivity(activities);
        }, 1000), // Throttle to 1 second
        (error) => {
          monitor.trackError(error, 'activity_listener');
          if (error.code !== 'internal' && !error.message?.includes('INTERNAL ASSERTION')) {
            console.error('❌ Activity listener error:', error);
          }
        }
      );
      listenerRegistry.register(activityListenerKey, activityUnsub);
      unsubs.push(() => listenerRegistry.unregister(activityListenerKey));
    }

    // Notes / scribes - load from shared collection with user-specific access
    // Notes are stored in workspaces/{workspaceId}/notes
    // Each user can access notes they created OR notes they joined via code
    // ⭐ OPTIMIZATION: Added limit to prevent loading too many notes
    if (currentUid) {
      const notesListenerKey = `notes_${workspaceId}_${currentUid}`;
      if (!listenerRegistry.has(notesListenerKey)) {
        console.log('📝 Setting up notes listener for user:', currentUid);
        
        // Query notes where user is creator OR user is in members array
        const notesRef = collection(db, `${wsPath}/notes`);
        const q = query(
          notesRef,
          where('accessList', 'array-contains', currentUid),
          orderBy('updatedAt', 'desc'),
          limit(50) // ⭐ OPTIMIZATION: Limit to 50 most recent notes
        );
        
        const notesUnsub = onSnapshot(
          q,
          throttleListener((snap) => {
            if (!isSubscribed) return;
            
            // Track reads
            monitor.trackRead('notes', snap.docs.length);
            
            const userNotes = snap.docs.map(d => ({ ...d.data(), id: d.id }));
            console.log(`📝 Loaded ${userNotes.length} notes (OPTIMIZED: limit 50)`);
            
            // Cache the notes data
            cacheFirestoreData('notes', workspaceId, userNotes);
            
            setNotes(userNotes);
          }, 1000), // Throttle to 1 second
          (error) => {
            monitor.trackError(error, 'notes_listener');
            console.error('❌ Notes listener error:', error);
            setNotes([]);
          }
        );
        listenerRegistry.register(notesListenerKey, notesUnsub);
        unsubs.push(() => listenerRegistry.unregister(notesListenerKey));
      }
    } else {
      console.log('⚠️ No currentUid - skipping notes listener');
      setNotes([]);
    }

    // ⭐ OPTIMIZATION: Roles - One-time read instead of real-time listener
    // Load once on workspace initialization, use manual refresh button to update
    const rolesListenerKey = `roles_${workspaceId}`;
    if (!listenerRegistry.has(rolesListenerKey)) {
      console.log('🎭 Loading roles (one-time read)...');
      
      // One-time read
      getDocs(collection(db, `${wsPath}/roles`))
        .then((snap) => {
          if (!isSubscribed) return;
          
          // Track reads
          monitor.trackRead('roles', snap.docs.length);
          
          const firestoreRoles = snap.docs.map(d => ({ ...d.data(), id: d.id }));
          console.log('🎭 Roles loaded from Firestore (one-time):', firestoreRoles.length, 'roles');
          
          // Cache the roles data
          cacheFirestoreData('roles', workspaceId, firestoreRoles.length > 0 ? firestoreRoles : INITIAL_ROLES);
          
          setRoles(firestoreRoles.length > 0 ? firestoreRoles : INITIAL_ROLES);
        })
        .catch((error) => {
          monitor.trackError(error, 'roles_load');
          if (error.code !== 'internal' && !error.message?.includes('INTERNAL ASSERTION')) {
            console.error('❌ Roles load error:', error);
          }
        });
      
      // Register a dummy unsubscribe to prevent re-loading
      listenerRegistry.register(rolesListenerKey, () => {});
      unsubs.push(() => listenerRegistry.unregister(rolesListenerKey));
    }

    // ⭐ OPTIMIZATION: Tags - One-time read instead of real-time listener
    const tagsListenerKey = `tags_${workspaceId}`;
    if (!listenerRegistry.has(tagsListenerKey)) {
      console.log('🏷️ Loading tags (one-time read)...');
      
      // One-time read
      getDocs(collection(db, `${wsPath}/tags`))
        .then((snap) => {
          if (!isSubscribed) return;
          
          // Track reads
          monitor.trackRead('tags', snap.docs.length);
          
          const loadedTags = snap.docs.map(d => ({ ...d.data(), id: d.id }));
          console.log('🏷️ Tags loaded from Firestore (one-time):', loadedTags.length, 'tags');
          
          // Cache the tags data
          cacheFirestoreData('tags', workspaceId, loadedTags);
          
          setTags(loadedTags);
        })
        .catch((error) => {
          monitor.trackError(error, 'tags_load');
          if (error.code !== 'internal' && !error.message?.includes('INTERNAL ASSERTION')) {
            console.error('❌ Tags load error:', error);
          }
        });
      
      // Register a dummy unsubscribe to prevent re-loading
      listenerRegistry.register(tagsListenerKey, () => {});
      unsubs.push(() => listenerRegistry.unregister(tagsListenerKey));
    }

    // ⭐ OPTIMIZATION: Categories - One-time read instead of real-time listener
    const categoriesListenerKey = `categories_${workspaceId}`;
    if (!listenerRegistry.has(categoriesListenerKey)) {
      console.log('📁 Loading categories (one-time read)...');
      
      // One-time read
      getDocs(collection(db, `${wsPath}/categories`))
        .then((snap) => {
          if (!isSubscribed) return;
          
          // Track reads
          monitor.trackRead('categories', snap.docs.length);
          
          const loadedCategories = snap.docs.map(d => ({ ...d.data(), id: d.id }));
          console.log('📁 Categories loaded from Firestore (one-time):', loadedCategories.length, 'categories');
          
          // Cache the categories data
          cacheFirestoreData('categories', workspaceId, loadedCategories);
          
          setCategories(loadedCategories);
        })
        .catch((error) => {
          monitor.trackError(error, 'categories_load');
          if (error.code !== 'internal' && !error.message?.includes('INTERNAL ASSERTION')) {
            console.error('❌ Categories load error:', error);
          }
        });
      
      // Register a dummy unsubscribe to prevent re-loading
      listenerRegistry.register(categoriesListenerKey, () => {});
      unsubs.push(() => listenerRegistry.unregister(categoriesListenerKey));
    }

    // Broadcasts - Only load when needed (lazy load) with LIMIT
    const broadcastsListenerKey = `broadcasts_${workspaceId}`;
    if (!listenerRegistry.has(broadcastsListenerKey)) {
      console.log('📢 Setting up broadcasts listener for workspace:', workspaceId);
      const broadcastsUnsub = onSnapshot(
        query(
          collection(db, `${wsPath}/broadcasts`), 
          orderBy('time', 'desc'),
          limit(50) // ⭐ OPTIMIZATION: Load only 50 most recent broadcasts
        ),
        throttleListener((snap) => {
          if (!isSubscribed) return;
          
          // Track reads
          monitor.trackRead('broadcasts', snap.docs.length);
          
          const broadcasts = snap.docs.map(d => {
            const data = d.data();
            return {
              ...data,
              id: d.id,
              // Convert Firestore timestamp to Date object
              time: data.time?.toDate ? data.time.toDate() : new Date(data.time),
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt)
            };
          });
          
          console.log(`📢 Loaded ${broadcasts.length} broadcasts (limited to 50 most recent)`, broadcasts.map(b => ({ id: b.id, title: b.title, time: b.time })));
          
          // Cache the broadcasts data
          cacheFirestoreData('broadcasts', workspaceId, broadcasts);
          
          setBroadcasts(broadcasts);
        }, 1000), // Throttle to 1 second
        (error) => {
          monitor.trackError(error, 'broadcasts_listener');
          if (error.code !== 'internal' && !error.message?.includes('INTERNAL ASSERTION')) {
            console.error('❌ Broadcasts listener error:', error);
          }
        }
      );
      listenerRegistry.register(broadcastsListenerKey, broadcastsUnsub);
      unsubs.push(() => listenerRegistry.unregister(broadcastsListenerKey));
    }

    // ⭐ PHASE 2: Payments listener with LIMIT for optimization
    const paymentsListenerKey = `payments_${workspaceId}`;
    if (!listenerRegistry.has(paymentsListenerKey)) {
      console.log('💰 Setting up payments listener for workspace:', workspaceId);
      const paymentsUnsub = onSnapshot(
        query(
          collection(db, `${wsPath}/payments`), 
          orderBy('createdAt', 'desc'),
          limit(200) // ⭐ OPTIMIZATION: Load only 200 most recent payments
        ),
        throttleListener((snap) => {
          if (!isSubscribed) return;
          
          // Track reads
          monitor.trackRead('payments', snap.docs.length);
          
          const paymentsData = snap.docs.map(d => {
            const data = d.data();
            return {
              ...data,
              id: d.id,
              // Convert Firestore timestamps to Date objects
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
              paidAt: data.paidAt?.toDate ? data.paidAt.toDate() : null
            };
          });
          
          console.log(`💰 Loaded ${paymentsData.length} payments (limited to 200 most recent)`);
          
          // Cache the payments data
          cacheFirestoreData('payments', workspaceId, paymentsData);
          
          // ⭐ Only update if data actually changed (prevents unnecessary re-renders)
          setPayments(prev => {
            // Quick check: if lengths are different, definitely update
            if (prev.length !== paymentsData.length) return paymentsData;
            
            // Check if any payment changed (excluding notes field for description updates)
            const hasChanges = paymentsData.some((newPayment, idx) => {
              const oldPayment = prev[idx];
              if (!oldPayment || oldPayment.id !== newPayment.id) return true;
              
              // Compare all fields except notes and updatedAt
              return oldPayment.status !== newPayment.status ||
                     oldPayment.amount !== newPayment.amount ||
                     oldPayment.taskId !== newPayment.taskId;
            });
            
            // If only notes changed, update silently without triggering re-render
            if (!hasChanges) {
              return prev.map((oldPayment, idx) => ({
                ...oldPayment,
                notes: paymentsData[idx]?.notes || oldPayment.notes
              }));
            }
            
            return paymentsData;
          });
        }, 1000), // Throttle to 1 second
        (error) => {
          monitor.trackError(error, 'payments_listener');
          if (error.code !== 'internal' && !error.message?.includes('INTERNAL ASSERTION')) {
            console.error('❌ Payments listener error:', error);
          }
        }
      );
      listenerRegistry.register(paymentsListenerKey, paymentsUnsub);
      unsubs.push(() => listenerRegistry.unregister(paymentsListenerKey));
    }

    // Help submissions - Removed from global context (lazy load in components only)
    // This prevents duplicate listeners and reduces initial read count
    // Help pages will subscribe directly when mounted

    // Task requests - Only load when needed (lazy load) with LIMIT
    const taskRequestsListenerKey = `taskRequests_${workspaceId}`;
    if (!listenerRegistry.has(taskRequestsListenerKey)) {
      const taskRequestsUnsub = onSnapshot(
        query(
          collection(db, `${wsPath}/taskRequests`), 
          orderBy('timestamp', 'desc'),
          limit(50) // ⭐ OPTIMIZATION: Load only 50 most recent task requests
        ),
        throttleListener((snap) => {
          if (!isSubscribed) return;
          
          // Track reads
          monitor.trackRead('taskRequests', snap.docs.length);
          
          console.log(`📝 Loaded ${snap.docs.length} task requests (limited to 50 most recent)`);
          setTaskRequests(snap.docs.map(d => ({ ...d.data(), id: d.id })));
        }, 1000), // Throttle to 1 second
        (error) => {
          monitor.trackError(error, 'taskRequests_listener');
          if (error.code !== 'internal' && !error.message?.includes('INTERNAL ASSERTION')) {
            console.error('❌ Task requests listener error:', error);
          }
        }
      );
      listenerRegistry.register(taskRequestsListenerKey, taskRequestsUnsub);
      unsubs.push(() => listenerRegistry.unregister(taskRequestsListenerKey));
    }

    // Scheduled tasks - Only load for admin users
    const scheduledTasksListenerKey = `scheduledTasks_${workspaceId}`;
    if (!listenerRegistry.has(scheduledTasksListenerKey)) {
      const scheduledTasksUnsub = onSnapshot(
        query(
          collection(db, `${wsPath}/scheduledTasks`), 
          orderBy('createdAt', 'desc')
        ),
        throttleListener((snap) => {
          if (!isSubscribed) return;
          
          // Track reads
          monitor.trackRead('scheduledTasks', snap.docs.length);
          
          console.log(`📅 Loaded ${snap.docs.length} scheduled tasks`);
          setScheduledTasks(snap.docs.map(d => ({ ...d.data(), id: d.id })));
        }, 1000), // Throttle to 1 second
        (error) => {
          monitor.trackError(error, 'scheduledTasks_listener');
          if (error.code !== 'internal' && !error.message?.includes('INTERNAL ASSERTION')) {
            console.error('❌ Scheduled tasks listener error:', error);
          }
        }
      );
      listenerRegistry.register(scheduledTasksListenerKey, scheduledTasksUnsub);
      unsubs.push(() => listenerRegistry.unregister(scheduledTasksListenerKey));
    }

    // Trashed items - Only load when needed (lazy load)
    const trashListenerKey = `trash_${workspaceId}`;
    if (!listenerRegistry.has(trashListenerKey)) {
      const trashUnsub = onSnapshot(
        collection(db, `${wsPath}/trash`),
        throttleListener((snap) => {
          if (!isSubscribed) return;
          
          // Track reads
          monitor.trackRead('trash', snap.docs.length);
          
          setTrashedItems(snap.docs.map(d => ({ ...d.data(), id: d.id })));
        }, 1000), // Throttle to 1 second
        (error) => {
          monitor.trackError(error, 'trash_listener');
          if (error.code !== 'internal' && !error.message?.includes('INTERNAL ASSERTION')) {
            console.error('❌ Trash listener error:', error);
          }
        }
      );
      listenerRegistry.register(trashListenerKey, trashUnsub);
      unsubs.push(() => listenerRegistry.unregister(trashListenerKey));
    }

    // Mark data as loaded after first snapshot batch
    const loadTimer = setTimeout(() => {
      if (isSubscribed) {
        setDataLoaded(true);
        console.log('✅ All data loaded');
        console.log('📊 Read optimization stats:', readStats.getSavings());
      }
    }, 1200);

    return () => {
      isSubscribed = false;
      unsubs.forEach(u => {
        try {
          u();
        } catch (err) {
          // Silently handle cleanup errors
          if (!err.message?.includes('INTERNAL ASSERTION')) {
            console.error('Cleanup error:', err);
          }
        }
      });
      clearTimeout(loadTimer);
    };
  }, [workspaceId, currentUid, currentUser?.memberId]); // ⭐ Added memberId to re-initialize when it becomes available

  const updateBroadcast = useCallback((id, updates) => {
    setBroadcasts(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
    setActivity(prev => prev.map(a => a.id === id ? { ...a, title: updates.title ?? a.title, sub: updates.sub ?? a.sub } : a));
    if (wsPath) {
      monitor.trackWrite('broadcasts', 1);
      updateDoc(doc(db, `${wsPath}/broadcasts`, String(id)), updates).catch(() => {});
    }
  }, [wsPath]);

  const updateNote = useCallback((noteId, updates, mergeContext = null) => {
    setNotes(prev => prev.map(n => n.id === noteId ? { ...n, ...updates } : n));
    
    if (workspaceId && currentUid) {
      // Use conflict resolution for collaborative editing
      monitor.trackWrite('notes', 1);
      return updateNoteWithConflictResolution(
        workspaceId, 
        noteId, 
        updates, 
        currentUid,
        mergeContext // NEW: Pass merge context for 3-way merge
      )
        .then((result) => {
          if (result.merged) {
            console.log('✅ Note updated with conflict resolution:', noteId);
            // Update local state with merged data
            setNotes(prev => prev.map(n => n.id === noteId ? { ...n, ...result.data } : n));
          } else {
            console.log('✅ Note updated (no conflict):', noteId);
          }
          return result;
        })
        .catch((error) => {
          monitor.trackError(error, 'update_note');
          console.error('❌ Failed to update note:', error);
          throw error;
        });
    }
    return Promise.resolve();
  }, [workspaceId, currentUid]);

  const addNote = useCallback((note) => {
    console.log('📝 addNote called:', {
      noteId: note.id,
      title: note.title,
      type: note.type,
      hasAccessList: !!note.accessList,
      accessListLength: note.accessList?.length || 0,
      accessListReceived: note.accessList,
      currentUid
    });
    
    if (!currentUid) {
      console.error('❌ No currentUid - cannot save note');
      return;
    }
    
    // Preserve existing accessList if provided, otherwise create new one with current user
    const noteWithAccess = {
      ...note,
      accessList: note.accessList && note.accessList.length > 0 
        ? note.accessList 
        : [currentUid], // Creator has access by default only if no accessList provided
    };
    
    console.log('💾 Note accessList being saved:', noteWithAccess.accessList);
    console.log('💾 Full note document being saved:', {
      id: noteWithAccess.id,
      title: noteWithAccess.title,
      accessList: noteWithAccess.accessList,
      members: noteWithAccess.members,
      taskId: noteWithAccess.taskId
    });
    
    setNotes(prev => [noteWithAccess, ...prev]);
    
    if (workspaceId) {
      const notePath = `workspaces/${workspaceId}/notes/${note.id}`;
      console.log('💾 Saving note to Firestore:', notePath);
      
      monitor.trackWrite('notes', 1);
      setDoc(doc(db, notePath), noteWithAccess)
        .then(() => {
          console.log('✅ Note saved successfully to Firestore');
          console.log('✅ AccessList saved:', noteWithAccess.accessList);
          console.log('✅ Members saved:', noteWithAccess.members);
        })
        .catch((error) => {
          monitor.trackError(error, 'add_note');
          console.error('❌ Failed to save note:', error);
        });
    }
  }, [workspaceId, currentUid]);

  const deleteNote = useCallback((noteId) => {
    console.log('🗑️ deleteNote called:', noteId);
    setNotes(prev => prev.filter(n => n.id !== noteId));
    
    if (workspaceId) {
      const notePath = `workspaces/${workspaceId}/notes/${noteId}`;
      console.log('💾 Deleting note from Firestore:', notePath);
      monitor.trackDelete('notes', 1);
      deleteDoc(doc(db, notePath))
        .then(() => {
          console.log('✅ Note deleted from Firestore');
        })
        .catch((error) => {
          monitor.trackError(error, 'delete_note');
          console.error('❌ Failed to delete note:', error);
        });
    }
  }, [workspaceId]);
  
  const [currentPlan, setCurrentPlan] = useState(null);
  const [planExpiryDate, setPlanExpiryDate] = useState(null);
  const [planExpiryTimestamp, setPlanExpiryTimestamp] = useState(null);
  const [planIsActive, setPlanIsActive] = useState(true); // Default to true, will be updated from Firestore
  
  // isPlanActive: Check BOTH plan.isActive field AND expiry timestamp
  // Plan is active only if:
  // 1. plan.isActive is true (explicitly set in Firestore)
  // 2. AND expiry timestamp hasn't passed yet
  const isPlanActive = planIsActive && (planExpiryTimestamp
    ? (typeof planExpiryTimestamp.toMillis === 'function' 
        ? planExpiryTimestamp.toMillis() >= Date.now()
        : planExpiryTimestamp >= Date.now())
    : (!planExpiryDate || new Date(planExpiryDate) >= new Date()));
  const [planAlertBlink, setPlanAlertBlink] = useState(false);
  const triggerPlanBlink = useCallback(() => {
    setPlanAlertBlink(true);
    setTimeout(() => setPlanAlertBlink(false), 1500);
  }, []);

  const [showDonutWelcome, setShowDonutWelcomeRaw] = useState(false);
  const [hasSeenDonutWelcome, setHasSeenDonutWelcome] = useState(false);

  // Load hasSeenDonutWelcome once from Firestore (not a listener)
  useEffect(() => {
    if (!currentUid) return;
    
    const loadDonutWelcome = async () => {
      try {
        const userRef = doc(db, 'users', currentUid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          const hasSeenDonut = snap.data().hasSeenDonutWelcome === true;
          console.log('🍩 hasSeenDonutWelcome loaded from Firestore:', hasSeenDonut, 'uid:', currentUid);
          setHasSeenDonutWelcome(hasSeenDonut);
        }
      } catch (error) {
        // Silently handle errors
        console.error('Error loading hasSeenDonutWelcome:', error);
      }
    };
    
    loadDonutWelcome();
  }, [currentUid]);

  // Per-user password listener — reads from users/{uid}
  useEffect(() => {
    if (!currentUid) return;
    const userRef = doc(db, 'users', currentUid);
    const unsub = onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        const userData = snap.data();
        if (userData.userPassword !== undefined) {
          setAdminPassword(userData.userPassword);
        }
      }
    }, () => {});
    return unsub;
  }, [currentUid]);

  // When donut welcome is dismissed, mark as seen per-user in Firestore
  const setShowDonutWelcome = useCallback((val) => {
    console.log('🍩 setShowDonutWelcome called:', val, 'currentUid:', currentUid);
    setShowDonutWelcomeRaw(val);
    if (!val && currentUid) {
      console.log('🍩 Saving hasSeenDonutWelcome: true to Firestore for uid:', currentUid);
      monitor.trackWrite('users', 1);
      updateDoc(doc(db, 'users', currentUid), { hasSeenDonutWelcome: true })
        .then(() => {
          console.log('✅ hasSeenDonutWelcome saved successfully');
          setHasSeenDonutWelcome(true);
        })
        .catch((err) => {
          monitor.trackError(err, 'set_donut_welcome');
          console.error('❌ Failed to save hasSeenDonutWelcome:', err);
        });
    }
  }, [currentUid]);

  const [adminPassword, setAdminPassword] = useState('admin123');

  // Workspace branding — loaded from Firestore settings
  const [workspaceName, setWorkspaceName] = useState('Taskzy');
  const [workspaceSub, setWorkspaceSub]   = useState('Workspace');
  const [workspaceLogo, setWorkspaceLogo] = useState(null);
  const [hasCompletedSetup, setHasCompletedSetup] = useState(false);

  // Dark mode — localStorage only (not synced to Firestore)
  const [darkMode, setDarkMode] = useState(() => {
    try { return localStorage.getItem('darkMode') === 'true'; } catch { return false; }
  });

  // ── Firestore settings listener — reads settings + plan from workspace doc ──
  useEffect(() => {
    if (!wsPath) return;
    const workspaceRef = doc(db, wsPath);
    const unsub = onSnapshot(workspaceRef, async (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      const s = data.settings || {};
      const p = data.plan || {};
      // NOTE: darkMode is NOT read from Firestore - it's localStorage only
      // Plan fields — read full schema
      if (p.id !== undefined || p.name !== undefined) {
        setCurrentPlan(p.id ? { id: p.id, name: p.name, billingCycle: p.billingCycle, users: p.users, color: p.color } : null);
      }
      if (p.expiryDate      !== undefined) setPlanExpiryDate(p.expiryDate);
      if (p.expiryTimestamp !== undefined) setPlanExpiryTimestamp(p.expiryTimestamp);
      if (p.isActive        !== undefined) {
        console.log('📊 Plan isActive field read from Firestore:', p.isActive);
        setPlanIsActive(p.isActive === true);
      }
      
      // Auto-deactivate plan if expiry date has passed
      // Only update if plan is currently active but expiry has passed
      if (p.isActive === true && p.expiryTimestamp) {
        const expiryTime = typeof p.expiryTimestamp.toMillis === 'function' 
          ? p.expiryTimestamp.toMillis() 
          : p.expiryTimestamp;
        
        if (expiryTime < Date.now()) {
          console.log('⏰ Plan expired - setting isActive to false');
          try {
            await updateDoc(workspaceRef, { 
              'plan.isActive': false,
              'plan.updatedAt': serverTimestamp()
            });
          } catch (err) {
            console.error('Failed to deactivate expired plan:', err);
          }
        }
      }
      
      if (s.workspaceName       !== undefined) setWorkspaceName(s.workspaceName);
      if (s.workspaceSub        !== undefined) setWorkspaceSub(s.workspaceSub);
      if (s.workspaceLogo       !== undefined) setWorkspaceLogo(s.workspaceLogo);
      if (s.hasCompletedSetup   !== undefined) setHasCompletedSetup(s.hasCompletedSetup);
    }, () => {});
    return unsub;
  }, [wsPath]);

  const updateAdminPassword = useCallback((newPwd) => {
    setAdminPassword(newPwd);
    if (wsPath) updateDoc(doc(db, wsPath), { 'settings.adminPassword': newPwd }).catch(() => {});
  }, [wsPath]);

  const saveWorkspaceSettings = useCallback((settings) => {
    if (settings.workspaceName  !== undefined) setWorkspaceName(settings.workspaceName);
    if (settings.workspaceSub   !== undefined) setWorkspaceSub(settings.workspaceSub);
    if (settings.workspaceLogo  !== undefined) setWorkspaceLogo(settings.workspaceLogo);
    if (settings.hasCompletedSetup !== undefined) setHasCompletedSetup(settings.hasCompletedSetup);
    if (wsPath) {
      // Map flat settings object to nested workspace doc fields
      const updates = {};
      if (settings.workspaceName    !== undefined) updates['settings.workspaceName']    = settings.workspaceName;
      if (settings.workspaceSub     !== undefined) updates['settings.workspaceSub']     = settings.workspaceSub;
      if (settings.workspaceLogo    !== undefined) updates['settings.workspaceLogo']    = settings.workspaceLogo;
      if (settings.hasCompletedSetup !== undefined) updates['settings.hasCompletedSetup'] = settings.hasCompletedSetup;
      // NOTE: darkMode is NOT saved to Firestore - it's localStorage only
      // NOTE: User passwords are saved to individual user profiles, not workspace settings
      if (settings.hasSeenDonutWelcome !== undefined) updates['settings.hasSeenDonutWelcome'] = settings.hasSeenDonutWelcome;
      if (settings.currentPlan      !== undefined) {
        // Write full plan schema to plan field
        const plan = settings.currentPlan;
        if (plan) {
          updates['plan.id']           = plan.id;
          updates['plan.name']         = plan.name;
          updates['plan.billingCycle'] = plan.billingCycle;
          updates['plan.users']        = plan.users;
          updates['plan.color']        = plan.color;
          updates['plan.updatedAt']    = serverTimestamp();
        }
      }
      if (settings.planExpiryDate   !== undefined) {
        updates['plan.expiryDate']      = settings.planExpiryDate;
        // Also store as Timestamp for server-side checks
        if (settings.planExpiryDate) {
          const d = new Date(settings.planExpiryDate);
          if (!isNaN(d.getTime())) {
            updates['plan.expiryTimestamp'] = d;
          }
        }
      }
      if (settings.planExpiryTimestamp !== undefined && settings.planExpiryTimestamp) {
        updates['plan.expiryTimestamp'] = settings.planExpiryTimestamp;
        updates['plan.updatedAt']       = serverTimestamp();
      }
      if (Object.keys(updates).length > 0) {
        updateDoc(doc(db, wsPath), updates).catch(() => {});
      }
    }
  }, [wsPath]);

  // Refresh data function - forces re-fetch from Firestore
  const refreshData = useCallback(() => {
    console.log('🔄 Refreshing data for workspace:', workspaceId);
    setDataLoadError(null); // Clear any previous errors
    setRetryCount(0); // Reset retry count on manual refresh
    setRefreshTrigger(prev => prev + 1);
    
    // Force re-render of all components by updating a timestamp
    // This ensures all pages get the latest data
    if (workspaceId) {
      // The Firestore listeners will automatically pick up any changes
      // This trigger helps components that depend on refreshTrigger to re-render
      console.log('✅ Data refresh triggered - listeners will update automatically');
    }
  }, [workspaceId]);

  // ⭐ OPTIMIZATION: Individual refresh functions for static data (one-time reads)
  const refreshRoles = useCallback(async () => {
    if (!wsPath) return;
    console.log('🎭 Manually refreshing roles...');
    try {
      const snapshot = await getDocs(collection(db, `${wsPath}/roles`));
      const firestoreRoles = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
      console.log('🎭 Roles refreshed:', firestoreRoles.length, 'roles');
      
      // Cache the roles data
      cacheFirestoreData('roles', workspaceId, firestoreRoles.length > 0 ? firestoreRoles : INITIAL_ROLES);
      
      setRoles(firestoreRoles.length > 0 ? firestoreRoles : INITIAL_ROLES);
      monitor.trackRead('roles', snapshot.docs.length);
    } catch (error) {
      console.error('❌ Error refreshing roles:', error);
      monitor.trackError(error, 'refresh_roles');
    }
  }, [wsPath, workspaceId]);

  const refreshTags = useCallback(async () => {
    if (!wsPath) return;
    console.log('🏷️ Manually refreshing tags...');
    try {
      const snapshot = await getDocs(collection(db, `${wsPath}/tags`));
      const loadedTags = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
      console.log('🏷️ Tags refreshed:', loadedTags.length, 'tags');
      
      // Cache the tags data
      cacheFirestoreData('tags', workspaceId, loadedTags);
      
      setTags(loadedTags);
      monitor.trackRead('tags', snapshot.docs.length);
    } catch (error) {
      console.error('❌ Error refreshing tags:', error);
      monitor.trackError(error, 'refresh_tags');
    }
  }, [wsPath, workspaceId]);

  const refreshCategories = useCallback(async () => {
    if (!wsPath) return;
    console.log('📁 Manually refreshing categories...');
    try {
      const snapshot = await getDocs(collection(db, `${wsPath}/categories`));
      const loadedCategories = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
      console.log('📁 Categories refreshed:', loadedCategories.length, 'categories');
      
      // Cache the categories data
      cacheFirestoreData('categories', workspaceId, loadedCategories);
      
      setCategories(loadedCategories);
      monitor.trackRead('categories', snapshot.docs.length);
    } catch (error) {
      console.error('❌ Error refreshing categories:', error);
      monitor.trackError(error, 'refresh_categories');
    }
  }, [wsPath, workspaceId]);

  // Auto-refresh data when user returns to the tab (OPTIMIZED)
  // Only refresh if tab was hidden for more than 5 minutes
  useEffect(() => {
    let lastHiddenTime = 0;
    const MIN_HIDDEN_TIME = 5 * 60 * 1000; // 5 minutes
    
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab became hidden - record the time
        lastHiddenTime = Date.now();
        console.log('👁️ Tab hidden at:', new Date(lastHiddenTime).toLocaleTimeString());
      } else if (workspaceId && lastHiddenTime > 0) {
        // Tab became visible - check if it was hidden long enough
        const hiddenDuration = Date.now() - lastHiddenTime;
        const hiddenMinutes = Math.floor(hiddenDuration / 60000);
        
        if (hiddenDuration >= MIN_HIDDEN_TIME) {
          console.log(`👁️ Tab visible after ${hiddenMinutes} minutes - refreshing data`);
          refreshData();
        } else {
          console.log(`👁️ Tab visible after ${hiddenMinutes} minutes - skipping refresh (too soon)`);
        }
        
        lastHiddenTime = 0; // Reset
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [workspaceId, refreshData]);

  // ── Sync derived member stats to Firestore when tasks change ─────────────
  // Throttled to avoid excessive writes — runs at most once per 30 seconds
  useEffect(() => {
    if (!wsPath || team.length === 0 || tasks.length === 0) return;
    const timer = setTimeout(() => {
      team.forEach(member => {
        const memberTasks    = tasks.filter(t => t.members?.some(m => m.id === member.id));
        const totalTasks     = memberTasks.length;
        const completedTasks = memberTasks.filter(t => t.stage === 'Complete').length;
        const completionRate = totalTasks > 0 ? completedTasks / totalTasks : 0;
        const rating         = Math.min(5, Math.round(completionRate * 5));
        // Only write if values changed
        if (member.tasks !== totalTasks || member.completed !== completedTasks || member.rating !== rating) {
          updateDoc(doc(db, `${wsPath}/team`, String(member.id)), {
            tasks:     totalTasks,
            completed: completedTasks,
            rating,
            updatedAt: serverTimestamp(),
          }).catch(() => {});
        }
      });
    }, 30000); // 30-second debounce
    return () => clearTimeout(timer);
  }, [tasks, wsPath]); // intentionally excludes team to avoid infinite loop

  useEffect(() => {
    // Save dark mode to localStorage only (not Firestore)
    try { localStorage.setItem('darkMode', darkMode); } catch {}
    if (darkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [darkMode]);

  // ── Sync currentUser avatar from team member data ─────────────────────────
  useEffect(() => {
    if (!currentUser || !team || team.length === 0) return;
    
    // If currentUser has a memberId, find the matching team member and sync avatar
    if (currentUser.memberId) {
      const teamMember = team.find(m => m.id === currentUser.memberId);
      if (teamMember && teamMember.avatar && teamMember.avatar !== currentUser.avatar) {
        setCurrentUser(prev => ({
          ...prev,
          avatar: teamMember.avatar,
          color: teamMember.color || prev.color,
        }));
      }
    }
  }, [team, currentUser?.memberId]);

  const toggleDarkMode = useCallback(() => {
    // Toggle dark mode in localStorage only (not Firestore)
    setDarkMode(v => !v);
  }, []);

  // ── Activity helpers ─────────────────────────────────────────────────────
  const addActivity = useCallback((type, title, sub, amount = null, up = null, broadcastId = null) => {
    const entry = {
      id: broadcastId || Date.now(),
      type, title, sub, amount, up,
      time: new Date(),
      broadcastId: broadcastId || null, // Store broadcast ID separately
    };
    setActivity(prev => [entry, ...prev.slice(0, 19)]);
    // Firestore write (listener will NOT re-read due to throttling and local state update)
    if (wsPath) {
      monitor.trackWrite('activity', 1);
      addDoc(collection(db, `${wsPath}/activity`), {
        ...entry,
        time: serverTimestamp(),
      }).catch(() => {});
    }
  }, [wsPath]);

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
    
    // Build history entry without undefined values
    const historyEntry = {
      stage: task.stage || 'New',
      date: now,
      user: actor,
      action: 'created',
    };
    
    // Only add note if source exists
    if (source) {
      historyEntry.note = source;
    }
    
    // ⭐ PHASE 1: Add creator tracking
    // Get proper creator name and role
    let creatorName = currentUser?.name || 'Admin';
    let creatorRole = currentUser?.role || 'Administrator';
    let creatorColor = currentUser?.color || '#3B5BFC';
    let creatorAvatar = currentUser?.avatar || currentUser?.name?.charAt(0)?.toUpperCase() || 'A';
    let creatorAvatarImg = currentUser?.avatarImg || null;
    
    console.log('👤 Building creator info from currentUser:', {
      currentUser: {
        name: currentUser?.name,
        role: currentUser?.role,
        color: currentUser?.color,
        avatar: currentUser?.avatar,
        avatarImg: currentUser?.avatarImg,
        memberId: currentUser?.memberId,
        userRole: currentUser?.userRole
      },
      extracted: {
        creatorName,
        creatorRole,
        creatorColor,
        creatorAvatar,
        creatorAvatarImg
      }
    });
    
    // If currentUser has a memberId, get the actual team member info
    if (currentUser?.memberId && team && team.length > 0) {
      const teamMember = team.find(m => m.id === currentUser.memberId);
      if (teamMember) {
        console.log('👥 Found team member, using their data:', {
          name: teamMember.name,
          role: teamMember.role,
          color: teamMember.color,
          avatar: teamMember.avatar,
          avatarImg: teamMember.avatarImg
        });
        creatorName = teamMember.name || creatorName;
        creatorRole = teamMember.role || creatorRole;
        // Use team member's visual info if available
        creatorColor = teamMember.color || creatorColor;
        creatorAvatar = teamMember.avatar || creatorAvatar;
        creatorAvatarImg = teamMember.avatarImg || creatorAvatarImg;
      }
    }
    
    // Use userRole for system role (admin/management/team)
    const systemRole = currentUser?.userRole || 'admin';
    
    const creatorInfo = {
      uid: currentUser?.uid || null,
      memberId: currentUser?.memberId || null,
      role: creatorRole, // ⭐ Team role (e.g., "Developer", "Designer")
      userRole: systemRole, // ⭐ System role (admin/management/team)
      name: creatorName, // ⭐ Actual user name
      color: creatorColor, // ⭐ Avatar background color
      avatar: creatorAvatar, // ⭐ Avatar letter
      avatarImg: creatorAvatarImg, // ⭐ Avatar image URL
      createdAt: now
    };
    
    console.log('👤 Task creator info:', {
      ...creatorInfo,
      currentUser: currentUser,
      foundInTeam: !!team?.find(m => m.id === currentUser?.memberId)
    });
    
    const taskWithHistory = {
      ...task,
      paid: false,
      createdDate: now,
      createdBy: creatorInfo, // ⭐ Store creator information
      seenByAdmin: systemRole === 'management' ? false : true, // ⭐ Mark management tasks as unseen
      history: [historyEntry],
      memberIds: task.members?.map(m => m.id).filter(Boolean) || [], // Add memberIds for efficient queries
      // ⭐ Ensure all members have a stage field initialized
      members: task.members?.map(m => ({
        ...m,
        stage: m.stage || 'New' // Initialize stage to 'New' if not set
      })) || []
    };
    
    // ⭐ Deep clean: Remove undefined values recursively (Firestore doesn't accept them)
    const cleanObject = (obj) => {
      if (Array.isArray(obj)) {
        return obj.map(item => cleanObject(item));
      }
      if (obj !== null && typeof obj === 'object') {
        return Object.fromEntries(
          Object.entries(obj)
            .filter(([_, v]) => v !== undefined)
            .map(([k, v]) => [k, cleanObject(v)])
        );
      }
      return obj;
    };
    
    const cleanTaskData = cleanObject(taskWithHistory);

    // Firestore write - let the listener update the state
    if (wsPath) {
      console.log('💾 Saving task to Firestore:', `${wsPath}/tasks/${task.id}`);
      console.log('👥 Task members data being saved:', JSON.stringify(task.members?.map(m => ({ 
        id: m.id, 
        name: m.name, 
        avatar: m.avatar, 
        color: m.color,
        role: m.role,
        email: m.email,
        status: m.status
      })), null, 2));
      
      // ⭐ PHASE 2: Create task and payment together
      setDoc(doc(db, `${wsPath}/tasks`, String(task.id)), {
        ...cleanTaskData,
        createdDate: serverTimestamp(),
        'createdBy.createdAt': serverTimestamp(), // Use server timestamp for creator date
      }).then(async () => {
        console.log('✅ Task created in Firestore:', task.id);
        console.log('✅ Creator info saved:', creatorInfo);
        
        // ⭐ PHASE 2: Auto-create payment records for EACH member AND additional payments
        try {
          const allPaymentPromises = [];
          
          // 1️⃣ Create individual payment records for each team member
          const memberPaymentPromises = (task.members || []).map(async (member) => {
            const memberBudget = member.budget || 0;
            
            console.log('💰 Creating payment for member:', {
              memberId: member.id,
              memberName: member.name,
              memberBudget: memberBudget,
              rawBudget: member.budget,
              memberData: member
            });
            
            const paymentData = {
              taskId: task.id, // ⭐ Link to task
              taskTitle: task.title,
              amount: memberBudget, // ⭐ Individual member budget
              memberId: member.id, // ⭐ Link to specific member
              memberName: member.name,
              memberUid: member.uid || null,
              status: "Unpaid",
              isPaid: false, // ⭐ Add isPaid field for consistency
              assignedTo: [{ // ⭐ CRITICAL: FinancialPage expects this format
                id: member.id,
                name: member.name,
                uid: member.uid || null
              }],
              createdBy: creatorInfo,
              createdAt: serverTimestamp(),
              paidAt: null,
              paidAmount: 0,
              notes: '', // ⭐ Empty by default - user can add description later
              paymentType: 'member' // ⭐ Identify as member payment
            };
            
            await addDoc(collection(db, `${wsPath}/payments`), paymentData);
            console.log('✅ Payment record created for member:', member.name, 'with amount:', memberBudget);
          });
          
          allPaymentPromises.push(...memberPaymentPromises);
          
          // 2️⃣ Create separate payment records for additional payment entries (including zero amounts)
          if (task.payments && task.payments.length > 0) {
            const additionalPaymentPromises = task.payments.map(async (payment) => {
              const paymentData = {
                taskId: task.id, // ⭐ Same task ID
                title: payment.title || task.title, // ⭐ Payment title (user-entered)
                taskTitle: task.title, // ⭐ Task title for reference
                amount: payment.amount || 0,
                memberId: null, // ⭐ No specific member for additional payments
                memberName: null,
                memberUid: null,
                status: "Unpaid",
                isPaid: false, // ⭐ Add isPaid field for consistency
                assignedTo: [], // ⭐ No specific assignee for additional payments
                createdBy: creatorInfo,
                createdAt: serverTimestamp(),
                paidAt: null,
                paidAmount: 0,
                notes: '', // ⭐ Empty by default - user can add description later
                paymentType: 'additional' // ⭐ Identify as additional payment
              };
              
              await addDoc(collection(db, `${wsPath}/payments`), paymentData);
              console.log('✅ Additional payment record created:', payment.title, 'with amount:', payment.amount);
            });
            
            allPaymentPromises.push(...additionalPaymentPromises);
          }
          await Promise.all(allPaymentPromises);
          console.log('✅ All payment records created for task:', task.id, '- Members:', task.members?.length || 0, 'Additional:', task.payments?.length || 0);
          
          // 3️⃣ Create task budget payment if task budget is specified
          if (task.taskBudgetAmount && task.taskBudgetAmount > 0) {
            const taskBudgetPaymentData = {
              taskId: task.id,
              title: task.title, // ⭐ Use task title directly
              taskTitle: task.title,
              amount: task.taskBudgetAmount,
              memberId: null,
              memberName: null,
              memberUid: null,
              status: task.taskBudgetStatus || 'Unpaid',
              isPaid: task.taskBudgetStatus === 'Paid',
              assignedTo: [],
              createdBy: creatorInfo,
              createdAt: serverTimestamp(),
              paidAt: task.taskBudgetStatus === 'Paid' ? serverTimestamp() : null,
              paidAmount: task.taskBudgetStatus === 'Paid' ? task.taskBudgetAmount : 0,
              notes: 'Task budget payment',
              paymentType: 'task-budget', // ⭐ New payment type for task budget
              category: task.category, // ⭐ Include task category
              taskStage: task.stage // ⭐ Include task stage
            };
            
            await addDoc(collection(db, `${wsPath}/payments`), taskBudgetPaymentData);
            console.log('✅ Task budget payment record created:', task.taskBudgetAmount, 'Status:', task.taskBudgetStatus);
          }
        } catch (paymentError) {
          console.error('❌ Failed to create payments:', paymentError);
          // Don't fail task creation if payment fails
        }
        
        // ⭐ PHASE 3: Create timeline entry
        try {
          const timelineData = {
            eventType: "created",
            timestamp: serverTimestamp(),
            user: {
              uid: creatorInfo.uid,
              memberId: creatorInfo.memberId,
              name: creatorInfo.name,
              role: creatorInfo.role,
              userRole: creatorInfo.userRole,
              color: creatorInfo.color, // ⭐ Add avatar color
              avatar: creatorInfo.avatar, // ⭐ Add avatar letter
              avatarImg: creatorInfo.avatarImg // ⭐ Add avatar image
            },
            // ⭐ No description for created events - just show "Task Created" label
            initialData: {
              title: task.title,
              budget: task.totalBudget,
              deadline: task.deadline,
              members: (task.members || []).map(m => m.name).join(", ")
            }
          };
          
          console.log('📜 Creating timeline entry with user data:', timelineData.user);
          
          await addDoc(collection(db, `${wsPath}/tasks/${task.id}/timeline`), timelineData);
          console.log('✅ Timeline entry created for task:', task.id);
        } catch (timelineError) {
          console.error('❌ Failed to create timeline:', timelineError);
          // Don't fail task creation if timeline fails
        }
      }).catch((err) => {
        console.error('❌ Failed to create task:', err);
        // Fallback to local state on error
        setTasks(prev => [taskWithHistory, ...prev]);
      });
    } else {
      console.warn('⚠️ No wsPath, using local state only');
      // Fallback to local state if no workspace
      setTasks(prev => [taskWithHistory, ...prev]);
    }

    // Auto-create scribes as notes if task has scribes attached
    if (task.scribes && task.scribes.length > 0) {
      const newNotes = task.scribes.map(scribe => {
        // Resolve which member IDs get access based on assignMode
        let resolvedMembers = [];
        if (scribe.assignMode === 'all' || !scribe.assignMode) {
          resolvedMembers = (task.members || []).map(m => m.id);
        } else {
          resolvedMembers = (scribe.assignees || []).map(id => parseInt(id)).filter(Boolean);
        }
        return {
          id: Date.now() + Math.random(),
          type: scribe.type || 'note',
          title: scribe.title,
          tags: [],
          date: now.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
          body: '',
          archived: false,
          joinCode: Math.random().toString(36).slice(2, 8).toUpperCase(),
          taskId: task.id,
          taskTitle: task.title,
          assignees: scribe.assignees || [],
          assignMode: scribe.assignMode || 'all',
          members: resolvedMembers, // joined members — used for access & display
          createdBy: actor,
        };
      });
      
      // Save notes to Firestore
      if (wsPath) {
        newNotes.forEach(note => {
          setDoc(doc(db, `${wsPath}/notes`, String(note.id)), note).catch(() => {});
        });
      } else {
        setNotes(prev => [...newNotes, ...prev]);
      }
    }

    addActivity('new', 'Task Created', `${task.id} — ${task.title}`);
    notify.taskCreated(`${task.id} — ${task.title}`);
  }, [addActivity, wsPath, workspaceId]);

  const updateTaskNote = useCallback(async (taskId, note) => {
    // Update local state immediately
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, note } : t));
    
    // Save to Firebase
    if (wsPath) {
      try {
        await updateDoc(doc(db, `${wsPath}/tasks`, String(taskId)), {
          note: note || '',
          updatedAt: serverTimestamp()
        });
        console.log('✅ Task note saved to Firebase:', taskId);
      } catch (error) {
        console.error('❌ Failed to save task note:', error);
        notify.error('Failed to save note');
      }
    }
  }, [wsPath]);

  // ⭐ PHASE 3: Timeline helper function (defined before updateTask to avoid initialization error)
  const addTimelineEvent = useCallback(async (taskId, eventData) => {
    if (!wsPath) {
      console.error('❌ Cannot add timeline event: No workspace path');
      return null;
    }

    try {
      // Helper to remove undefined values (Firestore doesn't accept them)
      const cleanObject = (obj) => {
        if (Array.isArray(obj)) {
          return obj.map((item) => cleanObject(item));
        }
        if (obj !== null && typeof obj === 'object') {
          return Object.fromEntries(
            Object.entries(obj)
              .filter(([_, v]) => v !== undefined)
              .map(([k, v]) => [k, cleanObject(v)])
          );
        }
        return obj;
      };

      const now = new Date();
      const timelineEntry = {
        eventType: eventData.eventType || "update",
        timestamp: serverTimestamp(),
        // ⭐ Save timestamp as milliseconds AND pre-formatted time strings
        timestampMs: now.getTime(),
        formattedTime: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        formattedExactTime: now.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
        user: {
          uid: currentUser?.uid || null,
          memberId: currentUser?.memberId || null,
          name: currentUser?.name || 'Admin',
          role: currentUser?.role || 'Admin',
          userRole: currentUser?.userRole || 'admin',
          color: currentUser?.color || '#3B5BFC',
          avatar: currentUser?.avatar || currentUser?.name?.charAt(0)?.toUpperCase() || 'A',
          avatarImg: currentUser?.avatarImg || null
        },
        description: eventData.description || "Task updated",
        ...eventData // Include any additional fields (changes, paymentAmount, etc.)
      };

      // Clean the timeline entry to remove undefined values
      const cleanTimelineEntry = cleanObject(timelineEntry);

      const docRef = await addDoc(collection(db, `${wsPath}/tasks/${taskId}/timeline`), cleanTimelineEntry);
      console.log('✅ Timeline event added:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Failed to add timeline event:', error);
      return null;
    }
  }, [wsPath, currentUser]);

  const updateTask = useCallback(async (taskId, updatedTask, editedBy = null) => {
    const actor = editedBy ? editedBy.name : 'Admin';
    const now = new Date();
    
    // Get the old task for comparison
    const oldTask = tasks.find(t => t.id === taskId);
    
    // Log member data if present
    if (updatedTask.members) {
      console.log(`📝 Updating task ${taskId} with members:`, updatedTask.members.map(m => ({
        id: m.id,
        name: m.name,
        avatar: m.avatar,
        color: m.color,
        role: m.role
      })));
    }
    
    // Sync memberIds when members are updated
    const taskUpdate = {
      ...updatedTask,
      memberIds: updatedTask.members?.map(m => m.id).filter(Boolean) || updatedTask.memberIds
    };
    
    // ⭐ Deep clean: Remove undefined values recursively (Firestore doesn't accept them)
    const cleanObject = (obj) => {
      if (Array.isArray(obj)) {
        return obj.map(item => cleanObject(item));
      }
      if (obj !== null && typeof obj === 'object') {
        return Object.fromEntries(
          Object.entries(obj)
            .filter(([_, v]) => v !== undefined)
            .map(([k, v]) => [k, cleanObject(v)])
        );
      }
      return obj;
    };
    
    const cleanTaskUpdate = cleanObject(taskUpdate);
    
    setTasks(prev => prev.map(t => t.id === taskId ? {
      ...t, ...cleanTaskUpdate,
      history: [...(t.history || []), { stage: t.stage, date: now, user: actor, action: 'edit' }],
    } : t));
    
    if (wsPath) {
      updateDoc(doc(db, `${wsPath}/tasks`, String(taskId)), {
        ...cleanTaskUpdate,
        updatedAt: serverTimestamp(),
      }).then(async () => {
        console.log(`✅ Task ${taskId} updated in Firestore with synced memberIds`);
        
        // ⭐ PHASE 3: Track changes in timeline - CREATE SEPARATE EVENT FOR EACH CHANGE
        if (oldTask) {
          const changes = [];
          
          // Track title changes
          if (oldTask.title !== updatedTask.title) {
            changes.push({
              field: "title",
              oldValue: oldTask.title,
              newValue: updatedTask.title
            });
          }
          
          // Track description changes
          if (oldTask.description !== updatedTask.description) {
            changes.push({
              field: "description",
              oldValue: oldTask.description || "",
              newValue: updatedTask.description || ""
            });
          }
          
          // Track budget changes
          if (oldTask.totalBudget !== updatedTask.totalBudget) {
            changes.push({
              field: "budget",
              oldValue: oldTask.totalBudget || 0,
              newValue: updatedTask.totalBudget || 0
            });
          }
          
          // Track deadline changes (completion date)
          if (oldTask.deadline !== updatedTask.deadline) {
            changes.push({
              field: "deadline",
              oldValue: oldTask.deadline,
              newValue: updatedTask.deadline
            });
          }
          
          // Track extended deadline changes
          if (oldTask.extendedDeadline !== updatedTask.extendedDeadline) {
            changes.push({
              field: "extendedDeadline",
              oldValue: oldTask.extendedDeadline || null,
              newValue: updatedTask.extendedDeadline || null
            });
          }
          
          // Track tags changes
          const oldTags = (oldTask.tags || []).sort().join(',');
          const newTags = (updatedTask.tags || []).sort().join(',');
          if (oldTags !== newTags) {
            changes.push({
              field: "tags",
              oldValue: (oldTask.tags || []).map(t => typeof t === 'string' ? t : t.label || t.name || t).join(", ") || "None",
              newValue: (updatedTask.tags || []).map(t => typeof t === 'string' ? t : t.label || t.name || t).join(", ") || "None"
            });
          }
          
          // Track category changes
          if (oldTask.category !== updatedTask.category) {
            const oldCat = typeof oldTask.category === 'string' ? oldTask.category : (oldTask.category?.label || oldTask.category?.name || "None");
            const newCat = typeof updatedTask.category === 'string' ? updatedTask.category : (updatedTask.category?.label || updatedTask.category?.name || "None");
            changes.push({
              field: "category",
              oldValue: oldCat,
              newValue: newCat
            });
          }
          
          // Track member changes (team assignment)
          const oldMemberIds = (oldTask.members || []).map(m => m.id).sort().join(',');
          const newMemberIds = (updatedTask.members || []).map(m => m.id).sort().join(',');
          if (oldMemberIds !== newMemberIds) {
            changes.push({
              field: "members",
              oldValue: (oldTask.members || []).map(m => m.name).join(", ") || "None",
              newValue: (updatedTask.members || []).map(m => m.name).join(", ") || "None"
            });
          }
          
          // ⭐ Track individual member property changes (instruction, budget)
          if (oldTask.members && updatedTask.members && oldMemberIds === newMemberIds) {
            // Same members, check for property changes
            for (let i = 0; i < oldTask.members.length; i++) {
              const oldMember = oldTask.members[i];
              const newMember = updatedTask.members.find(m => m.id === oldMember.id);
              
              if (newMember) {
                // Check instruction changes
                if (oldMember.instruction !== newMember.instruction) {
                  changes.push({
                    field: "memberInstruction",
                    memberId: newMember.id,
                    memberName: newMember.name,
                    oldValue: oldMember.instruction || "None",
                    newValue: newMember.instruction || "None"
                  });
                }
                
                // Check budget changes
                if (oldMember.budget !== newMember.budget) {
                  changes.push({
                    field: "memberBudget",
                    memberId: newMember.id,
                    memberName: newMember.name,
                    oldValue: oldMember.budget || 0,
                    newValue: newMember.budget || 0
                  });
                }
              }
            }
          }
          
          // ⭐ Track member hold status changes separately
          if (oldTask.members && updatedTask.members && oldMemberIds === newMemberIds) {
            // Same members, check for hold status changes
            for (let i = 0; i < oldTask.members.length; i++) {
              const oldMember = oldTask.members[i];
              const newMember = updatedTask.members.find(m => m.id === oldMember.id);
              
              if (newMember) {
                // Normalize undefined/false to false for comparison
                const oldHoldStatus = oldMember.isOnHold === true;
                const newHoldStatus = newMember.isOnHold === true;
                
                // Only create event if there's an actual change
                if (oldHoldStatus !== newHoldStatus) {
                  changes.push({
                    field: "memberHold",
                    memberId: newMember.id,
                    memberName: newMember.name,
                    oldValue: oldHoldStatus ? "On Hold" : "Active",
                    newValue: newHoldStatus ? "On Hold" : "Active"
                  });
                }
              }
            }
          }
          
          // ⭐ CREATE SEPARATE TIMELINE EVENT FOR EACH CHANGE
          for (const change of changes) {
            let description = "";
            let eventType = "updated";
            
            if (change.field === "title") {
              description = `Updated title to "${change.newValue}"`;
            } else if (change.field === "description") {
              // Show the actual description text (truncated if too long)
              const descText = change.newValue || "";
              description = descText.length > 100 ? descText.substring(0, 100) + "..." : descText;
            } else if (change.field === "budget") {
              description = `Budget updated from ₹${(change.oldValue || 0).toLocaleString()} to ₹${(change.newValue || 0).toLocaleString()}`;
              eventType = "budget_updated";
            } else if (change.field === "deadline") {
              const oldDate = new Date(change.oldValue).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
              const newDate = new Date(change.newValue).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
              description = `Completion date updated from ${oldDate} to ${newDate}`;
            } else if (change.field === "extendedDeadline") {
              if (change.newValue) {
                const oldDate = change.oldValue ? new Date(change.oldValue).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : new Date(change.newValue).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                const newDate = new Date(change.newValue).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                description = `Extended deadline from ${oldDate} to ${newDate}`;
              } else {
                description = `Removed extended deadline`;
              }
            } else if (change.field === "tags") {
              // Show actual tag names, not [object Object]
              description = `Tags updated to: ${change.newValue}`;
            } else if (change.field === "category") {
              // Show actual category name, not [object Object]
              description = `Category updated to: ${change.newValue}`;
            } else if (change.field === "members") {
              description = `Team members updated to: ${change.newValue}`;
              eventType = "members_changed";
            } else if (change.field === "memberInstruction") {
              description = `Updated instruction for ${change.memberName}: ${change.newValue}`;
              eventType = "members_changed";
            } else if (change.field === "memberBudget") {
              description = `Updated budget for ${change.memberName}: ₹${(change.oldValue || 0).toLocaleString()} → ₹${(change.newValue || 0).toLocaleString()}`;
              eventType = "members_changed";
            } else if (change.field === "memberHold") {
              // Just show the member name, label already indicates action
              description = change.memberName;
              console.log('🔍 Creating memberHold timeline event:', {
                memberName: change.memberName,
                description: description,
                newValue: change.newValue
              });
            } else {
              description = `Updated ${change.field}`;
            }
            
            await addTimelineEvent(taskId, {
              eventType: eventType,
              description: description,
              changes: {
                field: change.field,
                oldValue: change.oldValue,
                newValue: change.newValue
              }
            });
          }
        }
      }).catch((err) => {
        console.error(`❌ Failed to update task ${taskId}:`, err);
      });
    }
    addActivity('edit', 'Task Updated', `${taskId} — ${taskUpdate.title}`);
    notify.taskUpdated(`${taskId} — ${taskUpdate.title}`);
  }, [addActivity, wsPath, tasks, addTimelineEvent]);

  // Update the whole task stage (admin bulk action) AND optionally a specific member's stage
  const updateTaskStage = useCallback(async (taskId, newStage, memberId = null, actorName = null, issueNote = null, updateNote = null) => {
    // ⭐ CRITICAL: Clean and validate stage value to prevent duplicates
    const cleanStage = (newStage || 'New').trim();
    
    // Validate that the stage is one of the allowed stages
    if (!STAGES.includes(cleanStage)) {
      console.error('❌ Invalid stage value:', newStage, '- defaulting to New');
      newStage = 'New';
    } else {
      newStage = cleanStage;
    }
    
    console.log('🔄 updateTaskStage called:', {
      taskId,
      newStage,
      memberId,
      actorName,
      cleanedStage: newStage
    });
    
    const task = tasks.find(t => t.id === taskId);
    if (!task) {
      console.error('❌ Task not found:', taskId);
      return;
    }
    
    const now = new Date();

    // Calculate updated task data
    let updatedMembers = [...task.members];
    let updatedTaskStage = task.stage;
    
    if (memberId !== null) {
      // Update only a specific member's stage
      updatedMembers = task.members.map(m => {
        // ⭐ Compare as strings to handle both string and number IDs
        if (String(m.id) === String(memberId)) {
          const cleanMemberStage = (newStage || 'New').trim();
          console.log('🔄 Updating member stage:', {
            memberId: m.id,
            memberName: m.name,
            oldStage: m.stage,
            newStage: cleanMemberStage,
            hasIssueNote: !!issueNote,
            hasUpdateNote: !!updateNote,
            '⚠️ MEMBER WILL BE UPDATED': true
          });
          // ⭐ Store issue note and update note at member level, not task level
          return { 
            ...m, 
            stage: cleanMemberStage,
            issueNote: issueNote || m.issueNote || null, // Keep member's issue note
            updateNote: updateNote || m.updateNote || null // Keep member's update note
          };
        }
        console.log('➡️ Keeping member stage unchanged:', {
          memberId: m.id,
          memberName: m.name,
          stage: m.stage
        });
        return m;
      });
      
      console.log('📊 All members after update:', {
        members: updatedMembers.map(m => ({ id: m.id, name: m.name, stage: m.stage, hasUpdateNote: !!m.updateNote }))
      });
      
      // Task's overall stage = the highest (most advanced) stage among members
      const stageOrder = ['New', 'Start', 'Issue', 'Review A', 'Review B', 'Update', 'Complete'];
      const stages = updatedMembers.map(m => m.stage);
      const stageIndexes = stages.map(s => stageOrder.indexOf(s));
      const maxIdx = Math.max(...stageIndexes);
      updatedTaskStage = stageOrder[maxIdx] || task.stage;
      
      console.log('📊 Task stage calculation:', {
        memberStages: stages,
        stageIndexes: stageIndexes,
        maxIndex: maxIdx,
        calculatedTaskStage: updatedTaskStage,
        '⚠️ THIS IS THE NEW TASK STAGE': updatedTaskStage
      });
    } else {
      // Bulk update all members (skip members on hold)
      // ⭐ If updating to "Update" stage with a note, apply to all members
      updatedMembers = task.members.map(m => {
        if (m.isOnHold) return m;
        return { 
          ...m, 
          stage: newStage,
          updateNote: (newStage === 'Update' && updateNote) ? updateNote : m.updateNote // Apply bulk update note to all
        };
      });
      updatedTaskStage = newStage;
    }

    const historyEntry = {
      stage: newStage,
      date: now,
      user: actorName || (memberId ? (task.members.find(m => m.id === memberId)?.name || 'Member') : 'Admin'),
      action: 'updated',
      ...(issueNote && { note: issueNote }), // Only add note field if issueNote exists
    };
    
    const updatedHistory = [...(task.history || []), historyEntry];
    const updatedIssueNote = issueNote || task.issueNote || null; // Use null instead of undefined
    const isPaid = updatedTaskStage === 'Complete';

    // ⭐ Sanitize function to remove undefined values (Firebase doesn't allow them)
    const sanitizeForFirestore = (obj) => {
      if (Array.isArray(obj)) {
        return obj.map(item => sanitizeForFirestore(item));
      }
      if (obj && typeof obj === 'object' && !(obj instanceof Date)) {
        const cleaned = {};
        for (const [key, value] of Object.entries(obj)) {
          if (value !== undefined) {
            cleaned[key] = sanitizeForFirestore(value);
          }
        }
        return cleaned;
      }
      return obj;
    };

    // ⭐ CRITICAL: Save to Firestore FIRST before updating local state
    if (wsPath) {
      console.log('💾 Saving task to Firestore FIRST (before local state):', {
        taskId,
        overallTaskStage: updatedTaskStage,
        memberCount: updatedMembers?.length || 0,
        memberStages: updatedMembers?.map(m => ({ 
          id: m.id, 
          name: m.name, 
          stage: m.stage,
          budget: m.budget 
        })),
        updatingSpecificMember: memberId ? `Member ${memberId} to ${newStage}` : 'All members'
      });
      
      try {
        // Sanitize members array to remove any undefined values
        const sanitizedMembers = sanitizeForFirestore(updatedMembers);
        const sanitizedHistory = sanitizeForFirestore(updatedHistory);
        
        const updateData = {
          stage: updatedTaskStage,
          members: sanitizedMembers, // ⭐ CRITICAL: Save the members array with updated stages
          paid: task.paid || isPaid,
          history: sanitizedHistory,
          updatedAt: serverTimestamp(),
        };
        
        // Only add issueNote if it exists
        if (updatedIssueNote) {
          updateData.issueNote = updatedIssueNote;
        }
        
        await updateDoc(doc(db, `${wsPath}/tasks`, String(taskId)), updateData);
        console.log('✅ Task saved to Firestore successfully', {
          taskId,
          updatedStage: updatedTaskStage,
          memberCount: sanitizedMembers?.length,
          memberStages: sanitizedMembers?.map(m => ({ id: m.id, name: m.name, stage: m.stage }))
        });
        
        // ⭐ CRITICAL: Update local state immediately for instant UI feedback
        // The Firestore listener will sync this across all users
        setTasks(prev => prev.map(t => {
          if (t.id !== taskId) return t;
          console.log('🔄 LOCAL STATE UPDATE:', {
            taskId: t.id,
            oldStage: t.stage,
            newStage: updatedTaskStage,
            oldMembers: t.members?.map(m => ({ id: m.id, stage: m.stage })),
            newMembers: sanitizedMembers?.map(m => ({ id: m.id, stage: m.stage }))
          });
          return { 
            ...t, 
            stage: updatedTaskStage, 
            paid: t.paid || isPaid, 
            members: sanitizedMembers, // Use sanitized members
            history: sanitizedHistory, // Use sanitized history
            issueNote: updatedIssueNote,
            updatedAt: new Date(), // Use current time for local state
            _stageUpdateTimestamp: Date.now() // ⭐ Force re-render trigger
          };
        }));
        
      } catch (err) {
        console.error('❌ Failed to save task to Firestore:', err);
        // If Firestore save fails, update local state as fallback
        setTasks(prev => prev.map(t => {
          if (t.id !== taskId) return t;
          return { 
            ...t, 
            stage: updatedTaskStage, 
            paid: t.paid || isPaid, 
            members: updatedMembers, 
            history: updatedHistory,
            issueNote: updatedIssueNote
          };
        }));
      }
    } else {
      // No Firestore path, update local state only
      setTasks(prev => prev.map(t => {
        if (t.id !== taskId) return t;
        return { 
          ...t, 
          stage: updatedTaskStage, 
          paid: t.paid || isPaid, 
          members: updatedMembers, 
          history: updatedHistory,
          issueNote: updatedIssueNote
        };
      }));
    }

    // Show toast notification for stage updates
    const memberName = memberId ? task.members.find(m => m.id === memberId)?.name : null;
    const description = memberName 
      ? `${memberName} updated ${taskId} to ${newStage}`
      : `${taskId} — ${task.title}`;
    
    notify.taskStage(newStage, description);

    if (newStage === 'Complete') {
      addActivity('complete', 'Task Completed', `${taskId} — ${task.title}`, `+₹ ${task.totalBudget.toLocaleString()}`, true);
    } else if (newStage === 'Review A' || newStage === 'Review B') {
      addActivity('review', 'Submitted for Review', `${taskId} — ${task.title}`);
    } else if (newStage === 'Update') {
      addActivity('update', 'Update Requested', `${taskId} — ${task.title}`);
    } else if (newStage === 'Issue') {
      addActivity('issue', 'Issue Reported', `${taskId} — ${task.title}`);
    } else if (newStage === 'Start') {
      addActivity('start', 'Task Started', `${taskId} — ${task.title}`);
    }
    
    // ⭐ PHASE 3: Add timeline event for stage changes
    if (wsPath) {
      const actor = actorName || (memberId ? (task.members.find(m => m.id === memberId)?.name || 'Member') : 'Admin');
      const oldStage = task.stage;
      
      // Determine user info based on who made the change
      let userInfo = {
        uid: currentUser?.uid || null,
        memberId: currentUser?.memberId || null,
        name: actor,
        role: currentUser?.role || 'Admin',
        userRole: currentUser?.userRole || 'admin',
        color: currentUser?.color || '#3B5BFC',
        avatar: currentUser?.avatar || currentUser?.name?.charAt(0)?.toUpperCase() || 'A',
        avatarImg: currentUser?.avatarImg || null
      };
      
      let description = '';
      
      // If a specific member updated their stage
      if (memberId) {
        const taskMember = task.members.find(m => m.id === memberId);
        const teamMember = team.find(t => String(t.id) === String(memberId));
        
        if (taskMember) {
          userInfo = {
            uid: taskMember.uid || teamMember?.uid || null,
            memberId: taskMember.id,
            name: teamMember?.name || taskMember.name,
            avatar: teamMember?.avatar || taskMember.avatar,
            color: teamMember?.color || taskMember.color,
            avatarImg: teamMember?.avatarImg || taskMember.avatarImg || null,
            role: teamMember?.role || taskMember.role || 'Team Member',
            userRole: 'member'
          };
        }
        
        // Check if current user is admin/management updating a specific member
        const isAdminOrManagement = currentUser?.userRole === 'admin' || currentUser?.userRole === 'management';
        const isUpdatingSelf = String(currentUser?.memberId) === String(memberId);
        
        if (isAdminOrManagement && !isUpdatingSelf) {
          // Admin/Management updating a specific team member's stage
          description = `${taskMember?.name || 'Member'}: ${oldStage} → ${newStage}`;
        } else {
          // Team member updating their own stage
          description = `${oldStage} → ${newStage}`;
        }
      } else {
        // Admin/Management moving all members to a stage (no arrow, just new stage)
        description = `Updated stage: ${newStage}`;
      }
      
      // ⭐ Pass the appropriate note based on the stage
      const noteForTimeline = (newStage === 'Update' ? updateNote : issueNote) || null;
      
      addTimelineEvent(taskId, {
        eventType: "stage_changed",
        description: description,
        changes: {
          oldStage: oldStage,
          newStage: newStage,
          memberId: memberId || null
        },
        issueNote: noteForTimeline
      }).catch(err => {
        console.error('❌ Failed to add timeline event:', err);
      });
    }
  }, [tasks, addActivity, wsPath, currentUser, addTimelineEvent, team]);

  const deleteTask = useCallback(async (taskId, deletedBy = null) => {
    const task = tasks.find(t => t.id === taskId);
    setTasks(prev => prev.filter(t => t.id !== taskId));
    
    if (task) {
      const trashedTask = { ...task, _trashType: 'task', _deletedBy: deletedBy, _deletedAt: new Date() };
      setTrashedItems(prev => [trashedTask, ...prev]);
      
      // ⭐ Delete all related payment entries for this task
      const relatedPayments = payments.filter(p => p.taskId === taskId);
      console.log(`🗑️ Deleting ${relatedPayments.length} payment entries for task ${taskId}`);
      
      // Remove payments from local state
      setPayments(prev => prev.filter(p => p.taskId !== taskId));
      
      // ⭐ Delete all related scribes for this task
      const relatedScribes = notes.filter(n => n.taskId === taskId);
      console.log(`🗑️ Deleting ${relatedScribes.length} scribes for task ${taskId}`);
      
      // Remove scribes from local state
      setNotes(prev => prev.filter(n => n.taskId !== taskId));
      
      // Firestore: move task to trash, delete from tasks, and delete all related payments and scribes
      if (wsPath) {
        try {
          // Delete task from tasks collection
          await deleteDoc(doc(db, `${wsPath}/tasks`, String(taskId)));
          
          // Move task to trash
          await setDoc(doc(db, `${wsPath}/trash`, String(taskId)), trashedTask);
          
          // Delete all related payment documents
          const paymentDeletePromises = relatedPayments.map((payment) => 
            deleteDoc(doc(db, `${wsPath}/payments`, payment.id)).catch((err) => {
              console.error(`❌ Failed to delete payment ${payment.id}:`, err);
            })
          );
          
          // Delete all related scribe documents
          const scribeDeletePromises = relatedScribes.map((scribe) => 
            deleteDoc(doc(db, `${wsPath}/notes`, scribe.id)).catch((err) => {
              console.error(`❌ Failed to delete scribe ${scribe.id}:`, err);
            })
          );
          
          await Promise.all([...paymentDeletePromises, ...scribeDeletePromises]);
          console.log(`✅ Deleted ${relatedPayments.length} payment entries and ${relatedScribes.length} scribes for task ${taskId}`);
        } catch (err) {
          console.error('❌ Error during task deletion:', err);
        }
      }
      
      addActivity('delete', 'Task Deleted', `${taskId} — ${task.title}`);
      notify.taskDeleted(`${taskId}`);
    }
  }, [tasks, payments, notes, addActivity, wsPath]);

  const pauseTask = useCallback(async (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    const now = new Date();
    console.log('⏸️ Pausing task:', taskId, 'Setting paused: true');
    setTasks(prev => prev.map(t => t.id === taskId ? {
      ...t, paused: true, pausedOn: now,
      history: [...(t.history || []), { stage: t.stage, date: now, user: 'Admin', action: 'paused' }],
    } : t));
    if (wsPath) {
      updateDoc(doc(db, `${wsPath}/tasks`, String(taskId)), { paused: true, pausedOn: now })
        .then(() => console.log('✅ Task paused in Firestore:', taskId))
        .catch((err) => console.error('❌ Failed to pause task in Firestore:', err));
      
      // ⭐ Add timeline event for task hold
      addTimelineEvent(taskId, {
        eventType: "updated",
        description: "Task hold",
        changes: {
          field: "status",
          oldValue: "Active",
          newValue: "On Hold"
        }
      }).catch(err => console.error('❌ Failed to add timeline event:', err));
    }
    if (task) { addActivity('pause', 'Task On Hold', `${taskId} — ${task.title}`); notify.taskPaused(`${taskId} — ${task.title}`); }
  }, [tasks, addActivity, wsPath, addTimelineEvent]);

  const resumeTask = useCallback(async (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    const now = new Date();
    setTasks(prev => prev.map(t => t.id === taskId ? {
      ...t, paused: false, pausedOn: null,
      history: [...(t.history || []), { stage: t.stage, date: now, user: 'Admin', action: 'resumed' }],
    } : t));
    if (wsPath) {
      updateDoc(doc(db, `${wsPath}/tasks`, String(taskId)), { paused: false, pausedOn: null }).catch(() => {});
      
      // ⭐ Add timeline event for task activation
      addTimelineEvent(taskId, {
        eventType: "updated",
        description: "Task activated",
        changes: {
          field: "status",
          oldValue: "On Hold",
          newValue: "Active"
        }
      }).catch(err => console.error('❌ Failed to add timeline event:', err));
    }
    if (task) { addActivity('resume', 'Task Activated', `${taskId} — ${task.title}`); notify.taskResumed(`${taskId} — ${task.title}`); }
  }, [tasks, addActivity, wsPath, addTimelineEvent]);

  const markTaskPaid = useCallback(async (taskId, paidBy = null, source = null) => {
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
    if (task) {
      addActivity('payment', 'Payment Processed', `${taskId} — ${task.title}`, `+₹ ${task.totalBudget.toLocaleString()}`, true);
      notify.paymentProcessed(`₹ ${task.totalBudget.toLocaleString()} — ${task.title}`);
    }
    if (wsPath) {
      updateDoc(doc(db, `${wsPath}/tasks`, String(taskId)), {
        stage: 'Complete', paid: true, paidOn: now, updatedAt: serverTimestamp(),
      }).catch(() => {});
      
      // ⭐ Add timeline event for task budget payment
      if (task) {
        addTimelineEvent(taskId, {
          eventType: "payment_status",
          description: `Task budget completed: ₹${task.totalBudget.toLocaleString()}`,
          changes: {
            field: "payment",
            oldValue: "Pending",
            newValue: "Paid",
            amount: task.totalBudget
          }
        }).catch(err => console.error('❌ Failed to add timeline event:', err));
      }
    }
  }, [tasks, addActivity, wsPath, addTimelineEvent]);

  // ⭐ PHASE 2: Payment helper functions
  const addPaymentToTask = useCallback(async (taskId, paymentData) => {
    if (!wsPath) {
      console.error('❌ Cannot add payment: No workspace path');
      return null;
    }

    try {
      // ⭐ Check if this is a manual payment (no linked task)
      // Manual payments have taskId = "PAYMENT" (default text)
      const isManualPayment = paymentData.isManualPayment || taskId === 'PAYMENT';
      const task = isManualPayment ? null : tasks.find(t => t.id === taskId);
      
      // ⭐ For manual payments, use the provided paymentData directly
      if (isManualPayment) {
        console.log('🔵 Creating manual payment (no task link)');
        console.log('🔵 Manual payment data:', {
          taskId: paymentData.taskId,
          hasTaskId: !!paymentData.taskId,
          memberId: paymentData.memberId,
          memberName: paymentData.memberName,
          memberUid: paymentData.memberUid,
          amount: paymentData.amount,
          assignedTo: paymentData.assignedTo,
          paymentType: paymentData.paymentType
        });
        
        // ⭐ Helper function to remove undefined values recursively
        const removeUndefined = (obj) => {
          if (obj === null || obj === undefined) return null;
          if (Array.isArray(obj)) return obj.map(removeUndefined).filter(v => v !== undefined);
          if (typeof obj === 'object') {
            const cleaned = {};
            Object.keys(obj).forEach(key => {
              const value = removeUndefined(obj[key]);
              if (value !== undefined) {
                cleaned[key] = value;
              }
            });
            return cleaned;
          }
          return obj;
        };
        
        const basePayment = {
          ...paymentData,
          createdAt: serverTimestamp(),
          paidAt: paymentData.isPaid ? serverTimestamp() : null,
          paidAmount: paymentData.isPaid ? paymentData.amount : 0,
        };
        
        // ⭐ Clean the payment object to remove all undefined values
        const payment = removeUndefined(basePayment);

        const docRef = await addDoc(collection(db, `${wsPath}/payments`), payment);
        console.log('✅ Manual payment created with ID:', docRef.id);
        console.log('✅ Payment will appear for member:', paymentData.memberName, 'ID:', paymentData.memberId);
        return docRef.id;
      }
      
      // ⭐ For task-linked payments, require task to exist
      if (!task) {
        console.error('❌ Task not found:', taskId);
        return null;
      }

      // ⭐ Helper function to remove undefined values recursively
      const removeUndefined = (obj) => {
        if (obj === null || obj === undefined) return null;
        if (Array.isArray(obj)) return obj.map(removeUndefined).filter(v => v !== undefined);
        if (typeof obj === 'object') {
          const cleaned = {};
          Object.keys(obj).forEach(key => {
            const value = removeUndefined(obj[key]);
            if (value !== undefined) {
              cleaned[key] = value;
            }
          });
          return cleaned;
        }
        return obj;
      };
      
      // ⭐ Merge provided payment data with defaults
      const basePayment = {
        taskId: taskId,
        taskTitle: task.title,
        amount: paymentData.amount || 0,
        status: paymentData.status || "Pending",
        isPaid: paymentData.isPaid || false,
        // ⭐ IMPORTANT: Only assign to task members if assignedTo is explicitly undefined
        // If assignedTo is provided (even as empty array []), use it as-is
        assignedTo: paymentData.assignedTo !== undefined 
          ? paymentData.assignedTo 
          : (task.members || []).map(m => ({
              id: m.id,
              name: m.name,
              uid: m.uid || null
            })),
        createdBy: paymentData.createdBy || {
          uid: currentUser?.uid || null,
          memberId: currentUser?.memberId || null,
          role: currentUser?.role || 'Admin',
          userRole: currentUser?.userRole || 'admin',
          name: currentUser?.name || 'Admin',
        },
        createdAt: serverTimestamp(),
        paidAt: paymentData.isPaid ? serverTimestamp() : null,
        paidAmount: paymentData.isPaid ? paymentData.amount : 0,
      };
      
      // ⭐ Add optional fields from paymentData, filtering out undefined values
      const optionalFields = [
        'memberId', 'memberName', 'memberUid', 'title', 'notes', 'dueDate',
        'paymentType', 'investmentCategory', 'isManualPayment', 'category',
        'categoryLabel', 'tags', 'stage', 'priority', 'deadline', 'description',
        'taskMembers', 'taskCreatedBy', 'taskCreatedAt'
      ];
      
      optionalFields.forEach(field => {
        if (paymentData[field] !== undefined) {
          basePayment[field] = paymentData[field];
        }
      });
      
      // ⭐ Clean the payment object to remove all undefined values
      const payment = removeUndefined(basePayment);

      const docRef = await addDoc(collection(db, `${wsPath}/payments`), payment);
      console.log('✅ Additional payment created:', docRef.id);

      // Add timeline event
      await addTimelineEvent(taskId, {
        eventType: "payment_added",
        description: `${currentUser?.name || 'Admin'} added a payment of ₹${payment.amount.toLocaleString()}`,
        paymentAmount: payment.amount
      });

      return docRef.id;
    } catch (error) {
      console.error('❌ Failed to add payment:', error);
      return null;
    }
  }, [wsPath, tasks, currentUser]);

  const markPaymentAsPaid = useCallback(async (paymentId, taskId, amount) => {
    if (!wsPath) {
      console.error('❌ Cannot mark payment as paid: No workspace path');
      return false;
    }

    try {
      const now = new Date();
      
      // Get payment details first
      const payment = payments.find(p => p.id === paymentId);
      
      // Update payment record
      await updateDoc(doc(db, `${wsPath}/payments`, paymentId), {
        status: "Paid",
        isPaid: true, // ⭐ Add isPaid field for consistency
        paidAt: serverTimestamp(),
        paidAmount: amount,
        paidBy: {
          uid: currentUser?.uid || null,
          name: currentUser?.name || 'Admin',
          userRole: currentUser?.userRole || 'admin'
        }
      });

      console.log('✅ Payment marked as paid:', paymentId);

      // Add timeline event with payment context
      let paymentDescription = `Paid ₹${amount.toLocaleString()}`;
      if (payment) {
        if (payment.memberName) {
          // Member payment
          paymentDescription = `Paid ₹${amount.toLocaleString()} to ${payment.memberName}`;
        } else if (payment.category || payment.categoryLabel) {
          // Payment with category (from payment entry)
          const category = payment.categoryLabel || payment.category;
          if (payment.title) {
            paymentDescription = `Paid ₹${amount.toLocaleString()} for ${category} - ${payment.title}`;
          } else {
            paymentDescription = `Paid ₹${amount.toLocaleString()} for ${category}`;
          }
        } else if (payment.title) {
          // Additional payment with title only
          paymentDescription = `Paid ₹${amount.toLocaleString()} for ${payment.title}`;
        }
      }
      
      await addTimelineEvent(taskId, {
        eventType: "payment_completed",
        description: paymentDescription,
        paymentId: paymentId,
        paymentAmount: amount,
        paymentType: payment?.memberName ? 'member' : (payment?.category ? 'category' : 'additional'),
        paymentCategory: payment?.categoryLabel || payment?.category || null
      });

      // Add activity
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        addActivity('payment', 'Payment Processed', `${taskId} — ${task.title}`, `+₹ ${amount.toLocaleString()}`, true);
        notify.paymentProcessed(`₹ ${amount.toLocaleString()} — ${task.title}`);
      }

      return true;
    } catch (error) {
      console.error('❌ Failed to mark payment as paid:', error);
      return false;
    }
  }, [wsPath, currentUser, tasks, addActivity]);

  const updatePaymentNotes = useCallback(async (paymentId, notes) => {
    if (!wsPath) {
      console.error('❌ Cannot update payment notes: No workspace path');
      return false;
    }

    try {
      // Update payment record with new notes
      await updateDoc(doc(db, `${wsPath}/payments`, paymentId), {
        notes: notes || '',
        updatedAt: serverTimestamp(),
        updatedBy: {
          uid: currentUser?.uid || null,
          name: currentUser?.name || 'Admin',
          userRole: currentUser?.userRole || 'admin'
        }
      });

      console.log('✅ Payment notes updated:', paymentId);
      
      // ⭐ Don't update local state - let the onSnapshot listener handle it
      // This prevents double updates and unnecessary re-renders

      return true;
    } catch (error) {
      console.error('❌ Failed to update payment notes:', error);
      return false;
    }
  }, [wsPath, currentUser]);

  const getPaymentsForTask = useCallback((taskId) => {
    return payments.filter(p => p.taskId === taskId);
  }, [payments]);

  // ⭐ Update payment title and amount (for additional payments)
  // ⭐ If paymentId is null, create a new payment entry
  const updatePaymentDetails = useCallback(async (paymentId, updates) => {
    if (!wsPath) {
      console.error('❌ Cannot update payment: No workspace path');
      return false;
    }

    try {
      // ⭐ CREATE new payment if paymentId is null
      if (!paymentId) {
        console.log('🔵 Creating new payment entry:', updates);
        
        const paymentData = {
          ...updates,
          createdAt: serverTimestamp(),
          createdBy: {
            uid: currentUser?.uid || null,
            memberId: currentUser?.memberId || null,
            name: currentUser?.name || 'Admin',
            role: currentUser?.role || 'admin',
            userRole: currentUser?.userRole || 'admin'
          },
          paidAt: null,
          paidAmount: 0,
        };
        
        const docRef = await addDoc(collection(db, `${wsPath}/payments`), paymentData);
        console.log('✅ New payment created with ID:', docRef.id);
        return true;
      }
      
      // ⭐ UPDATE existing payment
      console.log('🔵 Updating payment details:', { paymentId, updates });
      
      const paymentRef = doc(db, `${wsPath}/payments`, paymentId);
      await updateDoc(paymentRef, {
        ...updates,
        updatedAt: serverTimestamp(),
        updatedBy: {
          uid: currentUser?.uid || null,
          name: currentUser?.name || 'Admin',
          role: currentUser?.role || 'admin',
        }
      });
      
      console.log('✅ Payment details updated successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to update payment details:', error);
      return false;
    }
  }, [wsPath, currentUser]);

  // ── Team actions ─────────────────────────────────────────────────────────

  // Calculate derived performance fields from tasks collection
  const getMemberStats = useCallback((memberId) => {
    const memberTasks     = tasks.filter(t => t.members?.some(m => m.id === memberId));
    const totalTasks      = memberTasks.length;
    const completedTasks  = memberTasks.filter(t => t.stage === 'Complete').length;
    const completionRate  = totalTasks > 0 ? completedTasks / totalTasks : 0;
    const rating          = Math.min(5, Math.round(completionRate * 5));
    return { tasks: totalTasks, completed: completedTasks, rating };
  }, [tasks]);

  const saveMember = useCallback((member, addedBy = null) => {
    console.log('💾 saveMember called with:', { 
      memberId: member.id,
      memberName: member.name,
      memberRole: member.role,
      '⚠️ ROLE BEING SAVED': member.role,
      addedBy, 
      hasEmail: !!member.email 
    });
    console.log('🔍 Current workspace for cache invalidation:', workspaceId);
    
    // CRITICAL: Invalidate the enriched team cache immediately
    // This ensures the Firestore listener will re-fetch and re-enrich the data
    if (workspaceId) {
      console.log('🗑️ Invalidating team cache due to saveMember');
      invalidateFirestoreCache('team_enriched', workspaceId);
      console.log('✅ Cache invalidation completed');
    } else {
      console.warn('⚠️ Cannot invalidate cache - no workspaceId found');
    }
    
    setTeam(prev => {
      const exists = prev.find(m => m.id === member.id);
      const memberData = addedBy ? { ...member, addedBy } : member;

      if (wsPath && currentUser) {
        // Calculate derived fields from tasks
        const stats = getMemberStats(member.id);

        // Full schema — NO password stored (Firebase Auth manages credentials)
        const firestoreData = {
          id:        member.id,
          name:      member.name,
          email:     member.email || '', // Ensure email is never undefined
          // password intentionally omitted — managed by Firebase Auth
          role:      member.role || 'Team Member', // Ensure role is never undefined
          avatar:    member.avatar,
          color:     member.color,
          status:    member.status || 'Active',
          joined:    member.joined,
          desc:      member.desc      || '',
          about:     member.about     || '',
          phone:     member.phone     || '',
          location:  member.location  || '',
          avatarImg: member.avatarImg || null,
          // Derived performance fields (calculated from tasks)
          tasks:     stats.tasks,
          completed: stats.completed,
          rating:    stats.rating,
          // Metadata
          addedBy:   addedBy || member.addedBy || null,
          uid:       member.uid || null, // Store Firebase Auth UID
          updatedAt: serverTimestamp(),
        };
        
        console.log('💾 Firestore data being saved:', {
          id: firestoreData.id,
          name: firestoreData.name,
          role: firestoreData.role,
          '⚠️ ROLE IN FIRESTORE DATA': firestoreData.role
        });

        if (!exists) {
          // Only admin/management can create new team members
          const canCreate = currentUser.userRole === 'admin' || currentUser.userRole === 'management';
          if (canCreate) {
            // New member — add creation timestamps
            firestoreData.joinedDate = serverTimestamp();
            firestoreData.createdAt  = serverTimestamp();
            // Use String(member.id) as document ID to ensure consistency
            console.log('💾 Creating new team member document:', String(member.id), firestoreData);
            setDoc(doc(db, `${wsPath}/team`, String(member.id)), firestoreData).catch((err) => {
              console.error('❌ Error creating team member:', err);
            });
          } else {
            console.log('⚠️ Skipping team member creation - insufficient permissions');
          }
        } else {
          // Update — preserve joinedDate/createdAt, update everything else
          console.log('💾 Updating team member document:', String(member.id), firestoreData);
          updateDoc(doc(db, `${wsPath}/team`, String(member.id)), firestoreData).catch((err) => {
            console.error('❌ Error updating team member:', err);
          });
        }
      }

      if (exists) {
        const old = prev.find(m => m.id === member.id);
        if (old.desc !== member.desc) setUnreadDescMembers(s => new Set([...s, member.id]));
        addActivity('edit', 'Member Updated', `${member.name} — ${member.role}`);
        notify.memberUpdated(`${member.name} — ${member.role}`);
        return prev.map(m => m.id === member.id ? memberData : m);
      } else {
        addActivity('member', 'Member Added', `${member.name} — ${member.role}`);
        notify.memberAdded(`${member.name} joined as ${member.role}`);
        return [...prev, memberData];
      }
    });
  }, [addActivity, wsPath, getMemberStats, currentUser]);

  const markDescRead = useCallback((memberId) => {
    console.log('✅ markDescRead called for member:', memberId);
    setUnreadDescMembers(s => { 
      const n = new Set(s); 
      n.delete(memberId); 
      console.log('📊 Unread members after delete:', Array.from(n));
      return n; 
    });
    
    // Save the read timestamp to Firestore
    if (wsPath && memberId) {
      const readAt = Date.now();
      console.log('💾 Saving descReadAt to Firestore:', { memberId, readAt });
      updateDoc(doc(db, `${wsPath}/team`, String(memberId)), {
        descReadAt: readAt
      }).then(() => {
        console.log('✅ descReadAt saved successfully');
      }).catch((err) => {
        console.error('❌ Error updating descReadAt:', err);
      });
    }
  }, [wsPath]);

  const toggleMemberStatus = useCallback((memberId) => {
    console.log('🔄 toggleMemberStatus called for member:', memberId);
    console.log('🔍 Current user workspace:', currentUser?.workspaceId);
    
    // CRITICAL: Invalidate the enriched team cache immediately
    // This ensures the Firestore listener will re-fetch and re-enrich the data
    if (currentUser?.workspaceId) {
      const cacheKey = `firestore_team_enriched_${currentUser.workspaceId}`;
      console.log('🗑️ Invalidating team cache:', cacheKey);
      invalidateFirestoreCache('team_enriched', currentUser.workspaceId);
      
      // Also clear from window.cache if available
      if (typeof window !== 'undefined' && window.cache) {
        window.cache.delete(cacheKey);
        console.log('🗑️ Also cleared from window.cache');
      }
      
      console.log('✅ Cache invalidation completed');
    } else {
      console.warn('⚠️ Cannot invalidate cache - no workspaceId found');
    }
    
    // Update local state immediately for instant UI feedback
    setTeam(prev => {
      console.log('🔄 Previous team state:', prev.map(m => ({ id: m.id, name: m.name, status: m.status })));
      
      const updatedTeam = prev.map(m => {
        if (m.id !== memberId) return m;
        const newStatus = m.status === 'Active' ? 'Inactive' : 'Active';
        console.log('🔄 Changing status:', { memberId, oldStatus: m.status, newStatus });
        
        // Update Firestore asynchronously
        if (wsPath) {
          const updateData = {
            status:          newStatus,
            statusChangedAt: serverTimestamp(),
            updatedAt:       serverTimestamp(),
          };
          
          // Add deactivatedAt timestamp when deactivating
          if (newStatus === 'Inactive') {
            updateData.deactivatedAt = serverTimestamp();
          } else {
            // Remove deactivatedAt when activating
            updateData.deactivatedAt = null;
          }
          
          updateDoc(doc(db, `${wsPath}/team`, String(memberId)), updateData).then(() => {
            console.log('✅ Status updated in Firestore:', { memberId, newStatus });
            
            // If deactivating, force logout the user by updating their profile
            if (newStatus === 'Inactive' && m.uid) {
              updateDoc(doc(db, 'users', m.uid), {
                forceLogout: true,
                updatedAt: serverTimestamp()
              }).catch(err => console.error('Failed to set forceLogout:', err));
            }
          }).catch((err) => {
            console.error('❌ Failed to update status in Firestore:', err);
          });
        }
        
        addActivity(
          newStatus === 'Inactive' ? 'deactivate' : 'activate',
          newStatus === 'Inactive' ? 'Member Deactivated' : 'Member Activated',
          `${m.name} — ${m.role}`
        );
        if (newStatus === 'Active') notify.memberActivated(`${m.name} is now active`);
        else notify.memberDeactivated(`${m.name} is now inactive`);
        
        // Update local state with deactivatedAt timestamp
        const updatedMember = { 
          ...m, 
          status: newStatus,
          statusChangedAt: new Date(),
          updatedAt: new Date()
        };
        
        // Add or remove deactivatedAt based on status
        if (newStatus === 'Inactive') {
          updatedMember.deactivatedAt = new Date();
        } else {
          updatedMember.deactivatedAt = null;
        }
        
        return updatedMember;
      });
      
      console.log('🔄 Updated team state:', updatedTeam.map(m => ({ id: m.id, name: m.name, status: m.status })));
      return updatedTeam;
    });
  }, [addActivity, wsPath, currentUser?.workspaceId]);

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
  const addTaskRequest = useCallback(async (request) => {
    if (!workspaceId) {
      console.error('❌ Cannot add task request: missing workspaceId');
      return;
    }

    try {
      const taskRequestsRef = collection(db, `workspaces/${workspaceId}/taskRequests`);
      const requestData = {
        ...request,
        timestamp: serverTimestamp(),
        status: 'pending',
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(taskRequestsRef, requestData);
      console.log('✅ Task request submitted:', docRef.id);
      
      // Optimistically update local state
      setTaskRequests(prev => [{
        ...request,
        id: docRef.id,
        timestamp: new Date(),
        status: 'pending'
      }, ...prev]);
      
      return docRef.id;
    } catch (error) {
      console.error('❌ Error submitting task request:', error);
      throw error;
    }
  }, [workspaceId]);

  const approveTaskRequest = useCallback(async (requestId, approvedBy = null) => {
    if (!workspaceId) {
      console.error('❌ Cannot approve task request: missing workspaceId');
      return;
    }

    try {
      const requestRef = doc(db, `workspaces/${workspaceId}/taskRequests`, requestId);
      await updateDoc(requestRef, {
        status: 'approved',
        isCreated: true,
        approvedBy: approvedBy ? {
          uid: approvedBy.uid || null,
          name: approvedBy.name || 'Admin',
          role: approvedBy.role || 'admin',
          avatar: approvedBy.avatar || null,
          color: approvedBy.color || '#3B5BFC',
          avatarImg: approvedBy.avatarImg || null
        } : null,
        approvedAt: serverTimestamp()
      });
      
      console.log('✅ Task request approved:', requestId);
      
      // Optimistically update local state
      setTaskRequests(prev => prev.map(r => 
        r.id === requestId 
          ? { ...r, status: 'approved', isCreated: true, approvedBy, approvedAt: new Date() } 
          : r
      ));
    } catch (error) {
      console.error('❌ Error approving task request:', error);
      throw error;
    }
  }, [workspaceId]);

  const completeTaskRequest = useCallback(async (requestId, completedBy = null) => {
    if (!workspaceId) {
      console.error('❌ Cannot complete task request: missing workspaceId');
      return;
    }

    try {
      const requestRef = doc(db, `workspaces/${workspaceId}/taskRequests`, requestId);
      await updateDoc(requestRef, {
        status: 'completed',
        isComplete: true,
        completedBy: completedBy ? {
          uid: completedBy.uid || null,
          name: completedBy.name || 'Admin',
          role: completedBy.role || 'admin',
          avatar: completedBy.avatar || null,
          color: completedBy.color || '#3B5BFC',
          avatarImg: completedBy.avatarImg || null
        } : null,
        completedAt: serverTimestamp()
      });
      
      console.log('✅ Task request marked as complete:', requestId);
      
      // Optimistically update local state
      setTaskRequests(prev => prev.map(r => 
        r.id === requestId 
          ? { ...r, status: 'completed', isComplete: true, completedBy, completedAt: new Date() } 
          : r
      ));
    } catch (error) {
      console.error('❌ Error completing task request:', error);
      throw error;
    }
  }, [workspaceId]);

  const addTaskHistoryEntry = useCallback((taskId, entry) => {
    setTasks(prev => prev.map(t => t.id === taskId
      ? { ...t, history: [...(t.history || []), entry] }
      : t
    ));
  }, []);

  const addScheduledTask = useCallback((task) => {
    console.log('📅 Adding scheduled task with createdBy:', {
      taskId: task.id,
      hasCreatedBy: !!task.createdBy,
      createdBy: task.createdBy
    });
    
    setScheduledTasks(prev => [{ ...task, isScheduled: true, createdAt: new Date() }, ...prev]);
    
    // Save scheduled task to Firestore
    if (wsPath) {
      const scheduledTaskData = {
        ...task,
        isScheduled: true,
        createdAt: serverTimestamp(),
      };
      
      console.log('💾 Saving scheduled task to Firestore:', {
        taskId: scheduledTaskData.id,
        hasCreatedBy: !!scheduledTaskData.createdBy,
        createdByUid: scheduledTaskData.createdBy?.uid,
        createdByMemberId: scheduledTaskData.createdBy?.memberId
      });
      
      setDoc(doc(db, `${wsPath}/scheduledTasks`, String(task.id)), scheduledTaskData)
        .then(() => {
          console.log('✅ Scheduled task saved to Firestore:', task.id);
        })
        .catch((err) => {
          console.error('❌ Failed to save scheduled task:', err);
        });
    }
    
    notify.taskScheduled(`${task.id} — ${task.title}`);
  }, [wsPath]);

  const removeScheduledTask = useCallback((taskId) => {
    setScheduledTasks(prev => prev.filter(t => t.id !== taskId));
    
    // Remove scheduled task from Firestore
    if (wsPath) {
      deleteDoc(doc(db, `${wsPath}/scheduledTasks`, String(taskId)))
        .then(() => {
          console.log('✅ Scheduled task removed from Firestore:', taskId);
        })
        .catch((err) => {
          console.error('❌ Failed to remove scheduled task:', err);
        });
    }
    
    notify.taskUnscheduled();
  }, [wsPath]);

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
    notify.itemRestored(item.title || 'Item moved back');
  }, [trashedItems]);

  const permanentlyDelete = useCallback((itemId) => {
    setTrashedItems(prev => prev.filter(i => i.id !== itemId));
    notify.itemDeleted();
  }, []);

  const clearTrash = useCallback(() => {
    setTrashedItems([]);
    notify.archiveCleared();
  }, []);

  const deleteTaskRequest = useCallback(async (requestId) => {
    if (!workspaceId) {
      console.error('❌ Cannot delete task request: missing workspaceId');
      return;
    }

    try {
      const requestRef = doc(db, `workspaces/${workspaceId}/taskRequests`, requestId);
      await deleteDoc(requestRef);
      
      console.log('✅ Task request deleted:', requestId);
      
      // Optimistically update local state
      setTaskRequests(prev => prev.filter(r => r.id !== requestId));
      notify.requestDismissed();
    } catch (error) {
      console.error('❌ Error deleting task request:', error);
      throw error;
    }
  }, [workspaceId]);

  // ⭐ Calculate unread message counts for all tasks
  useEffect(() => {
    if (!workspaceId || !currentUser || tasks.length === 0) return;
    
    const unsubscribers = [];
    
    // For each task, listen to chat messages and calculate unread count
    tasks.forEach(task => {
      const chatPath = `workspaces/${workspaceId}/tasks/${String(task.id)}/chat`;
      const readPath = `workspaces/${workspaceId}/tasks/${String(task.id)}/readReceipts`;
      
      // Listen to messages
      const messagesUnsub = onSnapshot(
        query(collection(db, chatPath), orderBy('timestamp', 'asc')),
        (messagesSnap) => {
          const messages = messagesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
          
          // Get user's last read timestamp
          getDoc(doc(db, readPath, String(currentUser.name || 'user')))
            .then(readDoc => {
              const lastReadAt = readDoc.exists() ? readDoc.data().readAt : null;
              
              // Count unread messages (messages after last read time)
              let unreadCount = 0;
              if (lastReadAt) {
                unreadCount = messages.filter(msg => {
                  // Don't count own messages as unread
                  if (msg.sender === currentUser.name) return false;
                  
                  // Compare timestamps
                  const msgTime = msg.timestamp?.toDate?.() || new Date(0);
                  const readTime = lastReadAt?.toDate?.() || new Date(0);
                  return msgTime > readTime;
                }).length;
              } else {
                // If never read, count all messages except own
                unreadCount = messages.filter(msg => msg.sender !== currentUser.name).length;
              }
              
              // Update task with unread count
              setTasks(prev => prev.map(t => 
                t.id === task.id ? { ...t, unreadCount } : t
              ));
            })
            .catch(() => {
              // If read receipt doesn't exist, count all messages except own
              const unreadCount = messages.filter(msg => msg.sender !== currentUser.name).length;
              setTasks(prev => prev.map(t => 
                t.id === task.id ? { ...t, unreadCount } : t
              ));
            });
        },
        () => {}
      );
      
      unsubscribers.push(messagesUnsub);
    });
    
    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [workspaceId, currentUser?.name, tasks.length]); // Only re-run when tasks count changes

  // Provide TAGS and CATEGORIES for all users
  const contextTags = TAGS;
  const contextCategories = CATEGORIES;

  return (
    <AppContext.Provider value={{
      currentUser, setCurrentUser,
      currentUid, setCurrentUid: setCurrentUidWithLog,
      workspaceId, setWorkspaceId,
      workspaceName, workspaceSub, workspaceLogo,
      hasCompletedSetup, saveWorkspaceSettings,
      tasks, team, activity, financials, dashStats, taskRequests, scheduledTasks, trashedItems, roles,
      notes, setNotes, updateNote, addNote, deleteNote,
      broadcasts, setBroadcasts, updateBroadcast,
      payments, addPaymentToTask, markPaymentAsPaid, updatePaymentNotes, getPaymentsForTask, updatePaymentDetails, // ⭐ PHASE 2: Payment functions
      addTimelineEvent, // ⭐ PHASE 3: Timeline function
      helpSubmissions, setHelpSubmissions,
      unreadDescMembers, markDescRead,
      createTask, updateTask, updateTaskNote, updateTaskStage, deleteTask, markTaskPaid, pauseTask, resumeTask, addTaskHistoryEntry,
      saveMember, toggleMemberStatus,
      saveRoles: (newRolesOrCallback) => {
        console.log('🔥 saveRoles called in AppContext');
        // Handle both direct array and callback function
        const newRoles = typeof newRolesOrCallback === 'function' 
          ? newRolesOrCallback(roles) 
          : newRolesOrCallback;
        
        console.log('📝 Updating roles state and saving to Firebase:', newRoles.length, 'roles');
        setRoles(newRoles);
        
        // Write all roles to Firestore
        if (wsPath && Array.isArray(newRoles)) {
          console.log('🔥 Writing roles to Firebase at path:', wsPath);
          newRoles.forEach(role => {
            console.log(`  💾 Saving role ${role.id} (${role.name}) to Firebase`);
            setDoc(doc(db, `${wsPath}/roles`, String(role.id)), role)
              .then(() => console.log(`  ✅ Role ${role.id} saved successfully`))
              .catch((err) => console.error(`  ❌ Error saving role ${role.id}:`, err));
          });
        } else {
          console.warn('⚠️ Cannot save roles to Firebase:', { wsPath, isArray: Array.isArray(newRoles) });
        }
      },
      saveTags: (newTagsOrCallback) => {
        // Handle both direct array and callback function
        const newTags = typeof newTagsOrCallback === 'function' 
          ? newTagsOrCallback(tags) 
          : newTagsOrCallback;
        
        setTags(newTags);
        
        // Write all tags to Firestore
        if (wsPath && Array.isArray(newTags)) {
          newTags.forEach(tag => {
            setDoc(doc(db, `${wsPath}/tags`, String(tag.id)), tag).catch(() => {});
          });
        }
      },
      saveCategories: (newCategoriesOrCallback) => {
        // Handle both direct array and callback function
        const newCategories = typeof newCategoriesOrCallback === 'function' 
          ? newCategoriesOrCallback(categories) 
          : newCategoriesOrCallback;
        
        setCategories(newCategories);
        
        // Write all categories to Firestore
        if (wsPath && Array.isArray(newCategories)) {
          newCategories.forEach(category => {
            setDoc(doc(db, `${wsPath}/categories`, String(category.id)), category).catch(() => {});
          });
        }
      },
      deleteTag: (tagId) => {
        setTags(prev => prev.filter(t => t.id !== tagId));
        if (wsPath) {
          deleteDoc(doc(db, `${wsPath}/tags`, String(tagId))).catch(() => {});
        }
      },
      deleteCategory: (categoryId) => {
        setCategories(prev => prev.filter(c => c.id !== categoryId));
        if (wsPath) {
          deleteDoc(doc(db, `${wsPath}/categories`, String(categoryId))).catch(() => {});
        }
      },
      addTaskRequest, approveTaskRequest, completeTaskRequest, deleteTaskRequest, addScheduledTask, removeScheduledTask, addToTrash, restoreFromTrash, permanentlyDelete, clearTrash,
      addActivity, fmt,
      STAGES, STAGE_COLORS, STAGE_BG, TAGS: tags, CATEGORIES: categories, PERMISSION_GROUPS,
      darkMode, toggleDarkMode,
      currentPlan, setCurrentPlan,
      planExpiryDate, setPlanExpiryDate, planExpiryTimestamp, isPlanActive, planAlertBlink, triggerPlanBlink,
      showDonutWelcome, setShowDonutWelcome, hasSeenDonutWelcome,
      adminPassword, updateAdminPassword,
      dataLoaded, // Export data loading state
      dataLoadError, // Export data loading error state
      refreshData, // Export refresh function
      refreshRoles, refreshTags, refreshCategories, // ⭐ OPTIMIZATION: Individual refresh functions
      refreshTrigger, // Export refresh trigger for components to react to
      updateProfile: updateUserProfile, // Export updateProfile from userProfileService
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
