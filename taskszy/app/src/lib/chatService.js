/**
 * Chat Service - Task Chat Access Control
 * Phase 9: Implements access control for task chat
 */

/**
 * Check if a user can access task chat
 * @param {Object} task - The task object
 * @param {Object} currentUser - The current user object
 * @returns {boolean} - True if user can access chat, false otherwise
 */
export function canAccessTaskChat(task, currentUser) {
  if (!task || !currentUser) {

    return false;
  }

  // Admin users can access all chats (whether assigned or not)
  if (currentUser.userRole === 'admin') {

    return true;
  }

  // Management users can access all chats (whether assigned or not)
  if (currentUser.userRole === 'manager' || currentUser.userRole === 'management') {

    return true;
  }

  // Team members can only access chats for tasks they are assigned to
  const userId = currentUser.memberId || currentUser.id;
  
  if (!userId) {

    return false;
  }

  // Check memberIds array (preferred)
  if (task.memberIds && Array.isArray(task.memberIds)) {
    const isInMemberIds = task.memberIds.some(id => String(id) === String(userId));
    if (isInMemberIds) {

      return true;
    }
  }

  // Check members array (fallback)
  if (task.members && Array.isArray(task.members)) {
    const isInMembers = task.members.some(m => String(m.id) === String(userId));
    if (isInMembers) {

      return true;
    }
  }

  return false;
}

/**
 * Get unread message count for a task
 * @param {Object} task - The task object with unreadCount property
 * @returns {number} - Number of unread messages
 */
export function getUnreadCount(task) {
  return task?.unreadCount || 0;
}
