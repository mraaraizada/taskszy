/**
 * Firestore Read Optimizations
 * 
 * Strategies to reduce Firestore read operations:
 * 1. Lazy loading - Only load data when needed
 * 2. Pagination - Load data in chunks
 * 3. Caching - Store data locally and reuse
 * 4. Conditional listeners - Only subscribe when data is visible
 * 5. Limit queries - Use .limit() to reduce document reads
 */

// Track which collections are actively being viewed
const activeCollections = new Set();

/**
 * Mark a collection as active (user is viewing it)
 * @param {string} collectionName - Name of the collection
 */
export function markCollectionActive(collectionName) {
  activeCollections.add(collectionName);

}

/**
 * Mark a collection as inactive (user navigated away)
 * @param {string} collectionName - Name of the collection
 */
export function markCollectionInactive(collectionName) {
  activeCollections.delete(collectionName);

}

/**
 * Check if a collection is currently active
 * @param {string} collectionName - Name of the collection
 * @returns {boolean}
 */
export function isCollectionActive(collectionName) {
  return activeCollections.has(collectionName);
}

/**
 * Get optimized query limits based on user role and collection
 * @param {string} collectionName - Name of the collection
 * @param {string} userRole - User's role (admin, management, member)
 * @returns {number} Limit for the query
 */
export function getQueryLimit(collectionName, userRole) {
  const limits = {
    // Admin sees everything, but still limit for performance
    admin: {
      tasks: 500,
      activity: 50,
      team: 100,
      notes: 100,
      broadcasts: 20,
      helpSubmissions: 50,
      taskRequests: 50,
      trash: 50
    },
    // Management sees most things
    management: {
      tasks: 300,
      activity: 30,
      team: 100,
      notes: 100,
      broadcasts: 20,
      helpSubmissions: 50,
      taskRequests: 50,
      trash: 50
    },
    // Members see limited data
    member: {
      tasks: 100, // Only their tasks
      activity: 20,
      team: 50,
      notes: 50, // Only their notes
      broadcasts: 10,
      helpSubmissions: 20, // Only their submissions
      taskRequests: 0, // Members don't see task requests
      trash: 0 // Members don't see trash
    }
  };

  return limits[userRole]?.[collectionName] || 100;
}

/**
 * Debounce function to prevent rapid successive calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function to limit execution frequency
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
export function throttle(func, limit) {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Local storage cache for Firestore data
 */
const CACHE_PREFIX = 'firestore_cache_';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

/**
 * Save data to local cache
 * @param {string} key - Cache key
 * @param {any} data - Data to cache
 */
export function saveToCache(key, data) {
  try {
    const cacheData = {
      data,
      timestamp: Date.now()
    };
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(cacheData));
  } catch (error) {

  }
}

/**
 * Get data from local cache
 * @param {string} key - Cache key
 * @returns {any|null} Cached data or null if expired/not found
 */
export function getFromCache(key) {
  try {
    const cached = localStorage.getItem(CACHE_PREFIX + key);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    
    // Check if cache is expired
    if (Date.now() - timestamp > CACHE_EXPIRY) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }

    return data;
  } catch (error) {

    return null;
  }
}

/**
 * Clear all cached data
 */
export function clearCache() {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(CACHE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });

  } catch (error) {

  }
}

/**
 * Visibility change handler to pause/resume listeners
 */
let visibilityListeners = [];

export function registerVisibilityListener(callback) {
  visibilityListeners.push(callback);
}

export function unregisterVisibilityListener(callback) {
  visibilityListeners = visibilityListeners.filter(cb => cb !== callback);
}

// Listen for visibility changes
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    const isVisible = !document.hidden;

    visibilityListeners.forEach(callback => {
      callback(isVisible);
    });
  });
}

/**
 * Batch multiple Firestore operations
 * @param {Array<Function>} operations - Array of async operations
 * @param {number} batchSize - Number of operations to run in parallel
 * @returns {Promise<Array>} Results of all operations
 */
export async function batchOperations(operations, batchSize = 5) {
  const results = [];
  
  for (let i = 0; i < operations.length; i += batchSize) {
    const batch = operations.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(op => op()));
    results.push(...batchResults);
  }
  
  return results;
}

/**
 * Create a smart listener that only subscribes when needed
 * @param {Function} subscribeFunc - Function that returns unsubscribe function
 * @param {string} collectionName - Name of the collection
 * @returns {Object} Controller with start/stop methods
 */
export function createSmartListener(subscribeFunc, collectionName) {
  let unsubscribe = null;
  let isActive = false;

  return {
    start: () => {
      if (!isActive) {

        unsubscribe = subscribeFunc();
        isActive = true;
        markCollectionActive(collectionName);
      }
    },
    stop: () => {
      if (isActive && unsubscribe) {

        unsubscribe();
        unsubscribe = null;
        isActive = false;
        markCollectionInactive(collectionName);
      }
    },
    isActive: () => isActive
  };
}

/**
 * Read optimization recommendations
 */
export const OPTIMIZATION_TIPS = {
  // Use limit() on queries
  useLimit: 'Always use .limit() on queries to reduce reads',
  
  // Use where() to filter server-side
  useWhere: 'Use .where() clauses to filter on the server instead of client',
  
  // Avoid real-time listeners for static data
  avoidListenersForStatic: 'Use getDoc/getDocs for data that rarely changes (roles, tags)',
  
  // Cache frequently accessed data
  cacheFrequentData: 'Cache frequently accessed data in localStorage',
  
  // Lazy load collections
  lazyLoad: 'Only load collections when user navigates to that page',
  
  // Use pagination
  usePagination: 'Implement pagination for large lists (tasks, activity)',
  
  // Throttle/debounce listeners
  throttleListeners: 'Throttle listener callbacks to reduce processing',
  
  // Unsubscribe when not needed
  unsubscribe: 'Always unsubscribe from listeners when component unmounts',
  
  // Use composite indexes
  useIndexes: 'Create composite indexes for complex queries',
  
  // Minimize document size
  minimizeDocSize: 'Keep documents small, use subcollections for large data'
};

/**
 * Log optimization metrics
 */
export function logOptimizationMetrics() {

}
