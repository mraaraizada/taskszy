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
      console.error('❌ Please provide workspaceId: window.runTaskMigration("ws_xxx")');
      return;
    }
    
    console.log('🔍 Checking migration status...');
    const status = await checkMigrationStatus(workspaceId);
    console.log('📊 Migration Status:', status);
    
    if (!status.migrationNeeded) {
      console.log('✅ All tasks already migrated!');
      return status;
    }
    
    console.log(`🔄 Starting migration for ${status.needsMigration} tasks...`);
    const results = await migrateTasksAddMemberIds(workspaceId);
    console.log('✅ Migration complete!', results);
    
    return results;
  };
  
  window.checkTaskMigration = async function(workspaceId) {
    if (!workspaceId) {
      console.error('❌ Please provide workspaceId: window.checkTaskMigration("ws_xxx")');
      return;
    }
    
    const status = await checkMigrationStatus(workspaceId);
    console.log('📊 Migration Status:', status);
    return status;
  };
  
  console.log('✅ Migration tools loaded. Available commands:');
  console.log('  - window.runTaskMigration("ws_xxx")');
  console.log('  - window.checkTaskMigration("ws_xxx")');
}

export { migrateTasksAddMemberIds, checkMigrationStatus };
