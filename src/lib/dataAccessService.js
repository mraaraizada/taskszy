/**
 * Data Access Service
 * Implements role-based data access to reduce Firebase reads
 * 
 * PRINCIPLE: Users should only load data they need to see
 */

import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from './firebase';

// ── Access Levels ──────────────────────────────────────────────────────────────
export const DATA_ACCESS_LEVELS = {
  MEMBER: 'member',      // Limited access - own data only
  MANAGER: 'manager',    // Team access - team data
  ADMIN: 'admin'         // Full access - all data
};

/**
 * Determine user's access level based on their role
 * @param {Object} user - Current user object
 * @returns {string} Access level (member, manager, or admin)
 */
export function getUserAccessLevel(user) {
  if (!user) return DATA_ACCESS_LEVELS.MEMBER;
  
  console.log('🔐 Determining access level:', {
    userRole: user.userRole,
    role: user.role,
    memberId: user.memberId,
    uid: user.uid
  });
  
  // Priority 1: Check userRole (set during login from Firestore profile)
  if (user.userRole === 'admin') {
    console.log('🔐 Access level: ADMIN (from userRole)');
    return DATA_ACCESS_LEVELS.ADMIN;
  }
  if (user.userRole === 'management') {
    console.log('🔐 Access level: MANAGER (from userRole)');
    return DATA_ACCESS_LEVELS.MANAGER;
  }
  
  // Priority 2: Check role field (from team collection or Firestore profile)
  // This handles cases where userRole isn't set yet but role is available
  if (user.role === 'admin') {
    console.log('🔐 Access level: ADMIN (from role field)');
    return DATA_ACCESS_LEVELS.ADMIN;
  }
  if (user.role === 'management') {
    console.log('🔐 Access level: MANAGER (from role field)');
    return DATA_ACCESS_LEVELS.MANAGER;
  }
  
  // Fallback: Check for string matches (for backward compatibility)
  const role = user.userRole?.toLowerCase() || user.role?.toLowerCase() || '';
  
  if (role.includes('admin') || role.includes('owner')) {
    console.log('🔐 Access level: ADMIN (from string match)');
    return DATA_ACCESS_LEVELS.ADMIN;
  }
  
  if (role.includes('management') || role.includes('manager') || role.includes('lead')) {
    console.log('🔐 Access level: MANAGER (from string match)');
    return DATA_ACCESS_LEVELS.MANAGER;
  }
  
  console.log('🔐 Access level: MEMBER (default)');
  return DATA_ACCESS_LEVELS.MEMBER;
}

/**
 * Get optimized tasks query based on user access level
 * @param {string} workspaceId - Workspace ID
 * @param {string} userId - Current user ID
 * @param {string} accessLevel - User's access level
 * @param {Object} options - Additional query options
 * @returns {Query} Firestore query
 */
export function getTasksQuery(workspaceId, userId, accessLevel, options = {}) {
  const tasksRef = collection(db, `workspaces/${workspaceId}/tasks`);
  
  // ⭐ OPTIMIZATION: Aggressive limit reduction - load only recent tasks
  // Dashboard should use aggregations, not full task list
  const taskLimit = options.limit || 50; // Reduced from 100 to 50
  
  console.log('📊 Creating tasks query:', { workspaceId, userId, accessLevel, limit: taskLimit });
  
  switch(accessLevel) {
    case DATA_ACCESS_LEVELS.MEMBER:
      // Members: Only tasks where they are in the memberIds array
      if (userId && options.useServerFiltering) {
        console.log('👤 Member access: Loading tasks with SERVER-SIDE filtering (limit:', taskLimit, ')');
        // This requires Firestore composite index:
        // Collection: tasks, Fields: memberIds (Array), createdDate (Descending)
        return query(
          tasksRef,
          where('memberIds', 'array-contains', userId),
          orderBy('createdDate', 'desc'),
          limit(taskLimit)
        );
      }
      // Fallback to client-side filtering
      console.log('👤 Member access: Loading tasks (limit:', taskLimit, ') - will filter client-side');
      return query(tasksRef, orderBy('createdDate', 'desc'), limit(taskLimit));
      
    case DATA_ACCESS_LEVELS.MANAGER:
      // Managers: Tasks created by management OR tasks where they are assigned
      // Since Firestore doesn't support OR queries, we load all tasks and filter client-side
      // OR we can use two separate queries and merge results
      console.log('👔 Manager access: Loading tasks (limit:', taskLimit, ') - will filter client-side for management tasks');
      return query(tasksRef, orderBy('createdDate', 'desc'), limit(taskLimit));
      
    case DATA_ACCESS_LEVELS.ADMIN:
      // Admins: All tasks
      console.log('👑 Admin access: Loading tasks (limit:', taskLimit, ')');
      return query(tasksRef, orderBy('createdDate', 'desc'), limit(taskLimit));
      
    default:
      console.warn('⚠️ Unknown access level, defaulting to all tasks (limit:', taskLimit, ')');
      return query(tasksRef, orderBy('createdDate', 'desc'), limit(taskLimit));
  }
}

/**
 * Get optimized team query based on user access level
 * @param {string} workspaceId - Workspace ID
 * @param {string} userId - Current user ID (memberId)
 * @param {string} accessLevel - User's access level
 * @param {Object} options - Additional query options
 * @returns {Query} Firestore query
 */
export function getTeamQuery(workspaceId, userId, accessLevel, options = {}) {
  const teamRef = collection(db, `workspaces/${workspaceId}/team`);
  
  console.log('📊 Creating team query:', { workspaceId, userId, accessLevel });
  
  switch(accessLevel) {
    case DATA_ACCESS_LEVELS.MEMBER:
      // Members: Only load essential team members
      // For now, load all (but in future, could limit to managers + self)
      console.log('👤 Member access: Loading essential team members');
      // TODO: Optimize to load only relevant members
      // For now, return all to maintain functionality
      return query(teamRef, orderBy('name'));
      
    case DATA_ACCESS_LEVELS.MANAGER:
      // Managers: Their team members
      if (options.teamId) {
        console.log('👔 Manager access: Loading team members');
        return query(
          teamRef,
          where('teamId', '==', options.teamId),
          orderBy('name')
        );
      }
      // Fallback to all members
      console.log('👔 Manager access: Loading all members (no teamId)');
      return query(teamRef, orderBy('name'));
      
    case DATA_ACCESS_LEVELS.ADMIN:
      // Admins: All team members
      console.log('👑 Admin access: Loading all team members');
      return query(teamRef, orderBy('name'));
      
    default:
      console.warn('⚠️ Unknown access level, defaulting to all members');
      return query(teamRef, orderBy('name'));
  }
}

/**
 * Get optimized activity query based on user access level
 * @param {string} workspaceId - Workspace ID
 * @param {string} userId - Current user ID
 * @param {string} accessLevel - User's access level
 * @param {number} limitCount - Number of activities to load
 * @returns {Query} Firestore query
 */
export function getActivityQuery(workspaceId, userId, accessLevel, limitCount = 15) {
  const activityRef = collection(db, `workspaces/${workspaceId}/activity`);
  
  // ⭐ OPTIMIZATION: Reduced from 20 to 15 - most users only see recent activity
  console.log('📊 Creating activity query:', { workspaceId, userId, accessLevel, limitCount });
  
  switch(accessLevel) {
    case DATA_ACCESS_LEVELS.MEMBER:
      // Members: For now, load all activities (filtering not yet implemented)
      // TODO: Implement proper activity filtering by user
      console.log('👤 Member access: Loading all activities (filtering not yet implemented)');
      return query(
        activityRef,
        orderBy('time', 'desc'),
        limit(limitCount)
      );
      
    case DATA_ACCESS_LEVELS.MANAGER:
    case DATA_ACCESS_LEVELS.ADMIN:
      // Managers & Admins: All activities
      console.log('👔👑 Manager/Admin access: Loading all activities');
      return query(
        activityRef,
        orderBy('time', 'desc'),
        limit(limitCount)
      );
      
    default:
      console.warn('⚠️ Unknown access level, defaulting to all activities');
      return query(
        activityRef,
        orderBy('time', 'desc'),
        limit(limitCount)
      );
  }
}

/**
 * Check if user should have access to specific data
 * @param {string} accessLevel - User's access level
 * @param {string} dataType - Type of data (tasks, team, financials, etc.)
 * @returns {boolean} Whether user has access
 */
export function hasDataAccess(accessLevel, dataType) {
  const accessMatrix = {
    [DATA_ACCESS_LEVELS.MEMBER]: {
      tasks: 'assigned',      // Only assigned tasks
      team: 'limited',        // Limited team view
      financials: 'own',      // Only own payments
      activity: 'own',        // Only own activity
      roles: 'view',          // Can view roles
      broadcasts: 'all',      // All broadcasts
    },
    [DATA_ACCESS_LEVELS.MANAGER]: {
      tasks: 'team',          // Team tasks
      team: 'team',           // Team members
      financials: 'team',     // Team payments
      activity: 'team',       // Team activity
      roles: 'view',          // Can view roles
      broadcasts: 'all',      // All broadcasts
    },
    [DATA_ACCESS_LEVELS.ADMIN]: {
      tasks: 'all',           // All tasks
      team: 'all',            // All members
      financials: 'all',      // All payments
      activity: 'all',        // All activity
      roles: 'manage',        // Can manage roles
      broadcasts: 'manage',   // Can manage broadcasts
    }
  };
  
  return accessMatrix[accessLevel]?.[dataType] || 'none';
}

/**
 * Get data access summary for logging/debugging
 * @param {string} accessLevel - User's access level
 * @returns {Object} Access summary
 */
export function getAccessSummary(accessLevel) {
  return {
    level: accessLevel,
    tasks: hasDataAccess(accessLevel, 'tasks'),
    team: hasDataAccess(accessLevel, 'team'),
    financials: hasDataAccess(accessLevel, 'financials'),
    activity: hasDataAccess(accessLevel, 'activity'),
    roles: hasDataAccess(accessLevel, 'roles'),
    broadcasts: hasDataAccess(accessLevel, 'broadcasts'),
  };
}

/**
 * Log data access for monitoring
 * @param {string} userId - User ID
 * @param {string} accessLevel - Access level
 * @param {string} operation - Operation performed
 * @param {Object} metadata - Additional metadata
 */
export function logDataAccess(userId, accessLevel, operation, metadata = {}) {
  console.log('📊 Data Access Log:', {
    timestamp: new Date().toISOString(),
    userId,
    accessLevel,
    operation,
    ...metadata
  });
  
  // TODO: Send to analytics service for monitoring
  // This helps track Firebase usage and optimize further
}

/**
 * Estimate read count for a query
 * @param {string} accessLevel - User's access level
 * @param {string} dataType - Type of data
 * @param {number} documentCount - Estimated document count
 * @returns {number} Estimated reads
 */
export function estimateReadCount(accessLevel, dataType, documentCount) {
  const reductionFactors = {
    [DATA_ACCESS_LEVELS.MEMBER]: {
      tasks: 0.1,      // 10% of all tasks (only assigned)
      team: 1.0,       // All team members (for now)
      activity: 0.05,  // 5% of activity (only own)
    },
    [DATA_ACCESS_LEVELS.MANAGER]: {
      tasks: 0.3,      // 30% of tasks (team tasks)
      team: 0.3,       // 30% of team (team members)
      activity: 0.3,   // 30% of activity (team activity)
    },
    [DATA_ACCESS_LEVELS.ADMIN]: {
      tasks: 1.0,      // 100% of tasks
      team: 1.0,       // 100% of team
      activity: 1.0,   // 100% of activity
    }
  };
  
  const factor = reductionFactors[accessLevel]?.[dataType] || 1.0;
  return Math.ceil(documentCount * factor);
}

export default {
  DATA_ACCESS_LEVELS,
  getUserAccessLevel,
  getTasksQuery,
  getTeamQuery,
  getActivityQuery,
  hasDataAccess,
  getAccessSummary,
  logDataAccess,
  estimateReadCount,
};
