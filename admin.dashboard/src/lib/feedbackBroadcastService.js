import { db } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Admin sends feedback request to organization(s)
 * @param {string} organizationId - Organization ID to send feedback request, or 'ALL' for all organizations
 * @param {string} message - Custom message for feedback request
 * @returns {Promise<string>} - Broadcast document ID
 */
export async function sendFeedbackRequest(organizationId, message = 'We would love to hear your feedback!') {
  try {
    const broadcastRef = collection(db, 'feedbackBroadcasts');
    
    const broadcastDoc = {
      organizationId, // 'ALL' means broadcast to all organizations
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
