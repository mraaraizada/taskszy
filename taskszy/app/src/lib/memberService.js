/**
 * Member Service
 * 
 * Handles team member creation via Cloud Functions
 */

import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions';
import { app } from './firebase';

// Initialize functions with us-central1 region (where functions are deployed)
const functions = getFunctions(app, 'us-central1');

/**
 * Create a new team member with Firebase Auth account
 * Uses client-side Firebase Auth to create the account
 * 
 * @param {object} memberData - Member data
 * @param {string} memberData.email - Member email
 * @param {string} memberData.password - Member password
 * @param {string} memberData.role - Member role
 * @param {string} memberData.workspaceId - Workspace ID
 * @param {number} memberData.memberId - Member ID
 * @param {string} memberData.name - Member name
 * 
 * @returns {Promise<object>} { success: boolean, uid: string, message: string }
 */
export async function createMemberAccount(memberData) {
  // Use the fallback method directly since Cloud Functions have CORS issues
  return await createMemberFallback(
    memberData.email,
    memberData.password,
    memberData.role,
    memberData.workspaceId,
    memberData.memberId,
    memberData.name,
    memberData.phone
  );
}

/**
 * Update member password in Firebase Auth
 * @param {string} uid - User's Firebase Auth UID
 * @param {string} newPassword - New password to set
 */
export async function updateMemberPassword(uid, newPassword) {
  const { getAuth } = await import('firebase/auth');
  const { updatePassword } = await import('firebase/auth');

  try {
    const auth = getAuth();
    
    // Note: This requires admin SDK or the user to be currently signed in
    // Since we can't update another user's password from client-side,
    // we'll need to use Firebase Admin SDK via Cloud Function
    // For now, we'll throw an error with instructions
    
    throw new Error('Password reset not yet implemented. Please use Firebase Console to reset the password, or ask the user to use "Forgot Password" on the login page.');
    
  } catch (error) {

    throw error;
  }
}

/**
 * Send password reset email to member
 * @param {string} email - Member's email address
 */
export async function sendPasswordResetEmail(email) {
  const { getAuth, sendPasswordResetEmail: firebaseSendPasswordReset } = await import('firebase/auth');

  try {
    const auth = getAuth();
    await firebaseSendPasswordReset(auth, email);

    return { success: true, message: 'Password reset email sent successfully.' };
  } catch (error) {

    if (error.code === 'auth/user-not-found') {
      throw new Error('No account found with this email address.');
    }
    throw error;
  }
}

/**
 * Create a team member WITHOUT creating Firebase Auth account
 * The member will receive an invitation email to set their password
 * This keeps the admin logged in
 * 
 * @param {string} email - Member email
 * @param {string} role - Member role (admin/management/member)
 * @param {string} workspaceId - Workspace ID
 * @param {number} memberId - Member ID
 * @param {string} name - Member full name
 * @param {string} phone - Member phone number
 */
export async function createMemberWithoutAuth(email, role, workspaceId, memberId, name, phone) {

  // We'll create the Firestore profile without a uid
  // When the user signs up using the invitation link, we'll link it
  
  return { 
    success: true, 
    uid: null, // No uid yet - will be set when user accepts invitation
    message: 'Member added to team. They will receive an invitation email.' 
  };
}

/**
 * Send invitation email to new team member
 * Creates Firebase Auth account and Firestore profile
 * Then sends password reset email as invitation
 * 
 * @param {string} email - Member's email address
 * @param {string} password - Initial password
 * @param {string} role - Member role
 * @param {string} workspaceId - Workspace ID
 * @param {number} memberId - Member ID
 * @param {string} name - Member name
 * @param {string} phone - Member phone
 */
export async function sendMemberInvitation(email, password, role, workspaceId, memberId, name, phone) {

  try {
    // Use the existing createMemberFallback but catch the logout issue
    const result = await createMemberFallback(email, password, role, workspaceId, memberId, name, phone);
    
    // Send password reset email as invitation (optional - they can already log in with the password)
    try {
      const { getAuth, sendPasswordResetEmail: firebaseSendPasswordReset } = await import('firebase/auth');
      const auth = getAuth();
      // Only send if there's a current user (admin might be logged out)
      if (auth.currentUser) {
        await firebaseSendPasswordReset(auth, email);

      }
    } catch (emailErr) {

      // Not critical - user can still log in with the password
    }
    
    return result;
  } catch (error) {

    throw error;
  }
}
export async function createMemberFallback(email, password, role, workspaceId, memberId, name, phone) {
  const { getAuth, createUserWithEmailAndPassword, signOut } = await import('firebase/auth');
  const { initializeApp, getApps } = await import('firebase/app');
  const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
  const { db } = await import('./firebase');

  try {
    const auth = getAuth();
    
    // Save current admin user
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('You must be logged in to create team members.');
    }
    
    const adminEmail = currentUser.email;
    const adminUid = currentUser.uid;

    // Create a temporary secondary Firebase app instance for creating the new user
    // This prevents the new user from replacing the admin's session
    let secondaryApp;
    let secondaryAuth;
    
    try {
      // Get Firebase config from the main app
      const { app } = await import('./firebase');
      const firebaseConfig = app.options;
      
      // Check if secondary app already exists
      const existingApps = getApps();
      secondaryApp = existingApps.find(a => a.name === 'Secondary');
      
      if (!secondaryApp) {
        // Create secondary app instance
        secondaryApp = initializeApp(firebaseConfig, 'Secondary');
      }
      
      secondaryAuth = getAuth(secondaryApp);

      const credential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
      const uid = credential.user.uid;

      // Sign out from secondary app immediately to avoid permission issues

      await signOut(secondaryAuth);

      // Now create Firestore profile using the ADMIN's authentication (main app)
      // This way the admin's permissions are used, not the new user's

      await setDoc(doc(db, 'users', uid), {
        email: email.toLowerCase().trim(),
        name: name || null,
        phone: phone || null,
        role,
        memberId: memberId || null,
        workspaceId,
        loginTime: null,
        lastActivityTime: null,
        hasSeenWelcomeAnimation: false, // New users should see welcome animation on first login
        hasSeenDonutWelcome: false, // New users should see donut welcome
        createdAt: serverTimestamp(),
        createdBy: adminUid,
      });

      // Verify admin is still logged in
      const stillLoggedIn = auth.currentUser?.uid === adminUid;

      if (!stillLoggedIn) {

        return { 
          success: true, 
          uid, 
          message: 'Member created successfully. Please log in again.',
          requiresRelogin: true 
        };
      }
      
      return { 
        success: true, 
        uid, 
        message: 'Member created successfully.',
        requiresRelogin: false 
      };
      
    } catch (error) {

      throw error;
    }
    
  } catch (error) {

    // Handle specific Firebase Auth errors with user-friendly messages
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('An account with this email already exists. Please use a different email address.');
    }
    if (error.code === 'auth/weak-password') {
      throw new Error('Password should be at least 6 characters.');
    }
    if (error.code === 'auth/invalid-email') {
      throw new Error('Invalid email address format.');
    }
    if (error.code === 'auth/operation-not-allowed') {
      throw new Error('Email/password authentication is not enabled. Please contact support.');
    }
    if (error.code === 'auth/too-many-requests') {
      throw new Error('Too many attempts. Please try again later.');
    }
    
    // If it's already a user-friendly error, pass it through
    if (error.message && !error.code) {
      throw error;
    }
    
    // Generic error for unexpected issues
    throw new Error(`Failed to create member account: ${error.message || 'Unknown error'}`);
  }
}
