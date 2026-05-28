const { onCall, onRequest, HttpsError } = require('firebase-functions/v2/https');
const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore, FieldValue, Timestamp } = require('firebase-admin/firestore');
const cors = require('cors')({ 
  origin: [
    'http://localhost:5173',
    'http://localhost:5174', 
    'https://taskzy-9c2e5.web.app',
    'https://taskzy-9c2e5.firebaseapp.com'
  ],
  credentials: true 
});

initializeApp();

// ══════════════════════════════════════════════════════════════════════
// EXPORT RAZORPAY FUNCTIONS
// ══════════════════════════════════════════════════════════════════════

const razorpayFunctions = require('./razorpay');
exports.createRazorpayOrder = razorpayFunctions.createRazorpayOrder;
exports.verifyRazorpayPayment = razorpayFunctions.verifyRazorpayPayment;
exports.activateFreePlan = razorpayFunctions.activateFreePlan;

// ══════════════════════════════════════════════════════════════════════
// EXPORT AGGREGATION TRIGGERS
// ══════════════════════════════════════════════════════════════════════

const aggregationTriggers = require('./aggregationTriggers');
exports.onTaskCreate = aggregationTriggers.onTaskCreate;
exports.onTaskUpdate = aggregationTriggers.onTaskUpdate;
exports.onTaskDelete = aggregationTriggers.onTaskDelete;
exports.onTeamMemberCreate = aggregationTriggers.onTeamMemberCreate;
exports.onTeamMemberUpdate = aggregationTriggers.onTeamMemberUpdate;
exports.onTeamMemberDelete = aggregationTriggers.onTeamMemberDelete;
exports.onPaymentCreate = aggregationTriggers.onPaymentCreate;
exports.onPaymentUpdate = aggregationTriggers.onPaymentUpdate;
exports.onPaymentDelete = aggregationTriggers.onPaymentDelete;
exports.rebuildAggregationsDaily = aggregationTriggers.rebuildAggregationsDaily;

// ══════════════════════════════════════════════════════════════════════
// EXPORT INITIALIZATION FUNCTION (ONE-TIME USE)
// ══════════════════════════════════════════════════════════════════════

const initializeAggregations = require('./initializeAggregations');
exports.initializeAggregations = initializeAggregations.initializeAggregations;

const initializeAdminAggregations = require('./initializeAdminAggregations');
exports.initializeAdminAggregations = initializeAdminAggregations.initializeAdminAggregations;

// ══════════════════════════════════════════════════════════════════════
// EXPORT ADMIN DASHBOARD AGGREGATION TRIGGERS
// ══════════════════════════════════════════════════════════════════════

const adminAggregationTriggers = require('./adminAggregationTriggers');
exports.onWorkspaceCreate = adminAggregationTriggers.onWorkspaceCreate;
exports.onWorkspaceUpdate = adminAggregationTriggers.onWorkspaceUpdate;
exports.onWorkspaceDelete = adminAggregationTriggers.onWorkspaceDelete;
exports.onUserCreate = adminAggregationTriggers.onUserCreate;
exports.onUserUpdate = adminAggregationTriggers.onUserUpdate;
exports.onUserDelete = adminAggregationTriggers.onUserDelete;
exports.rebuildAdminAggregationDaily = adminAggregationTriggers.rebuildAdminAggregationDaily;

/**
 * createMember — called by admin from TeamPage to create a Firebase Auth
 * account + Firestore user profile for a new team member.
 *
 * Request data: { email, password, role, workspaceId, memberId, name, phone }
 * Returns: { success: boolean, uid: string, message: string }
 */
exports.createMember = onCall({ 
  region: 'us-central1',
}, async (request) => {
  // ══════════════════════════════════════════════════════════════════════
  // 1. AUTHENTICATION CHECK
  // ══════════════════════════════════════════════════════════════════════
  
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be signed in.');
  }

  const { email, password, role, workspaceId, memberId, name, phone } = request.data;

  // ══════════════════════════════════════════════════════════════════════
  // 2. VALIDATE INPUT
  // ══════════════════════════════════════════════════════════════════════
  
  if (!email || !password || !role || !workspaceId) {
    throw new HttpsError('invalid-argument', 'Missing required fields: email, password, role, workspaceId.');
  }

  if (password.length < 6) {
    throw new HttpsError('invalid-argument', 'Password must be at least 6 characters.');
  }

  if (!['admin', 'management', 'member'].includes(role)) {
    throw new HttpsError('invalid-argument', 'Role must be one of: admin, management, member.');
  }

  const auth = getAuth();
  const db   = getFirestore();

  // ══════════════════════════════════════════════════════════════════════
  // 3. AUTHORIZATION CHECK
  // ══════════════════════════════════════════════════════════════════════
  
  // Verify the caller owns this workspace and has permission
  const callerDoc = await db.doc(`users/${request.auth.uid}`).get();
  if (!callerDoc.exists) {
    throw new HttpsError('permission-denied', 'User profile not found.');
  }
  
  const callerData = callerDoc.data();
  if (callerData.workspaceId !== workspaceId) {
    throw new HttpsError('permission-denied', 'Not authorized for this workspace.');
  }
  
  // Only admin and management can create members
  if (callerData.role !== 'admin' && callerData.role !== 'management') {
    throw new HttpsError('permission-denied', 'Only administrators and management can create team members.');
  }

  // ══════════════════════════════════════════════════════════════════════
  // 4. CREATE FIREBASE AUTH ACCOUNT
  // ══════════════════════════════════════════════════════════════════════
  
  let uid;
  try {
    const userRecord = await auth.createUser({ 
      email: email.toLowerCase().trim(), 
      password,
      displayName: name || email.split('@')[0],
      emailVerified: false,
    });
    uid = userRecord.uid;
  } catch (err) {
    if (err.code === 'auth/email-already-exists') {
      throw new HttpsError('already-exists', 'An account with this email already exists.');
    }
    if (err.code === 'auth/invalid-email') {
      throw new HttpsError('invalid-argument', 'Invalid email address.');
    }
    if (err.code === 'auth/weak-password') {
      throw new HttpsError('invalid-argument', 'Password is too weak.');
    }
    throw new HttpsError('internal', 'Failed to create auth account: ' + err.message);
  }

  // ══════════════════════════════════════════════════════════════════════
  // 5. CREATE FIRESTORE USER PROFILE
  // ══════════════════════════════════════════════════════════════════════
  
  try {
    await db.doc(`users/${uid}`).set({
      email: email.toLowerCase().trim(),
      name: name || null,
      phone: phone || null,
      role,
      memberId: memberId || null,
      workspaceId,
      loginTime: null,
      lastActivityTime: null,
      hasSeenWelcomeAnimation: false,
      createdAt: FieldValue.serverTimestamp(),
      createdBy: request.auth.uid,
    });
  } catch (err) {
    // If profile creation fails, delete the auth account to maintain consistency
    try {
      await auth.deleteUser(uid);
    } catch (deleteErr) {
      console.error('Failed to cleanup auth account:', deleteErr);
    }
    throw new HttpsError('internal', 'Failed to create user profile. Auth account cleaned up.');
  }

  // ══════════════════════════════════════════════════════════════════════
  // 6. LOG ACTIVITY (optional, non-fatal)
  // ══════════════════════════════════════════════════════════════════════
  
  try {
    await db.collection(`workspaces/${workspaceId}/activity`).add({
      type: 'member',
      title: 'Member Added',
      sub: `${name || email} — ${role}`,
      time: FieldValue.serverTimestamp(),
      createdBy: request.auth.uid,
    });
  } catch (err) {
    console.error('Failed to log activity:', err);
  }

  // ══════════════════════════════════════════════════════════════════════
  // 7. RETURN SUCCESS
  // ══════════════════════════════════════════════════════════════════════
  
  return {
    success: true,
    uid,
    message: `Team member created successfully.`,
    email: email.toLowerCase().trim(),
  };
});

/**
 * generateTaskId — generates a unique task ID in format: ABCD1234
 * (4 uppercase letters + 4 digits)
 * 
 * Request data: { workspaceId: string }
 * Returns: { taskId: string }
 */
exports.generateTaskId = onCall({
  enforceAppCheck: false,
  cors: true, // Allow all origins for callable functions (they handle CORS automatically)
  region: 'us-central1',
}, async (request) => {
  // ══════════════════════════════════════════════════════════════════════
  // 1. AUTHENTICATION CHECK
  // ══════════════════════════════════════════════════════════════════════
  
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be signed in.');
  }

  const { workspaceId } = request.data;

  // ══════════════════════════════════════════════════════════════════════
  // 2. VALIDATE INPUT
  // ══════════════════════════════════════════════════════════════════════
  
  if (!workspaceId) {
    throw new HttpsError('invalid-argument', 'Missing required field: workspaceId.');
  }

  const db = getFirestore();

  // ══════════════════════════════════════════════════════════════════════
  // 3. AUTHORIZATION CHECK
  // ══════════════════════════════════════════════════════════════════════
  
  const callerDoc = await db.doc(`users/${request.auth.uid}`).get();
  if (!callerDoc.exists) {
    throw new HttpsError('permission-denied', 'User profile not found.');
  }
  
  const callerData = callerDoc.data();
  if (callerData.workspaceId !== workspaceId) {
    throw new HttpsError('permission-denied', 'Not authorized for this workspace.');
  }

  // ══════════════════════════════════════════════════════════════════════
  // 4. GENERATE UNIQUE TASK ID
  // ══════════════════════════════════════════════════════════════════════
  
  const generateId = () => {
    // Generate 8-character ID with mixed letters and numbers
    // Pattern: 4 letters + 4 numbers in random positions
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const digits = '0123456789';
    
    // Create array of 8 positions
    const positions = Array(8).fill(null);
    
    // Randomly select 4 positions for letters
    const letterPositions = [];
    while (letterPositions.length < 4) {
      const pos = Math.floor(Math.random() * 8);
      if (!letterPositions.includes(pos)) {
        letterPositions.push(pos);
      }
    }
    
    // Fill letter positions
    letterPositions.forEach(pos => {
      positions[pos] = letters.charAt(Math.floor(Math.random() * letters.length));
    });
    
    // Fill remaining positions with digits
    for (let i = 0; i < 8; i++) {
      if (positions[i] === null) {
        positions[i] = digits.charAt(Math.floor(Math.random() * digits.length));
      }
    }
    
    return positions.join('');
  };

  // Keep trying until we find a unique ID
  let taskId;
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    taskId = generateId();
    
    // Check if this ID already exists in the workspace
    const existingTask = await db.doc(`workspaces/${workspaceId}/tasks/${taskId}`).get();
    
    if (!existingTask.exists) {
      // Found a unique ID
      break;
    }
    
    attempts++;
  }

  if (attempts >= maxAttempts) {
    throw new HttpsError('internal', 'Failed to generate unique task ID after multiple attempts.');
  }

  // ══════════════════════════════════════════════════════════════════════
  // 5. RETURN UNIQUE TASK ID
  // ══════════════════════════════════════════════════════════════════════
  
  return {
    taskId,
  };
});
