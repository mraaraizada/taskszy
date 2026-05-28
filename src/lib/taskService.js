/**
 * Task Service
 * 
 * Handles all task-related operations with Firestore
 * Firestore path: workspaces/{workspaceId}/tasks/{taskId}
 * 
 * Full Task Schema:
 * - id: string (e.g., "TSK-001" or "#AB12CD34")
 * - title: string
 * - description: string
 * - stage: string (New, Start, Issue, Review A, Review B, Update, Complete)
 * - deadline: Timestamp
 * - extendedDeadline: Timestamp (optional)
 * - totalBudget: number (in ₹)
 * - paid: boolean
 * - paidOn: Timestamp (optional)
 * - paused: boolean
 * - pausedOn: Timestamp (optional)
 * - issueNote: string (optional)
 * - note: string (admin internal note)
 * - updateNote: string (update request note)
 * - createdDate: Timestamp
 * - isScheduled: boolean
 * - scheduledFor: Timestamp (optional)
 * - tags: array of { label, emoji, color, bg }
 * - category: object { label, emoji, color, bg }
 * - members: array of { id, name, avatar, color, budget, stage, isOnHold, memberDesc }
 * - scribes: array of { type, title, assignMode, assignees }
 * - history: array of { stage, date, user, action, note }
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
  limit,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';

// ── Task Stage Constants ──────────────────────────────────────────────────────
export const TASK_STAGES = {
  NEW: 'New',
  START: 'Start',
  ISSUE: 'Issue',
  REVIEW_A: 'Review A',
  REVIEW_B: 'Review B',
  UPDATE: 'Update',
  COMPLETE: 'Complete',
};

export const STAGE_COLORS = {
  [TASK_STAGES.NEW]: '#9CA3AF',       // ⚪ Gray
  [TASK_STAGES.START]: '#3B5BFC',     // 🔵 Blue
  [TASK_STAGES.ISSUE]: '#EF4444',     // 🔴 Red
  [TASK_STAGES.REVIEW_A]: '#F97316',  // 🟠 Orange
  [TASK_STAGES.REVIEW_B]: '#7C3AED',  // 🟣 Purple
  [TASK_STAGES.UPDATE]: '#D97706',    // 🟡 Amber
  [TASK_STAGES.COMPLETE]: '#12C479',  // 🟢 Green
};

export const STAGE_BG = {
  [TASK_STAGES.NEW]: '#F3F4F6',
  [TASK_STAGES.START]: '#EEF2FF',
  [TASK_STAGES.ISSUE]: '#FEF2F2',
  [TASK_STAGES.REVIEW_A]: '#FFF7ED',
  [TASK_STAGES.REVIEW_B]: '#F5F3FF',
  [TASK_STAGES.UPDATE]: '#FFFBEB',
  [TASK_STAGES.COMPLETE]: '#ECFDF5',
};

// ── Helper Functions ──────────────────────────────────────────────────────────

/**
 * Get the Firestore path for tasks collection
 */
function getTasksPath(workspaceId) {
  if (!workspaceId) throw new Error('workspaceId is required');
  return `workspaces/${workspaceId}/tasks`;
}

/**
 * Get the Firestore path for a specific task
 */
function getTaskPath(workspaceId, taskId) {
  if (!workspaceId) throw new Error('workspaceId is required');
  if (!taskId) throw new Error('taskId is required');
  return `${getTasksPath(workspaceId)}/${taskId}`;
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
 * Prepare task data for Firestore (convert dates to Timestamps)
 */
function prepareTaskForFirestore(taskData) {
  const prepared = { ...taskData };

  // Convert date fields to Timestamps
  if (prepared.deadline && !(prepared.deadline instanceof Timestamp)) {
    prepared.deadline = Timestamp.fromDate(new Date(prepared.deadline));
  }
  if (prepared.extendedDeadline && !(prepared.extendedDeadline instanceof Timestamp)) {
    prepared.extendedDeadline = Timestamp.fromDate(new Date(prepared.extendedDeadline));
  }
  if (prepared.scheduledFor && !(prepared.scheduledFor instanceof Timestamp)) {
    prepared.scheduledFor = Timestamp.fromDate(new Date(prepared.scheduledFor));
  }
  if (prepared.paidOn && !(prepared.paidOn instanceof Timestamp)) {
    prepared.paidOn = Timestamp.fromDate(new Date(prepared.paidOn));
  }
  if (prepared.pausedOn && !(prepared.pausedOn instanceof Timestamp)) {
    prepared.pausedOn = Timestamp.fromDate(new Date(prepared.pausedOn));
  }
  if (prepared.createdDate && !(prepared.createdDate instanceof Timestamp)) {
    prepared.createdDate = Timestamp.fromDate(new Date(prepared.createdDate));
  }

  // Convert history dates to Timestamps
  if (prepared.history && Array.isArray(prepared.history)) {
    prepared.history = prepared.history.map(entry => ({
      ...entry,
      date: entry.date instanceof Timestamp ? entry.date : Timestamp.fromDate(new Date(entry.date)),
    }));
  }

  return prepared;
}

/**
 * Prepare task data from Firestore (convert Timestamps to Dates)
 */
function prepareTaskFromFirestore(taskData) {
  if (!taskData) return null;

  const prepared = { ...taskData };

  // Convert Timestamp fields to Dates
  if (prepared.deadline) prepared.deadline = timestampToDate(prepared.deadline);
  if (prepared.extendedDeadline) prepared.extendedDeadline = timestampToDate(prepared.extendedDeadline);
  if (prepared.scheduledFor) prepared.scheduledFor = timestampToDate(prepared.scheduledFor);
  if (prepared.paidOn) prepared.paidOn = timestampToDate(prepared.paidOn);
  if (prepared.pausedOn) prepared.pausedOn = timestampToDate(prepared.pausedOn);
  if (prepared.createdDate) prepared.createdDate = timestampToDate(prepared.createdDate);

  // Convert history dates
  if (prepared.history && Array.isArray(prepared.history)) {
    prepared.history = prepared.history.map(entry => ({
      ...entry,
      date: timestampToDate(entry.date),
    }));
  }

  return prepared;
}

// ── CRUD Operations ───────────────────────────────────────────────────────────

/**
 * Create a new task
 * @param {string} workspaceId - Workspace ID
 * @param {object} taskData - Task data object
 * @param {object} options - Additional options { createdBy: { name, source } }
 * @returns {Promise<object>} Created task
 */
export async function createTask(workspaceId, taskData, options = {}) {
  try {
    const { createdBy } = options;
    const now = new Date();
    const actor = createdBy?.name || 'Admin';
    const source = createdBy?.source ? ` via ${createdBy.source}` : '';

    // Build complete task object with all required fields
    const task = {
      // Core fields
      id: taskData.id,
      title: taskData.title || '',
      description: taskData.description || '',
      stage: taskData.stage || TASK_STAGES.NEW,
      
      // Dates
      deadline: taskData.deadline || null,
      extendedDeadline: taskData.extendedDeadline || null,
      createdDate: now,
      
      // Budget & Payment
      totalBudget: taskData.totalBudget || 0,
      paid: false,
      paidOn: null,
      
      // Status flags
      paused: false,
      pausedOn: null,
      isScheduled: taskData.isScheduled || false,
      scheduledFor: taskData.scheduledFor || null,
      
      // Notes
      note: taskData.note || '',
      issueNote: taskData.issueNote || '',
      updateNote: taskData.updateNote || '',
      
      // Metadata
      tags: taskData.tags || [],
      category: taskData.category || null,
      members: taskData.members || [],
      scribes: taskData.scribes || [],
      
      // History
      history: [
        {
          stage: taskData.stage || TASK_STAGES.NEW,
          date: now,
          user: actor,
          action: 'created',
          note: source || undefined,
        },
      ],
    };

    // Prepare for Firestore
    const firestoreTask = prepareTaskForFirestore(task);
    firestoreTask.createdDate = serverTimestamp();
    firestoreTask.updatedAt = serverTimestamp();

    // Write to Firestore
    const taskRef = doc(db, getTaskPath(workspaceId, task.id));
    await setDoc(taskRef, firestoreTask);

    return task;
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
}

/**
 * Get a task by ID
 * @param {string} workspaceId - Workspace ID
 * @param {string} taskId - Task ID
 * @returns {Promise<object|null>} Task object or null if not found
 */
export async function getTask(workspaceId, taskId) {
  try {
    const taskRef = doc(db, getTaskPath(workspaceId, taskId));
    const taskSnap = await getDoc(taskRef);

    if (!taskSnap.exists()) {
      return null;
    }

    return prepareTaskFromFirestore({ id: taskSnap.id, ...taskSnap.data() });
  } catch (error) {
    console.error('Error getting task:', error);
    throw error;
  }
}

/**
 * Get all tasks for a workspace
 * @param {string} workspaceId - Workspace ID
 * @param {object} options - Query options { stage, memberId, limit }
 * @returns {Promise<array>} Array of tasks
 */
export async function getTasks(workspaceId, options = {}) {
  try {
    const tasksRef = collection(db, getTasksPath(workspaceId));
    let q = query(tasksRef, orderBy('createdDate', 'desc'));

    // Apply filters
    if (options.stage) {
      q = query(q, where('stage', '==', options.stage));
    }

    if (options.limit) {
      q = query(q, limit(options.limit));
    }

    const snapshot = await getDocs(q);
    const tasks = snapshot.docs.map(doc => 
      prepareTaskFromFirestore({ id: doc.id, ...doc.data() })
    );

    // Filter by member if specified (client-side filter since members is an array)
    if (options.memberId) {
      return tasks.filter(task => 
        task.members?.some(m => m.id === options.memberId)
      );
    }

    return tasks;
  } catch (error) {
    console.error('Error getting tasks:', error);
    throw error;
  }
}

/**
 * Update a task
 * @param {string} workspaceId - Workspace ID
 * @param {string} taskId - Task ID
 * @param {object} updates - Fields to update
 * @param {object} options - Additional options { editedBy: { name } }
 * @returns {Promise<void>}
 */
export async function updateTask(workspaceId, taskId, updates, options = {}) {
  try {
    const { editedBy } = options;
    const actor = editedBy?.name || 'Admin';
    const now = new Date();

    // Prepare updates for Firestore
    const firestoreUpdates = prepareTaskForFirestore(updates);
    firestoreUpdates.updatedAt = serverTimestamp();

    // Add history entry if this is a significant edit
    if (updates.title || updates.description || updates.deadline || updates.totalBudget) {
      const task = await getTask(workspaceId, taskId);
      if (task) {
        const newHistory = [
          ...(task.history || []),
          {
            stage: task.stage,
            date: now,
            user: actor,
            action: 'edit',
          },
        ];
        firestoreUpdates.history = newHistory.map(entry => ({
          ...entry,
          date: entry.date instanceof Timestamp ? entry.date : Timestamp.fromDate(new Date(entry.date)),
        }));
      }
    }

    const taskRef = doc(db, getTaskPath(workspaceId, taskId));
    await updateDoc(taskRef, firestoreUpdates);
  } catch (error) {
    console.error('Error updating task:', error);
    throw error;
  }
}

/**
 * Update task stage
 * @param {string} workspaceId - Workspace ID
 * @param {string} taskId - Task ID
 * @param {string} newStage - New stage value
 * @param {object} options - { memberId, actorName, issueNote }
 * @returns {Promise<void>}
 */
export async function updateTaskStage(workspaceId, taskId, newStage, options = {}) {
  try {
    const { memberId, actorName, issueNote } = options;
    const task = await getTask(workspaceId, taskId);
    if (!task) throw new Error('Task not found');

    const now = new Date();
    const actor = actorName || (memberId ? task.members.find(m => m.id === memberId)?.name || 'Member' : 'Admin');

    // Create history entry
    const historyEntry = {
      stage: newStage,
      date: now,
      user: actor,
      action: 'updated',
      note: issueNote || undefined,
    };

    const updates = {
      updatedAt: serverTimestamp(),
      history: [
        ...(task.history || []),
        {
          ...historyEntry,
          date: Timestamp.fromDate(historyEntry.date),
        },
      ],
    };

    // Update issue note if provided
    if (issueNote) {
      updates.issueNote = issueNote;
    }

    // Update member-specific stage or task-wide stage
    if (memberId !== null && memberId !== undefined) {
      // Update specific member's stage
      const updatedMembers = task.members.map(m =>
        m.id === memberId ? { ...m, stage: newStage } : m
      );
      updates.members = updatedMembers;

      // Derive task's overall stage from members
      const stageOrder = Object.values(TASK_STAGES);
      const memberStages = updatedMembers.map(m => m.stage);
      const minIdx = Math.min(...memberStages.map(s => stageOrder.indexOf(s)));
      updates.stage = stageOrder[minIdx] || task.stage;
    } else {
      // Update all members (except those on hold)
      updates.stage = newStage;
      updates.members = task.members.map(m =>
        m.isOnHold ? m : { ...m, stage: newStage }
      );
    }

    // Auto-mark as paid if completing
    if (newStage === TASK_STAGES.COMPLETE) {
      updates.paid = true;
      updates.paidOn = serverTimestamp();
    }

    const taskRef = doc(db, getTaskPath(workspaceId, taskId));
    await updateDoc(taskRef, updates);
  } catch (error) {
    console.error('Error updating task stage:', error);
    throw error;
  }
}

/**
 * Mark task as paid
 * @param {string} workspaceId - Workspace ID
 * @param {string} taskId - Task ID
 * @param {object} options - { paidBy: { name }, source }
 * @returns {Promise<void>}
 */
export async function markTaskPaid(workspaceId, taskId, options = {}) {
  try {
    const { paidBy, source } = options;
    const task = await getTask(workspaceId, taskId);
    if (!task) throw new Error('Task not found');

    const now = new Date();
    const actor = paidBy?.name || 'Admin';

    const historyEntry = {
      stage: TASK_STAGES.COMPLETE,
      date: now,
      user: actor,
      action: 'paid',
      note: source || undefined,
    };

    const updates = {
      stage: TASK_STAGES.COMPLETE,
      paid: true,
      paidOn: serverTimestamp(),
      members: task.members.map(m => ({ ...m, stage: TASK_STAGES.COMPLETE })),
      history: [
        ...(task.history || []),
        {
          ...historyEntry,
          date: Timestamp.fromDate(historyEntry.date),
        },
      ],
      updatedAt: serverTimestamp(),
    };

    const taskRef = doc(db, getTaskPath(workspaceId, taskId));
    await updateDoc(taskRef, updates);
  } catch (error) {
    console.error('Error marking task as paid:', error);
    throw error;
  }
}

/**
 * Pause a task
 * @param {string} workspaceId - Workspace ID
 * @param {string} taskId - Task ID
 * @returns {Promise<void>}
 */
export async function pauseTask(workspaceId, taskId) {
  try {
    const task = await getTask(workspaceId, taskId);
    if (!task) throw new Error('Task not found');

    const now = new Date();
    const historyEntry = {
      stage: task.stage,
      date: now,
      user: 'Admin',
      action: 'paused',
    };

    const updates = {
      paused: true,
      pausedOn: serverTimestamp(),
      history: [
        ...(task.history || []),
        {
          ...historyEntry,
          date: Timestamp.fromDate(historyEntry.date),
        },
      ],
      updatedAt: serverTimestamp(),
    };

    const taskRef = doc(db, getTaskPath(workspaceId, taskId));
    await updateDoc(taskRef, updates);
  } catch (error) {
    console.error('Error pausing task:', error);
    throw error;
  }
}

/**
 * Resume a paused task
 * @param {string} workspaceId - Workspace ID
 * @param {string} taskId - Task ID
 * @returns {Promise<void>}
 */
export async function resumeTask(workspaceId, taskId) {
  try {
    const task = await getTask(workspaceId, taskId);
    if (!task) throw new Error('Task not found');

    const now = new Date();
    const historyEntry = {
      stage: task.stage,
      date: now,
      user: 'Admin',
      action: 'resumed',
    };

    const updates = {
      paused: false,
      pausedOn: null,
      history: [
        ...(task.history || []),
        {
          ...historyEntry,
          date: Timestamp.fromDate(historyEntry.date),
        },
      ],
      updatedAt: serverTimestamp(),
    };

    const taskRef = doc(db, getTaskPath(workspaceId, taskId));
    await updateDoc(taskRef, updates);
  } catch (error) {
    console.error('Error resuming task:', error);
    throw error;
  }
}

/**
 * Delete a task (move to trash)
 * @param {string} workspaceId - Workspace ID
 * @param {string} taskId - Task ID
 * @param {object} options - { deletedBy: { name } }
 * @returns {Promise<object>} Deleted task data
 */
export async function deleteTask(workspaceId, taskId, options = {}) {
  try {
    const { deletedBy } = options;
    const task = await getTask(workspaceId, taskId);
    if (!task) throw new Error('Task not found');

    // Move to trash collection
    const trashedTask = {
      ...task,
      _trashType: 'task',
      _deletedBy: deletedBy,
      _deletedAt: new Date(),
    };

    const trashRef = doc(db, `workspaces/${workspaceId}/trash`, taskId);
    await setDoc(trashRef, prepareTaskForFirestore(trashedTask));

    // Delete from tasks collection
    const taskRef = doc(db, getTaskPath(workspaceId, taskId));
    await deleteDoc(taskRef);

    return trashedTask;
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
}

/**
 * Add a history entry to a task
 * @param {string} workspaceId - Workspace ID
 * @param {string} taskId - Task ID
 * @param {object} entry - History entry { stage, date, user, action, note }
 * @returns {Promise<void>}
 */
export async function addTaskHistoryEntry(workspaceId, taskId, entry) {
  try {
    const task = await getTask(workspaceId, taskId);
    if (!task) throw new Error('Task not found');

    const newHistory = [
      ...(task.history || []),
      {
        ...entry,
        date: entry.date || new Date(),
      },
    ];

    const updates = {
      history: newHistory.map(e => ({
        ...e,
        date: e.date instanceof Timestamp ? e.date : Timestamp.fromDate(new Date(e.date)),
      })),
      updatedAt: serverTimestamp(),
    };

    const taskRef = doc(db, getTaskPath(workspaceId, taskId));
    await updateDoc(taskRef, updates);
  } catch (error) {
    console.error('Error adding task history entry:', error);
    throw error;
  }
}

/**
 * Update task note (admin internal note)
 * @param {string} workspaceId - Workspace ID
 * @param {string} taskId - Task ID
 * @param {string} note - Note content
 * @returns {Promise<void>}
 */
export async function updateTaskNote(workspaceId, taskId, note) {
  try {
    const taskRef = doc(db, getTaskPath(workspaceId, taskId));
    await updateDoc(taskRef, {
      note,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating task note:', error);
    throw error;
  }
}

// ── Query Helpers ─────────────────────────────────────────────────────────────

/**
 * Get tasks by stage
 * @param {string} workspaceId - Workspace ID
 * @param {string} stage - Stage name
 * @returns {Promise<array>} Array of tasks
 */
export async function getTasksByStage(workspaceId, stage) {
  return getTasks(workspaceId, { stage });
}

/**
 * Get tasks assigned to a member
 * @param {string} workspaceId - Workspace ID
 * @param {string|number} memberId - Member ID
 * @returns {Promise<array>} Array of tasks
 */
export async function getTasksByMember(workspaceId, memberId) {
  return getTasks(workspaceId, { memberId });
}

/**
 * Get overdue tasks
 * @param {string} workspaceId - Workspace ID
 * @returns {Promise<array>} Array of overdue tasks
 */
export async function getOverdueTasks(workspaceId) {
  const tasks = await getTasks(workspaceId);
  const now = new Date();
  return tasks.filter(task => 
    task.deadline &&
    new Date(task.deadline) < now &&
    task.stage !== TASK_STAGES.COMPLETE
  );
}

/**
 * Get scheduled tasks
 * @param {string} workspaceId - Workspace ID
 * @returns {Promise<array>} Array of scheduled tasks
 */
export async function getScheduledTasks(workspaceId) {
  const tasks = await getTasks(workspaceId);
  return tasks.filter(task => task.isScheduled && task.scheduledFor);
}

/**
 * Get tasks pending payment
 * @param {string} workspaceId - Workspace ID
 * @returns {Promise<array>} Array of tasks pending payment
 */
export async function getTasksPendingPayment(workspaceId) {
  const tasks = await getTasks(workspaceId);
  return tasks.filter(task => 
    task.stage === TASK_STAGES.COMPLETE && !task.paid
  );
}
