import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { auth, functions } from './firebase';

/**
 * Sign in with email and password.
 * @returns {Promise<import('firebase/auth').UserCredential>}
 */
export async function signIn(email, password) {
  try {
    return await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    // Log authentication errors for debugging (but these are expected for wrong credentials)

    throw error; // Re-throw so the UI can handle it
  }
}

/**
 * Create a new user account with email and password.
 * @returns {Promise<import('firebase/auth').UserCredential>}
 */
export async function signUp(email, password) {
  return createUserWithEmailAndPassword(auth, email, password);
}

/**
 * Sign out the currently authenticated user.
 */
export async function signOutUser() {
  return signOut(auth);
}

/**
 * Send a password reset email using custom branded email template.
 * This disables Firebase's default email and uses only our custom template.
 */
export async function sendPasswordReset(email) {
  try {
    // Call our custom function that will generate the link and send branded email
    const sendCustomResetEmail = httpsCallable(functions, 'sendBrandedPasswordResetEmail');
    const result = await sendCustomResetEmail({ email });
    
    return result.data;
  } catch (error) {
    console.error('Password reset error:', error);
    throw error;
  }
}

/**
 * Send an email verification to the given Firebase user.
 * Uses Firebase default URL until taskszy.com is added to authorized domains.
 */
export async function sendVerificationEmail(user) {
  // Temporarily removed actionCodeSettings to avoid 400 error
  // Add taskszy.com to Firebase Console → Authentication → Authorized domains
  // Then uncomment the code below:
  // const actionCodeSettings = {
  //   url: 'https://taskszy.com/app',
  //   handleCodeInApp: true,
  // };
  // return sendEmailVerification(user, actionCodeSettings);
  
  return sendEmailVerification(user);
}

/**
 * Sign in with Google via popup.
 * @returns {Promise<import('firebase/auth').UserCredential>}
 */
export async function signInWithGoogle() {
  try {
    const provider = new GoogleAuthProvider();
    return await signInWithPopup(auth, provider);
  } catch (error) {
    // Log the full error for debugging
    console.error('Google Sign-In Error:', error.code, error.message);
    throw error; // Re-throw so the UI can handle it
  }
}

/**
 * Register a listener for auth state changes.
 * @param {function} callback - Called with the Firebase user object (or null).
 * @returns {function} Unsubscribe function — call on component unmount.
 */
export function onAuthChanged(callback) {
  return onAuthStateChanged(auth, callback);
}

/**
 * Map a Firebase Auth error code to a user-facing message for sign-in / sign-up flows.
 * Never returns null, undefined, or "".
 * @param {string} code - e.g. "auth/user-not-found"
 * @returns {string}
 */
export function mapAuthError(code) {
  // Handle cases where code might be undefined or null
  if (!code) {
    console.error('mapAuthError called with no code');
    return 'An unexpected error occurred. Please try again.';
  }

  switch (code) {
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials':
      return 'Invalid email or password. Please try again.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later or reset your password.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection and try again.';
    case 'auth/popup-blocked':
      return 'Pop-up was blocked by your browser. Please allow pop-ups for this site and try again.';
    case 'auth/unauthorized-domain':
      return 'This domain is not authorized for Google sign-in. Please contact support.';
    case 'auth/operation-not-allowed':
      return 'Google sign-in is not enabled. Please contact support.';
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with the same email but different sign-in method.';
    case 'auth/auth-domain-config-required':
      return 'Authentication configuration is incomplete. Please contact support.';
    case 'auth/cancelled-popup-request':
      return ''; // Silent error - user cancelled
    case 'auth/popup-closed-by-user':
      return ''; // Silent error - user closed popup
    case 'auth/internal-error':
      return 'An internal authentication error occurred. Please try again or contact support.';
    case 'unknown':
      return 'Unable to complete sign-in. Please check your internet connection and try again.';
    default:
      console.error('Unmapped auth error:', code);
      return 'An unexpected error occurred. Please try again.';
  }
}

/**
 * Map a Firebase Auth error code to a user-facing message for the password-reset flow.
 * @param {string} code
 * @returns {string}
 */
export function mapPasswordResetError(code) {
  switch (code) {
    case 'auth/user-not-found':
      return 'No account found with that email address.';
    default:
      return 'Failed to send reset email. Please try again.';
  }
}
