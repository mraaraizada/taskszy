import { db } from './firebase';
import { collection, addDoc, query, where, onSnapshot, updateDoc, doc, serverTimestamp, orderBy, limit, getDocs } from 'firebase/firestore';

/**
 * Admin sends feedback request to organization
 * @param {string} organizationId - Organization ID to send feedback request
 * @param {string} message - Custom message for feedback request
 * @returns {Promise<string>} - Broadcast document ID
 */
export async function sendFeedbackRequest(organizationId, message = 'We would love to hear your feedback!') {
  try {
    const broadcastRef = collection(db, 'feedbackBroadcasts');
    
    const broadcastDoc = {
      organizationId,
      message,
      type: 'feedback_request',
      status: 'active', // active, expired
      createdAt: serverTimestamp(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      sentBy: 'admin',
    };

    const docRef = await addDoc(broadcastRef, broadcastDoc);
    return docRef.id;
  } catch (error) {

    throw error;
  }
}

/**
 * Listen for active feedback requests for an organization
 * @param {string} organizationId - Organization ID
 * @param {Function} callback - Callback function with feedback request data
 * @param {Date|null} userCreatedAt - User's join date (to filter out old broadcasts)
 * @returns {Function} - Unsubscribe function
 */
export function listenForFeedbackRequests(organizationId, callback, userCreatedAt = null) {
  try {
    const broadcastRef = collection(db, 'feedbackBroadcasts');
    
    // Listen for all active broadcasts (no orderBy to avoid index requirement)
    const q = query(
      broadcastRef,
      where('status', '==', 'active')
    );

    return onSnapshot(q, (snapshot) => {

      // Filter for broadcasts that match this organization or are for ALL
      const relevantBroadcasts = snapshot.docs.filter(doc => {
        const data = doc.data();
        const isRelevant = data.organizationId === organizationId || data.organizationId === 'ALL';
        
        // Filter out broadcasts created BEFORE user joined
        let isAfterUserJoined = true;
        if (userCreatedAt && data.createdAt) {
          const broadcastCreatedAt = data.createdAt.toDate();
          isAfterUserJoined = broadcastCreatedAt >= userCreatedAt;

        }

        return isRelevant && isAfterUserJoined;
      });

      if (relevantBroadcasts.length > 0) {
        // Sort by createdAt in memory and get most recent
        const sortedBroadcasts = relevantBroadcasts.sort((a, b) => {
          const aTime = a.data().createdAt?.toDate() || new Date(0);
          const bTime = b.data().createdAt?.toDate() || new Date(0);
          return bTime - aTime;
        });
        
        const doc = sortedBroadcasts[0]; // Get most recent
        const data = doc.data();
        
        // Check if expired
        const expiresAt = data.expiresAt?.toDate() || new Date();
        if (expiresAt < new Date()) {

          // Mark as expired
          updateDoc(doc.ref, { status: 'expired' });
          callback(null);
        } else {

          callback({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            expiresAt: expiresAt,
          });
        }
      } else {

        callback(null);
      }
    }, (error) => {

      callback(null);
    });
  } catch (error) {

    return () => {};
  }
}

/**
 * Dismiss feedback request for a user
 * @param {string} broadcastId - Broadcast document ID
 * @param {string} userId - User ID who dismissed
 */
export async function dismissFeedbackRequest(broadcastId, userId) {
  try {
    const dismissalRef = collection(db, 'feedbackDismissals');
    await addDoc(dismissalRef, {
      broadcastId,
      userId,
      dismissedAt: serverTimestamp(),
    });
  } catch (error) {

  }
}

/**
 * Check if user has dismissed a feedback request
 * @param {string} broadcastId - Broadcast document ID
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} - True if dismissed
 */
export async function hasDismissedFeedback(broadcastId, userId) {
  try {
    const dismissalRef = collection(db, 'feedbackDismissals');
    const q = query(
      dismissalRef,
      where('broadcastId', '==', broadcastId),
      where('userId', '==', userId),
      limit(1)
    );
    
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {

    return false;
  }
}
