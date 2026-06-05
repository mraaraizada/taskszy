import { db } from './firebase';
import { collection, addDoc, query, orderBy, getDocs, serverTimestamp, where } from 'firebase/firestore';

/**
 * Submit feedback from organization users
 * @param {Object} feedbackData - Feedback data
 * @param {string} feedbackData.organizationId - Organization ID
 * @param {string} feedbackData.organizationName - Organization name
 * @param {string} feedbackData.userId - User ID
 * @param {string} feedbackData.userName - User name
 * @param {string} feedbackData.userEmail - User email
 * @param {string} feedbackData.userPhone - User phone (optional)
 * @param {string} feedbackData.description - Feedback description (max 1000 chars)
 * @param {string} feedbackData.userRole - User role (dashboard/member/admin)
 * @returns {Promise<string>} - Feedback document ID
 */
export async function submitFeedback(feedbackData) {
  try {
    const feedbackRef = collection(db, 'feedback');
    
    const feedbackDoc = {
      organizationId: feedbackData.organizationId,
      organizationName: feedbackData.organizationName,
      userId: feedbackData.userId,
      userName: feedbackData.userName,
      userEmail: feedbackData.userEmail,
      userPhone: feedbackData.userPhone || '',
      description: feedbackData.description.substring(0, 1000), // Limit to 1000 chars
      userRole: feedbackData.userRole || 'user',
      submittedAt: serverTimestamp(),
      status: 'pending', // pending, reviewed, resolved
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(feedbackRef, feedbackDoc);
    return docRef.id;
  } catch (error) {

    throw error;
  }
}

/**
 * Get all feedback entries (for admin dashboard)
 * @returns {Promise<Array>} - Array of feedback entries
 */
export async function getAllFeedback() {
  try {
    const feedbackRef = collection(db, 'feedback');
    const q = query(feedbackRef, orderBy('submittedAt', 'desc'));
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
 * Get feedback for a specific organization
 * @param {string} organizationId - Organization ID
 * @returns {Promise<Array>} - Array of feedback entries
 */
export async function getOrganizationFeedback(organizationId) {
  try {
    const feedbackRef = collection(db, 'feedback');
    const q = query(
      feedbackRef,
      where('organizationId', '==', organizationId),
      orderBy('submittedAt', 'desc')
    );
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
 * Check if user has submitted feedback recently (within last 24 hours)
 * @param {string} userId - User ID
 * @param {string} organizationId - Organization ID
 * @returns {Promise<boolean>} - True if user has submitted feedback recently
 */
export async function hasRecentFeedback(userId, organizationId) {
  try {
    const feedbackRef = collection(db, 'feedback');
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const q = query(
      feedbackRef,
      where('userId', '==', userId),
      where('organizationId', '==', organizationId),
      where('submittedAt', '>', oneDayAgo)
    );
    
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {

    return false;
  }
}
