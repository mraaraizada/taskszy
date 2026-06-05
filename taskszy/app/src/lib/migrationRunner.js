/**
 * Migration Runner
 * Run this in browser console to migrate tasks
 * 
 * Usage:
 * 1. Open browser console (F12)
 * 2. Type: window.runTaskMigration()
 * 3. Wait for completion
 */

import { migrateTasksAddMemberIds, checkMigrationStatus } from './taskMigration';

// Expose migration functions to window for console access
if (typeof window !== 'undefined') {
  window.runTaskMigration = async function(workspaceId) {
    if (!workspaceId) {

      return;
    }

    const status = await checkMigrationStatus(workspaceId);

    if (!status.migrationNeeded) {

      return status;
    }

    const results = await migrateTasksAddMemberIds(workspaceId);

    return results;
  };
  
  window.checkTaskMigration = async function(workspaceId) {
    if (!workspaceId) {

      return;
    }
    
    const status = await checkMigrationStatus(workspaceId);

    return status;
  };

}

export { migrateTasksAddMemberIds, checkMigrationStatus };
