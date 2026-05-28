import { db } from './firebase';
import { collection, query, orderBy, getDocs, limit, startAfter, where } from 'firebase/firestore';

/**
 * Fetch payments from Firestore
 * @param {Object} options - Query options
 * @param {number} options.pageSize - Number of payments per page
 * @param {Object} options.lastDoc - Last document for pagination
 * @param {string} options.workspaceId - Filter by workspace ID
 * @returns {Promise<{payments: Array, lastDoc: Object}>}
 */
export async function fetchPayments({ pageSize = 50, lastDoc = null, workspaceId = null } = {}) {
  try {
    console.log('💳 PaymentService: Fetching payments', { pageSize, hasLastDoc: !!lastDoc, workspaceId });
    
    const paymentsRef = collection(db, 'payments');
    let q = query(
      paymentsRef,
      orderBy('transactionDate', 'desc'),
      limit(pageSize)
    );
    
    // Add workspace filter if provided
    if (workspaceId) {
      q = query(
        paymentsRef,
        where('workspaceId', '==', workspaceId),
        orderBy('transactionDate', 'desc'),
        limit(pageSize)
      );
    }
    
    // Add pagination
    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }
    
    const snapshot = await getDocs(q);
    
    const payments = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      // Convert Firestore timestamp to Date
      transactionDate: doc.data().transactionDate?.toDate?.() || new Date(doc.data().transactionDate),
    }));
    
    const lastVisible = snapshot.docs[snapshot.docs.length - 1];
    
    console.log('💳 PaymentService: Fetched payments', { count: payments.length });
    
    return {
      payments,
      lastDoc: lastVisible,
      hasMore: snapshot.docs.length === pageSize,
    };
  } catch (error) {
    console.error('❌ PaymentService: Error fetching payments', error);
    throw error;
  }
}

/**
 * Format date and time for display
 * @param {Date} date - Date object
 * @returns {string} Formatted date string
 */
export function formatDateTime(date) {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return 'N/A';
  }
  
  const dateStr = date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
  
  const timeStr = date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
  
  return `${dateStr} • ${timeStr}`;
}

/**
 * Get payment status badge color
 * @param {string} status - Payment status
 * @returns {Object} Color configuration
 */
export function getStatusColor(status) {
  switch (status) {
    case 'completed':
      return { bg: '#ECFDF5', color: '#12C479', border: '#BBF7D0' };
    case 'pending':
      return { bg: '#FFF7ED', color: '#F97316', border: '#FED7AA' };
    case 'failed':
    case 'cancelled':
      return { bg: '#FEF2F2', color: '#EF4444', border: '#FECACA' };
    default:
      return { bg: '#F3F4F6', color: '#6B7280', border: '#E5E7EB' };
  }
}
