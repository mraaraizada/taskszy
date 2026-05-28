/**
 * Cache Service
 * Implements multi-layer caching for Firebase data
 */

// ── Memory Cache ──────────────────────────────────────────────────────────────
class MemoryCache {
  constructor(ttl = 5 * 60 * 1000) { // 5 minutes default
    this.cache = new Map();
    this.ttl = ttl;
  }

  set(key, value) {
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  get(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;

    // Check if expired
    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.value;
  }

  has(key) {
    return this.get(key) !== null;
  }

  delete(key) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  size() {
    return this.cache.size;
  }
}

// ── LocalStorage Cache ────────────────────────────────────────────────────────
class LocalStorageCache {
  constructor(prefix = 'taskzy_cache_', ttl = 24 * 60 * 60 * 1000) { // 24 hours default
    this.prefix = prefix;
    this.ttl = ttl;
  }

  set(key, value) {
    try {
      const cacheKey = this.prefix + key;
      const data = {
        value,
        timestamp: Date.now()
      };
      localStorage.setItem(cacheKey, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to cache to localStorage:', error);
    }
  }

  get(key) {
    try {
      const cacheKey = this.prefix + key;
      const cached = localStorage.getItem(cacheKey);
      if (!cached) return null;

      const data = JSON.parse(cached);
      
      // Check if expired
      if (Date.now() - data.timestamp > this.ttl) {
        localStorage.removeItem(cacheKey);
        return null;
      }

      return data.value;
    } catch (error) {
      console.warn('Failed to read from localStorage cache:', error);
      return null;
    }
  }

  has(key) {
    return this.get(key) !== null;
  }

  delete(key) {
    try {
      const cacheKey = this.prefix + key;
      localStorage.removeItem(cacheKey);
    } catch (error) {
      console.warn('Failed to delete from localStorage cache:', error);
    }
  }

  clear() {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Failed to clear localStorage cache:', error);
    }
  }
}

// ── Multi-Layer Cache ─────────────────────────────────────────────────────────
class MultiLayerCache {
  constructor() {
    this.memoryCache = new MemoryCache(5 * 60 * 1000); // 5 min
    this.localStorageCache = new LocalStorageCache('taskzy_cache_', 24 * 60 * 60 * 1000); // 24 hours
  }

  /**
   * Get from cache (checks memory first, then localStorage)
   */
  get(key) {
    // Try memory cache first (fastest)
    let value = this.memoryCache.get(key);
    if (value !== null) {
      console.log('💾 Cache HIT (memory):', key);
      return value;
    }

    // Try localStorage (slower but persistent)
    value = this.localStorageCache.get(key);
    if (value !== null) {
      console.log('💾 Cache HIT (localStorage):', key);
      // Promote to memory cache
      this.memoryCache.set(key, value);
      return value;
    }

    console.log('❌ Cache MISS:', key);
    return null;
  }

  /**
   * Set in both caches
   */
  set(key, value) {
    this.memoryCache.set(key, value);
    this.localStorageCache.set(key, value);
    console.log('💾 Cached:', key);
  }

  /**
   * Check if key exists in cache
   */
  has(key) {
    return this.get(key) !== null;
  }

  /**
   * Delete from both caches
   */
  delete(key) {
    this.memoryCache.delete(key);
    this.localStorageCache.delete(key);
  }

  /**
   * Clear all caches
   */
  clear() {
    this.memoryCache.clear();
    this.localStorageCache.clear();
    console.log('🗑️ All caches cleared');
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      memorySize: this.memoryCache.size(),
      localStorageKeys: Object.keys(localStorage).filter(k => k.startsWith('taskzy_cache_')).length
    };
  }
}

// ── Global Cache Instance ─────────────────────────────────────────────────────
export const cache = new MultiLayerCache();

// ── Cache Helpers ─────────────────────────────────────────────────────────────

/**
 * Cache Firestore data with automatic key generation
 */
export function cacheFirestoreData(collection, workspaceId, data) {
  const key = `firestore_${collection}_${workspaceId}`;
  cache.set(key, data);
}

/**
 * Get cached Firestore data
 */
export function getCachedFirestoreData(collection, workspaceId) {
  const key = `firestore_${collection}_${workspaceId}`;
  return cache.get(key);
}

/**
 * Invalidate Firestore cache
 */
export function invalidateFirestoreCache(collection, workspaceId) {
  const key = `firestore_${collection}_${workspaceId}`;
  cache.delete(key);
}

/**
 * Cache user profile
 */
export function cacheUserProfile(userId, profile) {
  const key = `user_profile_${userId}`;
  cache.set(key, profile);
}

/**
 * Get cached user profile
 */
export function getCachedUserProfile(userId) {
  const key = `user_profile_${userId}`;
  return cache.get(key);
}

// Expose to window for debugging
if (typeof window !== 'undefined') {
  window.cache = {
    get: (key) => cache.get(key),
    set: (key, value) => cache.set(key, value),
    delete: (key) => cache.delete(key),
    clear: () => cache.clear(),
    stats: () => cache.getStats(),
  };
  
  console.log('✅ Cache service loaded. Available commands:');
  console.log('  - window.cache.get("key")');
  console.log('  - window.cache.set("key", value)');
  console.log('  - window.cache.delete("key")');
  console.log('  - window.cache.clear()');
  console.log('  - window.cache.stats()');
}

export default {
  cache,
  cacheFirestoreData,
  getCachedFirestoreData,
  invalidateFirestoreCache,
  cacheUserProfile,
  getCachedUserProfile,
};
