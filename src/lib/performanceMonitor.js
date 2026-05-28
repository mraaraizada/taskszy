/**
 * Performance Monitor
 * Track Firebase usage and app performance
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      reads: 0,
      writes: 0,
      deletes: 0,
      cacheHits: 0,
      cacheMisses: 0,
      pageLoads: 0,
      errors: 0,
    };
    
    this.startTime = Date.now();
    this.sessionId = `session_${Date.now()}`;
  }

  /**
   * Track a Firestore read
   */
  trackRead(collection, count = 1) {
    this.metrics.reads += count;
    console.log(`📖 Read: ${collection} (+${count}) | Total: ${this.metrics.reads}`);
  }

  /**
   * Track a Firestore write
   */
  trackWrite(collection, count = 1) {
    this.metrics.writes += count;
    console.log(`✍️ Write: ${collection} (+${count}) | Total: ${this.metrics.writes}`);
  }

  /**
   * Track a Firestore delete
   */
  trackDelete(collection, count = 1) {
    this.metrics.deletes += count;
    console.log(`🗑️ Delete: ${collection} (+${count}) | Total: ${this.metrics.deletes}`);
  }

  /**
   * Track cache hit
   */
  trackCacheHit(key) {
    this.metrics.cacheHits++;
    console.log(`💾 Cache HIT: ${key} | Total: ${this.metrics.cacheHits}`);
  }

  /**
   * Track cache miss
   */
  trackCacheMiss(key) {
    this.metrics.cacheMisses++;
    console.log(`❌ Cache MISS: ${key} | Total: ${this.metrics.cacheMisses}`);
  }

  /**
   * Track page load
   */
  trackPageLoad(page) {
    this.metrics.pageLoads++;
    console.log(`📄 Page Load: ${page} | Total: ${this.metrics.pageLoads}`);
  }

  /**
   * Track error
   */
  trackError(error, context) {
    this.metrics.errors++;
    console.error(`❌ Error in ${context}:`, error);
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    const uptime = Date.now() - this.startTime;
    const uptimeMinutes = Math.floor(uptime / 60000);
    
    return {
      ...this.metrics,
      uptime: uptimeMinutes,
      sessionId: this.sessionId,
      cacheHitRate: this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses) * 100 || 0,
      readsPerMinute: this.metrics.reads / uptimeMinutes || 0,
    };
  }

  /**
   * Get formatted report
   */
  getReport() {
    const metrics = this.getMetrics();
    
    return `
╔════════════════════════════════════════════════════════════╗
║              FIREBASE PERFORMANCE REPORT                   ║
╠════════════════════════════════════════════════════════════╣
║ Session: ${metrics.sessionId}                              
║ Uptime: ${metrics.uptime} minutes                          
╠════════════════════════════════════════════════════════════╣
║ FIRESTORE OPERATIONS:                                      ║
║   Reads:   ${metrics.reads.toString().padStart(6)} operations
║   Writes:  ${metrics.writes.toString().padStart(6)} operations
║   Deletes: ${metrics.deletes.toString().padStart(6)} operations
╠════════════════════════════════════════════════════════════╣
║ CACHE PERFORMANCE:                                         ║
║   Hits:    ${metrics.cacheHits.toString().padStart(6)} 
║   Misses:  ${metrics.cacheMisses.toString().padStart(6)}
║   Hit Rate: ${metrics.cacheHitRate.toFixed(1)}%
╠════════════════════════════════════════════════════════════╣
║ APP METRICS:                                               ║
║   Page Loads: ${metrics.pageLoads.toString().padStart(4)}
║   Errors:     ${metrics.errors.toString().padStart(4)}
║   Reads/min:  ${metrics.readsPerMinute.toFixed(1)}
╚════════════════════════════════════════════════════════════╝
    `.trim();
  }

  /**
   * Reset metrics
   */
  reset() {
    this.metrics = {
      reads: 0,
      writes: 0,
      deletes: 0,
      cacheHits: 0,
      cacheMisses: 0,
      pageLoads: 0,
      errors: 0,
    };
    this.startTime = Date.now();
    console.log('🔄 Performance metrics reset');
  }

  /**
   * Check if approaching Firebase limits
   */
  checkLimits() {
    const DAILY_READ_LIMIT = 50000;
    const WARNING_THRESHOLD = 0.8; // 80%
    
    const metrics = this.getMetrics();
    const projectedDailyReads = metrics.readsPerMinute * 60 * 24;
    
    if (projectedDailyReads > DAILY_READ_LIMIT * WARNING_THRESHOLD) {
      console.warn(`⚠️ WARNING: Projected daily reads (${projectedDailyReads.toFixed(0)}) approaching limit (${DAILY_READ_LIMIT})`);
      return {
        warning: true,
        projected: projectedDailyReads,
        limit: DAILY_READ_LIMIT,
        percentage: (projectedDailyReads / DAILY_READ_LIMIT * 100).toFixed(1)
      };
    }
    
    return {
      warning: false,
      projected: projectedDailyReads,
      limit: DAILY_READ_LIMIT,
      percentage: (projectedDailyReads / DAILY_READ_LIMIT * 100).toFixed(1)
    };
  }
}

// Global monitor instance
export const monitor = new PerformanceMonitor();

// Auto-check limits every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    const status = monitor.checkLimits();
    if (status.warning) {
      console.warn('⚠️ Firebase usage warning:', status);
    }
  }, 5 * 60 * 1000);
}

// Expose to window for debugging
if (typeof window !== 'undefined') {
  window.performanceMonitor = {
    getMetrics: () => monitor.getMetrics(),
    getReport: () => console.log(monitor.getReport()),
    reset: () => monitor.reset(),
    checkLimits: () => monitor.checkLimits(),
  };
  
  console.log('✅ Performance monitor loaded. Available commands:');
  console.log('  - window.performanceMonitor.getMetrics()');
  console.log('  - window.performanceMonitor.getReport()');
  console.log('  - window.performanceMonitor.reset()');
  console.log('  - window.performanceMonitor.checkLimits()');
}

export default monitor;
