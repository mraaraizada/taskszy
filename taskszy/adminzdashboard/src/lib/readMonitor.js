/**
 * Firebase Read Operation Monitor
 * 
 * Tracks and analyzes all Firestore read operations for optimization insights
 * Provides real-time analytics and cost estimation
 */

class ReadMonitor {
  constructor() {
    this.operations = [];
    this.startTime = Date.now();
    this.enabled = true;
    
    // Cost per operation (Google Cloud Firestore pricing)
    this.costs = {
      documentRead: 0.00000036, // $0.36 per 1M reads
      documentWrite: 0.00000108, // $1.08 per 1M writes
      documentDelete: 0.00000012, // $0.12 per 1M deletes
    };
  }

  /**
   * Log a read operation
   * @param {Object} operation - { type, collection, count, cached, source }
   */
  logRead(operation) {
    if (!this.enabled) return;
    
    const entry = {
      ...operation,
      timestamp: Date.now(),
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    this.operations.push(entry);
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      const emoji = operation.cached ? '💾' : '🔥';

    }
  }

  /**
   * Get read statistics
   * @param {Object} options - { timeRange, groupBy }
   * @returns {Object} - Statistics
   */
  getStats(options = {}) {
    const { timeRange = null, groupBy = 'collection' } = options;
    
    // Filter by time range
    let ops = this.operations;
    if (timeRange) {
      const cutoff = Date.now() - timeRange;
      ops = ops.filter(op => op.timestamp >= cutoff);
    }
    
    // Calculate totals
    const totalReads = ops.reduce((sum, op) => sum + (op.cached ? 0 : op.count), 0);
    const cachedReads = ops.reduce((sum, op) => sum + (op.cached ? op.count : 0), 0);
    const totalOperations = ops.length;
    
    // Calculate costs
    const estimatedCost = totalReads * this.costs.documentRead;
    const savedCost = cachedReads * this.costs.documentRead;
    
    // Group by collection
    const byCollection = {};
    ops.forEach(op => {
      const key = op.collection || 'unknown';
      if (!byCollection[key]) {
        byCollection[key] = { reads: 0, cached: 0, operations: 0 };
      }
      byCollection[key].operations++;
      if (op.cached) {
        byCollection[key].cached += op.count;
      } else {
        byCollection[key].reads += op.count;
      }
    });
    
    // Calculate cache hit rate
    const cacheHitRate = totalReads + cachedReads > 0
      ? ((cachedReads / (totalReads + cachedReads)) * 100).toFixed(2)
      : 0;
    
    return {
      totalReads,
      cachedReads,
      totalOperations,
      cacheHitRate: `${cacheHitRate}%`,
      estimatedCost: `$${estimatedCost.toFixed(6)}`,
      savedCost: `$${savedCost.toFixed(6)}`,
      byCollection,
      uptime: this.getUptime(),
      readsPerMinute: this.getReadsPerMinute(ops)
    };
  }

  /**
   * Get uptime in human-readable format
   * @returns {string}
   */
  getUptime() {
    const ms = Date.now() - this.startTime;
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  /**
   * Calculate reads per minute
   * @param {Array} ops - Operations to analyze
   * @returns {number}
   */
  getReadsPerMinute(ops) {
    if (ops.length === 0) return 0;
    
    const duration = Date.now() - this.startTime;
    const minutes = duration / (1000 * 60);
    const totalReads = ops.reduce((sum, op) => sum + op.count, 0);
    
    return (totalReads / minutes).toFixed(2);
  }

  /**
   * Get top read-heavy collections
   * @param {number} limit - Number of results
   * @returns {Array}
   */
  getTopCollections(limit = 5) {
    const stats = this.getStats();
    const collections = Object.entries(stats.byCollection)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.reads - a.reads)
      .slice(0, limit);
    
    return collections;
  }

  /**
   * Get optimization recommendations
   * @returns {Array} - Array of recommendation objects
   */
  getRecommendations() {
    const stats = this.getStats();
    const recommendations = [];
    
    // Check cache hit rate
    const cacheHitRate = parseFloat(stats.cacheHitRate);
    if (cacheHitRate < 50) {
      recommendations.push({
        priority: 'high',
        type: 'caching',
        message: `Low cache hit rate (${stats.cacheHitRate}). Consider increasing cache TTL or implementing more aggressive caching.`,
        impact: 'Could reduce reads by up to 50%'
      });
    }
    
    // Check for high-read collections
    Object.entries(stats.byCollection).forEach(([collection, data]) => {
      if (data.reads > 100) {
        recommendations.push({
          priority: 'medium',
          type: 'aggregation',
          message: `Collection "${collection}" has ${data.reads} reads. Consider using aggregation documents.`,
          impact: `Could reduce reads by ${Math.floor(data.reads * 0.9)} (90%)`
        });
      }
      
      // Check for collections with low cache usage
      const collectionCacheRate = data.cached / (data.reads + data.cached);
      if (collectionCacheRate < 0.3 && data.reads > 20) {
        recommendations.push({
          priority: 'medium',
          type: 'caching',
          message: `Collection "${collection}" has low cache usage. Implement query result caching.`,
          impact: `Could reduce reads by ${Math.floor(data.reads * 0.7)} (70%)`
        });
      }
    });
    
    // Check reads per minute
    const rpm = parseFloat(stats.readsPerMinute);
    if (rpm > 100) {
      recommendations.push({
        priority: 'high',
        type: 'listener',
        message: `High read rate (${rpm} reads/min). Check for duplicate listeners or unnecessary real-time subscriptions.`,
        impact: 'Could reduce reads by 50-80%'
      });
    }
    
    return recommendations.sort((a, b) => {
      const priority = { high: 3, medium: 2, low: 1 };
      return priority[b.priority] - priority[a.priority];
    });
  }

  /**
   * Generate optimization report
   * @returns {Object} - Detailed report
   */
  generateReport() {
    const stats = this.getStats();
    const topCollections = this.getTopCollections();
    const recommendations = this.getRecommendations();
    
    return {
      summary: {
        ...stats,
        efficiency: this.calculateEfficiency()
      },
      topCollections,
      recommendations,
      timeline: this.getReadTimeline()
    };
  }

  /**
   * Calculate overall efficiency score (0-100)
   * @returns {number}
   */
  calculateEfficiency() {
    const stats = this.getStats();
    const cacheHitRate = parseFloat(stats.cacheHitRate);
    const rpm = parseFloat(stats.readsPerMinute);
    
    // Efficiency based on cache hit rate and read frequency
    let score = cacheHitRate;
    
    // Penalty for high read rate
    if (rpm > 100) score *= 0.7;
    else if (rpm > 50) score *= 0.85;
    
    return Math.round(score);
  }

  /**
   * Get read timeline (last 10 operations)
   * @returns {Array}
   */
  getReadTimeline() {
    return this.operations
      .slice(-10)
      .map(op => ({
        collection: op.collection,
        count: op.count,
        cached: op.cached,
        timestamp: new Date(op.timestamp).toLocaleTimeString()
      }));
  }

  /**
   * Clear all tracked operations
   */
  clear() {
    this.operations = [];
    this.startTime = Date.now();

  }

  /**
   * Enable/disable monitoring
   * @param {boolean} enabled
   */
  setEnabled(enabled) {
    this.enabled = enabled;

  }

  /**
   * Export operations to JSON
   * @returns {string}
   */
  exportToJSON() {
    return JSON.stringify({
      operations: this.operations,
      stats: this.getStats(),
      report: this.generateReport()
    }, null, 2);
  }
}

// Singleton instance
const readMonitor = new ReadMonitor();

// Export helper functions
export const logRead = (operation) => readMonitor.logRead(operation);
export const getReadStats = (options) => readMonitor.getStats(options);
export const getOptimizationReport = () => readMonitor.generateReport();
export const clearReadMonitor = () => readMonitor.clear();

// Expose to window for debugging
if (typeof window !== 'undefined') {
  window.readMonitor = readMonitor;
}

export default readMonitor;
