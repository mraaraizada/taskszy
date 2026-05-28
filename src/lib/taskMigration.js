/**
 * Task Migration Utility
 * Adds memberIds array to existing tasks for efficient Firestore queries
 */

import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Migrate tasks to add memberIds array field
 * This enables efficient server-side filtering with array-contains
 * 
 * @param {string} workspaceId - Workspace ID
 * @returns {Promise<Object>} Migration results
 */
export async function migrateTasksAddMemberIds(workspaceId) {
  console.log('🔄 Starting task migration for workspace:', workspaceId);
  
  const results = {
    total: 0,
    migrated: 0,
    skipped: 0,
    errors: 0,
    errorDetails: []
  };
  
  try {
    const tasksRef = collection(db, `workspaces/${workspaceId}/tasks`);
    const snapshot = await getDocs(tasksRef);
    
    results.total = snapshot.docs.length;
    console.log(`📊 Found ${results.total} tasks to check`);
    
    for (const taskDoc of snapshot.docs) {
      const task = taskDoc.data();
      
      // Skip if already has memberIds
      if (task.memberIds && Array.isArray(task.memberIds)) {
        results.skipped++;
        continue;
      }
      
      // Extract member IDs from members array
      const memberIds = task.members?.map(m => m.id).filter(Boolean) || [];
      
      try {
        await updateDoc(doc(db, `workspaces/${workspaceId}/tasks`, taskDoc.id), {
          memberIds: memberIds
        });
        
        console.log(`✅ Migrated task ${taskDoc.id}: ${memberIds.length} members`);
        results.migrated++;
      } catch (error) {
        console.error(`❌ Failed to migrate task ${taskDoc.id}:`, error);
        results.errors++;
        results.errorDetails.push({
          taskId: taskDoc.id,
          error: error.message
        });
      }
    }
    
    console.log('✅ Migration complete:', results);
    return results;
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

/**
 * Update task to sync memberIds with members array
 * Call this whenever task members are updated
 * 
 * @param {string} workspaceId - Workspace ID
 * @param {string} taskId - Task ID
 * @param {Array} members - Array of member objects
 */
export async function syncTaskMemberIds(workspaceId, taskId, members) {
  const memberIds = members?.map(m => m.id).filter(Boolean) || [];
  
  try {
    await updateDoc(doc(db, `workspaces/${workspaceId}/tasks`, taskId), {
      memberIds: memberIds
    });
    console.log(`✅ Synced memberIds for task ${taskId}:`, memberIds);
  } catch (error) {
    console.error(`❌ Failed to sync memberIds for task ${taskId}:`, error);
    throw error;
  }
}

/**
 * Check if workspace tasks need migration
 * 
 * @param {string} workspaceId - Workspace ID
 * @returns {Promise<Object>} Migration status
 */
export async function checkMigrationStatus(workspaceId) {
  try {
    const tasksRef = collection(db, `workspaces/${workspaceId}/tasks`);
    const snapshot = await getDocs(tasksRef);
    
    let needsMigration = 0;
    let alreadyMigrated = 0;
    
    snapshot.docs.forEach(taskDoc => {
      const task = taskDoc.data();
      if (task.memberIds && Array.isArray(task.memberIds)) {
        alreadyMigrated++;
      } else {
        needsMigration++;
      }
    });
    
    return {
      total: snapshot.docs.length,
      needsMigration,
      alreadyMigrated,
      migrationNeeded: needsMigration > 0
    };
  } catch (error) {
    console.error('❌ Failed to check migration status:', error);
    throw error;
  }
}
