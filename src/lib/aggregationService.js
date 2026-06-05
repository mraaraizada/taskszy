/**
 * Aggregation Service
 * 
 * Creates and maintains aggregation documents to reduce dashboard reads
 * Instead of reading 1000+ documents, read 1 aggregation document
 * 
 * GOAL: Reduce dashboard reads by 95%+
 */

import { doc, setDoc, getDoc, onSnapshot, serverTimestamp, increment, writeBatch } from 'firebase/firestore';
import { db } from './firebase';

// ── Aggregation Document Structure ────────────────────────────────────────────
/**
 * workspaces/{workspaceId}/aggregations/dashboard
 * {
 *   tasks: {
 *     total: 150,
 *     completed: 45,
 *     active: 80,
 *     pending: 25,
 *     byStage: { New: 10, Start: 20, ... }
 *   },
 *   team: {
 *     total: 25,
 *     active: 23,
 *     inactive: 2,
 *     byRole: { Admin: 2, Management: 5, Member: 18 }
 *   },
 *   financials: {
 *     totalBudget: 50000,
 *     totalPaid: 35000,
 *     totalPending: 15000,
 *     paymentsCount: 120
 *   },
 *   activity: {
 *     last7Days: 45,
 *     last30Days: 180,
 *     recentTypes: { complete: 15, payment: 10, update: 20 }
 *   },
 *   lastUpdated: Timestamp
 * }
 */

// ── Create/Update Dashboard Aggregation ───────────────────────────────────────
/**
 * Rebuild dashboard aggregation from scratch
 * Call this when initializing or after major data changes
 */
export async function rebuildDashboardAggregation(workspaceId, tasks, team, payments, activity) {
  try {

    // Calculate task stats
    const taskStats = {
      total: tasks.length,
      completed: tasks.filter(t => t.stage === 'Complete').length,
      active: tasks.filter(t => t.stage !== 'Complete' && new Date(t.extendedDeadline || t.deadline) >= new Date()).length,
      pending: tasks.filter(t => t.stage !== 'Complete' && new Date(t.extendedDeadline || t.deadline) < new Date()).length,
      byStage: {}
    };
    
    // Count by stage
    tasks.forEach(t => {
      taskStats.byStage[t.stage] = (taskStats.byStage[t.stage] || 0) + 1;
    });
    
    // Calculate team stats
    const teamStats = {
      total: team.length,
      active: team.filter(m => m.status === 'Active').length,
      inactive: team.filter(m => m.status !== 'Active').length,
      byRole: {}
    };
    
    // Count by role
    team.forEach(m => {
      teamStats.byRole[m.role] = (teamStats.byRole[m.role] || 0) + 1;
    });
    
    // Calculate financial stats
    const financialStats = {
      totalBudget: tasks.reduce((sum, t) => sum + (t.totalBudget || 0), 0),
      totalPaid: payments.reduce((sum, p) => sum + (p.paidAmount || 0), 0),
      totalPending: payments.reduce((sum, p) => sum + ((p.amount || 0) - (p.paidAmount || 0)), 0),
      paymentsCount: payments.length
    };
    
    // Calculate activity stats
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const activityStats = {
      last7Days: activity.filter(a => {
        const activityDate = a.time?.toDate ? a.time.toDate() : new Date(a.time);
        return activityDate >= sevenDaysAgo;
      }).length,
      last30Days: activity.filter(a => {
        const activityDate = a.time?.toDate ? a.time.toDate() : new Date(a.time);
        return activityDate >= thirtyDaysAgo;
      }).length,
      recentTypes: {}
    };
    
    // Count recent activity by type
    activity.filter(a => {
      const activityDate = a.time?.toDate ? a.time.toDate() : new Date(a.time);
      return activityDate >= sevenDaysAgo;
    }).forEach(a => {
      activityStats.recentTypes[a.type] = (activityStats.recentTypes[a.type] || 0) + 1;
    });
    
    // Write aggregation document
    const aggRef = doc(db, `workspaces/${workspaceId}/aggregations/dashboard`);
    await setDoc(aggRef, {
      tasks: taskStats,
      team: teamStats,
      financials: financialStats,
      activity: activityStats,
      lastUpdated: serverTimestamp()
    });

    return true;
  } catch (error) {

    return false;
  }
}

// ── Incremental Updates ───────────────────────────────────────────────────────
/**
 * Update task count when task is created/deleted/completed
 */
export async function updateTaskAggregation(workspaceId, operation, taskData) {
  try {
    const aggRef = doc(db, `workspaces/${workspaceId}/aggregations/dashboard`);
    const batch = writeBatch(db);
    
    if (operation === 'create') {
      batch.update(aggRef, {
        'tasks.total': increment(1),
        'tasks.active': increment(1),
        [`tasks.byStage.${taskData.stage}`]: increment(1),
        lastUpdated: serverTimestamp()
      });
    } else if (operation === 'delete') {
      batch.update(aggRef, {
        'tasks.total': increment(-1),
        [`tasks.byStage.${taskData.stage}`]: increment(-1),
        lastUpdated: serverTimestamp()
      });
    } else if (operation === 'complete') {
      batch.update(aggRef, {
        'tasks.completed': increment(1),
        'tasks.active': increment(-1),
        [`tasks.byStage.${taskData.oldStage}`]: increment(-1),
        'tasks.byStage.Complete': increment(1),
        lastUpdated: serverTimestamp()
      });
    }
    
    await batch.commit();

  } catch (error) {

  }
}

/**
 * Update team count when member is added/removed/deactivated
 */
export async function updateTeamAggregation(workspaceId, operation, memberData) {
  try {
    const aggRef = doc(db, `workspaces/${workspaceId}/aggregations/dashboard`);
    const batch = writeBatch(db);
    
    if (operation === 'add') {
      batch.update(aggRef, {
        'team.total': increment(1),
        'team.active': increment(1),
        [`team.byRole.${memberData.role}`]: increment(1),
        lastUpdated: serverTimestamp()
      });
    } else if (operation === 'remove') {
      batch.update(aggRef, {
        'team.total': increment(-1),
        [`team.byRole.${memberData.role}`]: increment(-1),
        lastUpdated: serverTimestamp()
      });
    } else if (operation === 'deactivate') {
      batch.update(aggRef, {
        'team.active': increment(-1),
        'team.inactive': increment(1),
        lastUpdated: serverTimestamp()
      });
    }
    
    await batch.commit();

  } catch (error) {

  }
}

// ── Read Dashboard Aggregation ────────────────────────────────────────────────
/**
 * Get dashboard stats from aggregation document
 * Returns cached stats instead of reading 1000+ documents
 */
export async function getDashboardAggregation(workspaceId) {
  try {
    const aggRef = doc(db, `workspaces/${workspaceId}/aggregations/dashboard`);
    const aggSnap = await getDoc(aggRef);
    
    if (aggSnap.exists()) {

      return aggSnap.data();
    }

    return null;
  } catch (error) {

    return null;
  }
}

/**
 * Subscribe to dashboard aggregation changes
 * Real-time updates with only 1 listener instead of 4+
 */
export function subscribeToDashboardAggregation(workspaceId, callback) {
  const aggRef = doc(db, `workspaces/${workspaceId}/aggregations/dashboard`);

  return onSnapshot(aggRef, (snap) => {
    if (snap.exists()) {

      callback(snap.data());
    } else {

      callback(null);
    }
  }, (error) => {

    callback(null);
  });
}

// ── Member-Specific Aggregations ──────────────────────────────────────────────
/**
 * Create member-specific dashboard stats
 * Reduces member dashboard reads by 90%+
 */
export async function rebuildMemberAggregation(workspaceId, memberId, tasks, payments) {
  try {

    // Filter tasks for this member
    const memberTasks = tasks.filter(t => 
      t.members?.some(m => String(m.id) === String(memberId))
    );
    
    // Calculate member task stats
    const taskStats = {
      total: memberTasks.length,
      completed: memberTasks.filter(t => t.stage === 'Complete').length,
      active: memberTasks.filter(t => t.stage !== 'Complete' && new Date(t.extendedDeadline || t.deadline) >= new Date()).length,
      pending: memberTasks.filter(t => t.stage !== 'Complete' && new Date(t.extendedDeadline || t.deadline) < new Date()).length,
      myStages: {}
    };
    
    // Count by member's stage in each task
    memberTasks.forEach(t => {
      const memberData = t.members.find(m => String(m.id) === String(memberId));
      if (memberData?.stage) {
        taskStats.myStages[memberData.stage] = (taskStats.myStages[memberData.stage] || 0) + 1;
      }
    });
    
    // Calculate member payment stats
    const memberPayments = payments.filter(p => String(p.memberId) === String(memberId));
    const paymentStats = {
      total: memberPayments.reduce((sum, p) => sum + (p.amount || 0), 0),
      paid: memberPayments.reduce((sum, p) => sum + (p.paidAmount || 0), 0),
      pending: memberPayments.reduce((sum, p) => sum + ((p.amount || 0) - (p.paidAmount || 0)), 0),
      count: memberPayments.length
    };
    
    // Write member aggregation
    const aggRef = doc(db, `workspaces/${workspaceId}/memberAggregations/${memberId}`);
    await setDoc(aggRef, {
      tasks: taskStats,
      payments: paymentStats,
      lastUpdated: serverTimestamp()
    });

    return true;
  } catch (error) {

    return false;
  }
}

/**
 * Get member dashboard stats
 */
export async function getMemberAggregation(workspaceId, memberId) {
  try {
    const aggRef = doc(db, `workspaces/${workspaceId}/memberAggregations/${memberId}`);
    const aggSnap = await getDoc(aggRef);
    
    if (aggSnap.exists()) {

      return aggSnap.data();
    }

    return null;
  } catch (error) {

    return null;
  }
}

/**
 * Subscribe to member aggregation changes
 */
export function subscribeToMemberAggregation(workspaceId, memberId, callback) {
  const aggRef = doc(db, `workspaces/${workspaceId}/memberAggregations/${memberId}`);

  return onSnapshot(aggRef, (snap) => {
    if (snap.exists()) {

      callback(snap.data());
    } else {

      callback(null);
    }
  }, (error) => {

    callback(null);
  });
}

export default {
  rebuildDashboardAggregation,
  updateTaskAggregation,
  updateTeamAggregation,
  getDashboardAggregation,
  subscribeToDashboardAggregation,
  rebuildMemberAggregation,
  getMemberAggregation,
  subscribeToMemberAggregation
};
