import {
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from './firebase';

/**
 * Sign in with email and password.
 * @returns {Promise<import('firebase/auth').UserCredential>}
 */
export async function signIn(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

/**
 * Sign out the currently authenticated user.
 */
export async function signOutUser() {
  return signOut(auth);
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
 * Map a Firebase Auth error code to a user-facing message for sign-in flows.
 * Never returns null, undefined, or "".
 * @param {string} code - e.g. "auth/user-not-found"
 * @returns {string}
 */
export function mapAuthError(code) {
  switch (code) {
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please try again.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.';
    default:
      return 'An unexpected error occurred. Please try again.';
  }
}

// NOTE: signUp and sendVerificationEmail are intentionally
// NOT exported — dashboard accounts are provisioned via Firebase Console only.

/**
 * Send a password reset email (dashboard admins can reset their own password).
 */
export async function sendPasswordReset(email) {
  return sendPasswordResetEmail(auth, email);
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
