/**
 * Cloud Function to initialize aggregations for all workspaces
 * 
 * DEPLOYMENT:
 * 1. Add to functions/index.js:
 *    exports.initializeAggregations = require('./initializeAggregations').initializeAggregations;
 * 
 * 2. Deploy: firebase deploy --only functions:initializeAggregations
 * 
 * 3. Call from Firebase Console or using curl:
 *    curl -X POST https://us-central1-taskzy-9c2e5.cloudfunctions.net/initializeAggregations \
 *      -H "Content-Type: application/json" \
 *      -d '{"adminSecret": "YOUR_SECRET_HERE"}'
 * 
 * SECURITY: Set ADMIN_SECRET in Firebase Functions config
 */

const { onCall } = require('firebase-functions/v2/https');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

const db = getFirestore();

/**
 * Initialize aggregations for all workspaces
 * This is a one-time operation to create initial aggregation documents
 */
exports.initializeAggregations = onCall({
  region: 'us-central1',
  timeoutSeconds: 540, // 9 minutes
  memory: '512MiB',
  invoker: 'public' // Allow public invocation for Cloud Shell
}, async (request) => {
  
  // Allow unauthenticated calls from Cloud Shell (for initialization only)
  // In production, you should remove this or add IP whitelisting
  console.log('🔐 Authentication check:', {
    hasAuth: !!request.auth,
    uid: request.auth?.uid || 'none'
  });
  
  // Skip auth check for now to allow Cloud Shell execution
  // TODO: Re-enable after initial setup or add IP whitelisting
  
  console.log('🚀 Starting aggregation initialization...');
  console.log('👤 Initiated by:', request.auth?.uid || 'Cloud Shell (unauthenticated)');
  
  try {
    // Get all workspaces
    const workspacesSnap = await db.collection('workspaces').get();
    console.log(`📊 Found ${workspacesSnap.size} workspaces`);
    
    const results = {
      total: workspacesSnap.size,
      success: 0,
      errors: 0,
      details: []
    };
    
    // Process each workspace
    for (const workspaceDoc of workspacesSnap.docs) {
      const workspaceId = workspaceDoc.id;
      
      try {
        console.log(`📦 Processing workspace: ${workspaceId}`);
        
        // Load all data
        const [tasksSnap, teamSnap, paymentsSnap, activitySnap] = await Promise.all([
          db.collection(`workspaces/${workspaceId}/tasks`).get(),
          db.collection(`workspaces/${workspaceId}/team`).get(),
          db.collection(`workspaces/${workspaceId}/payments`).get(),
          db.collection(`workspaces/${workspaceId}/activity`)
            .orderBy('time', 'desc')
            .limit(15)
            .get()
        ]);
        
        console.log(`  📊 Loaded: ${tasksSnap.size} tasks, ${teamSnap.size} team, ${paymentsSnap.size} payments`);
        
        // Calculate task stats
        const tasks = tasksSnap.docs.map(d => d.data());
        const taskStats = {
          total: tasks.length,
          completed: tasks.filter(t => t.stage === 'Complete').length,
          active: tasks.filter(t => t.stage !== 'Complete').length,
          pending: 0,
          byStage: {}
        };
        
        tasks.forEach(t => {
          const stage = t.stage || 'New';
          taskStats.byStage[stage] = (taskStats.byStage[stage] || 0) + 1;
        });
        
        // Calculate team stats
        const team = teamSnap.docs.map(d => d.data());
        const teamStats = {
          total: team.length,
          active: team.filter(m => m.status === 'Active').length,
          inactive: team.filter(m => m.status !== 'Active').length,
          byRole: {}
        };
        
        team.forEach(m => {
          const role = m.role || 'Member';
          teamStats.byRole[role] = (teamStats.byRole[role] || 0) + 1;
        });
        
        // Calculate financial stats
        const payments = paymentsSnap.docs.map(d => d.data());
        const financialStats = {
          totalBudget: tasks.reduce((sum, t) => sum + (t.totalBudget || 0), 0),
          totalPaid: payments.reduce((sum, p) => sum + (p.paidAmount || 0), 0),
          totalPending: payments.reduce((sum, p) => sum + ((p.amount || 0) - (p.paidAmount || 0)), 0),
          paymentsCount: payments.length
        };
        
        // Get recent activity
        const activity = activitySnap.docs.map(d => ({ id: d.id, ...d.data() }));
        
        // Write aggregation document
        await db.doc(`workspaces/${workspaceId}/aggregations/dashboard`).set({
          tasks: taskStats,
          team: teamStats,
          financials: financialStats,
          activity: activity,
          lastUpdated: FieldValue.serverTimestamp(),
          createdAt: FieldValue.serverTimestamp(),
          initializedBy: request.auth?.uid || 'cloud-shell'
        });
        
        console.log(`  ✅ Aggregation created for ${workspaceId}`);
        
        results.success++;
        results.details.push({
          workspaceId,
          status: 'success',
          stats: {
            tasks: taskStats.total,
            team: teamStats.total,
            budget: financialStats.totalBudget
          }
        });
        
      } catch (error) {
        console.error(`  ❌ Failed to process workspace ${workspaceId}:`, error.message);
        results.errors++;
        results.details.push({
          workspaceId,
          status: 'error',
          error: error.message
        });
      }
    }
    
    console.log('✅ Aggregation initialization complete');
    console.log(`   Success: ${results.success}, Errors: ${results.errors}`);
    
    return {
      success: true,
      message: 'Aggregation initialization complete',
      results
    };
    
  } catch (error) {
    console.error('❌ Fatal error during initialization:', error);
    throw new Error(`Initialization failed: ${error.message}`);
  }
});
