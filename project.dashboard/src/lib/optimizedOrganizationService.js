/**
 * Optimized Organization Service
 * 
 * Reduces Firebase reads by:
 * 1. Using aggregations instead of full queries
 * 2. Pagination for large datasets
 * 3. Limiting nested queries
 * 4. Smart caching
 */

import { db } from './firebase';
import { collection, query, getDocs, doc, getDoc, orderBy, limit, startAfter, getCountFromServer } from 'firebase/firestore';
import cacheManager, { CACHE_KEYS } from './cacheManager';

/**
 * Get organizations with pagination (OPTIMIZED)
 * @param {Object} options - Pagination options
 * @param {number} options.pageSize - Number of organizations per page (default: 20)
 * @param {Object} options.lastDoc - Last document from previous page
 * @param {boolean} options.forceRefresh - Force refresh from Firebase
 * @returns {Promise<Object>} - { organizations, lastDoc, hasMore }
 */
export async function getOrganizationsPaginated(options = {}) {
  const {
    pageSize = 20,
    lastDoc = null,
    forceRefresh = false
  } = options;
  
  // Check cache for first page only
  if (!lastDoc && !forceRefresh) {
    const cached = cacheManager.get(CACHE_KEYS.ORGANIZATIONS);
    if (cached && cached.length > 0) {
      console.log(`✅ Returning cached organizations (0 reads)`);
      return {
        organizations: cached.slice(0, pageSize),
        hasMore: cached.length > pageSize,
        total: cached.length
      };
    }
  }
  
  try {
    console.log(`🔄 Fetching ${pageSize} organizations from Firebase...`);
    
    const workspacesRef = collection(db, 'workspaces');
    let q = query(workspacesRef, orderBy('createdAt', 'desc'), limit(pageSize + 1));
    
    if (lastDoc) {
      q = query(workspacesRef, orderBy('createdAt', 'desc'), startAfter(lastDoc), limit(pageSize + 1));
    }
    
    const snapshot = await getDocs(q);
    console.log(`📊 Firebase reads: ${snapshot.size} workspaces`);
    
    const hasMore = snapshot.size > pageSize;
    const docs = hasMore ? snapshot.docs.slice(0, pageSize) : snapshot.docs;
    const newLastDoc = docs.length > 0 ? docs[docs.length - 1] : null;
    
    // ⭐ OPTIMIZATION: Load essential data with minimal queries
    const organizations = await Promise.all(docs.map(async (workspaceDoc) => {
      const workspaceData = workspaceDoc.data();
      const workspaceId = workspaceDoc.id;
      
      const toDate = (dateValue) => {
        if (!dateValue) return null;
        if (typeof dateValue?.toDate === 'function') return dateValue.toDate();
        if (dateValue instanceof Date) return dateValue;
        if (typeof dateValue === 'string' || typeof dateValue === 'number') return new Date(dateValue);
        return null;
      };
      
      // Get owner data
      let ownerName = 'Unknown';
      let ownerEmail = 'N/A';
      let ownerPhone = 'N/A';
      let ownerAvatar = 'U';
      let ownerColor = '#3B5BFC';
      
      if (workspaceData.ownerId) {
        try {
          const ownerDoc = await getDoc(doc(db, 'users', workspaceData.ownerId));
          if (ownerDoc.exists()) {
            const ownerData = ownerDoc.data();
            ownerName = ownerData.name || 'Unknown';
            ownerEmail = ownerData.email || 'N/A';
            ownerPhone = ownerData.phone || 'N/A';
            ownerAvatar = ownerData.name ? ownerData.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : 'U';
            ownerColor = ownerData.color || '#3B5BFC';
          }
        } catch (err) {
          console.warn(`Failed to load owner for workspace ${workspaceId}:`, err);
        }
      }
      
      // Get team count
      let teamCount = 0;
      let activeTeamCount = 0;
      try {
        const teamSnapshot = await getDocs(collection(db, 'workspaces', workspaceId, 'team'));
        teamCount = teamSnapshot.size;
        activeTeamCount = teamSnapshot.docs.filter(d => d.data().status === 'Active').length;
      } catch (err) {
        console.warn(`Failed to load team for workspace ${workspaceId}:`, err);
      }
      
      return {
        id: workspaceId,
        name: workspaceData.settings?.workspaceName || 'Unnamed Workspace',
        email: ownerEmail,
        phone: ownerPhone,
        subscriptionPlan: workspaceData.plan?.name || 'Free',
        subscriptionStatus: workspaceData.plan?.isActive ? 'active' : 'inactive',
        joinDate: toDate(workspaceData.createdAt) || new Date(),
        teamCount,
        activeTeamCount,
        totalTasks: 0,
        ownerName,
        ownerUid: workspaceData.ownerId || null,
        ownerAvatar,
        ownerAvatarImg: null,
        ownerColor,
        workspaceLogo: workspaceData.settings?.workspaceLogo || null,
        workspaceSub: workspaceData.settings?.workspaceSub || '',
        planExpiryDate: toDate(workspaceData.plan?.expiryDate),
        planStartDate: toDate(workspaceData.plan?.startDate),
        customPlanRequest: workspaceData.customPlanRequest || null,
        isCompleted: workspaceData.isCompleted || false,
        requestDate: workspaceData.customPlanRequest?.requestDate 
          ? toDate(workspaceData.customPlanRequest.requestDate) 
          : toDate(workspaceData.createdAt),
        ownerEmail,
        description: workspaceData.description || null,
      };
    }));
    
    console.log(`✅ Fetched ${organizations.length} organizations (optimized)`);
    
    // Cache first page only
    if (!lastDoc) {
      cacheManager.set(CACHE_KEYS.ORGANIZATIONS, organizations);
    }
    
    return {
      organizations,
      lastDoc: newLastDoc,
      hasMore,
      total: organizations.length
    };
  } catch (error) {
    console.error('Error getting organizations:', error);
    throw error;
  }
}

/**
 * Enrich organization with owner and team data (on-demand)
 * @param {string} workspaceId - Workspace ID
 * @returns {Promise<Object>} - Enriched organization data
 */
export async function enrichOrganization(workspaceId) {
  try {
    const workspaceDoc = await getDoc(doc(db, 'workspaces', workspaceId));
    
    if (!workspaceDoc.exists()) {
      throw new Error('Workspace not found');
    }
    
    const workspaceData = workspaceDoc.data();
    
    // Get owner data
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
        console.warn(`Could not fetch owner for ${workspaceId}`);
      }
    }
    
    // Get team count (optimized)
    let teamCount = 0;
    let activeTeamCount = 0;
    try {
      const teamRef = collection(db, `workspaces/${workspaceId}/team`);
      const teamCountSnap = await getCountFromServer(teamRef);
      teamCount = teamCountSnap.data().count;
      
      // For active count, we need to query
      const teamSnap = await getDocs(query(teamRef, limit(100))); // Limit to 100
      teamSnap.forEach(doc => {
        const memberData = doc.data();
        if (memberData.status === 'Active') {
          activeTeamCount++;
        }
      });
    } catch (err) {
      console.warn(`Could not fetch team for ${workspaceId}`);
    }
    
    // Get tasks count (optimized)
    let totalTasks = 0;
    try {
      const tasksRef = collection(db, `workspaces/${workspaceId}/tasks`);
      const tasksCountSnap = await getCountFromServer(tasksRef);
      totalTasks = tasksCountSnap.data().count;
    } catch (err) {
      console.warn(`Could not fetch tasks for ${workspaceId}`);
    }
    
    return {
      email: ownerEmail,
      phone: ownerData?.phone || 'N/A',
      teamCount,
      activeTeamCount,
      totalTasks,
      ownerName: ownerData?.name || 'Unknown',
      ownerAvatar: ownerData?.avatar || ownerData?.name?.charAt(0) || 'U',
      ownerAvatarImg: ownerData?.avatarImg || null,
      ownerColor: ownerData?.color || '#3B5BFC',
      ownerEmail,
      _needsEnrichment: false
    };
  } catch (error) {
    console.error('Error enriching organization:', error);
    throw error;
  }
}

/**
 * Get organization statistics (OPTIMIZED - uses aggregation)
 * @returns {Promise<Object>} - Statistics object
 */
export async function getOrganizationStatsOptimized() {
  try {
    // Try to get from admin aggregation first
    const { getAdminAggregation } = await import('./adminAggregationService');
    const aggregation = await getAdminAggregation();
    
    if (aggregation && aggregation.workspaces) {
      console.log('✅ Using aggregated stats (0 additional reads)');
      return {
        total: aggregation.workspaces.total,
        byPlan: aggregation.workspaces.byPlan,
        byStatus: {
          active: aggregation.workspaces.active,
          inactive: aggregation.workspaces.inactive,
          suspended: 0
        }
      };
    }
    
    // Fallback: calculate from cached organizations
    const cached = cacheManager.get(CACHE_KEYS.ORGANIZATIONS);
    if (cached) {
      console.log('✅ Calculating stats from cache (0 reads)');
      return {
        total: cached.length,
        byPlan: {
          Starter: cached.filter(o => o.subscriptionPlan === 'Starter' && o.subscriptionStatus === 'active').length,
          Professional: cached.filter(o => o.subscriptionPlan === 'Professional' && o.subscriptionStatus === 'active').length,
          Business: cached.filter(o => o.subscriptionPlan === 'Business' && o.subscriptionStatus === 'active').length,
          Enterprise: cached.filter(o => o.subscriptionPlan === 'Enterprise' && o.subscriptionStatus === 'active').length,
          Free: cached.filter(o => o.subscriptionPlan === 'Free').length,
        },
        byStatus: {
          active: cached.filter(o => o.subscriptionStatus === 'active').length,
          inactive: cached.filter(o => o.subscriptionStatus === 'inactive').length,
          suspended: 0
        }
      };
    }
    
    // Last resort: query Firestore (expensive)
    console.log('⚠️ No cache available, querying Firestore...');
    const workspacesRef = collection(db, 'workspaces');
    const snapshot = await getDocs(workspacesRef);
    
    const organizations = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        subscriptionPlan: data.plan?.name || 'Free',
        subscriptionStatus: data.plan?.isActive ? 'active' : 'inactive'
      };
    });
    
    return {
      total: organizations.length,
      byPlan: {
        Starter: organizations.filter(o => o.subscriptionPlan === 'Starter' && o.subscriptionStatus === 'active').length,
        Professional: organizations.filter(o => o.subscriptionPlan === 'Professional' && o.subscriptionStatus === 'active').length,
        Business: organizations.filter(o => o.subscriptionPlan === 'Business' && o.subscriptionStatus === 'active').length,
        Enterprise: organizations.filter(o => o.subscriptionPlan === 'Enterprise' && o.subscriptionStatus === 'active').length,
        Free: organizations.filter(o => o.subscriptionPlan === 'Free').length,
      },
      byStatus: {
        active: organizations.filter(o => o.subscriptionStatus === 'active').length,
        inactive: organizations.filter(o => o.subscriptionStatus === 'inactive').length,
        suspended: 0
      }
    };
  } catch (error) {
    console.error('Error getting organization stats:', error);
    throw error;
  }
}
