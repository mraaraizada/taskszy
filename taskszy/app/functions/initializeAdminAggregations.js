/**
 * Cloud Function to initialize admin dashboard aggregations
 * 
 * DEPLOYMENT:
 * 1. Add to functions/index.js
 * 2. Deploy: firebase deploy --only functions:initializeAdminAggregations
 * 3. Call from Cloud Shell or Firebase Console
 */

const { onCall } = require('firebase-functions/v2/https');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

const db = getFirestore();

exports.initializeAdminAggregations = onCall({
  region: 'us-central1',
  timeoutSeconds: 540,
  memory: '512MiB',
  invoker: 'public'
}, async (request) => {
  
  console.log('🚀 Starting admin aggregation initialization...');
  console.log('👤 Initiated by:', request.auth?.uid || 'Cloud Shell');
  
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
      createdAt: FieldValue.serverTimestamp(),
      initializedBy: request.auth?.uid || 'cloud-shell'
    });
    
    console.log('✅ Admin aggregation initialized successfully');
    
    return {
      success: true,
      message: 'Admin aggregation initialization complete',
      results: {
        workspaces: workspaceStats,
        users: userStats,
        monthlyGrowthPoints: monthlyGrowth.length,
        yearlyGrowthPoints: yearlyGrowth.length
      }
    };
  } catch (error) {
    console.error('❌ Admin aggregation initialization failed:', error);
    throw new Error(`Initialization failed: ${error.message}`);
  }
});
