/**
 * Migration Utility: Populate Team Counts in Workspace Documents
 * 
 * This script adds teamCount and activeTeamCount fields to existing workspace documents.
 * Run this once to fix the "0 + 0Teams" issue in the admin dashboard.
 * 
 * HOW TO USE:
 * 1. Import this function in your admin dashboard component
 * 2. Call it from a button or on mount (one time)
 * 3. It will update all workspace documents with correct team counts
 */

import { db } from '../lib/firebase';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';

/**
 * Migrate team counts to workspace documents
 * @returns {Promise<Object>} - Migration results
 */
export async function migrateTeamCounts() {
  console.log('🚀 Starting team count migration...');
  
  const results = {
    total: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
    details: []
  };
  
  try {
    // Get all workspaces
    const workspacesRef = collection(db, 'workspaces');
    const workspacesSnap = await getDocs(workspacesRef);
    
    results.total = workspacesSnap.size;
    console.log(`📊 Found ${results.total} workspaces to process`);
    
    // Process each workspace
    for (const workspaceDoc of workspacesSnap.docs) {
      const workspaceId = workspaceDoc.id;
      const workspaceData = workspaceDoc.data();
      
      try {
        // Check if already has team counts
        if (workspaceData.teamCount !== undefined && workspaceData.activeTeamCount !== undefined) {
          console.log(`⏭️  Skipping ${workspaceId} - already has team counts`);
          results.skipped++;
          continue;
        }
        
        // Get team members
        const teamRef = collection(db, `workspaces/${workspaceId}/team`);
        const teamSnap = await getDocs(teamRef);
        
        // Calculate counts
        const teamCount = teamSnap.size;
        let activeTeamCount = 0;
        
        teamSnap.forEach(doc => {
          const memberData = doc.data();
          if (memberData.status === 'Active') {
            activeTeamCount++;
          }
        });
        
        // Get tasks count (optional, for completeness)
        let tasksCount = 0;
        try {
          const { getCountFromServer } = await import('firebase/firestore');
          const tasksRef = collection(db, `workspaces/${workspaceId}/tasks`);
          const tasksCountSnap = await getCountFromServer(tasksRef);
          tasksCount = tasksCountSnap.data().count;
        } catch (err) {
          console.warn(`⚠️  Could not get tasks count for ${workspaceId}:`, err.message);
        }
        
        // Update workspace document
        await setDoc(doc(db, 'workspaces', workspaceId), {
          teamCount,
          activeTeamCount,
          tasksCount
        }, { merge: true });
        
        console.log(`✅ Updated ${workspaceId}: ${activeTeamCount} active / ${teamCount} total members`);
        results.updated++;
        results.details.push({
          workspaceId,
          workspaceName: workspaceData.settings?.workspaceName || 'Unnamed',
          teamCount,
          activeTeamCount,
          tasksCount
        });
        
      } catch (err) {
        console.error(`❌ Error processing ${workspaceId}:`, err);
        results.errors++;
        results.details.push({
          workspaceId,
          error: err.message
        });
      }
    }
    
    console.log('✨ Migration complete!');
    console.log(`📈 Results: ${results.updated} updated, ${results.skipped} skipped, ${results.errors} errors`);
    
    return results;
  } catch (error) {
    console.error('💥 Migration failed:', error);
    throw error;
  }
}

/**
 * Quick migration for a single workspace (useful for testing)
 * @param {string} workspaceId - Workspace ID to migrate
 * @returns {Promise<Object>} - Migration result
 */
export async function migrateSingleWorkspace(workspaceId) {
  console.log(`🔧 Migrating workspace: ${workspaceId}`);
  
  try {
    // Get team members
    const teamRef = collection(db, `workspaces/${workspaceId}/team`);
    const teamSnap = await getDocs(teamRef);
    
    // Calculate counts
    const teamCount = teamSnap.size;
    let activeTeamCount = 0;
    
    teamSnap.forEach(doc => {
      const memberData = doc.data();
      if (memberData.status === 'Active') {
        activeTeamCount++;
      }
    });
    
    // Get tasks count
    let tasksCount = 0;
    try {
      const { getCountFromServer } = await import('firebase/firestore');
      const tasksRef = collection(db, `workspaces/${workspaceId}/tasks`);
      const tasksCountSnap = await getCountFromServer(tasksRef);
      tasksCount = tasksCountSnap.data().count;
    } catch (err) {
      console.warn('⚠️  Could not get tasks count:', err.message);
    }
    
    // Update workspace document
    await setDoc(doc(db, 'workspaces', workspaceId), {
      teamCount,
      activeTeamCount,
      tasksCount
    }, { merge: true });
    
    console.log(`✅ Updated: ${activeTeamCount} active / ${teamCount} total members`);
    
    return {
      success: true,
      workspaceId,
      teamCount,
      activeTeamCount,
      tasksCount
    };
  } catch (error) {
    console.error('❌ Migration failed:', error);
    return {
      success: false,
      workspaceId,
      error: error.message
    };
  }
}

export default {
  migrateTeamCounts,
  migrateSingleWorkspace
};
