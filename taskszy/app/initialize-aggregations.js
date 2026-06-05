/**
 * One-time script to initialize dashboard aggregations for all existing workspaces
 * 
 * USAGE:
 * Option 1 - Using service account key:
 *   1. Download serviceAccountKey.json from Firebase Console
 *   2. Place in project root
 *   3. Run: node initialize-aggregations.js
 * 
 * Option 2 - Using Firebase CLI (recommended):
 *   1. Login: firebase login
 *   2. Run: firebase functions:shell
 *   3. Copy and run the initializeAggregations function
 * 
 * Option 3 - Deploy as Cloud Function:
 *   This script can be deployed as a one-time callable function
 */

const admin = require('firebase-admin');
const fs = require('fs');

// Initialize Firebase Admin
try {
  // Try to load service account key if it exists
  if (fs.existsSync('./serviceAccountKey.json')) {
    const serviceAccount = require('./serviceAccountKey.json');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('✅ Initialized with service account key');
  } else {
    // Use application default credentials (works with Firebase CLI)
    admin.initializeApp();
    console.log('✅ Initialized with application default credentials');
  }
} catch (error) {
  console.error('❌ Failed to initialize Firebase Admin:', error.message);
  console.log('\n📝 To fix this:');
  console.log('1. Download serviceAccountKey.json from Firebase Console:');
  console.log('   Project Settings > Service Accounts > Generate New Private Key');
  console.log('2. Place the file in: c:\\Files\\project\\taskzy\\serviceAccountKey.json');
  console.log('3. Run this script again\n');
  process.exit(1);
}

const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

async function initializeAggregations() {
  console.log('🚀 Starting aggregation initialization...\n');
  
  try {
    // Get all workspaces
    const workspacesSnap = await db.collection('workspaces').get();
    console.log(`📊 Found ${workspacesSnap.size} workspaces\n`);
    
    let successCount = 0;
    let errorCount = 0;
    
    // Process each workspace
    for (const workspaceDoc of workspacesSnap.docs) {
      const workspaceId = workspaceDoc.id;
      
      try {
        console.log(`\n📦 Processing workspace: ${workspaceId}`);
        
        // Load all data
        const [tasksSnap, teamSnap, paymentsSnap, activitySnap] = await Promise.all([
          db.collection(`workspaces/${workspaceId}/tasks`).get(),
          db.collection(`workspaces/${workspaceId}/team`).get(),
          db.collection(`workspaces/${workspaceId}/payments`).get(),
          db.collection(`workspaces/${workspaceId}/activity`).limit(15).orderBy('time', 'desc').get()
        ]);
        
        console.log(`  📊 Loaded: ${tasksSnap.size} tasks, ${teamSnap.size} team, ${paymentsSnap.size} payments, ${activitySnap.size} activities`);
        
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
          createdAt: FieldValue.serverTimestamp()
        });
        
        console.log(`  ✅ Aggregation created successfully`);
        console.log(`     Tasks: ${taskStats.total} (${taskStats.completed} completed, ${taskStats.active} active)`);
        console.log(`     Team: ${teamStats.total} (${teamStats.active} active)`);
        console.log(`     Budget: ₹${financialStats.totalBudget} (Paid: ₹${financialStats.totalPaid})`);
        
        successCount++;
        
      } catch (error) {
        console.error(`  ❌ Failed to process workspace ${workspaceId}:`, error.message);
        errorCount++;
      }
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 AGGREGATION INITIALIZATION COMPLETE');
    console.log('='.repeat(60));
    console.log(`✅ Success: ${successCount} workspaces`);
    console.log(`❌ Errors: ${errorCount} workspaces`);
    console.log(`📦 Total: ${workspacesSnap.size} workspaces`);
    console.log('\n🎯 Next steps:');
    console.log('   1. Cloud Functions will now maintain aggregations automatically');
    console.log('   2. Deploy frontend: firebase deploy --only hosting');
    console.log('   3. Monitor Firebase Console for read reduction');
    console.log('='.repeat(60) + '\n');
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

// Run the initialization
initializeAggregations();
