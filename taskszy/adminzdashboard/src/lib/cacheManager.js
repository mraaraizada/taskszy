/**
 * Professional Cache Manager for Firebase Optimization
 * Reduces Firestore reads by implementing intelligent caching strategies with localStorage persistence
 */

class CacheManager {
  constructor() {
    this.caches = new Map();
    this.defaultTTL = 5 * 60 * 1000; // 5 minutes default
    this.storagePrefix = 'taskzy_cache_';
    
    // Load caches from localStorage on initialization
    this.loadFromStorage();
  }

  /**
   * Load caches from localStorage
   */
  loadFromStorage() {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.storagePrefix)) {
          const cacheName = key.replace(this.storagePrefix, '');
          const stored = localStorage.getItem(key);
          if (stored) {
            const parsed = JSON.parse(stored);
            // Only restore if not expired
            if (parsed.timestamp && (Date.now() - parsed.timestamp < parsed.ttl)) {
              this.caches.set(cacheName, {
                data: parsed.data,
                timestamp: parsed.timestamp,
                ttl: parsed.ttl,
                hash: parsed.hash,
                isValid() {
                  return this.data !== null && 
                         this.timestamp !== null && 
                         (Date.now() - this.timestamp < this.ttl);
                },
                set: this.createSetMethod(cacheName),
                get: this.createGetMethod(cacheName),
                clear: this.createClearMethod(cacheName),
                generateHash: this.generateHash,
                hasChanged: this.hasChangedMethod
              });

            }
          }
        }
      });
    } catch (err) {

    }
  }

  /**
   * Save cache to localStorage
   */
  saveToStorage(name, cache) {
    try {
      const toStore = {
        data: cache.data,
        timestamp: cache.timestamp,
        ttl: cache.ttl,
        hash: cache.hash
      };
      localStorage.setItem(this.storagePrefix + name, JSON.stringify(toStore));
    } catch (err) {

    }
  }

  /**
   * Create set method for cache
   */
  createSetMethod(name) {
    return function(data) {
      const newHash = this.generateHash(data);
      const hasChanged = this.hash !== newHash;
      
      this.data = data;
      this.timestamp = Date.now();
      this.hash = newHash;
      
      // Save to localStorage
      cacheManager.saveToStorage(name, this);
      
      if (hasChanged) {

      } else {

      }
      
      return hasChanged;
    };
  }

  /**
   * Create get method for cache
   */
  createGetMethod(name) {
    return function() {
      if (this.isValid()) {

        return this.data;
      }

      return null;
    };
  }

  /**
   * Create clear method for cache
   */
  createClearMethod(name) {
    return function() {
      this.data = null;
      this.timestamp = null;
      this.hash = null;
      try {
        localStorage.removeItem(cacheManager.storagePrefix + name);
      } catch (err) {

      }

    };
  }

  /**
   * Generate hash for data comparison
   */
  generateHash(data) {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash;
  }

  /**
   * Check if data has changed
   */
  hasChangedMethod(newData) {
    const newHash = this.generateHash(newData);
    return this.hash !== newHash;
  }

  /**
   * Create or get a cache instance
   * @param {string} name - Cache name
   * @param {number} ttl - Time to live in milliseconds
   */
  createCache(name, ttl = this.defaultTTL) {
    if (!this.caches.has(name)) {
      this.caches.set(name, {
        data: null,
        timestamp: null,
        ttl: ttl,
        hash: null,
        isValid() {
          return this.data !== null && 
                 this.timestamp !== null && 
                 (Date.now() - this.timestamp < this.ttl);
        },
        set: this.createSetMethod(name),
        get: this.createGetMethod(name),
        clear: this.createClearMethod(name),
        generateHash: this.generateHash,
        hasChanged: this.hasChangedMethod
      });
    }
    return this.caches.get(name);
  }

  /**
   * Get data from cache
   * @param {string} name - Cache name
   */
  get(name) {
    const cache = this.caches.get(name);
    return cache ? cache.get() : null;
  }

  /**
   * Set data in cache and return whether data changed
   * @param {string} name - Cache name
   * @param {any} data - Data to cache
   * @returns {boolean} - True if data changed, false if same
   */
  set(name, data) {
    const cache = this.createCache(name);
    return cache.set(data);
  }

  /**
   * Check if data has changed without setting
   * @param {string} name - Cache name
   * @param {any} newData - New data to compare
   * @returns {boolean} - True if data changed
   */
  hasChanged(name, newData) {
    const cache = this.caches.get(name);
    if (!cache) return true; // No cache = changed
    return cache.hasChanged(newData);
  }

  /**
   * Clear specific cache
   * @param {string} name - Cache name
   */
  clear(name) {
    const cache = this.caches.get(name);
    if (cache) {
      cache.clear();
    }
  }

  /**
   * Clear all caches
   */
  clearAll() {

    this.caches.forEach(cache => cache.clear());
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const stats = {};
    this.caches.forEach((cache, name) => {
      stats[name] = {
        hasData: cache.data !== null,
        isValid: cache.isValid(),
        age: cache.timestamp ? Date.now() - cache.timestamp : null,
        ttl: cache.ttl
      };
    });
    return stats;
  }
}

// Singleton instance
const cacheManager = new CacheManager();

// Pre-configure caches for different data types
export const CACHE_KEYS = {
  ORGANIZATIONS: 'organizations',
  FEEDBACK: 'feedback',
  PAYMENTS: 'payments',
  USERS: 'users',
  WORKSPACES: 'workspaces',
  TEAM_MEMBERS: 'team_members',
  TASKS: 'tasks',
  STATS: 'stats'
};

// Configure cache TTLs (Time To Live) - BALANCED FOR REAL-TIME UPDATES
export const CACHE_TTL = {
  SHORT: 2 * 60 * 1000,        // 2 minutes - frequently changing data
  MEDIUM: 5 * 60 * 1000,       // 5 minutes - moderate changes
  LONG: 15 * 60 * 1000,        // 15 minutes - rarely changing data
  VERY_LONG: 30 * 60 * 1000    // 30 minutes - static data
};

// Initialize caches with appropriate TTLs - BALANCED FOR RESPONSIVENESS
cacheManager.createCache(CACHE_KEYS.ORGANIZATIONS, CACHE_TTL.MEDIUM);    // 5 minutes - organizations can change
cacheManager.createCache(CACHE_KEYS.FEEDBACK, CACHE_TTL.SHORT);          // 2 minutes - feedback submissions
cacheManager.createCache(CACHE_KEYS.PAYMENTS, CACHE_TTL.MEDIUM);         // 5 minutes - payment history
cacheManager.createCache(CACHE_KEYS.USERS, CACHE_TTL.LONG);              // 15 minutes - user profiles
cacheManager.createCache(CACHE_KEYS.WORKSPACES, CACHE_TTL.MEDIUM);       // 5 minutes - workspace settings
cacheManager.createCache(CACHE_KEYS.TEAM_MEMBERS, CACHE_TTL.MEDIUM);     // 5 minutes - team members
cacheManager.createCache(CACHE_KEYS.TASKS, CACHE_TTL.SHORT);             // 2 minutes - tasks
cacheManager.createCache(CACHE_KEYS.STATS, CACHE_TTL.MEDIUM);            // 5 minutes - statistics

export default cacheManager;
