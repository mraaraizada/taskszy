import { db } from './firebase';
import { collection, doc, addDoc, updateDoc, onSnapshot, serverTimestamp, query, orderBy, limit } from 'firebase/firestore';

/**
 * Help Submissions Service
 * 
 * Handles help requests from team members and management
 * Admin can view and respond to all submissions
 */

/**
 * Subscribe to help submissions
 * @param {string} workspaceId - Workspace ID
 * @param {function} callback - Callback function to receive submissions
 * @param {number} limitCount - Maximum number of submissions to load (default: 50)
 * @returns {function} Unsubscribe function
 */
export function subscribeToHelpSubmissions(workspaceId, callback, limitCount = 10) {
  if (!workspaceId) {

    callback([]);
    return () => {};
  }

  const helpRef = collection(db, `workspaces/${workspaceId}/helpSubmissions`);
  // Limit query to reduce reads - only load most recent submissions
  const q = query(helpRef, orderBy('timestamp', 'desc'), limit(limitCount));

  return onSnapshot(q, (snapshot) => {

    const submissions = snapshot.docs.map(doc => {
      const data = doc.data();
      
      return {
        ...data,
        id: doc.id,
        // Convert Firestore timestamp to Date object
        timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp),
        // Ensure member data exists with fallbacks
        member: data.member || {
          name: 'Unknown User',
          role: 'member',
          avatar: '👤',
          color: '#6B7280',
          uid: null
        }
      };
    });
    
    callback(submissions);
  }, (error) => {

    callback([]);
  });
}

/**
 * Submit a help request
 * @param {string} workspaceId - Workspace ID
 * @param {object} submission - Submission data
 * @returns {Promise<string>} Document ID
 */
export async function submitHelpRequest(workspaceId, submission) {
  if (!workspaceId) {
    throw new Error('Missing workspaceId');
  }

  const helpRef = collection(db, `workspaces/${workspaceId}/helpSubmissions`);
  
  const submissionData = {
    member: {
      name: submission.member?.name || 'Unknown User',
      role: submission.member?.role || 'member',
      avatar: submission.member?.avatar || '👤',
      avatarImg: submission.member?.avatarImg || null, // Profile picture
      color: submission.member?.color || '#6B7280',
      uid: submission.member?.uid || null
    },
    message: submission.message,
    createdBy: submission.member?.uid || null, // Track who created this help request
    timestamp: serverTimestamp(),
    status: 'pending',
    response: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  try {
    const docRef = await addDoc(helpRef, submissionData);

    return docRef.id;
  } catch (error) {

    throw error;
  }
}

/**
 * Resolve a help submission (admin/management only)
 * @param {string} workspaceId - Workspace ID
 * @param {string} submissionId - Submission document ID
 * @param {string} response - Admin response text
 * @param {string} resolvedByUid - UID of user resolving the submission
 * @param {object} resolverInfo - Info about the resolver { name, avatar, avatarImg, color, role }
 * @returns {Promise<void>}
 */
export async function resolveHelpSubmission(workspaceId, submissionId, response, resolvedByUid, resolverInfo) {
  if (!workspaceId || !submissionId) {
    throw new Error('Missing workspaceId or submissionId');
  }

  const submissionRef = doc(db, `workspaces/${workspaceId}/helpSubmissions`, submissionId);
  
  try {
    await updateDoc(submissionRef, {
      status: 'solved',
      response: response,
      resolvedBy: resolvedByUid, // Track who resolved it
      resolvedByInfo: {
        name: resolverInfo?.name || 'Admin',
        avatar: resolverInfo?.avatar || '👤',
        avatarImg: resolverInfo?.avatarImg || null,
        color: resolverInfo?.color || '#3B5BFC',
        role: resolverInfo?.role || 'admin'
      },
      resolvedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

  } catch (error) {

    throw error;
  }
}

/**
 * Update help submission response (edit existing response)
 * @param {string} workspaceId - Workspace ID
 * @param {string} submissionId - Submission document ID
 * @param {string} response - Updated response text
 * @returns {Promise<void>}
 */
export async function updateHelpResponse(workspaceId, submissionId, response) {
  if (!workspaceId || !submissionId) {
    throw new Error('Missing workspaceId or submissionId');
  }

  const submissionRef = doc(db, `workspaces/${workspaceId}/helpSubmissions`, submissionId);
  
  try {
    await updateDoc(submissionRef, {
      response: response,
      updatedAt: serverTimestamp()
    });

  } catch (error) {

    throw error;
  }
}
