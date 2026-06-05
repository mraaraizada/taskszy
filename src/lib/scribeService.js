/**
 * Scribe Service (Notes & Sheets)
 * 
 * Handles all scribe-related operations with Firestore
 * Firestore path: workspaces/{workspaceId}/notes/{noteId}
 * 
 * Scribe Schema:
 * - id: string/number
 * - type: string ('note' | 'sheet')
 * - title: string
 * - tags: array of strings
 * - date: string (formatted date)
 * - body: string (for notes)
 * - archived: boolean
 * - joinCode: string (6-8 char uppercase code for joining)
 * - taskId: string (optional - if linked to a task)
 * - taskTitle: string (optional - task title for display)
 * - assignees: array of member IDs
 * - assignMode: string ('all' | 'specific')
 * - members: array of member IDs (resolved members with access)
 * - createdBy: string (creator name)
 * - tagColors: object { tagName: { color, bg } }
 * - createdDate: Timestamp
 * - updatedAt: Timestamp
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';

// ── Helper Functions ──────────────────────────────────────────────────────────

/**
 * Get the Firestore path for notes collection
 */
function getNotesPath(workspaceId) {
  if (!workspaceId) throw new Error('workspaceId is required');
  return `workspaces/${workspaceId}/notes`;
}

/**
 * Get the Firestore path for a specific note
 */
function getNotePath(workspaceId, noteId) {
  if (!workspaceId) throw new Error('workspaceId is required');
  if (!noteId) throw new Error('noteId is required');
  return `${getNotesPath(workspaceId)}/${noteId}`;
}

/**
 * Generate a random join code (6-8 characters, uppercase)
 */
export function generateJoinCode(length = 6) {
  return Math.random().toString(36).slice(2, 2 + length).toUpperCase();
}

/**
 * Convert Firestore Timestamp to Date
 */
function timestampToDate(timestamp) {
  if (!timestamp) return null;
  if (timestamp instanceof Timestamp) return timestamp.toDate();
  if (timestamp.toDate) return timestamp.toDate();
  return new Date(timestamp);
}

/**
 * Prepare scribe data for Firestore
 */
function prepareScribeForFirestore(scribeData) {
  const prepared = { ...scribeData };

  // Convert date fields to Timestamps if needed
  if (prepared.createdDate && !(prepared.createdDate instanceof Timestamp)) {
    prepared.createdDate = Timestamp.fromDate(new Date(prepared.createdDate));
  }

  return prepared;
}

/**
 * Prepare scribe data from Firestore
 */
function prepareScribeFromFirestore(scribeData) {
  if (!scribeData) return null;

  const prepared = { ...scribeData };

  // Convert Timestamp fields to Dates
  if (prepared.createdDate) prepared.createdDate = timestampToDate(prepared.createdDate);
  if (prepared.updatedAt) prepared.updatedAt = timestampToDate(prepared.updatedAt);

  return prepared;
}

// ── CRUD Operations ───────────────────────────────────────────────────────────

/**
 * Create a new note or sheet
 * @param {string} workspaceId - Workspace ID
 * @param {object} scribeData - Scribe data object
 * @param {object} options - Additional options { createdBy }
 * @returns {Promise<object>} Created scribe
 */
export async function createScribe(workspaceId, scribeData, options = {}) {
  try {
    const { createdBy } = options;
    const now = new Date();

    // Build complete scribe object
    const scribe = {
      id: scribeData.id || Date.now(),
      type: scribeData.type || 'note', // 'note' or 'sheet'
      title: scribeData.title || 'Untitled',
      tags: scribeData.tags || [],
      date: scribeData.date || now.toLocaleDateString('en-US', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric' 
      }),
      body: scribeData.body || '', // For notes
      archived: false,
      joinCode: scribeData.joinCode || generateJoinCode(),
      
      // Task linking (optional)
      taskId: scribeData.taskId || null,
      taskTitle: scribeData.taskTitle || null,
      
      // Member access
      assignees: scribeData.assignees || [],
      assignMode: scribeData.assignMode || 'all', // 'all' or 'specific'
      members: scribeData.members || [], // Resolved member IDs with access
      
      // Metadata
      createdBy: createdBy || scribeData.createdBy || 'Admin',
      tagColors: scribeData.tagColors || {},
      createdDate: now,
    };

    // Prepare for Firestore
    const firestoreScribe = prepareScribeForFirestore(scribe);
    firestoreScribe.createdDate = serverTimestamp();
    firestoreScribe.updatedAt = serverTimestamp();

    // Write to Firestore
    const scribeRef = doc(db, getNotePath(workspaceId, scribe.id));
    await setDoc(scribeRef, firestoreScribe);

    return scribe;
  } catch (error) {

    throw error;
  }
}

/**
 * Get a scribe by ID
 * @param {string} workspaceId - Workspace ID
 * @param {string} noteId - Note/Scribe ID
 * @returns {Promise<object|null>} Scribe object or null if not found
 */
export async function getScribe(workspaceId, noteId) {
  try {
    const scribeRef = doc(db, getNotePath(workspaceId, noteId));
    const scribeSnap = await getDoc(scribeRef);

    if (!scribeSnap.exists()) {
      return null;
    }

    return prepareScribeFromFirestore({ id: scribeSnap.id, ...scribeSnap.data() });
  } catch (error) {

    throw error;
  }
}

/**
 * Get all scribes for a workspace
 * @param {string} workspaceId - Workspace ID
 * @param {object} options - Query options { type, taskId, memberId, includeArchived }
 * @returns {Promise<array>} Array of scribes
 */
export async function getScribes(workspaceId, options = {}) {
  try {
    const notesRef = collection(db, getNotesPath(workspaceId));
    let q = query(notesRef);

    // Apply filters
    if (options.type) {
      q = query(q, where('type', '==', options.type));
    }

    if (options.taskId) {
      q = query(q, where('taskId', '==', options.taskId));
    }

    const snapshot = await getDocs(q);
    let scribes = snapshot.docs.map(doc => 
      prepareScribeFromFirestore({ id: doc.id, ...doc.data() })
    );

    // Client-side filters
    if (!options.includeArchived) {
      scribes = scribes.filter(s => !s.archived);
    }

    // Filter by member access
    if (options.memberId) {
      scribes = scribes.filter(s => {
        // If assignMode is 'all', everyone has access
        if (s.assignMode === 'all') return true;
        // Otherwise check if member is in the members array
        return s.members?.includes(String(options.memberId));
      });
    }

    return scribes;
  } catch (error) {

    throw error;
  }
}

/**
 * Update a scribe
 * @param {string} workspaceId - Workspace ID
 * @param {string} noteId - Note/Scribe ID
 * @param {object} updates - Fields to update
 * @returns {Promise<void>}
 */
export async function updateScribe(workspaceId, noteId, updates) {
  try {
    // Prepare updates for Firestore
    const firestoreUpdates = prepareScribeForFirestore(updates);
    firestoreUpdates.updatedAt = serverTimestamp();

    const scribeRef = doc(db, getNotePath(workspaceId, noteId));
    await updateDoc(scribeRef, firestoreUpdates);
  } catch (error) {

    throw error;
  }
}

/**
 * Archive/unarchive a scribe
 * @param {string} workspaceId - Workspace ID
 * @param {string} noteId - Note/Scribe ID
 * @param {boolean} archived - Archive state
 * @returns {Promise<void>}
 */
export async function archiveScribe(workspaceId, noteId, archived = true) {
  try {
    const scribeRef = doc(db, getNotePath(workspaceId, noteId));
    await updateDoc(scribeRef, {
      archived,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {

    throw error;
  }
}

/**
 * Delete a scribe (move to trash)
 * @param {string} workspaceId - Workspace ID
 * @param {string} noteId - Note/Scribe ID
 * @param {object} options - { deletedBy: { name, id, role, avatar, color } }
 * @returns {Promise<object>} Deleted scribe data
 */
export async function deleteScribe(workspaceId, noteId, options = {}) {
  try {
    const { deletedBy } = options;
    const scribe = await getScribe(workspaceId, noteId);
    if (!scribe) throw new Error('Scribe not found');

    // Move to trash collection
    const trashedScribe = {
      ...scribe,
      _trashType: 'note',
      _deletedBy: deletedBy,
      _deletedAt: new Date(),
    };

    const trashRef = doc(db, `workspaces/${workspaceId}/trash`, noteId);
    await setDoc(trashRef, prepareScribeForFirestore(trashedScribe));

    // Delete from notes collection
    const scribeRef = doc(db, getNotePath(workspaceId, noteId));
    await deleteDoc(scribeRef);

    return trashedScribe;
  } catch (error) {

    throw error;
  }
}

/**
 * Add a member to a scribe
 * @param {string} workspaceId - Workspace ID
 * @param {string} noteId - Note/Scribe ID
 * @param {string|number} memberId - Member ID to add
 * @returns {Promise<void>}
 */
export async function addMemberToScribe(workspaceId, noteId, memberId) {
  try {
    const scribe = await getScribe(workspaceId, noteId);
    if (!scribe) throw new Error('Scribe not found');

    const members = scribe.members || [];
    if (members.includes(String(memberId))) {
      return; // Already a member
    }

    const updatedMembers = [...members, String(memberId)];

    const scribeRef = doc(db, getNotePath(workspaceId, noteId));
    await updateDoc(scribeRef, {
      members: updatedMembers,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {

    throw error;
  }
}

/**
 * Remove a member from a scribe
 * @param {string} workspaceId - Workspace ID
 * @param {string} noteId - Note/Scribe ID
 * @param {string|number} memberId - Member ID to remove
 * @returns {Promise<void>}
 */
export async function removeMemberFromScribe(workspaceId, noteId, memberId) {
  try {
    const scribe = await getScribe(workspaceId, noteId);
    if (!scribe) throw new Error('Scribe not found');

    const members = scribe.members || [];
    const updatedMembers = members.filter(id => id !== String(memberId));

    const scribeRef = doc(db, getNotePath(workspaceId, noteId));
    await updateDoc(scribeRef, {
      members: updatedMembers,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {

    throw error;
  }
}

/**
 * Find a scribe by join code
 * @param {string} workspaceId - Workspace ID
 * @param {string} joinCode - Join code to search for
 * @returns {Promise<object|null>} Scribe object or null if not found
 */
export async function findScribeByJoinCode(workspaceId, joinCode) {
  try {
    const notesRef = collection(db, getNotesPath(workspaceId));
    const q = query(notesRef, where('joinCode', '==', joinCode.toUpperCase()));
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return prepareScribeFromFirestore({ id: doc.id, ...doc.data() });
  } catch (error) {

    throw error;
  }
}

/**
 * Add a tag to a scribe
 * @param {string} workspaceId - Workspace ID
 * @param {string} noteId - Note/Scribe ID
 * @param {string} tag - Tag label
 * @param {object} tagColor - Optional { color, bg }
 * @returns {Promise<void>}
 */
export async function addTagToScribe(workspaceId, noteId, tag, tagColor = null) {
  try {
    const scribe = await getScribe(workspaceId, noteId);
    if (!scribe) throw new Error('Scribe not found');

    const tags = scribe.tags || [];
    if (tags.includes(tag)) {
      return; // Tag already exists
    }

    const updatedTags = [...tags, tag];
    const updates = {
      tags: updatedTags,
      updatedAt: serverTimestamp(),
    };

    // Add tag color if provided
    if (tagColor) {
      updates.tagColors = {
        ...(scribe.tagColors || {}),
        [tag]: tagColor,
      };
    }

    const scribeRef = doc(db, getNotePath(workspaceId, noteId));
    await updateDoc(scribeRef, updates);
  } catch (error) {

    throw error;
  }
}

/**
 * Remove a tag from a scribe
 * @param {string} workspaceId - Workspace ID
 * @param {string} noteId - Note/Scribe ID
 * @param {string} tag - Tag label to remove
 * @returns {Promise<void>}
 */
export async function removeTagFromScribe(workspaceId, noteId, tag) {
  try {
    const scribe = await getScribe(workspaceId, noteId);
    if (!scribe) throw new Error('Scribe not found');

    const tags = scribe.tags || [];
    const updatedTags = tags.filter(t => t !== tag);

    const scribeRef = doc(db, getNotePath(workspaceId, noteId));
    await updateDoc(scribeRef, {
      tags: updatedTags,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {

    throw error;
  }
}

// ── Query Helpers ─────────────────────────────────────────────────────────────

/**
 * Get all notes (type: 'note')
 * @param {string} workspaceId - Workspace ID
 * @param {object} options - Query options
 * @returns {Promise<array>} Array of notes
 */
export async function getNotes(workspaceId, options = {}) {
  return getScribes(workspaceId, { ...options, type: 'note' });
}

/**
 * Get all sheets (type: 'sheet')
 * @param {string} workspaceId - Workspace ID
 * @param {object} options - Query options
 * @returns {Promise<array>} Array of sheets
 */
export async function getSheets(workspaceId, options = {}) {
  return getScribes(workspaceId, { ...options, type: 'sheet' });
}

/**
 * Get scribes linked to a specific task
 * @param {string} workspaceId - Workspace ID
 * @param {string} taskId - Task ID
 * @returns {Promise<array>} Array of task-linked scribes
 */
export async function getScribesByTask(workspaceId, taskId) {
  return getScribes(workspaceId, { taskId });
}

/**
 * Get scribes accessible by a specific member
 * @param {string} workspaceId - Workspace ID
 * @param {string|number} memberId - Member ID
 * @returns {Promise<array>} Array of accessible scribes
 */
export async function getScribesByMember(workspaceId, memberId) {
  return getScribes(workspaceId, { memberId });
}

/**
 * Get archived scribes
 * @param {string} workspaceId - Workspace ID
 * @returns {Promise<array>} Array of archived scribes
 */
export async function getArchivedScribes(workspaceId) {
  const allScribes = await getScribes(workspaceId, { includeArchived: true });
  return allScribes.filter(s => s.archived);
}
