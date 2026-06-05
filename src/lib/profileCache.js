/**
 * Profile Cache Manager
 * Caches user profile data in localStorage to prevent unnecessary reloads
 */

const CACHE_KEY_PREFIX = 'profile_cache_';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Save profile data to cache
 * @param {string} userId - User ID
 * @param {object} profileData - Profile data to cache
 */
export function saveProfileToCache(userId, profileData) {
  if (!userId || !profileData) return;
  
  try {
    const cacheData = {
      data: profileData,
      timestamp: Date.now(),
      userId: userId
    };
    
    localStorage.setItem(`${CACHE_KEY_PREFIX}${userId}`, JSON.stringify(cacheData));

  } catch (error) {

  }
}

/**
 * Get profile data from cache
 * @param {string} userId - User ID
 * @returns {object|null} - Cached profile data or null if not found/expired
 */
export function getProfileFromCache(userId) {
  if (!userId) return null;
  
  try {
    const cached = localStorage.getItem(`${CACHE_KEY_PREFIX}${userId}`);
    if (!cached) {

      return null;
    }
    
    const cacheData = JSON.parse(cached);
    const age = Date.now() - cacheData.timestamp;
    
    // Check if cache is expired
    if (age > CACHE_EXPIRY) {

      clearProfileCache(userId);
      return null;
    }

    return cacheData.data;
  } catch (error) {

    return null;
  }
}

/**
 * Clear profile cache for specific user
 * @param {string} userId - User ID
 */
export function clearProfileCache(userId) {
  if (!userId) return;
  
  try {
    localStorage.removeItem(`${CACHE_KEY_PREFIX}${userId}`);

  } catch (error) {

  }
}

/**
 * Clear all profile caches
 */
export function clearAllProfileCaches() {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(CACHE_KEY_PREFIX)) {
        localStorage.removeItem(key);
      }
    });

  } catch (error) {

  }
}

/**
 * Update specific fields in cached profile
 * @param {string} userId - User ID
 * @param {object} updates - Fields to update
 */
export function updateProfileCache(userId, updates) {
  if (!userId || !updates) return;
  
  try {
    const cached = getProfileFromCache(userId);
    if (!cached) return;
    
    const updatedProfile = { ...cached, ...updates };
    saveProfileToCache(userId, updatedProfile);

  } catch (error) {

  }
}
