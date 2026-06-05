/**
 * Advanced Query Optimizer for Firebase Reads
 * 
 * Implements enterprise-grade optimization strategies:
 * 1. Query result caching with smart invalidation
 * 2. Request deduplication (prevent duplicate simultaneous queries)
 * 3. Query batching and coalescing
 * 4. Automatic pagination management
 * 5. Read operation tracking and analytics
 */

class QueryOptimizer {
  constructor() {
    // In-flight request tracking (prevents duplicate queries)
    this.inflightRequests = new Map();
    
    // Query result cache
    this.queryCache = new Map();
    
    // Read operation analytics
    this.readStats = {
      total: 0,
      cached: 0,
      deduplicated: 0,
      batched: 0,
      timestamp: Date.now()
    };
    
    // Batch queue for coalescing similar queries
    this.batchQueue = new Map();
    this.batchTimeout = null;
  }

  /**
   * Execute a query with automatic deduplication and caching
   * @param {string} queryKey - Unique identifier for the query
   * @param {Function} queryFn - Function that executes the Firestore query
   * @param {Object} options - { ttl, forceRefresh }
   * @returns {Promise} - Query result
   */
  async executeQuery(queryKey, queryFn, options = {}) {
    const { ttl = 5 * 60 * 1000, forceRefresh = false } = options;
    
    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = this.getCached(queryKey);
      if (cached) {
        this.readStats.cached++;

        return cached;
      }
    }
    
    // Check if query is already in-flight (deduplication)
    if (this.inflightRequests.has(queryKey)) {
      this.readStats.deduplicated++;

      return this.inflightRequests.get(queryKey);
    }
    
    // Execute query and track in-flight

    const queryPromise = queryFn()
      .then(result => {
        // Cache result
        this.setCache(queryKey, result, ttl);
        this.readStats.total++;
        return result;
      })
      .finally(() => {
        // Remove from in-flight
        this.inflightRequests.delete(queryKey);
      });
    
    this.inflightRequests.set(queryKey, queryPromise);
    return queryPromise;
  }

  /**
   * Batch multiple queries together
   * @param {string} batchKey - Batch identifier
   * @param {Array} queries - Array of { key, fn }
   * @param {number} delay - Batch delay in ms
   * @returns {Promise<Array>} - Array of results
   */
  async batchQueries(batchKey, queries, delay = 50) {
    return new Promise((resolve, reject) => {
      // Add to batch queue
      if (!this.batchQueue.has(batchKey)) {
        this.batchQueue.set(batchKey, []);
      }
      
      this.batchQueue.get(batchKey).push({ queries, resolve, reject });
      
      // Clear existing timeout
      if (this.batchTimeout) {
        clearTimeout(this.batchTimeout);
      }
      
      // Set new timeout to execute batch
      this.batchTimeout = setTimeout(async () => {
        const batch = this.batchQueue.get(batchKey);
        if (!batch || batch.length === 0) return;

        try {
          // Execute all queries in parallel
          const allQueries = batch.flatMap(b => b.queries);
          const results = await Promise.all(
            allQueries.map(q => this.executeQuery(q.key, q.fn))
          );
          
          this.readStats.batched += allQueries.length;
          
          // Resolve all promises
          batch.forEach(b => b.resolve(results));
        } catch (error) {
          // Reject all promises
          batch.forEach(b => b.reject(error));
        } finally {
          // Clear batch queue
          this.batchQueue.delete(batchKey);
        }
      }, delay);
    });
  }

  /**
   * Get cached query result
   * @param {string} queryKey - Query identifier
   * @returns {any|null} - Cached result or null
   */
  getCached(queryKey) {
    const cached = this.queryCache.get(queryKey);
    if (!cached) return null;
    
    // Check if expired
    if (Date.now() - cached.timestamp > cached.ttl) {
      this.queryCache.delete(queryKey);
      return null;
    }
    
    return cached.data;
  }

  /**
   * Set query result in cache
   * @param {string} queryKey - Query identifier
   * @param {any} data - Data to cache
   * @param {number} ttl - Time to live in ms
   */
  setCache(queryKey, data, ttl) {
    this.queryCache.set(queryKey, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  /**
   * Invalidate cache for specific query or pattern
   * @param {string|RegExp} pattern - Query key or pattern
   */
  invalidateCache(pattern) {
    if (typeof pattern === 'string') {
      this.queryCache.delete(pattern);

    } else if (pattern instanceof RegExp) {
      let count = 0;
      for (const key of this.queryCache.keys()) {
        if (pattern.test(key)) {
          this.queryCache.delete(key);
          count++;
        }
      }

    }
  }

  /**
   * Clear all caches
   */
  clearAll() {
    this.queryCache.clear();
    this.inflightRequests.clear();
    this.batchQueue.clear();

  }

  /**
   * Get read operation statistics
   * @returns {Object} - Statistics object
   */
  getStats() {
    const uptime = Date.now() - this.readStats.timestamp;
    const cacheHitRate = this.readStats.total > 0 
      ? ((this.readStats.cached / (this.readStats.total + this.readStats.cached)) * 100).toFixed(2)
      : 0;
    
    return {
      ...this.readStats,
      cacheHitRate: `${cacheHitRate}%`,
      uptime: `${Math.floor(uptime / 1000)}s`,
      cacheSize: this.queryCache.size,
      inflightRequests: this.inflightRequests.size
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.readStats = {
      total: 0,
      cached: 0,
      deduplicated: 0,
      batched: 0,
      timestamp: Date.now()
    };
  }

  /**
   * Create a paginated query executor
   * @param {Function} queryFn - Function that returns a Firestore query
   * @param {Object} options - { pageSize, cacheKey }
   * @returns {Object} - Pagination controller
   */
  createPaginatedQuery(queryFn, options = {}) {
    const { pageSize = 20, cacheKey = 'paginated' } = options;
    
    let currentPage = 0;
    let lastDoc = null;
    let hasMore = true;
    
    return {
      async loadNext() {
        if (!hasMore) {

          return { data: [], hasMore: false };
        }
        
        const key = `${cacheKey}_page_${currentPage}`;
        const result = await this.executeQuery(key, () => queryFn(lastDoc, pageSize));
        
        lastDoc = result.lastDoc;
        hasMore = result.hasMore;
        currentPage++;
        
        return result;
      },
      
      reset() {
        currentPage = 0;
        lastDoc = null;
        hasMore = true;
        // Invalidate all pages
        this.invalidateCache(new RegExp(`^${cacheKey}_page_`));
      },
      
      getCurrentPage() {
        return currentPage;
      },
      
      hasMorePages() {
        return hasMore;
      }
    };
  }
}

// Singleton instance
const queryOptimizer = new QueryOptimizer();

// Export helper functions
export const executeOptimizedQuery = (key, fn, options) => 
  queryOptimizer.executeQuery(key, fn, options);

export const batchQueries = (key, queries, delay) => 
  queryOptimizer.batchQueries(key, queries, delay);

export const invalidateQueryCache = (pattern) => 
  queryOptimizer.invalidateCache(pattern);

export const getQueryStats = () => 
  queryOptimizer.getStats();

export const createPaginatedQuery = (fn, options) => 
  queryOptimizer.createPaginatedQuery(fn, options);

export default queryOptimizer;
