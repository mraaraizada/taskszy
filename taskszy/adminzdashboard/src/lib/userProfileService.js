import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

const COLLECTION = 'superAdmins';

/**
 * Fetch a dashboard super-admin profile from Firestore.
 * Reads from `superAdmins/{uid}` — accounts are created via Firebase Console only.
 *
 * @param {string} uid - Firebase Auth UID
 * @returns {Promise<{email: string, dashboardRole: string, createdAt: import('firebase/firestore').Timestamp}|null>}
 */
export async function getProfile(uid) {
  const ref = doc(db, COLLECTION, uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const { email, dashboardRole, createdAt } = snap.data();
  return { email, dashboardRole, createdAt };
}

// NOTE: createProfile is intentionally NOT exported.
// Dashboard accounts are provisioned via Firebase Console or a seed script only.
