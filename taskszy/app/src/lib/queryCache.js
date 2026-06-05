/**
 * Query Cache Service
 * Implements intelligent query result caching with TTL, pattern-based invalidation,
 * LRU eviction, and cache hit rate tracking for Firebase read optimization.
 * 
 * Requirements: 7.1, 7.4, 7.5, 7.6, 18.1, 18.2, 18.7, 18.8
 */

// ── Constants ─────────────────────────────────────────────────────────────────
const MAX_CACHE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB limit
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes default

// ── Cache Entry ───────────────────────────────────────────────────────────────
class CacheEntry {
  constructor(signature, data, ttl) {
    this.signature = signature;
    this.data = data;
    this.timestamp = Date.now();
    this.ttl = ttl;
    this.hits = 0;
    this.lastAccessed = Date.now();
    this.size = this._estimateSize(data);
  }

  /**
   * Check if entry is expired
   */
  isExpired() {
    return Date.now() - this.timestamp > this.ttl;
  }

  /**
   * Record a cache hit
   */
  recordHit() {
    this.hits++;
    this.lastAccessed = Date.now();
  }

  /**
   * Estimate size of cached data in bytes
   */
  _estimateSize(data) {
    try {
      const jsonString = JSON.stringify(data);
      // Rough estimate: 2 bytes per character in UTF-16
      return jsonString.length * 2;
    } catch (error) {

      return 1024; // Default 1KB estimate
    }
  }
}

// ── Query Cache ───────────────────────────────────────────────────────────────
export class QueryCache {
  constructor() {
    this.cache = new Map();
    this.totalSize = 0;
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      invalidations: 0
    };
  }

  /**
   * Get cached query result
   * @param {string} signature - Query signature (collection + filters + orderBy)
   * @returns {Object|null} Cached result or null
   */
  get(signature) {
    const entry = this.cache.get(signature);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if expired
    if (entry.isExpired()) {
      this.cache.delete(signature);
      this.totalSize -= entry.size;
      this.stats.misses++;
      return null;
    }

    // Record hit and return data
    entry.recordHit();
    this.stats.hits++;
    return entry.data;
  }

  /**
   * Set cached query result
   * @param {string} signature - Query signature
   * @param {Object} result - Query result to cache
   * @param {number} ttl - Time-to-live in milliseconds (default: 5 minutes)
   */
  set(signature, result, ttl = DEFAULT_TTL) {
    // Create new entry
    const entry = new CacheEntry(signature, result, ttl);

    // Check if we need to evict entries to make room
    while (this.totalSize + entry.size > MAX_CACHE_SIZE_BYTES && this.cache.size > 0) {
      this._evictLRU();
    }

    // If entry is too large for cache, don't cache it
    if (entry.size > MAX_CACHE_SIZE_BYTES) {

      return;
    }

    // Remove old entry if exists
    const oldEntry = this.cache.get(signature);
    if (oldEntry) {
      this.totalSize -= oldEntry.size;
    }

    // Add new entry
    this.cache.set(signature, entry);
    this.totalSize += entry.size;
  }

  /**
   * Invalidate cache entries matching pattern
   * @param {string} pattern - Collection path or regex pattern
   */
  invalidate(pattern) {
    let invalidatedCount = 0;

    // Convert string pattern to regex if needed
    const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern);

    // Find and remove matching entries
    for (const [signature, entry] of this.cache.entries()) {
      if (regex.test(signature)) {
        this.cache.delete(signature);
        this.totalSize -= entry.size;
        invalidatedCount++;
      }
    }

    this.stats.invalidations += invalidatedCount;
    
    if (invalidatedCount > 0) {

    }
  }

  /**
   * Get cache statistics
   * @returns {Object} { hits, misses, hitRate, size, entries, evictions, invalidations }
   */
  getStats() {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0;

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: hitRate.toFixed(2) + '%',
      size: this._formatBytes(this.totalSize),
      sizeBytes: this.totalSize,
      entries: this.cache.size,
      evictions: this.stats.evictions,
      invalidations: this.stats.invalidations,
      maxSize: this._formatBytes(MAX_CACHE_SIZE_BYTES)
    };
  }

  /**
   * Clear all cache entries
   */
  clear() {
    this.cache.clear();
    this.totalSize = 0;

  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      invalidations: 0
    };
  }

  /**
   * Evict least recently used entry (LRU)
   * @private
   */
  _evictLRU() {
    let lruSignature = null;
    let lruTime = Infinity;

    // Find least recently accessed entry
    for (const [signature, entry] of this.cache.entries()) {
      if (entry.lastAccessed < lruTime) {
        lruTime = entry.lastAccessed;
        lruSignature = signature;
      }
    }

    // Evict the LRU entry
    if (lruSignature) {
      const entry = this.cache.get(lruSignature);
      this.cache.delete(lruSignature);
      this.totalSize -= entry.size;
      this.stats.evictions++;
    }
  }

  /**
   * Format bytes to human-readable string
   * @private
   */
  _formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }
}

// ── Query Signature Generation ────────────────────────────────────────────────

/**
 * Generate a unique signature for a query
 * @param {string} collectionPath - Firestore collection path
 * @param {Object} options - Query options
 * @param {Object} options.filters - Where clause filters
 * @param {Object} options.orderBy - Sort configuration
 * @param {number} options.limit - Result limit
 * @returns {string} Query signature
 */
export function generateQuerySignature(collectionPath, options = {}) {
  const parts = [
    collectionPath,
    JSON.stringify(options.filters || {}),
    JSON.stringify(options.orderBy || {}),
    options.limit || 'unlimited'
  ];
  return parts.join('::');
}

// ── Global Query Cache Instance ───────────────────────────────────────────────
export const queryCache = new QueryCache();

// ── Expose to window for debugging ────────────────────────────────────────────
if (typeof window !== 'undefined') {
  window.queryCache = {
    get: (signature) => queryCache.get(signature),
    set: (signature, result, ttl) => queryCache.set(signature, result, ttl),
    invalidate: (pattern) => queryCache.invalidate(pattern),
    stats: () => queryCache.getStats(),
    clear: () => queryCache.clear(),
    resetStats: () => queryCache.resetStats()
  };

}

export default {
  QueryCache,
  queryCache,
  generateQuerySignature
};
