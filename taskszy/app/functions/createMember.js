/**
 * Cloud Function: createMember
 * 
 * Creates a Firebase Auth account and Firestore profile for a new team member.
 * This should be called by admins when adding team members.
 * 
 * Security: Only callable by authenticated admin users
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin (if not already initialized)
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * Create a new team member with Firebase Auth account
 * 
 * @param {object} data - Request data
 * @param {string} data.email - Member email
 * @param {string} data.password - Member password
 * @param {string} data.role - Member role (admin, management, member)
 * @param {string} data.workspaceId - Workspace ID
 * @param {number} data.memberId - Member ID from team collection
 * @param {string} data.name - Member name
 * 
 * @param {object} context - Call context with auth info
 * 
 * @returns {object} { success: boolean, uid: string, message: string }
 */
exports.createMember = functions.https.onCall(async (data, context) => {
  // ══════════════════════════════════════════════════════════════════════
  // 1. AUTHENTICATION CHECK
  // ══════════════════════════════════════════════════════════════════════
  
  // Verify the caller is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'You must be signed in to create team members.'
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  // 2. AUTHORIZATION CHECK - Only admins can create members
  // ══════════════════════════════════════════════════════════════════════
  
  try {
    const callerUid = context.auth.uid;
    const callerProfile = await db.collection('users').doc(callerUid).get();
    
    if (!callerProfile.exists) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'User profile not found.'
      );
    }

    const callerRole = callerProfile.data().role;
    
    // Only admin and management can create members
    if (callerRole !== 'admin' && callerRole !== 'management') {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Only administrators and management can create team members.'
      );
    }

    // Verify caller belongs to the same workspace
    const callerWorkspaceId = callerProfile.data().workspaceId;
    if (callerWorkspaceId !== data.workspaceId) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'You can only create members in your own workspace.'
      );
    }

  } catch (error) {
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError(
      'internal',
      'Failed to verify permissions.',
      error.message
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  // 3. VALIDATE INPUT
  // ══════════════════════════════════════════════════════════════════════
  
  const { email, password, role, workspaceId, memberId, name, phone } = data;

  if (!email || typeof email !== 'string') {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Email is required and must be a string.'
    );
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Password is required and must be at least 6 characters.'
    );
  }

  if (!role || !['admin', 'management', 'member'].includes(role)) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Role must be one of: admin, management, member.'
    );
  }

  if (!workspaceId || typeof workspaceId !== 'string') {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Workspace ID is required.'
    );
  }

  if (!memberId || typeof memberId !== 'number') {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Member ID is required and must be a number.'
    );
  }

  if (!name || typeof name !== 'string') {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Name is required.'
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  // 4. CREATE FIREBASE AUTH ACCOUNT
  // ══════════════════════════════════════════════════════════════════════
  
  let userRecord;
  try {
    userRecord = await admin.auth().createUser({
      email: email.toLowerCase().trim(),
      password: password,
      displayName: name,
      emailVerified: false, // Admin can manually verify if needed
    });
  } catch (error) {
    // Handle specific auth errors
    if (error.code === 'auth/email-already-exists') {
      throw new functions.https.HttpsError(
        'already-exists',
        'An account with this email already exists.'
      );
    }
    if (error.code === 'auth/invalid-email') {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Invalid email address.'
      );
    }
    if (error.code === 'auth/weak-password') {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Password is too weak. Use at least 6 characters.'
      );
    }
    
    throw new functions.https.HttpsError(
      'internal',
      'Failed to create authentication account.',
      error.message
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  // 5. CREATE FIRESTORE USER PROFILE
  // ══════════════════════════════════════════════════════════════════════
  
  try {
    await db.collection('users').doc(userRecord.uid).set({
      email: email.toLowerCase().trim(),
      name: name || null,
      phone: phone || null,
      role: role,
      memberId: memberId,
      workspaceId: workspaceId,
      loginTime: null,
      lastActivityTime: null,
      hasSeenWelcomeAnimation: false, // New users should see welcome animation on first login
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: context.auth.uid,
    });
  } catch (error) {
    // If profile creation fails, delete the auth account to maintain consistency
    try {
      await admin.auth().deleteUser(userRecord.uid);
    } catch (deleteError) {
      console.error('Failed to cleanup auth account after profile creation failure:', deleteError);
    }
    
    throw new functions.https.HttpsError(
      'internal',
      'Failed to create user profile. Auth account has been cleaned up.',
      error.message
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  // 6. LOG ACTIVITY
  // ══════════════════════════════════════════════════════════════════════
  
  try {
    await db.collection(`workspaces/${workspaceId}/activity`).add({
      type: 'member',
      title: 'Member Added',
      sub: `${name} — ${role}`,
      time: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: context.auth.uid,
    });
  } catch (error) {
    // Non-fatal - log but don't fail the operation
    console.error('Failed to log activity:', error);
  }

  // ══════════════════════════════════════════════════════════════════════
  // 7. RETURN SUCCESS
  // ══════════════════════════════════════════════════════════════════════
  
  return {
    success: true,
    uid: userRecord.uid,
    message: `Team member ${name} created successfully.`,
    email: email.toLowerCase().trim(),
  };
});

/**
 * Optional: Send welcome email to new member
 * Uncomment and configure if you want to send welcome emails
 */
/*
exports.sendWelcomeEmail = functions.firestore
  .document('users/{uid}')
  .onCreate(async (snap, context) => {
    const userData = snap.data();
    
    // Only send for team members (not self-signup admins)
    if (!userData.createdBy) return;
    
    // TODO: Implement email sending logic
    // Use SendGrid, Mailgun, or Firebase Extensions
    
    console.log(`Welcome email should be sent to ${userData.email}`);
  });
*/
