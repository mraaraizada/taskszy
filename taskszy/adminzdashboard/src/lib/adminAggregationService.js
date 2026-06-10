/**
 * Admin Dashboard Aggregation Service
 * 
 * Pre-computes statistics for the admin project dashboard
 * Reduces Firebase reads from 1000+ to 1 per dashboard load
 * 
 * AGGREGATION STRUCTURE:
 * adminStats/global {
 *   workspaces: { total, active, inactive, byPlan: {...} }
 *   users: { total, active }
 *   revenue: { total, monthly, byPlan: {...} }
 *   growth: { monthly: [...], yearly: [...] }
 *   lastUpdated: timestamp
 * }
 */

import { db } from './firebase';
import { doc, getDoc, setDoc, collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { FieldValue } from 'firebase/firestore';

/**
 * Subscribe to admin dashboard aggregation (real-time)
 * @param {Function} callback - Called with aggregation data
 * @returns {Promise<Function>} - Promise that resolves to unsubscribe function
 */
export async function subscribeToAdminAggregation(callback) {
  try {
    const { onSnapshot } = await import('firebase/firestore');
    
    const aggRef = doc(db, 'adminStats/global');
    
    const unsubscribe = onSnapshot(aggRef, (snap) => {
      if (snap.exists()) {

        callback(snap.data());
      } else {
        callback(null);
      }
    }, (error) => {
      // Silently handle permission errors - this is expected
      if (error.code === 'permission-denied') {

      } else {

      }
      callback(null);
    });
    
    return unsubscribe;
  } catch (error) {
    // Silently handle setup errors

    // Return a no-op function if setup fails
    return () => {};
  }
}

/**
 * Get admin dashboard aggregation (one-time)
 * @returns {Promise<Object|null>} - Aggregation data or null
 */
export async function getAdminAggregation() {
  try {
    const aggRef = doc(db, 'adminStats/global');
    const aggSnap = await getDoc(aggRef);
    
    if (aggSnap.exists()) {

      return aggSnap.data();
    }
    
    // Silently return null if not found
    return null;
  } catch (error) {
    // Silently handle permission errors - this is expected if adminStats collection doesn't exist
    if (error.code === 'permission-denied') {

    } else {

    }
    return null;
  }
}

/**
 * Rebuild admin dashboard aggregation from scratch
 * This should be called:
 * 1. Initially to create the aggregation
 * 2. Periodically (daily) via Cloud Function
 * 3. Manually when data seems out of sync
 */
export async function rebuildAdminAggregation() {

  try {
    // Load all workspaces
    const workspacesRef = collection(db, 'workspaces');
    const workspacesSnap = await getDocs(workspacesRef);

    const workspaces = [];
    const now = new Date();
    
    // Process each workspace
    for (const workspaceDoc of workspacesSnap.docs) {
      const workspaceData = workspaceDoc.data();
      const workspaceId = workspaceDoc.id;
      
      // Get team count (optimized - just count)
      let teamCount = 0;
      let activeTeamCount = 0;
      try {
        const teamRef = collection(db, `workspaces/${workspaceId}/team`);
        const teamSnap = await getDocs(teamRef);
        teamCount = teamSnap.size;
        
        teamSnap.forEach(doc => {
          const memberData = doc.data();
          if (memberData.status === 'Active') {
            activeTeamCount++;
          }
        });
      } catch (err) {

      }
      
      // Get tasks count (optimized)
      let tasksCount = 0;
      try {
        const { getCountFromServer } = await import('firebase/firestore');
        const tasksRef = collection(db, `workspaces/${workspaceId}/tasks`);
        const tasksCountSnap = await getCountFromServer(tasksRef);
        tasksCount = tasksCountSnap.data().count;
      } catch (err) {

      }
      
      const toDate = (dateValue) => {
        if (!dateValue) return null;
        if (typeof dateValue?.toDate === 'function') return dateValue.toDate();
        if (dateValue instanceof Date) return dateValue;
        if (typeof dateValue === 'string' || typeof dateValue === 'number') return new Date(dateValue);
        return null;
      };
      
      workspaces.push({
        id: workspaceId,
        plan: workspaceData.plan?.name || 'Free',
        isActive: workspaceData.plan?.isActive || false,
        status: workspaceData.plan?.isActive ? 'active' : 'inactive',
        createdAt: toDate(workspaceData.createdAt) || now,
        teamCount,
        activeTeamCount,
        tasksCount,
        ownerId: workspaceData.ownerId
      });
      
      // ⭐ UPDATE: Write team counts back to workspace document for admin dashboard
      try {
        await setDoc(doc(db, 'workspaces', workspaceId), {
          teamCount,
          activeTeamCount,
          tasksCount
        }, { merge: true });
      } catch (err) {

      }
    }
    
    // Calculate workspace stats
    const workspaceStats = {
      total: workspaces.length,
      active: workspaces.filter(w => w.isActive).length,
      inactive: workspaces.filter(w => !w.isActive).length,
      byPlan: {
        Starter: workspaces.filter(w => w.plan === 'Starter' && w.isActive).length,
        Professional: workspaces.filter(w => w.plan === 'Professional' && w.isActive).length,
        Business: workspaces.filter(w => w.plan === 'Business' && w.isActive).length,
        Enterprise: workspaces.filter(w => w.plan === 'Enterprise' && w.isActive).length,
        Free: workspaces.filter(w => w.plan === 'Free').length,
      }
    };
    
    // Calculate user stats
    const usersRef = collection(db, 'users');
    const usersSnap = await getDocs(usersRef);
    const userStats = {
      total: usersSnap.size,
      active: usersSnap.docs.filter(d => d.data().status === 'Active').length
    };
    
    // Calculate growth data (last 6 months)
    const monthlyGrowth = [];
    for (let i = 5; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = month.toLocaleDateString('en-US', { month: 'short' });
      const count = workspaces.filter(w => {
        const createdDate = w.createdAt;
        return createdDate.getMonth() === month.getMonth() && 
               createdDate.getFullYear() === month.getFullYear();
      }).length;
      monthlyGrowth.push({ month: monthName, count });
    }
    
    // Calculate yearly growth (last 3 years)
    const yearlyGrowth = [];
    for (let i = 2; i >= 0; i--) {
      const year = now.getFullYear() - i;
      const count = workspaces.filter(w => w.createdAt.getFullYear() === year).length;
      yearlyGrowth.push({ year: year.toString(), count });
    }
    
    // Calculate revenue (mock - would need payment data)
    const revenueStats = {
      total: 0,
      monthly: 0,
      byPlan: {
        Starter: 0,
        Professional: 0,
        Business: 0,
        Enterprise: 0
      }
    };
    
    // Build aggregation document
    const aggregation = {
      workspaces: workspaceStats,
      users: userStats,
      revenue: revenueStats,
      growth: {
        monthly: monthlyGrowth,
        yearly: yearlyGrowth
      },
      lastUpdated: new Date(),
      rebuiltAt: new Date()
    };
    
    // Save to Firestore
    const aggRef = doc(db, 'adminStats/global');
    await setDoc(aggRef, aggregation);

    return aggregation;
  } catch (error) {

    throw error;
  }
}

/**
 * Get admin aggregation with fallback to full query
 * @returns {Promise<Object>} - Aggregation data
 */
export async function getAdminAggregationWithFallback() {
  // Try to get aggregation first
  const aggregation = await getAdminAggregation();
  
  if (aggregation) {

    return aggregation;
  }
  
  // Fallback: Use optimized organization service to calculate stats from cache

  try {
    const { getOrganizationStatsOptimized } = await import('./optimizedOrganizationService');
    const stats = await getOrganizationStatsOptimized();
    
    // Return in aggregation format
    return {
      workspaces: stats,
      users: { total: 0, active: 0 },
      revenue: { total: 0, monthly: 0, byPlan: {} },
      growth: { monthly: [], yearly: [] },
      lastUpdated: new Date(),
      calculatedFromCache: true
    };
  } catch (error) {

    // Return empty stats
    return {
      workspaces: { total: 0, active: 0, inactive: 0, byPlan: {} },
      users: { total: 0, active: 0 },
      revenue: { total: 0, monthly: 0, byPlan: {} },
      growth: { monthly: [], yearly: [] },
      lastUpdated: new Date(),
      error: true
    };
  }
}
