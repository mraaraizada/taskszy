import { db } from './firebase';
import { collection, query, orderBy, getDocs, onSnapshot, limit } from 'firebase/firestore';
import cacheManager, { CACHE_KEYS } from './cacheManager';

/**
 * Get all feedback entries with caching (for admin dashboard)
 * @param {boolean} forceRefresh - Force refresh from Firebase, bypass cache
 * @returns {Promise<Array>} - Array of feedback entries
 */
export async function getAllFeedback(forceRefresh = false) {
  // Check cache first
  if (!forceRefresh) {
    const cached = cacheManager.get(CACHE_KEYS.FEEDBACK);
    if (cached) {
      return cached;
    }
  }
  
  try {

    const feedbackRef = collection(db, 'feedback');
    const q = query(feedbackRef, orderBy('submittedAt', 'desc'));
    const snapshot = await getDocs(q);
    
    const feedback = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      submittedAt: doc.data().submittedAt?.toDate() || new Date(),
    }));
    
    // Cache the results
    cacheManager.set(CACHE_KEYS.FEEDBACK, feedback);
    
    return feedback;
  } catch (error) {

    throw error;
  }
}

/**
 * Get recent feedback (limited) - more efficient for dashboard previews
 * @param {number} limitCount - Number of recent items to fetch
 * @returns {Promise<Array>} - Array of recent feedback entries
 */
export async function getRecentFeedback(limitCount = 10) {
  try {
    const feedbackRef = collection(db, 'feedback');
    const q = query(feedbackRef, orderBy('submittedAt', 'desc'), limit(limitCount));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      submittedAt: doc.data().submittedAt?.toDate() || new Date(),
    }));
  } catch (error) {

    throw error;
  }
}

/**
 * Listen for feedback updates in real-time (use sparingly)
 * @param {Function} callback - Callback function with feedback data
 * @returns {Function} - Unsubscribe function
 */
export function listenForFeedback(callback) {
  try {
    const feedbackRef = collection(db, 'feedback');
    const q = query(feedbackRef, orderBy('submittedAt', 'desc'));
    
    return onSnapshot(q, (snapshot) => {
      const feedback = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        submittedAt: doc.data().submittedAt?.toDate() || new Date(),
      }));
      
      // Update cache when real-time data arrives
      cacheManager.set(CACHE_KEYS.FEEDBACK, feedback);
      
      callback(feedback);
    });
  } catch (error) {

    return () => {};
  }
}

/**
 * Clear feedback cache (call after creating/updating feedback)
 */
export function clearFeedbackCache() {
  cacheManager.clear(CACHE_KEYS.FEEDBACK);
}
