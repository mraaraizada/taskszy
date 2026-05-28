import { db } from './firebase';
import { collection, doc, setDoc, getDoc, updateDoc, arrayUnion, arrayRemove, onSnapshot } from 'firebase/firestore';

/**
 * Calendar Events Service
 * 
 * For Admin/Management: Events are stored in a shared collection
 * For Team Members: Events are stored per user
 */

// Get the calendar document reference
function getCalendarRef(orgId, userId = null, isShared = true) {
  let path;
  if (isShared) {
    // Shared calendar for admin/management
    path = `workspaces/${orgId}/calendar/shared`;
  } else {
    // Personal calendar for team members
    path = `workspaces/${orgId}/calendar/users/${userId}/events`;
  }
  console.log('📅 Calendar path:', path);
  return doc(db, path);
}

/**
 * Load calendar events
 * @param {string} orgId - Organization ID
 * @param {string} userId - User ID (required for personal calendars)
 * @param {boolean} isShared - Whether this is a shared calendar (admin/management) or personal (team)
 * @param {function} callback - Callback function to receive events
 * @returns {function} Unsubscribe function
 * 
 * Note: Calendar events are typically small in number, so no limit is applied
 */
export function subscribeToCalendarEvents(orgId, userId, isShared, callback) {
  const calendarRef = getCalendarRef(orgId, userId, isShared);
  
  console.log('📅 Setting up calendar subscription', { orgId, userId, isShared });
  
  return onSnapshot(calendarRef, (snapshot) => {
    console.log('📅 Calendar snapshot received', { 
      exists: snapshot.exists(), 
      data: snapshot.data(),
      reads: 1 // Single document read
    });
    if (snapshot.exists()) {
      const data = snapshot.data();
      callback(data.events || []);
    } else {
      console.log('📅 Calendar document does not exist yet');
      callback([]);
    }
  }, (error) => {
    console.error('❌ Error loading calendar events:', error);
    callback([]);
  });
}

/**
 * Add a calendar event
 * @param {string} orgId - Organization ID
 * @param {string} userId - User ID (required for personal calendars)
 * @param {boolean} isShared - Whether this is a shared calendar
 * @param {object} event - Event object { date, name, color, month, year, id }
 */
export async function addCalendarEvent(orgId, userId, isShared, event) {
  const calendarRef = getCalendarRef(orgId, userId, isShared);
  
  console.log('📅 Adding calendar event', { orgId, userId, isShared, event });
  
  try {
    const snapshot = await getDoc(calendarRef);
    
    // Add unique ID to event
    const eventWithId = {
      ...event,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      createdBy: userId
    };
    
    console.log('📅 Event with ID:', eventWithId);
    
    if (snapshot.exists()) {
      // Update existing document
      console.log('📅 Updating existing calendar document');
      await updateDoc(calendarRef, {
        events: arrayUnion(eventWithId),
        updatedAt: new Date().toISOString()
      });
    } else {
      // Create new document
      console.log('📅 Creating new calendar document');
      await setDoc(calendarRef, {
        events: [eventWithId],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    
    console.log('✅ Calendar event added successfully');
    return eventWithId;
  } catch (error) {
    console.error('❌ Error adding calendar event:', error);
    throw error;
  }
}

/**
 * Remove a calendar event
 * @param {string} orgId - Organization ID
 * @param {string} userId - User ID (required for personal calendars)
 * @param {boolean} isShared - Whether this is a shared calendar
 * @param {object} event - Event object to remove
 */
export async function removeCalendarEvent(orgId, userId, isShared, event) {
  const calendarRef = getCalendarRef(orgId, userId, isShared);
  
  try {
    await updateDoc(calendarRef, {
      events: arrayRemove(event),
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error removing calendar event:', error);
    throw error;
  }
}

/**
 * Load calendar events once (no subscription)
 * @param {string} orgId - Organization ID
 * @param {string} userId - User ID (required for personal calendars)
 * @param {boolean} isShared - Whether this is a shared calendar
 * @returns {Promise<Array>} Array of events
 */
export async function loadCalendarEvents(orgId, userId, isShared) {
  const calendarRef = getCalendarRef(orgId, userId, isShared);
  
  try {
    const snapshot = await getDoc(calendarRef);
    if (snapshot.exists()) {
      const data = snapshot.data();
      return data.events || [];
    }
    return [];
  } catch (error) {
    console.error('Error loading calendar events:', error);
    return [];
  }
}
