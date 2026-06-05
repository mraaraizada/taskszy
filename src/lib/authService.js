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
 * Send a branded password reset email using custom Cloud Function.
 * The email will contain TasksZy branding with logo and custom template.
 */
export async function sendPasswordReset(email) {
  const generatePasswordResetLink = httpsCallable(functions, 'generatePasswordResetLink');
  const result = await generatePasswordResetLink({ email });
  return result.data;
}

/**
 * Send an email verification to the given Firebase user.
 * The email will contain a link that opens in your app (not Firebase's default page).
 */
export async function sendVerificationEmail(user) {
  const actionCodeSettings = {
    // URL to redirect to after the user clicks the email link
    url: window.location.origin,
    handleCodeInApp: true,
  };
  return sendEmailVerification(user, actionCodeSettings);
}

/**
 * Sign in with Google via popup.
 * @returns {Promise<import('firebase/auth').UserCredential>}
 */
export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
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
    default:

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
