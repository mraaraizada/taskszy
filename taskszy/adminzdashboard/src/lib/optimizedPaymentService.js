/**
 * Optimized Payment Service
 * Reduces Firebase reads with pagination and query limits
 */

import { db } from './firebase';
import { collection, query, orderBy, getDocs, where, limit, startAfter, getCountFromServer } from 'firebase/firestore';

/**
 * Get payments with pagination (OPTIMIZED)
 * @param {Object} options - { pageSize, lastDoc, status }
 * @returns {Promise<Object>} - { payments, lastDoc, hasMore, total }
 */
export async function getPaymentsPaginated(options = {}) {
  const { pageSize = 50, lastDoc = null, status = null } = options;
  
  try {
    const paymentsRef = collection(db, 'payments');
    
    // Query without orderBy to get all payments (works with any document structure)
    let q = query(paymentsRef, limit(pageSize + 1));
    
    if (status) {
      q = query(paymentsRef, where('status', '==', status), limit(pageSize + 1));
    }
    
    if (lastDoc) {
      q = query(paymentsRef, startAfter(lastDoc), limit(pageSize + 1));
    }
    
    const snapshot = await getDocs(q);
    
    const hasMore = snapshot.size > pageSize;
    const docs = hasMore ? snapshot.docs.slice(0, pageSize) : snapshot.docs;
    const newLastDoc = docs.length > 0 ? docs[docs.length - 1] : null;
    
    const payments = docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Sort by transactionDate or createdAt in memory (supports both old and new formats)
    payments.sort((a, b) => {
      const dateA = a.transactionDate || a.createdAt || 0;
      const dateB = b.transactionDate || b.createdAt || 0;
      
      // Convert to timestamps for comparison
      const timeA = typeof dateA?.toMillis === 'function' ? dateA.toMillis() : 
                    dateA instanceof Date ? dateA.getTime() : 
                    typeof dateA === 'number' ? dateA : 0;
      const timeB = typeof dateB?.toMillis === 'function' ? dateB.toMillis() : 
                    dateB instanceof Date ? dateB.getTime() : 
                    typeof dateB === 'number' ? dateB : 0;
      
      return timeB - timeA; // Descending order (newest first)
    });
    
    return { payments, lastDoc: newLastDoc, hasMore };
  } catch (error) {

    throw error;
  }
}

/**
 * Get payment count (OPTIMIZED - uses count query)
 * @param {string} status - Optional status filter
 * @returns {Promise<number>} - Payment count
 */
export async function getPaymentCount(status = null) {
  try {
    const paymentsRef = collection(db, 'payments');
    let q = query(paymentsRef);
    
    if (status) {
      q = query(paymentsRef, where('status', '==', status));
    }
    
    const countSnap = await getCountFromServer(q);
    return countSnap.data().count;
  } catch (error) {

    return 0;
  }
}

/**
 * Get custom plan requests with pagination (OPTIMIZED)
 * @param {Object} options - { pageSize, lastDoc, status }
 * @returns {Promise<Object>} - { requests, lastDoc, hasMore }
 */
export async function getCustomRequestsPaginated(options = {}) {
  const { pageSize = 50, lastDoc = null, status = null } = options;
  
  try {

    const requestsRef = collection(db, 'customPlanRequests');
    
    // Try with orderBy first, fallback to simple query if it fails
    let snapshot;
    try {
      let q = query(requestsRef, orderBy('createdAt', 'desc'), limit(pageSize + 1));
      
      if (lastDoc) {
        q = query(requestsRef, orderBy('createdAt', 'desc'), startAfter(lastDoc), limit(pageSize + 1));
      }

      snapshot = await getDocs(q);

    } catch (orderError) {

      // Fallback: query without orderBy
      let q = query(requestsRef, limit(pageSize + 1));
      
      if (lastDoc) {
        q = query(requestsRef, startAfter(lastDoc), limit(pageSize + 1));
      }

      snapshot = await getDocs(q);

    }
    
    const hasMore = snapshot.size > pageSize;
    const docs = hasMore ? snapshot.docs.slice(0, pageSize) : snapshot.docs;
    const newLastDoc = docs.length > 0 ? docs[docs.length - 1] : null;
    
    let requests = docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Sort by createdAt or requestDate in memory
    requests.sort((a, b) => {
      const dateA = a.createdAt || a.requestDate || 0;
      const dateB = b.createdAt || b.requestDate || 0;
      
      // Convert to timestamps for comparison
      const timeA = typeof dateA?.toMillis === 'function' ? dateA.toMillis() : 
                    dateA instanceof Date ? dateA.getTime() : 
                    typeof dateA === 'number' ? dateA : 0;
      const timeB = typeof dateB?.toMillis === 'function' ? dateB.toMillis() : 
                    dateB instanceof Date ? dateB.getTime() : 
                    typeof dateB === 'number' ? dateB : 0;
      
      return timeB - timeA; // Descending order (newest first)
    });
    
    // Filter by status in memory if provided
    if (status) {
      requests = requests.filter(req => req.status === status);

    }

    return { requests, lastDoc: newLastDoc, hasMore };
  } catch (error) {

    // Return empty result instead of throwing
    return { requests: [], lastDoc: null, hasMore: false };
  }
}

/**
 * Get coupons with limit (OPTIMIZED)
 * @param {number} limitCount - Max coupons to fetch
 * @returns {Promise<Array>} - Coupons array
 */
export async function getCouponsOptimized(limitCount = 100) {
  try {
    const couponsRef = collection(db, 'coupons');
    const q = query(couponsRef, orderBy('createdAt', 'desc'), limit(limitCount));
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {

    throw error;
  }
}
