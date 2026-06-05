/**
 * Aggregation Triggers (Firebase Cloud Functions v2)
 * 
 * Automatically update aggregation documents when data changes
 * This keeps dashboard stats up-to-date without client-side recalculation
 * 
 * DEPLOYMENT:
 * 1. Add to functions/index.js:
 *    exports.updateTaskAggregation = require('./aggregationTriggers').updateTaskAggregation;
 *    exports.updateTeamAggregation = require('./aggregationTriggers').updateTeamAggregation;
 *    exports.updatePaymentAggregation = require('./aggregationTriggers').updatePaymentAggregation;
 * 
 * 2. Deploy: firebase deploy --only functions
 */

const { onDocumentCreated, onDocumentUpdated, onDocumentDeleted } = require('firebase-functions/v2/firestore');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const admin = require('firebase-admin');

// Initialize admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = getFirestore();

// ── Task Aggregation Triggers ─────────────────────────────────────────────────

/**
 * Update dashboard aggregation when task is created
 */
exports.onTaskCreate = onDocumentCreated('workspaces/{workspaceId}/tasks/{taskId}', async (event) => {
  const { workspaceId } = event.params;
  const taskData = event.data.data();
  
  console.log('📊 Task created, updating aggregation:', { workspaceId, taskId: event.data.id });
  
  const aggRef = db.doc(`workspaces/${workspaceId}/aggregations/dashboard`);
  
  try {
    await aggRef.set({
      tasks: {
        total: FieldValue.increment(1),
        active: FieldValue.increment(1),
        byStage: {
          [taskData.stage || 'New']: FieldValue.increment(1)
        }
      },
      lastUpdated: FieldValue.serverTimestamp()
    }, { merge: true });
    
    console.log('✅ Task aggregation updated');
  } catch (error) {
    console.error('❌ Failed to update task aggregation:', error);
  }
});

/**
 * Update dashboard aggregation when task is updated
 */
exports.onTaskUpdate = onDocumentUpdated('workspaces/{workspaceId}/tasks/{taskId}', async (event) => {
  const { workspaceId } = event.params;
  const before = event.data.before.data();
  const after = event.data.after.data();
  
  // Check if stage changed
  if (before.stage !== after.stage) {
    console.log('📊 Task stage changed, updating aggregation:', {
      workspaceId,
      taskId: event.data.after.id,
      oldStage: before.stage,
      newStage: after.stage
    });
    
    const aggRef = db.doc(`workspaces/${workspaceId}/aggregations/dashboard`);
    
    try {
      const updates = {
        lastUpdated: FieldValue.serverTimestamp()
      };
      
      // Decrement old stage
      updates[`tasks.byStage.${before.stage}`] = FieldValue.increment(-1);
      
      // Increment new stage
      updates[`tasks.byStage.${after.stage}`] = FieldValue.increment(1);
      
      // Update completed/active counts
      if (after.stage === 'Complete' && before.stage !== 'Complete') {
        updates['tasks.completed'] = FieldValue.increment(1);
        updates['tasks.active'] = FieldValue.increment(-1);
      } else if (before.stage === 'Complete' && after.stage !== 'Complete') {
        updates['tasks.completed'] = FieldValue.increment(-1);
        updates['tasks.active'] = FieldValue.increment(1);
      }
      
      await aggRef.update(updates);
      
      console.log('✅ Task aggregation updated');
    } catch (error) {
      console.error('❌ Failed to update task aggregation:', error);
    }
  }
});

/**
 * Update dashboard aggregation when task is deleted
 */
exports.onTaskDelete = onDocumentDeleted('workspaces/{workspaceId}/tasks/{taskId}', async (event) => {
  const { workspaceId } = event.params;
  const taskData = event.data.data();
  
  console.log('📊 Task deleted, updating aggregation:', { workspaceId, taskId: event.data.id });
  
  const aggRef = db.doc(`workspaces/${workspaceId}/aggregations/dashboard`);
  
  try {
    await aggRef.update({
      'tasks.total': FieldValue.increment(-1),
      [`tasks.byStage.${taskData.stage || 'New'}`]: FieldValue.increment(-1),
      lastUpdated: FieldValue.serverTimestamp()
    });
    
    console.log('✅ Task aggregation updated');
  } catch (error) {
    console.error('❌ Failed to update task aggregation:', error);
  }
});

// ── Team Aggregation Triggers ─────────────────────────────────────────────────

/**
 * Update dashboard aggregation when team member is added
 */
exports.onTeamMemberCreate = onDocumentCreated('workspaces/{workspaceId}/team/{memberId}', async (event) => {
  const { workspaceId } = event.params;
  const memberData = event.data.data();
  
  console.log('📊 Team member added, updating aggregation:', { workspaceId, memberId: event.data.id });
  
  const aggRef = db.doc(`workspaces/${workspaceId}/aggregations/dashboard`);
  
  try {
    await aggRef.set({
      team: {
        total: FieldValue.increment(1),
        active: FieldValue.increment(1),
        byRole: {
          [memberData.role || 'Member']: FieldValue.increment(1)
        }
      },
      lastUpdated: FieldValue.serverTimestamp()
    }, { merge: true });
    
    console.log('✅ Team aggregation updated');
  } catch (error) {
    console.error('❌ Failed to update team aggregation:', error);
  }
});

/**
 * Update dashboard aggregation when team member is updated
 */
exports.onTeamMemberUpdate = onDocumentUpdated('workspaces/{workspaceId}/team/{memberId}', async (event) => {
  const { workspaceId } = event.params;
  const before = event.data.before.data();
  const after = event.data.after.data();
  
  const aggRef = db.doc(`workspaces/${workspaceId}/aggregations/dashboard`);
  const updates = {
    lastUpdated: FieldValue.serverTimestamp()
  };
  
  // Check if status changed
  if (before.status !== after.status) {
    console.log('📊 Team member status changed:', {
      workspaceId,
      memberId: event.data.after.id,
      oldStatus: before.status,
      newStatus: after.status
    });
    
    if (after.status === 'Active' && before.status !== 'Active') {
      updates['team.active'] = FieldValue.increment(1);
      updates['team.inactive'] = FieldValue.increment(-1);
    } else if (before.status === 'Active' && after.status !== 'Active') {
      updates['team.active'] = FieldValue.increment(-1);
      updates['team.inactive'] = FieldValue.increment(1);
    }
  }
  
  // Check if role changed
  if (before.role !== after.role) {
    console.log('📊 Team member role changed:', {
      workspaceId,
      memberId: event.data.after.id,
      oldRole: before.role,
      newRole: after.role
    });
    
    updates[`team.byRole.${before.role}`] = FieldValue.increment(-1);
    updates[`team.byRole.${after.role}`] = FieldValue.increment(1);
  }
  
  // Only update if there are changes
  if (Object.keys(updates).length > 1) {
    try {
      await aggRef.update(updates);
      console.log('✅ Team aggregation updated');
    } catch (error) {
      console.error('❌ Failed to update team aggregation:', error);
    }
  }
});

/**
 * Update dashboard aggregation when team member is deleted
 */
exports.onTeamMemberDelete = onDocumentDeleted('workspaces/{workspaceId}/team/{memberId}', async (event) => {
  const { workspaceId } = event.params;
  const memberData = event.data.data();
  
  console.log('📊 Team member deleted, updating aggregation:', { workspaceId, memberId: event.data.id });
  
  const aggRef = db.doc(`workspaces/${workspaceId}/aggregations/dashboard`);
  
  try {
    await aggRef.update({
      'team.total': FieldValue.increment(-1),
      [`team.byRole.${memberData.role || 'Member'}`]: FieldValue.increment(-1),
      lastUpdated: FieldValue.serverTimestamp()
    });
    
    console.log('✅ Team aggregation updated');
  } catch (error) {
    console.error('❌ Failed to update team aggregation:', error);
  }
});

// ── Payment Aggregation Triggers ──────────────────────────────────────────────

/**
 * Update dashboard aggregation when payment is created
 */
exports.onPaymentCreate = onDocumentCreated('workspaces/{workspaceId}/payments/{paymentId}', async (event) => {
  const { workspaceId } = event.params;
  const paymentData = event.data.data();
  
  console.log('📊 Payment created, updating aggregation:', { workspaceId, paymentId: event.data.id });
  
  const aggRef = db.doc(`workspaces/${workspaceId}/aggregations/dashboard`);
  
  try {
    await aggRef.set({
      financials: {
        totalBudget: FieldValue.increment(paymentData.amount || 0),
        totalPaid: FieldValue.increment(paymentData.paidAmount || 0),
        totalPending: FieldValue.increment((paymentData.amount || 0) - (paymentData.paidAmount || 0)),
        paymentsCount: FieldValue.increment(1)
      },
      lastUpdated: FieldValue.serverTimestamp()
    }, { merge: true });
    
    console.log('✅ Payment aggregation updated');
  } catch (error) {
    console.error('❌ Failed to update payment aggregation:', error);
  }
});

/**
 * Update dashboard aggregation when payment is updated
 */
exports.onPaymentUpdate = onDocumentUpdated('workspaces/{workspaceId}/payments/{paymentId}', async (event) => {
  const { workspaceId } = event.params;
  const before = event.data.before.data();
  const after = event.data.after.data();
  
  // Calculate deltas
  const amountDelta = (after.amount || 0) - (before.amount || 0);
  const paidDelta = (after.paidAmount || 0) - (before.paidAmount || 0);
  const pendingDelta = ((after.amount || 0) - (after.paidAmount || 0)) - ((before.amount || 0) - (before.paidAmount || 0));
  
  if (amountDelta !== 0 || paidDelta !== 0) {
    console.log('📊 Payment updated, updating aggregation:', {
      workspaceId,
      paymentId: event.data.after.id,
      amountDelta,
      paidDelta,
      pendingDelta
    });
    
    const aggRef = db.doc(`workspaces/${workspaceId}/aggregations/dashboard`);
    
    try {
      await aggRef.update({
        'financials.totalBudget': FieldValue.increment(amountDelta),
        'financials.totalPaid': FieldValue.increment(paidDelta),
        'financials.totalPending': FieldValue.increment(pendingDelta),
        lastUpdated: FieldValue.serverTimestamp()
      });
      
      console.log('✅ Payment aggregation updated');
    } catch (error) {
      console.error('❌ Failed to update payment aggregation:', error);
    }
  }
});

/**
 * Update dashboard aggregation when payment is deleted
 */
exports.onPaymentDelete = onDocumentDeleted('workspaces/{workspaceId}/payments/{paymentId}', async (event) => {
  const { workspaceId } = event.params;
  const paymentData = event.data.data();
  
  console.log('📊 Payment deleted, updating aggregation:', { workspaceId, paymentId: event.data.id });
  
  const aggRef = db.doc(`workspaces/${workspaceId}/aggregations/dashboard`);
  
  try {
    await aggRef.update({
      'financials.totalBudget': FieldValue.increment(-(paymentData.amount || 0)),
      'financials.totalPaid': FieldValue.increment(-(paymentData.paidAmount || 0)),
      'financials.totalPending': FieldValue.increment(-((paymentData.amount || 0) - (paymentData.paidAmount || 0))),
      'financials.paymentsCount': FieldValue.increment(-1),
      lastUpdated: FieldValue.serverTimestamp()
    });
    
    console.log('✅ Payment aggregation updated');
  } catch (error) {
    console.error('❌ Failed to update payment aggregation:', error);
  }
});

// ── Scheduled Aggregation Rebuild ─────────────────────────────────────────────

/**
 * Rebuild all aggregations daily (safety net for drift)
 * Runs at 2 AM UTC every day
 */
exports.rebuildAggregationsDaily = onSchedule('0 2 * * *', async (event) => {
  console.log('📊 Starting daily aggregation rebuild...');
  
  try {
    // Get all workspaces
    const workspacesSnap = await db.collection('workspaces').get();
    
    console.log(`📊 Found ${workspacesSnap.size} workspaces to rebuild`);
    
    // Rebuild each workspace
    for (const workspaceDoc of workspacesSnap.docs) {
      const workspaceId = workspaceDoc.id;
      
      try {
        console.log(`📊 Rebuilding aggregation for workspace: ${workspaceId}`);
        
        // Load all data
        const [tasksSnap, teamSnap, paymentsSnap] = await Promise.all([
          db.collection(`workspaces/${workspaceId}/tasks`).get(),
          db.collection(`workspaces/${workspaceId}/team`).get(),
          db.collection(`workspaces/${workspaceId}/payments`).get()
        ]);
        
        // Calculate stats (same logic as client-side rebuildDashboardAggregation)
        const tasks = tasksSnap.docs.map(d => d.data());
        const team = teamSnap.docs.map(d => d.data());
        const payments = paymentsSnap.docs.map(d => d.data());
        
        const taskStats = {
          total: tasks.length,
          completed: tasks.filter(t => t.stage === 'Complete').length,
          active: tasks.filter(t => t.stage !== 'Complete').length,
          pending: 0,
          byStage: {}
        };
        
        tasks.forEach(t => {
          taskStats.byStage[t.stage] = (taskStats.byStage[t.stage] || 0) + 1;
        });
        
        const teamStats = {
          total: team.length,
          active: team.filter(m => m.status === 'Active').length,
          inactive: team.filter(m => m.status !== 'Active').length,
          byRole: {}
        };
        
        team.forEach(m => {
          teamStats.byRole[m.role] = (teamStats.byRole[m.role] || 0) + 1;
        });
        
        const financialStats = {
          totalBudget: tasks.reduce((sum, t) => sum + (t.totalBudget || 0), 0),
          totalPaid: payments.reduce((sum, p) => sum + (p.paidAmount || 0), 0),
          totalPending: payments.reduce((sum, p) => sum + ((p.amount || 0) - (p.paidAmount || 0)), 0),
          paymentsCount: payments.length
        };
        
        // Write aggregation
        await db.doc(`workspaces/${workspaceId}/aggregations/dashboard`).set({
          tasks: taskStats,
          team: teamStats,
          financials: financialStats,
          lastUpdated: FieldValue.serverTimestamp()
        });
        
        console.log(`✅ Rebuilt aggregation for workspace: ${workspaceId}`);
      } catch (error) {
        console.error(`❌ Failed to rebuild aggregation for workspace ${workspaceId}:`, error);
      }
    }
    
    console.log('✅ Daily aggregation rebuild complete');
  } catch (error) {
    console.error('❌ Daily aggregation rebuild failed:', error);
  }
});
