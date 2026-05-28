import {
  doc,
  getDoc,
  getDocFromCache,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';

const USERS_COLLECTION      = 'users';
const WORKSPACES_COLLECTION = 'workspaces';

// In-memory cache for profile data to prevent multiple simultaneous fetches
const profileCache = new Map();
const pendingFetches = new Map();

/**
 * Fetch a user profile from Firestore.
 * Uses cache-first strategy to avoid Firestore internal state errors.
 * @param {string} uid
 * @returns {Promise<{email, role, memberId, workspaceId, loginTime, lastActivityTime, createdAt, name, phone, location, about, avatarImg, hasSeenWelcomeAnimation, hasCompletedSetup, userPassword}|null>}
 */
export async function getProfile(uid) {
  // Return in-memory cached profile if available (cache for 5 seconds)
  const cached = profileCache.get(uid);
  if (cached && Date.now() - cached.timestamp < 5000) {
    console.log('📖 getProfile (memory cache):', { uid, name: cached.data.name });
    return cached.data;
  }

  // If a fetch is already in progress, wait for it
  if (pendingFetches.has(uid)) {
    console.log('⏳ getProfile (waiting for pending fetch):', uid);
    return pendingFetches.get(uid);
  }

  // Start new fetch
  const fetchPromise = (async () => {
    try {
      const ref = doc(db, USERS_COLLECTION, uid);
      let snap;
      
      // Try to get from Firestore cache first
      try {
        snap = await getDocFromCache(ref);
        console.log('📖 getProfile (Firestore cache):', uid);
      } catch (cacheError) {
        // Cache miss - fetch from server
        console.log('📖 getProfile (fetching from server):', uid);
        snap = await getDoc(ref);
      }
      
      if (!snap.exists()) {
        console.log('❌ getProfile: User profile not found for uid:', uid);
        pendingFetches.delete(uid);
        return null;
      }
      
      const data = snap.data();
      const profile = { 
        email: data.email, 
        role: data.role, 
        memberId: data.memberId ?? null, 
        workspaceId: data.workspaceId ?? null, 
        loginTime: data.loginTime, 
        lastActivityTime: data.lastActivityTime, 
        createdAt: data.createdAt,
        name: data.name ?? null,
        phone: data.phone ?? null,
        location: data.location ?? null,
        about: data.about ?? null,
        avatarImg: data.avatarImg ?? null,
        hasSeenWelcomeAnimation: data.hasSeenWelcomeAnimation ?? false,
        hasCompletedSetup: data.hasCompletedSetup ?? false,
        userPassword: data.userPassword ?? null,
      };
      
      // Cache the result in memory
      profileCache.set(uid, { data: profile, timestamp: Date.now() });
      pendingFetches.delete(uid);
      
      console.log('✅ getProfile loaded:', { uid, name: profile.name, source: snap.metadata.fromCache ? 'cache' : 'server' });
      return profile;
    } catch (error) {
      console.error('❌ getProfile error:', error);
      pendingFetches.delete(uid);
      throw error;
    }
  })();

  pendingFetches.set(uid, fetchPromise);
  return fetchPromise;
}

/**
 * Create a workspace document and a user profile document for a new self-signup admin.
 * @param {string} uid
 * @param {{ email: string, name?: string, phone?: string }} data
 */
export async function createAdminProfile(uid, { email, name, phone }) {
  const workspaceId = 'ws_' + uid;

  // Extract name from email if not provided
  const userName = name || email.split('@')[0];

  // 1. Create workspace doc with settings and plan as top-level fields
  await setDoc(doc(db, WORKSPACES_COLLECTION, workspaceId), {
    ownerId:   uid,
    createdAt: serverTimestamp(),
    // Settings (branding + admin password) - empty until user completes setup
    settings: {
      workspaceName:    null, // Will be set during WorkspaceSetup
      workspaceSub:     null, // Will be set during WorkspaceSetup
      workspaceLogo:    null,
      adminPassword:    'admin123', // Default password (will be changed)
      hasCompletedSetup: false,
      // NOTE: darkMode is NOT stored here - it's localStorage only
    },
    // Plan (subscription) — empty until user selects a plan
    plan: {
      id:              null,
      name:            null,
      billingCycle:    null,
      users:           null,
      color:           null,
      expiryDate:      null,
      expiryTimestamp: null,
      isActive:        false,
      createdAt:       null,
      updatedAt:       null,
    },
  });

  // 2. Create user doc with name extracted from email
  await setDoc(doc(db, USERS_COLLECTION, uid), {
    email,
    name:             userName, // Use extracted name from email
    phone:            phone ?? null,
    role:             'admin',
    memberId:         null,
    workspaceId,
    loginTime:        serverTimestamp(),
    lastActivityTime: serverTimestamp(),
    createdAt:        serverTimestamp(),
    hasSeenWelcomeAnimation: false, // Track if user has seen welcome animation
  });
}

/**
 * Create a team-member profile document (admin-provisioned, no workspace).
 * @param {string} uid
 * @param {{ email: string, role: string, memberId: number|null, name?: string, phone?: string }} data
 */
export async function createProfile(uid, data) {
  await setDoc(doc(db, USERS_COLLECTION, uid), {
    email:            data.email,
    name:             data.name ?? null,
    phone:            data.phone ?? null,
    role:             data.role,
    memberId:         data.memberId ?? null,
    workspaceId:      data.workspaceId ?? null,
    loginTime:        serverTimestamp(),
    lastActivityTime: serverTimestamp(),
    createdAt:        serverTimestamp(),
    hasSeenWelcomeAnimation: false, // Track if user has seen welcome animation
  });
}

/**
 * Merge updates into an existing user profile.
 * Automatically syncs relevant fields to team collection.
 * @param {string} uid
 * @param {object} updates
 */
export async function updateProfile(uid, updates) {
  console.log('📝 updateProfile called:', { uid, updates });
  
  // Update user profile first
  await updateDoc(doc(db, USERS_COLLECTION, uid), updates);
  
  // ⭐ Sync relevant fields to team collection
  // Fields that should sync: name, phone, location, about, avatarImg
  const syncableFields = ['name', 'phone', 'location', 'about', 'avatarImg'];
  const fieldsToSync = Object.keys(updates).filter(key => syncableFields.includes(key));
  
  if (fieldsToSync.length > 0) {
    try {
      // Get user's profile to find their workspaceId and memberId
      const userDoc = await getDoc(doc(db, USERS_COLLECTION, uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const workspaceId = userData.workspaceId;
        const memberId = userData.memberId;
        
        if (workspaceId && memberId) {
          const teamDocRef = doc(db, `workspaces/${workspaceId}/team`, String(memberId));
          
          // Build team update object
          const teamUpdates = {
            updatedAt: serverTimestamp()
          };
          
          // Sync each field
          if (updates.name !== undefined) {
            teamUpdates.name = updates.name;
            teamUpdates.avatar = updates.name.charAt(0).toUpperCase();
          }
          if (updates.phone !== undefined) {
            teamUpdates.phone = updates.phone;
          }
          if (updates.location !== undefined) {
            teamUpdates.location = updates.location;
          }
          if (updates.about !== undefined) {
            teamUpdates.about = updates.about;
          }
          if (updates.avatarImg !== undefined) {
            teamUpdates.avatarImg = updates.avatarImg;
          }
          
          // Update team collection
          await updateDoc(teamDocRef, teamUpdates);
          console.log('✅ Synced profile data to team collection:', { 
            workspaceId, 
            memberId, 
            syncedFields: Object.keys(teamUpdates).filter(k => k !== 'updatedAt')
          });
        } else {
          console.warn('⚠️ Cannot sync to team - missing workspaceId or memberId:', { workspaceId, memberId });
        }
      }
    } catch (error) {
      console.error('❌ Failed to sync profile data to team collection:', error);
      // Don't throw - profile update succeeded, team sync is secondary
    }
  }
  
  // Clear cache for this user so next getProfile fetches fresh data
  profileCache.delete(uid);
  
  console.log('✅ updateProfile completed');
}

/**
 * Stamp loginTime and lastActivityTime on sign-in.
 * Also generates a unique session token to enforce single-device login.
 * loginTime = hard expiry clock (never reset after this).
 * lastActivityTime = inactivity clock (reset on user activity).
 * @param {string} uid
 */
export async function stampLogin(uid) {
  // Generate unique session token
  const sessionToken = `${uid}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  await updateDoc(doc(db, USERS_COLLECTION, uid), {
    loginTime:        serverTimestamp(),
    lastActivityTime: serverTimestamp(),
    sessionToken:     sessionToken, // Store current session token
  });
  
  // Store session token in localStorage for this device
  if (typeof window !== 'undefined') {
    localStorage.setItem('sessionToken', sessionToken);
  }
  
  return sessionToken;
}

/**
 * Clear session fields on logout.
 * loginTime, lastActivityTime, currentPlan → null.
 * planExpiryDate, adminPassword, role, memberId → kept.
 * @param {string} uid
 */
export async function clearSession(uid) {
  await updateDoc(doc(db, USERS_COLLECTION, uid), {
    loginTime:        null,
    lastActivityTime: null,
    currentPlan:      null,
  });
}
