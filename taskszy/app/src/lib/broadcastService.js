import { db } from './firebase';
import { collection, doc, addDoc, updateDoc, onSnapshot, serverTimestamp, query, orderBy, limit } from 'firebase/firestore';

/**
 * Broadcast Service
 * 
 * Handles team updates/announcements that are sent to all members or specific roles
 * Works globally across Admin, Management, and Team dashboards
 */

/**
 * Subscribe to broadcasts
 * @param {string} workspaceId - Workspace ID
 * @param {function} callback - Callback function to receive broadcasts
 * @param {number} limitCount - Maximum number of broadcasts to load (default: 20)
 * @returns {function} Unsubscribe function
 */
export function subscribeToBroadcasts(workspaceId, callback, limitCount = 20) {
  if (!workspaceId) {

    callback([]);
    return () => {};
  }

  const broadcastRef = collection(db, `workspaces/${workspaceId}/broadcasts`);
  const q = query(broadcastRef, orderBy('time', 'desc'), limit(limitCount));

  return onSnapshot(q, (snapshot) => {

    const broadcasts = snapshot.docs.map(doc => {
      const data = doc.data();
      
      return {
        ...data,
        id: doc.id,
        // Convert Firestore timestamp to Date object
        time: data.time?.toDate ? data.time.toDate() : new Date(data.time),
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt)
      };
    });
    
    callback(broadcasts);
  }, (error) => {

    callback([]);
  });
}

/**
 * Create a new broadcast
 * @param {string} workspaceId - Workspace ID
 * @param {object} broadcast - Broadcast data
 * @returns {Promise<string>} Document ID
 */
export async function createBroadcast(workspaceId, broadcast) {
  if (!workspaceId) {
    throw new Error('Missing workspaceId');
  }

  const broadcastRef = collection(db, `workspaces/${workspaceId}/broadcasts`);
  
  const broadcastData = {
    title: broadcast.title || '',
    message: broadcast.message,
    to: broadcast.to, // e.g., "All members" or "3 members"
    recipientMode: broadcast.recipientMode, // 'all' or 'role'
    selectedMembers: broadcast.selectedMembers || [], // Array of member IDs
    selectedRoles: broadcast.selectedRoles || [], // Array of role names
    recipientCount: broadcast.recipientCount,
    time: serverTimestamp(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: broadcast.createdBy || null, // UID of creator
    creatorInfo: broadcast.creatorInfo || null // { name, avatar, avatarImg, color, role }
  };

  try {
    const docRef = await addDoc(broadcastRef, broadcastData);

    return docRef.id;
  } catch (error) {

    throw error;
  }
}

/**
 * Update an existing broadcast
 * @param {string} workspaceId - Workspace ID
 * @param {string} broadcastId - Broadcast document ID
 * @param {object} updates - Fields to update
 * @returns {Promise<void>}
 */
export async function updateBroadcast(workspaceId, broadcastId, updates) {
  if (!workspaceId || !broadcastId) {
    throw new Error('Missing workspaceId or broadcastId');
  }

  const broadcastRef = doc(db, `workspaces/${workspaceId}/broadcasts`, String(broadcastId));
  
  try {
    await updateDoc(broadcastRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });

  } catch (error) {

    throw error;
  }
}

/**
 * Check if a member should see a broadcast based on recipient settings and join date
 * @param {object} broadcast - Broadcast object
 * @param {object} member - Member object with id, role, userRole, and joined date
 * @returns {boolean} True if member should see the broadcast
 */
export function shouldMemberSeeBroadcast(broadcast, member) {
  if (!broadcast || !member) return false;

  // IMPORTANT: Check if broadcast was created AFTER user joined
  // Users should NOT see broadcasts from before they joined the workspace
  if (member && broadcast.time) {
    try {
      let joinedDate = null;
      
      // Try to get join date from different possible fields:
      // 1. joinedDate or createdAt (Firestore Timestamp)
      // 2. joined (string date like "Jan 2026")
      if (member.joinedDate) {
        joinedDate = member.joinedDate instanceof Date ? member.joinedDate : member.joinedDate.toDate();
      } else if (member.createdAt) {
        joinedDate = member.createdAt instanceof Date ? member.createdAt : member.createdAt.toDate();
      } else if (member.joined) {
        // Parse string date (format: "Jan 2026" or full date)
        joinedDate = new Date(member.joined);
      }
      
      if (joinedDate && !isNaN(joinedDate.getTime())) {
        const broadcastDate = broadcast.time instanceof Date ? broadcast.time : new Date(broadcast.time);
        
        // If broadcast was created before user joined, don't show it
        if (broadcastDate < joinedDate) {

          return false;
        }
      }
    } catch (error) {

      // If date comparison fails, continue with role-based filtering
    }
  }

  // ADMIN EXCEPTION: Admin users see ALL broadcasts regardless of recipient settings
  // (but still filtered by join date above)
  if (member.userRole === 'admin') {
    return true;
  }

  // If broadcast is for all members
  if (broadcast.recipientMode === 'all') {
    return true;
  }

  // If broadcast is for specific roles
  if (broadcast.recipientMode === 'role') {
    // Check if member's role is in selectedRoles
    if (broadcast.selectedRoles && broadcast.selectedRoles.includes(member.role)) {
      return true;
    }
    // Also check if member ID is in selectedMembers (role members are added to this array)
    if (broadcast.selectedMembers && broadcast.selectedMembers.includes(member.id)) {
      return true;
    }
  }

  // MANAGEMENT EXCEPTION: Management users can see broadcasts they created
  if (member.userRole === 'management' && broadcast.createdBy === member.uid) {
    return true;
  }

  return false;
}

/**
 * Get broadcasts visible to a specific member
 * @param {array} broadcasts - Array of all broadcasts
 * @param {object} member - Member object with id, role, userRole, and uid
 * @returns {array} Filtered broadcasts
 */
export function getVisibleBroadcasts(broadcasts, member) {
  if (!broadcasts || !member) return [];
  
  return broadcasts.filter(broadcast => shouldMemberSeeBroadcast(broadcast, member));
}
