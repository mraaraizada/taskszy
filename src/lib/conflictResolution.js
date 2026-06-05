/**
 * Conflict Resolution for Collaborative Editing
 * Handles concurrent edits to Scribe notes and sheets
 * Implements 3-way merge algorithm for intelligent conflict resolution
 */

import { doc, runTransaction, serverTimestamp, onSnapshot, getDoc } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Normalize text for comparison
 * - Trim trailing whitespace
 * - Normalize line endings
 */
function normalizeText(text) {
  if (!text) return '';
  return text
    .replace(/\r\n/g, '\n') // Normalize line endings
    .split('\n')
    .map(line => line.trimEnd()) // Trim trailing spaces
    .join('\n');
}

/**
 * Find common prefix between two strings
 */
function findCommonPrefix(str1, str2) {
  let i = 0;
  const minLen = Math.min(str1.length, str2.length);
  while (i < minLen && str1[i] === str2[i]) {
    i++;
  }
  return str1.substring(0, i);
}

/**
 * Find common suffix between two strings
 */
function findCommonSuffix(str1, str2) {
  let i = 0;
  const minLen = Math.min(str1.length, str2.length);
  while (i < minLen && str1[str1.length - 1 - i] === str2[str2.length - 1 - i]) {
    i++;
  }
  return str1.substring(str1.length - i);
}

/**
 * Merge strategies for different field types
 */
const MERGE_STRATEGIES = {
  // Text fields: Use operational transformation
  TEXT: 'text',
  // Arrays: Merge unique items
  ARRAY: 'array',
  // Objects: Deep merge
  OBJECT: 'object',
  // Primitives: Last write wins with timestamp
  PRIMITIVE: 'primitive',
};

/**
 * Detect merge strategy for a field
 */
function detectStrategy(value) {
  if (typeof value === 'string') return MERGE_STRATEGIES.TEXT;
  if (Array.isArray(value)) return MERGE_STRATEGIES.ARRAY;
  if (typeof value === 'object' && value !== null) return MERGE_STRATEGIES.OBJECT;
  return MERGE_STRATEGIES.PRIMITIVE;
}

/**
 * Longest Common Subsequence (LCS) algorithm
 * Used for computing line-based diffs
 */
function longestCommonSubsequence(arr1, arr2) {
  const m = arr1.length;
  const n = arr2.length;
  const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  
  // Build LCS table
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (arr1[i - 1] === arr2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  
  // Backtrack to find LCS
  const lcs = [];
  let i = m;
  let j = n;
  
  while (i > 0 && j > 0) {
    if (arr1[i - 1] === arr2[j - 1]) {
      lcs.unshift([i - 1, j - 1]);
      i--;
      j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }
  
  return lcs;
}

/**
 * 3-Way Merge Algorithm
 * Compares base, local, and remote to identify actual changes
 * Uses a proper diff algorithm to handle insertions and deletions
 * 
 * @param {string} baseText - Original text before editing
 * @param {string} localText - Current user's version
 * @param {string} remoteText - Other user's version from Firestore
 * @param {object} userInfo - { localUserName, remoteUserName }
 * @returns {object} { mergedText, hasConflicts, conflictCount }
 */
function merge3Way(baseText, localText, remoteText, userInfo = {}) {
  // Normalize inputs
  const base = normalizeText(baseText || '');
  const local = normalizeText(localText || '');
  const remote = normalizeText(remoteText || '');

  // Quick checks
  if (local === remote) {

    return { mergedText: localText, hasConflicts: false, conflictCount: 0 };
  }
  
  if (local === base) {

    return { mergedText: remoteText, hasConflicts: false, conflictCount: 0 };
  }
  
  if (remote === base) {

    return { mergedText: localText, hasConflicts: false, conflictCount: 0 };
  }
  
  // Check if one version contains the other (append-only scenario)
  if (local.includes(base) && remote.includes(base)) {
    const localAddition = local.substring(base.length);
    const remoteAddition = remote.substring(base.length);
    
    if (localAddition && remoteAddition && !localAddition.includes(remoteAddition) && !remoteAddition.includes(localAddition)) {
      // Both users appended different content - merge both

      return { 
        mergedText: base + localAddition + '\n' + remoteAddition, 
        hasConflicts: false, 
        conflictCount: 0 
      };
    }
  }
  
  // Perform proper 3-way merge using diff
  const baseLines = base.split('\n');
  const localLines = local.split('\n');
  const remoteLines = remote.split('\n');
  
  const result = merge3WayWithDiff(baseLines, localLines, remoteLines, userInfo);

  return {
    mergedText: result.lines.join('\n'),
    hasConflicts: result.conflictCount > 0,
    conflictCount: result.conflictCount,
  };
}

/**
 * 3-Way merge using proper diff algorithm
 * Computes what changed from base to local and base to remote
 * Then merges the changes intelligently WITHOUT conflict markers
 * Always combines both users' changes
 */
function merge3WayWithDiff(baseLines, localLines, remoteLines, userInfo) {
  // Compute diffs
  const localDiff = computeLineDiff(baseLines, localLines);
  const remoteDiff = computeLineDiff(baseLines, remoteLines);

  const merged = [];
  let conflictCount = 0;
  
  let baseIdx = 0;
  let localIdx = 0;
  let remoteIdx = 0;
  
  // Process all lines
  while (baseIdx < baseLines.length || localIdx < localLines.length || remoteIdx < remoteLines.length) {
    // Find changes at current base position
    const localChange = localDiff.changes.find(c => c.baseStart <= baseIdx && baseIdx < c.baseStart + c.baseCount);
    const remoteChange = remoteDiff.changes.find(c => c.baseStart <= baseIdx && baseIdx < c.baseStart + c.baseCount);
    
    if (!localChange && !remoteChange) {
      // No changes at this position - copy from base
      if (baseIdx < baseLines.length) {
        merged.push(baseLines[baseIdx]);
        baseIdx++;
        localIdx++;
        remoteIdx++;
      } else {
        break;
      }
    } else if (localChange && !remoteChange) {
      // Only local changed - use local changes
      const linesToAdd = localLines.slice(localChange.newStart, localChange.newStart + localChange.newCount);
      merged.push(...linesToAdd);
      baseIdx += localChange.baseCount;
      localIdx += localChange.newCount;
      remoteIdx += localChange.baseCount;
    } else if (!localChange && remoteChange) {
      // Only remote changed - use remote changes
      const linesToAdd = remoteLines.slice(remoteChange.newStart, remoteChange.newStart + remoteChange.newCount);
      merged.push(...linesToAdd);
      baseIdx += remoteChange.baseCount;
      localIdx += remoteChange.baseCount;
      remoteIdx += remoteChange.newCount;
    } else {
      // Both changed - merge both changes WITHOUT conflict markers
      const localChangedLines = localLines.slice(localChange.newStart, localChange.newStart + localChange.newCount);
      const remoteChangedLines = remoteLines.slice(remoteChange.newStart, remoteChange.newStart + remoteChange.newCount);
      
      if (JSON.stringify(localChangedLines) === JSON.stringify(remoteChangedLines)) {
        // Same changes - use either
        merged.push(...localChangedLines);
      } else {
        // Different changes - combine both (NO conflict markers)
        // Add remote changes first, then local changes
        if (remoteChangedLines.length > 0) {
          merged.push(...remoteChangedLines);
        }
        if (localChangedLines.length > 0) {
          // Add a blank line separator if both have content
          if (remoteChangedLines.length > 0 && localChangedLines.length > 0) {
            merged.push('');
          }
          merged.push(...localChangedLines);
        }

      }
      
      baseIdx += Math.max(localChange.baseCount, remoteChange.baseCount);
      localIdx += localChange.newCount;
      remoteIdx += remoteChange.newCount;
    }
  }
  
  return { lines: merged, conflictCount: 0 }; // Always 0 conflicts since we merge everything
}

/**
 * Compute line-based diff between two versions
 * Returns a list of changes (additions, deletions, modifications)
 */
function computeLineDiff(oldLines, newLines) {
  const changes = [];
  const lcs = longestCommonSubsequence(oldLines, newLines);
  
  let oldIdx = 0;
  let newIdx = 0;
  
  // Build LCS map for quick lookup
  const lcsMap = new Map();
  lcs.forEach(([oldPos, newPos]) => {
    lcsMap.set(oldPos, newPos);
  });
  
  for (let i = 0; i < oldLines.length; i++) {
    if (lcsMap.has(i)) {
      // This line is unchanged
      const newPos = lcsMap.get(i);
      
      // Check if there are insertions before this line
      if (newIdx < newPos) {
        changes.push({
          type: 'insert',
          baseStart: i,
          baseCount: 0,
          newStart: newIdx,
          newCount: newPos - newIdx,
        });
      }
      
      newIdx = newPos + 1;
      oldIdx = i + 1;
    } else {
      // This line was deleted or modified
      // Find the next unchanged line
      let nextUnchanged = i + 1;
      while (nextUnchanged < oldLines.length && !lcsMap.has(nextUnchanged)) {
        nextUnchanged++;
      }
      
      const deletedCount = nextUnchanged - i;
      const nextNewPos = lcsMap.get(nextUnchanged) || newLines.length;
      const insertedCount = nextNewPos - newIdx;
      
      if (deletedCount > 0 || insertedCount > 0) {
        changes.push({
          type: insertedCount > 0 && deletedCount > 0 ? 'modify' : (insertedCount > 0 ? 'insert' : 'delete'),
          baseStart: i,
          baseCount: deletedCount,
          newStart: newIdx,
          newCount: insertedCount,
        });
      }
      
      i = nextUnchanged - 1;
      newIdx = nextNewPos;
    }
  }
  
  // Handle trailing insertions
  if (newIdx < newLines.length) {
    changes.push({
      type: 'insert',
      baseStart: oldLines.length,
      baseCount: 0,
      newStart: newIdx,
      newCount: newLines.length - newIdx,
    });
  }
  
  return { changes };
}

/**
 * Merge arrays by combining unique items
 */
function mergeText(baseText, localText, remoteText) {
  // If texts are identical, no conflict
  if (localText === remoteText) return localText;
  
  // If one side didn't change, use the other
  if (localText === baseText) return remoteText;
  if (remoteText === baseText) return localText;
  
  // Both changed - check if one contains the other
  const localTrimmed = (localText || '').trim();
  const remoteTrimmed = (remoteText || '').trim();
  
  if (!remoteTrimmed) return localText;
  if (!localTrimmed) return remoteText;
  
  if (remoteTrimmed.includes(localTrimmed)) {
    return remoteText;
  } else if (localTrimmed.includes(remoteTrimmed)) {
    return localText;
  }
  
  // Different content - find common prefix/suffix and merge
  const commonPrefix = findCommonPrefix(remoteTrimmed, localTrimmed);
  const commonSuffix = findCommonSuffix(remoteTrimmed, localTrimmed);
  
  if (commonPrefix.length > 10 || commonSuffix.length > 10) {
    // Significant overlap - merge intelligently
    const remoteMiddle = remoteTrimmed.substring(
      commonPrefix.length,
      remoteTrimmed.length - commonSuffix.length
    );
    const localMiddle = localTrimmed.substring(
      commonPrefix.length,
      localTrimmed.length - commonSuffix.length
    );
    
    return commonPrefix + remoteMiddle + '\n\n' + localMiddle + commonSuffix;
  }
  
  // No significant overlap - append with clear separator
  return `${remoteText}\n\n--- Added by another user ---\n\n${localText}`;
}

/**
 * Merge arrays by combining unique items
 */
function mergeArray(baseArray, localArray, remoteArray) {
  const base = baseArray || [];
  const local = localArray || [];
  const remote = remoteArray || [];
  
  // Combine all unique items
  const merged = [...new Set([...local, ...remote])];
  
  return merged;
}

/**
 * Deep merge objects
 */
function mergeObject(baseObj, localObj, remoteObj) {
  const base = baseObj || {};
  const local = localObj || {};
  const remote = remoteObj || {};
  
  const merged = { ...base };
  
  // Merge all keys
  const allKeys = new Set([...Object.keys(local), ...Object.keys(remote)]);
  
  for (const key of allKeys) {
    const baseVal = base[key];
    const localVal = local[key];
    const remoteVal = remote[key];
    
    if (localVal === remoteVal) {
      merged[key] = localVal;
    } else if (localVal === baseVal) {
      merged[key] = remoteVal;
    } else if (remoteVal === baseVal) {
      merged[key] = localVal;
    } else {
      // Both changed - recursively merge if objects
      const strategy = detectStrategy(localVal);
      if (strategy === MERGE_STRATEGIES.OBJECT) {
        merged[key] = mergeObject(baseVal, localVal, remoteVal);
      } else if (strategy === MERGE_STRATEGIES.TEXT) {
        merged[key] = mergeText(baseVal, localVal, remoteVal);
      } else {
        // Primitive conflict - keep local (last write wins)
        merged[key] = localVal;
      }
    }
  }
  
  return merged;
}

/**
 * Get user name from Firestore
 */
async function getUserName(workspaceId, userId) {
  if (!userId) return 'Unknown User';
  
  try {
    // Try to get user name from workspace members first
    const membersDoc = await getDoc(doc(db, `workspaces/${workspaceId}/members`, userId));
    if (membersDoc.exists()) {
      return membersDoc.data().name || 'Unknown User';
    }
    
    // Fallback: try users collection (might not have permission)
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return userDoc.data().name || 'Unknown User';
    }
  } catch (error) {

  }
  return 'Another User';
}

/**
 * Update note with conflict resolution
 * Uses Firestore transactions to ensure atomic updates
 * Supports 3-way merge when baseText is provided
 */
export async function updateNoteWithConflictResolution(
  workspaceId, 
  noteId, 
  updates, 
  currentUserId,
  mergeContext = null
) {
  const notePath = `workspaces/${workspaceId}/notes/${noteId}`;
  const noteRef = doc(db, notePath);

  try {
    const result = await runTransaction(db, async (transaction) => {
      // Read current state from Firestore
      const noteDoc = await transaction.get(noteRef);
      
      if (!noteDoc.exists()) {
        throw new Error('Note does not exist');
      }
      
      const currentData = noteDoc.data();
      
      // Get remote user info for conflict markers
      const remoteUserId = currentData.lastModifiedBy;
      const remoteUserName = await getUserName(workspaceId, remoteUserId);

      // Check if note was modified by another user since we started editing
      const lastModifiedBy = currentData.lastModifiedBy;
      const lastModifiedAt = currentData.lastModifiedAt?.toMillis() || 0;
      
      // If we're the last modifier and it was recent (< 5 seconds), no conflict
      const timeSinceLastModify = Date.now() - lastModifiedAt;
      if (lastModifiedBy === currentUserId && timeSinceLastModify < 5000) {
        // Simple update - no conflict
        const updateData = {
          ...updates,
          lastModifiedBy: currentUserId,
          lastModifiedAt: serverTimestamp(),
          updatedAt: Date.now(), // Required for Firestore query ordering
        };

        transaction.update(noteRef, updateData);
        
        return { merged: false, data: updateData, conflictCount: 0 };
      }
      
      // Conflict detected - merge changes

      const merged = {};
      
      // Fields that should NEVER be merged (system fields)
      const SYSTEM_FIELDS = ['id', 'createdAt', 'createdBy', 'accessList'];
      
      // Fields that use last-write-wins (no merge, no conflict)
      const LAST_WRITE_WINS_FIELDS = ['title', 'tags', 'archived', 'joinCode', 'taskId', 'type'];
      
      let totalConflicts = 0;
      
      // Merge each field
      for (const [key, localValue] of Object.entries(updates)) {
        // Skip system fields - never merge these
        if (SYSTEM_FIELDS.includes(key)) {
          merged[key] = localValue;
          continue;
        }
        
        // Last-write-wins fields - no merge, just use local value
        if (LAST_WRITE_WINS_FIELDS.includes(key)) {
          merged[key] = localValue;

          continue;
        }
        
        const remoteValue = currentData[key];
        const strategy = detectStrategy(localValue);
        
        if (strategy === MERGE_STRATEGIES.TEXT && mergeContext?.baseText && key === 'body') {
          // Use 3-way merge for body text ONLY
          const baseText = mergeContext.baseText;
          const userInfo = {
            localUserName: mergeContext.currentUserName || 'You',
            remoteUserName: remoteUserName,
          };

          const mergeResult = merge3Way(baseText, localValue, remoteValue, userInfo);
          merged[key] = mergeResult.mergedText;
          totalConflicts += mergeResult.conflictCount;

        } else if (key === 'sheetData') {
          // Special handling for sheet data - ensure only first sheet is used
          let localSheet = localValue;
          let remoteSheet = remoteValue;
          
          // Extract first sheet if array
          if (Array.isArray(localValue) && localValue.length > 0) {
            if (localValue.length > 1) {

            }
            localSheet = [localValue[0]];
          }
          
          if (Array.isArray(remoteValue) && remoteValue.length > 0) {
            if (remoteValue.length > 1) {

            }
            remoteSheet = [remoteValue[0]];
          }
          
          // Use last-write-wins for sheet data (most recent edit wins)
          // This prevents data split across multiple sheets
          merged[key] = localSheet;

        } else {
          // Fallback to existing merge strategies for other fields
          merged[key] = mergeField(key, localValue, remoteValue, strategy);
        }
      }
      
      // Add metadata
      merged.lastModifiedBy = currentUserId;
      merged.lastModifiedAt = serverTimestamp();
      merged.updatedAt = Date.now(); // Required for Firestore query ordering
      merged.conflictResolved = totalConflicts > 0;
      merged.conflictResolvedAt = totalConflicts > 0 ? serverTimestamp() : null;

      transaction.update(noteRef, merged);

      return { merged: true, data: merged, conflictCount: totalConflicts };
    });
    
    return result;
  } catch (error) {

    throw error;
  }
}

/**
 * Merge a single field based on strategy
 */
function mergeField(key, localValue, remoteValue, strategy) {
  switch (strategy) {
    case MERGE_STRATEGIES.TEXT:
      // For text fields without base text, use simple merge
      return mergeText(null, localValue, remoteValue);
      
    case MERGE_STRATEGIES.ARRAY:
      return mergeArray([], localValue, remoteValue);
      
    case MERGE_STRATEGIES.OBJECT:
      return mergeObject({}, localValue, remoteValue);
      
    default:
      // Primitive - last write wins
      return localValue;
  }
}

/**
 * Check if note has been modified by another user
 */
export async function checkForConflicts(workspaceId, noteId, lastKnownModifiedAt, currentUserId) {
  const notePath = `workspaces/${workspaceId}/notes/${noteId}`;
  const noteRef = doc(db, notePath);
  
  try {
    const noteDoc = await noteRef.get();
    
    if (!noteDoc.exists()) {
      return { hasConflict: false, reason: 'Note does not exist' };
    }
    
    const data = noteDoc.data();
    const currentModifiedAt = data.lastModifiedAt?.toMillis() || 0;
    const currentModifiedBy = data.lastModifiedBy;
    
    // Check if modified by another user after we started editing
    if (currentModifiedBy !== currentUserId && currentModifiedAt > lastKnownModifiedAt) {
      return {
        hasConflict: true,
        reason: 'Modified by another user',
        modifiedBy: currentModifiedBy,
        modifiedAt: currentModifiedAt,
      };
    }
    
    return { hasConflict: false };
  } catch (error) {

    return { hasConflict: false, error };
  }
}

/**
 * Real-time conflict detection
 * Subscribe to note changes and notify if another user is editing
 */
export function subscribeToNoteConflicts(workspaceId, noteId, currentUserId, onConflict) {
  const notePath = `workspaces/${workspaceId}/notes/${noteId}`;
  const noteRef = doc(db, notePath);
  
  const unsubscribe = onSnapshot(noteRef, (snapshot) => {
    if (!snapshot.exists()) return;
    
    const data = snapshot.data();
    const lastModifiedBy = data.lastModifiedBy;
    const lastModifiedAt = data.lastModifiedAt?.toMillis() || 0;
    
    // Check if modified by another user in the last 10 seconds
    const timeSinceModify = Date.now() - lastModifiedAt;
    if (lastModifiedBy !== currentUserId && timeSinceModify < 10000) {
      onConflict({
        modifiedBy: lastModifiedBy,
        modifiedAt: lastModifiedAt,
        data,
      });
    }
  });
  
  return unsubscribe;
}

export default {
  updateNoteWithConflictResolution,
  checkForConflicts,
  subscribeToNoteConflicts,
  merge3Way,
  mergeText,
  mergeArray,
  mergeObject,
};
