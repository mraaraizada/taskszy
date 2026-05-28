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
    console.log('✅ Profile cached for user:', userId);
  } catch (error) {
    console.error('❌ Error saving profile to cache:', error);
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
      console.log('❌ No cached profile found for user:', userId);
      return null;
    }
    
    const cacheData = JSON.parse(cached);
    const age = Date.now() - cacheData.timestamp;
    
    // Check if cache is expired
    if (age > CACHE_EXPIRY) {
      console.log('⏰ Cached profile expired for user:', userId);
      clearProfileCache(userId);
      return null;
    }
    
    console.log('✅ Using cached profile for user:', userId, `(age: ${Math.round(age / 1000 / 60)} minutes)`);
    return cacheData.data;
  } catch (error) {
    console.error('❌ Error reading profile from cache:', error);
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
    console.log('🗑️ Profile cache cleared for user:', userId);
  } catch (error) {
    console.error('❌ Error clearing profile cache:', error);
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
    console.log('🗑️ All profile caches cleared');
  } catch (error) {
    console.error('❌ Error clearing all profile caches:', error);
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
    console.log('✅ Profile cache updated for user:', userId);
  } catch (error) {
    console.error('❌ Error updating profile cache:', error);
  }
}
