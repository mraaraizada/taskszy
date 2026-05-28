/**
 * Admin Dashboard Aggregation Triggers (Firebase Cloud Functions v2)
 * 
 * Automatically update admin dashboard aggregations when workspaces change
 * This keeps admin stats up-to-date without expensive client-side queries
 */

const { onDocumentCreated, onDocumentUpdated, onDocumentDeleted } = require('firebase-functions/v2/firestore');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

const db = getFirestore();

// ── Workspace Aggregation Triggers ────────────────────────────────────────────

/**
 * Update admin aggregation when workspace is created
 */
exports.onWorkspaceCreate = onDocumentCreated('workspaces/{workspaceId}', async (event) => {
  const { workspaceId } = event.params;
  const workspaceData = event.data.data();
  
  console.log('📊 Workspace created, updating admin aggregation:', workspaceId);
  
  const aggRef = db.doc('adminStats/global');
  const plan = workspaceData.plan?.name || 'Free';
  const isActive = workspaceData.plan?.isActive || false;
  
  try {
    await aggRef.set({
      workspaces: {
        total: FieldValue.increment(1),
        active: isActive ? FieldValue.increment(1) : FieldValue.increment(0),
        inactive: !isActive ? FieldValue.increment(1) : FieldValue.increment(0),
        byPlan: {
          [plan]: FieldValue.increment(isActive ? 1 : 0)
        }
      },
      lastUpdated: FieldValue.serverTimestamp()
    }, { merge: true });
    
    console.log('✅ Admin aggregation updated');
  } catch (error) {
    console.error('❌ Failed to update admin aggregation:', error);
  }
});

/**
 * Update admin aggregation when workspace is updated
 */
exports.onWorkspaceUpdate = onDocumentUpdated('workspaces/{workspaceId}', async (event) => {
  const { workspaceId } = event.params;
  const before = event.data.before.data();
  const after = event.data.after.data();
  
  const beforePlan = before.plan?.name || 'Free';
  const afterPlan = after.plan?.name || 'Free';
  const beforeActive = before.plan?.isActive || false;
  const afterActive = after.plan?.isActive || false;
  
  // Check if plan or status changed
  if (beforePlan !== afterPlan || beforeActive !== afterActive) {
    console.log('📊 Workspace plan/status changed:', {
      workspaceId,
      beforePlan,
      afterPlan,
      beforeActive,
      afterActive
    });
    
    const aggRef = db.doc('adminStats/global');
    const updates = {
      lastUpdated: FieldValue.serverTimestamp()
    };
    
    // Update active/inactive counts
    if (beforeActive !== afterActive) {
      if (afterActive) {
        updates['workspaces.active'] = FieldValue.increment(1);
        updates['workspaces.inactive'] = FieldValue.increment(-1);
      } else {
        updates['workspaces.active'] = FieldValue.increment(-1);
        updates['workspaces.inactive'] = FieldValue.increment(1);
      }
    }
    
    // Update plan counts
    if (beforePlan !== afterPlan) {
      // Decrement old plan (only if was active)
      if (beforeActive) {
        updates[`workspaces.byPlan.${beforePlan}`] = FieldValue.increment(-1);
      }
      // Increment new plan (only if is active)
      if (afterActive) {
        updates[`workspaces.byPlan.${afterPlan}`] = FieldValue.increment(1);
      }
    } else if (beforeActive !== afterActive) {
      // Same plan, but status changed
      if (afterActive) {
        updates[`workspaces.byPlan.${afterPlan}`] = FieldValue.increment(1);
      } else {
        updates[`workspaces.byPlan.${afterPlan}`] = FieldValue.increment(-1);
      }
    }
    
    try {
      await aggRef.update(updates);
      console.log('✅ Admin aggregation updated');
    } catch (error) {
      console.error('❌ Failed to update admin aggregation:', error);
    }
  }
});

/**
 * Update admin aggregation when workspace is deleted
 */
exports.onWorkspaceDelete = onDocumentDeleted('workspaces/{workspaceId}', async (event) => {
  const { workspaceId } = event.params;
  const workspaceData = event.data.data();
  
  console.log('📊 Workspace deleted, updating admin aggregation:', workspaceId);
  
  const aggRef = db.doc('adminStats/global');
  const plan = workspaceData.plan?.name || 'Free';
  const isActive = workspaceData.plan?.isActive || false;
  
  try {
    const updates = {
      'workspaces.total': FieldValue.increment(-1),
      lastUpdated: FieldValue.serverTimestamp()
    };
    
    if (isActive) {
      updates['workspaces.active'] = FieldValue.increment(-1);
      updates[`workspaces.byPlan.${plan}`] = FieldValue.increment(-1);
    } else {
      updates['workspaces.inactive'] = FieldValue.increment(-1);
    }
    
    await aggRef.update(updates);
    console.log('✅ Admin aggregation updated');
  } catch (error) {
    console.error('❌ Failed to update admin aggregation:', error);
  }
});

// ── User Aggregation Triggers ─────────────────────────────────────────────────

/**
 * Update admin aggregation when user is created
 */
exports.onUserCreate = onDocumentCreated('users/{userId}', async (event) => {
  const { userId } = event.params;
  const userData = event.data.data();
  
  console.log('📊 User created, updating admin aggregation:', userId);
  
  const aggRef = db.doc('adminStats/global');
  const isActive = userData.status === 'Active';
  
  try {
    await aggRef.set({
      users: {
        total: FieldValue.increment(1),
        active: isActive ? FieldValue.increment(1) : FieldValue.increment(0)
      },
      lastUpdated: FieldValue.serverTimestamp()
    }, { merge: true });
    
    console.log('✅ Admin aggregation updated');
  } catch (error) {
    console.error('❌ Failed to update admin aggregation:', error);
  }
});

/**
 * Update admin aggregation when user is updated
 */
exports.onUserUpdate = onDocumentUpdated('users/{userId}', async (event) => {
  const { userId } = event.params;
  const before = event.data.before.data();
  const after = event.data.after.data();
  
  const beforeActive = before.status === 'Active';
  const afterActive = after.status === 'Active';
  
  // Check if status changed
  if (beforeActive !== afterActive) {
    console.log('📊 User status changed:', { userId, beforeActive, afterActive });
    
    const aggRef = db.doc('adminStats/global');
    
    try {
      const updates = {
        lastUpdated: FieldValue.serverTimestamp()
      };
      
      if (afterActive) {
        updates['users.active'] = FieldValue.increment(1);
      } else {
        updates['users.active'] = FieldValue.increment(-1);
      }
      
      await aggRef.update(updates);
      console.log('✅ Admin aggregation updated');
    } catch (error) {
      console.error('❌ Failed to update admin aggregation:', error);
    }
  }
});

/**
 * Update admin aggregation when user is deleted
 */
exports.onUserDelete = onDocumentDeleted('users/{userId}', async (event) => {
  const { userId } = event.params;
  const userData = event.data.data();
  
  console.log('📊 User deleted, updating admin aggregation:', userId);
  
  const aggRef = db.doc('adminStats/global');
  const isActive = userData.status === 'Active';
  
  try {
    const updates = {
      'users.total': FieldValue.increment(-1),
      lastUpdated: FieldValue.serverTimestamp()
    };
    
    if (isActive) {
      updates['users.active'] = FieldValue.increment(-1);
    }
    
    await aggRef.update(updates);
    console.log('✅ Admin aggregation updated');
  } catch (error) {
    console.error('❌ Failed to update admin aggregation:', error);
  }
});

// ── Scheduled Aggregation Rebuild ─────────────────────────────────────────────

/**
 * Rebuild admin aggregation daily (safety net for drift)
 * Runs at 3 AM UTC every day
 */
exports.rebuildAdminAggregationDaily = onSchedule('0 3 * * *', async (event) => {
  console.log('📊 Starting daily admin aggregation rebuild...');
  
  try {
    // Get all workspaces
    const workspacesSnap = await db.collection('workspaces').get();
    console.log(`📊 Found ${workspacesSnap.size} workspaces`);
    
    const workspaces = workspacesSnap.docs.map(doc => doc.data());
    
    // Calculate workspace stats
    const workspaceStats = {
      total: workspaces.length,
      active: workspaces.filter(w => w.plan?.isActive).length,
      inactive: workspaces.filter(w => !w.plan?.isActive).length,
      byPlan: {
        Starter: workspaces.filter(w => w.plan?.name === 'Starter' && w.plan?.isActive).length,
        Professional: workspaces.filter(w => w.plan?.name === 'Professional' && w.plan?.isActive).length,
        Business: workspaces.filter(w => w.plan?.name === 'Business' && w.plan?.isActive).length,
        Enterprise: workspaces.filter(w => w.plan?.name === 'Enterprise' && w.plan?.isActive).length,
        Free: workspaces.filter(w => (w.plan?.name === 'Free' || !w.plan?.name)).length,
      }
    };
    
    // Get all users
    const usersSnap = await db.collection('users').get();
    const users = usersSnap.docs.map(doc => doc.data());
    
    const userStats = {
      total: users.length,
      active: users.filter(u => u.status === 'Active').length
    };
    
    // Calculate growth data (last 6 months)
    const now = new Date();
    const monthlyGrowth = [];
    for (let i = 5; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = month.toLocaleDateString('en-US', { month: 'short' });
      
      const count = workspaces.filter(w => {
        const createdAt = w.createdAt?.toDate ? w.createdAt.toDate() : new Date(w.createdAt);
        return createdAt.getMonth() === month.getMonth() && 
               createdAt.getFullYear() === month.getFullYear();
      }).length;
      
      monthlyGrowth.push({ month: monthName, count });
    }
    
    // Calculate yearly growth (last 3 years)
    const yearlyGrowth = [];
    for (let i = 2; i >= 0; i--) {
      const year = now.getFullYear() - i;
      const count = workspaces.filter(w => {
        const createdAt = w.createdAt?.toDate ? w.createdAt.toDate() : new Date(w.createdAt);
        return createdAt.getFullYear() === year;
      }).length;
      yearlyGrowth.push({ year: year.toString(), count });
    }
    
    // Write aggregation
    await db.doc('adminStats/global').set({
      workspaces: workspaceStats,
      users: userStats,
      revenue: {
        total: 0,
        monthly: 0,
        byPlan: {
          Starter: 0,
          Professional: 0,
          Business: 0,
          Enterprise: 0
        }
      },
      growth: {
        monthly: monthlyGrowth,
        yearly: yearlyGrowth
      },
      lastUpdated: FieldValue.serverTimestamp(),
      rebuiltAt: FieldValue.serverTimestamp()
    });
    
    console.log('✅ Daily admin aggregation rebuild complete');
  } catch (error) {
    console.error('❌ Daily admin aggregation rebuild failed:', error);
  }
});
