/**
 * Optimized Feedback Service
 * Reduces Firebase reads with pagination and limits
 */

import { db } from './firebase';
import { collection, query, orderBy, getDocs, limit, startAfter } from 'firebase/firestore';
import cacheManager, { CACHE_KEYS } from './cacheManager';

/**
 * Get feedback with pagination (OPTIMIZED)
 * @param {Object} options - { pageSize, lastDoc, forceRefresh }
 * @returns {Promise<Object>} - { feedback, lastDoc, hasMore }
 */
export async function getFeedbackPaginated(options = {}) {
  const { pageSize = 50, lastDoc = null, forceRefresh = false } = options;
  
  if (!lastDoc && !forceRefresh) {
    const cached = cacheManager.get(CACHE_KEYS.FEEDBACK);
    if (cached) {

      return {
        feedback: cached.slice(0, pageSize),
        hasMore: cached.length > pageSize,
        total: cached.length
      };
    }
  }
  
  try {

    const feedbackRef = collection(db, 'feedback');
    let q = query(feedbackRef, orderBy('submittedAt', 'desc'), limit(pageSize + 1));
    
    if (lastDoc) {
      q = query(feedbackRef, orderBy('submittedAt', 'desc'), startAfter(lastDoc), limit(pageSize + 1));
    }
    
    const snapshot = await getDocs(q);

    const hasMore = snapshot.size > pageSize;
    const docs = hasMore ? snapshot.docs.slice(0, pageSize) : snapshot.docs;
    const newLastDoc = docs.length > 0 ? docs[docs.length - 1] : null;
    
    const feedback = docs.map(doc => {
      const data = doc.data();
      
      // Convert Firestore Timestamp to Date
      const toDate = (dateValue) => {
        if (!dateValue) return null;
        if (dateValue instanceof Date) return dateValue;
        if (typeof dateValue?.toDate === 'function') return dateValue.toDate();
        if (typeof dateValue === 'string' || typeof dateValue === 'number') {
          const date = new Date(dateValue);
          return isNaN(date.getTime()) ? null : date;
        }
        return null;
      };
      
      return {
        id: doc.id,
        ...data,
        submittedAt: toDate(data.submittedAt),
      };
    });
    
    if (!lastDoc) {
      cacheManager.set(CACHE_KEYS.FEEDBACK, feedback);
    }
    
    return { feedback, lastDoc: newLastDoc, hasMore };
  } catch (error) {

    throw error;
  }
}
