import { db } from './firebase';
import { collection, query, getDocs, doc, getDoc, where, orderBy, getCountFromServer } from 'firebase/firestore';
import cacheManager, { CACHE_KEYS } from './cacheManager';

/**
 * Get all workspaces (organizations) from Firebase with caching
 * @param {boolean} forceRefresh - Force refresh from Firebase, bypass cache
 * @returns {Promise<Array>} - Array of workspace/organization data
 */
export async function getAllOrganizations(forceRefresh = false) {
  // Check cache first
  if (!forceRefresh) {
    const cached = cacheManager.get(CACHE_KEYS.ORGANIZATIONS);
    if (cached) {

      return cached; // Return same reference to prevent unnecessary re-renders
    }
  }
  
  try {

    const workspacesRef = collection(db, 'workspaces');
    const q = query(workspacesRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    const organizations = await Promise.all(
      snapshot.docs.map(async (workspaceDoc) => {
        const workspaceData = workspaceDoc.data();
        const workspaceId = workspaceDoc.id;
        
        // Get workspace owner details from users collection
        let ownerData = null;
        let ownerEmail = 'N/A';
        if (workspaceData.ownerId) {
          try {
            const ownerDoc = await getDoc(doc(db, 'users', workspaceData.ownerId));
            if (ownerDoc.exists()) {
              ownerData = ownerDoc.data();
              ownerEmail = ownerData?.email || 'N/A';
            }
          } catch (err) {

          }
        }
        
        // Get team count and active team count
        let teamCount = 0;
        let activeTeamCount = 0;
        try {
          const teamRef = collection(db, `workspaces/${workspaceId}/team`);
          const teamSnapshot = await getDocs(teamRef);
          teamCount = teamSnapshot.size;
          
          // Count active team members (status === 'Active')
          teamSnapshot.forEach(doc => {
            const memberData = doc.data();
            if (memberData.status === 'Active') {
              activeTeamCount++;
            }
          });
        } catch (err) {

        }
        
        // Get total tasks count (optimized - count only, don't load data)
        let totalTasks = 0;
        try {
          const tasksRef = collection(db, `workspaces/${workspaceId}/tasks`);
          const tasksCount = await getCountFromServer(tasksRef);
          totalTasks = tasksCount.data().count;
        } catch (err) {

        }
        
        // Helper function to convert various date formats to Date object
        const toDate = (dateValue) => {
          if (!dateValue) return null;
          if (typeof dateValue?.toDate === 'function') return dateValue.toDate();
          if (dateValue instanceof Date) return dateValue;
          if (typeof dateValue === 'string' || typeof dateValue === 'number') return new Date(dateValue);
          return null;
        };
        
        // Map workspace data to organization format
        const orgData = {
          id: workspaceId,
          name: workspaceData.settings?.workspaceName || 'Unnamed Workspace',
          email: ownerEmail,
          phone: ownerData?.phone || ownerData?.phoneNumber || 'N/A',
          subscriptionPlan: workspaceData.plan?.name || 'Free',
          subscriptionStatus: workspaceData.plan?.isActive ? 'active' : 'inactive',
          joinDate: toDate(workspaceData.createdAt) || new Date(),
          teamCount: teamCount,
          activeTeamCount: activeTeamCount,
          totalTasks: totalTasks,
          ownerName: ownerData?.name || ownerData?.displayName || 'Unknown',
          ownerUid: workspaceData.ownerId || null,
          ownerAvatar: ownerData?.avatar || ownerData?.name?.charAt(0) || 'U',
          ownerAvatarImg: ownerData?.avatarImg || ownerData?.photoURL || null,
          ownerColor: ownerData?.color || '#3B5BFC',
          workspaceLogo: workspaceData.settings?.workspaceLogo || null,
          workspaceSub: workspaceData.settings?.workspaceSub || '',
          planExpiryDate: toDate(workspaceData.plan?.expiryDate),
          planStartDate: toDate(workspaceData.plan?.startDate),
          // Include customPlanRequest data
          customPlanRequest: workspaceData.customPlanRequest || null,
          isCompleted: workspaceData.isCompleted || false,
          requestDate: workspaceData.customPlanRequest?.requestDate 
            ? toDate(workspaceData.customPlanRequest.requestDate) 
            : toDate(workspaceData.createdAt),
          ownerEmail: ownerEmail,
          description: workspaceData.description || null,
        };
        
        // Log if customPlanRequest exists
        if (workspaceData.customPlanRequest) {

        }
        
        return orgData;
      })
    );

    // Cache the results
    cacheManager.set(CACHE_KEYS.ORGANIZATIONS, organizations);

    return organizations;
  } catch (error) {

    throw error;
  }
}

/**
 * Get organization by ID
 * @param {string} workspaceId - Workspace ID
 * @returns {Promise<Object>} - Organization data
 */
export async function getOrganizationById(workspaceId) {
  try {
    const workspaceDoc = await getDoc(doc(db, 'workspaces', workspaceId));
    
    if (!workspaceDoc.exists()) {
      throw new Error('Workspace not found');
    }
    
    const workspaceData = workspaceDoc.data();
    
    // Get workspace owner details
    let ownerData = null;
    if (workspaceData.ownerId) {
      const ownerDoc = await getDoc(doc(db, 'users', workspaceData.ownerId));
      if (ownerDoc.exists()) {
        ownerData = ownerDoc.data();
      }
    }
    
    // Get team count
    const teamRef = collection(db, `workspaces/${workspaceId}/team`);
    const teamSnapshot = await getDocs(teamRef);
    
    // Helper function to convert various date formats to Date object
    const toDate = (dateValue) => {
      if (!dateValue) return null;
      if (typeof dateValue?.toDate === 'function') return dateValue.toDate();
      if (dateValue instanceof Date) return dateValue;
      if (typeof dateValue === 'string' || typeof dateValue === 'number') return new Date(dateValue);
      return null;
    };
    
    return {
      id: workspaceId,
      name: workspaceData.settings?.workspaceName || 'Unnamed Workspace',
      email: ownerData?.email || 'N/A',
      phone: ownerData?.phone || 'N/A',
      subscriptionPlan: workspaceData.plan?.name || 'Free',
      subscriptionStatus: workspaceData.plan?.status || 'inactive',
      joinDate: toDate(workspaceData.createdAt) || new Date(),
      teamCount: teamSnapshot.size,
      ownerName: ownerData?.name || 'Unknown',
      ownerUid: workspaceData.ownerId || null,
      ownerAvatar: ownerData?.avatar || ownerData?.name?.charAt(0) || 'U',
      ownerAvatarImg: ownerData?.avatarImg || null,
      ownerColor: ownerData?.color || '#3B5BFC',
      workspaceLogo: workspaceData.settings?.workspaceLogo || null,
      workspaceSub: workspaceData.settings?.workspaceSub || '',
      planExpiryDate: toDate(workspaceData.plan?.expiryDate),
      planStartDate: toDate(workspaceData.plan?.startDate),
      // Include customPlanRequest data
      customPlanRequest: workspaceData.customPlanRequest || null,
      isCompleted: workspaceData.isCompleted || false,
      requestDate: workspaceData.customPlanRequest?.requestDate 
        ? toDate(workspaceData.customPlanRequest.requestDate) 
        : toDate(workspaceData.createdAt),
      ownerEmail: ownerData?.email || 'N/A',
      description: workspaceData.description || null,
    };
  } catch (error) {

    throw error;
  }
}

/**
 * Get organization statistics with caching
 * @param {boolean} forceRefresh - Force refresh from Firebase
 * @returns {Promise<Object>} - Statistics object
 */
export async function getOrganizationStats(forceRefresh = false) {
  try {
    const organizations = await getAllOrganizations(forceRefresh);
    
    const stats = {
      total: organizations.length, // Total ALL workspaces (active + inactive)
      byPlan: {
        // Count ONLY ACTIVE workspaces for each plan
        Starter: organizations.filter(o => o.subscriptionPlan === 'Starter' && o.subscriptionStatus === 'active').length,
        Professional: organizations.filter(o => o.subscriptionPlan === 'Professional' && o.subscriptionStatus === 'active').length,
        Business: organizations.filter(o => o.subscriptionPlan === 'Business' && o.subscriptionStatus === 'active').length,
        Enterprise: organizations.filter(o => o.subscriptionPlan === 'Enterprise' && o.subscriptionStatus === 'active').length,
        Free: organizations.filter(o => o.subscriptionPlan === 'Free' && o.subscriptionStatus === 'active').length,
      },
      byStatus: {
        active: organizations.filter(o => o.subscriptionStatus === 'active').length,
        inactive: organizations.filter(o => o.subscriptionStatus === 'inactive').length,
        suspended: organizations.filter(o => o.subscriptionStatus === 'suspended').length,
      },
    };
    
    return stats;
  } catch (error) {

    throw error;
  }
}

/**
 * Clear the organizations cache (call when data changes)
 */
export function clearOrganizationsCache() {
  cacheManager.clear(CACHE_KEYS.ORGANIZATIONS);
  cacheManager.clear(CACHE_KEYS.STATS);
}
