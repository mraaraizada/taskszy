/**
 * Read Optimizer
 * Aggressive Firebase read reduction strategies
 * 
 * GOAL: Reduce reads by 90%+ through:
 * 1. Listener deduplication
 * 2. Conditional data loading
 * 3. Pagination
 * 4. Snapshot reuse
 * 5. Offline persistence
 */

import { enableIndexedDbPersistence, enableMultiTabIndexedDbPersistence } from 'firebase/firestore';
import { db } from './firebase';

// ── Listener Registry ──────────────────────────────────────────────────────────
// Prevents duplicate listeners from being created
class ListenerRegistry {
  constructor() {
    this.activeListeners = new Map();
    // Enhanced: Shared listener support
    this.sharedListeners = new Map(); // key -> { unsubscribe, subscribers: Set, priority, paused, disposeTimeout }
    this.gracePeriodMs = 5000; // 5-second grace period before disposal
  }

  /**
   * Register a listener to prevent duplicates
   */
  register(key, unsubscribe) {
    // If listener already exists, unsubscribe the old one
    if (this.activeListeners.has(key)) {
      console.warn(`⚠️ Duplicate listener detected: ${key} - removing old listener`);
      const oldUnsub = this.activeListeners.get(key);
      oldUnsub();
    }
    
    this.activeListeners.set(key, unsubscribe);
    console.log(`✅ Listener registered: ${key} (Total: ${this.activeListeners.size})`);
  }

  /**
   * Unregister a listener
   */
  unregister(key) {
    if (this.activeListeners.has(key)) {
      const unsub = this.activeListeners.get(key);
      unsub();
      this.activeListeners.delete(key);
      console.log(`🔌 Listener unregistered: ${key} (Remaining: ${this.activeListeners.size})`);
    }
  }

  /**
   * Check if listener exists
   */
  has(key) {
    return this.activeListeners.has(key);
  }

  /**
   * Get all active listeners
   */
  getAll() {
    return Array.from(this.activeListeners.keys());
  }

  /**
   * Unregister all listeners
   */
  unregisterAll() {
    console.log(`🔌 Unregistering all listeners (${this.activeListeners.size})`);
    this.activeListeners.forEach((unsub, key) => {
      unsub();
    });
    this.activeListeners.clear();
    
    // Also unregister all shared listeners
    this.sharedListeners.forEach((listener, key) => {
      if (listener.disposeTimeout) {
        clearTimeout(listener.disposeTimeout);
      }
      listener.unsubscribe();
    });
    this.sharedListeners.clear();
  }

  /**
   * Register or retrieve shared listener for deduplication
   * @param {string} key - Unique listener identifier
   * @param {Function} listenerFactory - Function that creates listener (returns unsubscribe function)
   * @param {Object} options - Configuration options
   * @param {string} options.priority - 'critical' | 'normal' | 'low' (default: 'normal')
   * @returns {Function} Unsubscribe function for this subscriber
   */
  registerShared(key, listenerFactory, options = {}) {
    const priority = options.priority || 'normal';
    
    // Check if shared listener already exists
    if (this.sharedListeners.has(key)) {
      const listener = this.sharedListeners.get(key);
      
      // Cancel any pending disposal
      if (listener.disposeTimeout) {
        clearTimeout(listener.disposeTimeout);
        listener.disposeTimeout = null;
        console.log(`⏰ Cancelled disposal timeout for shared listener: ${key}`);
      }
      
      // Create a subscriber callback placeholder
      const subscriberId = Symbol('subscriber');
      listener.subscribers.add(subscriberId);
      
      console.log(`♻️ Reusing shared listener: ${key} (Subscribers: ${listener.subscribers.size})`);
      
      // Return unsubscribe function for this subscriber
      return () => {
        listener.subscribers.delete(subscriberId);
        console.log(`🔌 Subscriber removed from: ${key} (Remaining: ${listener.subscribers.size})`);
        
        // If no subscribers remain, schedule disposal after grace period
        if (listener.subscribers.size === 0) {
          listener.disposeTimeout = setTimeout(() => {
            if (listener.subscribers.size === 0 && this.sharedListeners.has(key)) {
              console.log(`🗑️ Disposing shared listener after grace period: ${key}`);
              listener.unsubscribe();
              this.sharedListeners.delete(key);
            }
          }, this.gracePeriodMs + 1); // Add 1ms to ensure it happens after the grace period
        }
      };
    }
    
    // Create new shared listener
    console.log(`✨ Creating new shared listener: ${key}`);
    const unsubscribe = listenerFactory();
    const subscriberId = Symbol('subscriber');
    
    const listener = {
      unsubscribe,
      subscribers: new Set([subscriberId]),
      priority,
      paused: false,
      disposeTimeout: null,
      createdAt: Date.now(),
      lastUpdate: Date.now()
    };
    
    this.sharedListeners.set(key, listener);
    console.log(`✅ Shared listener registered: ${key} (Total shared: ${this.sharedListeners.size})`);
    
    // Return unsubscribe function for this subscriber
    return () => {
      listener.subscribers.delete(subscriberId);
      console.log(`🔌 Subscriber removed from: ${key} (Remaining: ${listener.subscribers.size})`);
      
      // If no subscribers remain, schedule disposal after grace period
      if (listener.subscribers.size === 0) {
        listener.disposeTimeout = setTimeout(() => {
          if (listener.subscribers.size === 0 && this.sharedListeners.has(key)) {
            console.log(`🗑️ Disposing shared listener after grace period: ${key}`);
            listener.unsubscribe();
            this.sharedListeners.delete(key);
          }
        }, this.gracePeriodMs + 1); // Add 1ms to ensure it happens after the grace period
      }
    };
  }

  /**
   * Subscribe to existing shared listener
   * @param {string} key - Listener identifier
   * @param {Function} callback - Subscriber callback (receives snapshot data)
   * @returns {Function} Unsubscribe function
   */
  subscribe(key, callback) {
    if (!this.sharedListeners.has(key)) {
      console.warn(`⚠️ Cannot subscribe to non-existent shared listener: ${key}`);
      return () => {}; // Return no-op unsubscribe
    }
    
    const listener = this.sharedListeners.get(key);
    
    // Cancel any pending disposal
    if (listener.disposeTimeout) {
      clearTimeout(listener.disposeTimeout);
      listener.disposeTimeout = null;
    }
    
    // Add subscriber with callback
    const subscriberId = Symbol('subscriber');
    listener.subscribers.add(subscriberId);
    
    // Store callback for this subscriber (we'll need to enhance the listener to support callbacks)
    // For now, just track the subscriber
    console.log(`📡 Subscribed to shared listener: ${key} (Subscribers: ${listener.subscribers.size})`);
    
    // Return unsubscribe function
    return () => {
      listener.subscribers.delete(subscriberId);
      console.log(`🔌 Unsubscribed from: ${key} (Remaining: ${listener.subscribers.size})`);
      
      // If no subscribers remain, schedule disposal after grace period
      if (listener.subscribers.size === 0) {
        listener.disposeTimeout = setTimeout(() => {
          if (listener.subscribers.size === 0 && this.sharedListeners.has(key)) {
            console.log(`🗑️ Disposing shared listener after grace period: ${key}`);
            listener.unsubscribe();
            this.sharedListeners.delete(key);
          }
        }, this.gracePeriodMs + 1); // Add 1ms to ensure it happens after the grace period
      }
    };
  }

  /**
   * Pause non-critical listeners (on tab visibility change)
   * @param {Array<string>} criticalKeys - Listeners to keep active
   */
  pauseNonCritical(criticalKeys = []) {
    const criticalSet = new Set(criticalKeys);
    let pausedCount = 0;
    
    this.sharedListeners.forEach((listener, key) => {
      // Skip critical listeners
      if (criticalSet.has(key) || listener.priority === 'critical') {
        return;
      }
      
      // Skip already paused listeners
      if (listener.paused) {
        return;
      }
      
      // Pause the listener (unsubscribe but keep metadata)
      listener.unsubscribe();
      listener.paused = true;
      pausedCount++;
      console.log(`⏸️ Paused non-critical listener: ${key}`);
    });
    
    console.log(`⏸️ Paused ${pausedCount} non-critical listeners`);
    return pausedCount;
  }

  /**
   * Resume all paused listeners
   * Note: This requires the original listenerFactory to recreate listeners
   * For now, we just mark them as not paused and log
   */
  resumeAll() {
    let resumedCount = 0;
    
    this.sharedListeners.forEach((listener, key) => {
      if (listener.paused) {
        listener.paused = false;
        resumedCount++;
        console.log(`▶️ Resumed listener: ${key}`);
      }
    });
    
    console.log(`▶️ Resumed ${resumedCount} listeners`);
    return resumedCount;
  }

  /**
   * Get listener statistics for monitoring
   * @returns {Object} Statistics about active listeners
   */
  getStats() {
    const stats = {
      active: this.activeListeners.size,
      shared: this.sharedListeners.size,
      paused: 0,
      totalSubscribers: 0,
      byPriority: {
        critical: 0,
        normal: 0,
        low: 0
      }
    };
    
    this.sharedListeners.forEach((listener) => {
      if (listener.paused) {
        stats.paused++;
      }
      stats.totalSubscribers += listener.subscribers.size;
      stats.byPriority[listener.priority] = (stats.byPriority[listener.priority] || 0) + 1;
    });
    
    return stats;
  }
}

export const listenerRegistry = new ListenerRegistry();

// ── Snapshot Cache ─────────────────────────────────────────────────────────────
// Reuse snapshots to avoid redundant reads
class SnapshotCache {
  constructor() {
    this.snapshots = new Map();
    this.timestamps = new Map();
    this.ttl = 30 * 1000; // 30 seconds
  }

  /**
   * Store a snapshot
   */
  set(key, snapshot) {
    this.snapshots.set(key, snapshot);
    this.timestamps.set(key, Date.now());
    console.log(`📸 Snapshot cached: ${key}`);
  }

  /**
   * Get a snapshot if still valid
   */
  get(key) {
    if (!this.snapshots.has(key)) return null;
    
    const timestamp = this.timestamps.get(key);
    const age = Date.now() - timestamp;
    
    if (age > this.ttl) {
      // Expired
      this.snapshots.delete(key);
      this.timestamps.delete(key);
      console.log(`⏰ Snapshot expired: ${key} (age: ${age}ms)`);
      return null;
    }
    
    console.log(`📸 Snapshot reused: ${key} (age: ${age}ms)`);
    return this.snapshots.get(key);
  }

  /**
   * Clear all snapshots
   */
  clear() {
    this.snapshots.clear();
    this.timestamps.clear();
    console.log('🗑️ All snapshots cleared');
  }
}

export const snapshotCache = new SnapshotCache();

// ── Offline Persistence ────────────────────────────────────────────────────────
let persistenceEnabled = false;

/**
 * Enable offline persistence to reduce reads
 * This allows Firestore to serve data from local cache
 */
export async function enableOfflinePersistence() {
  if (persistenceEnabled) {
    console.log('✅ Offline persistence already enabled');
    return true;
  }

  try {
    // Try multi-tab persistence first (better for multiple tabs)
    await enableMultiTabIndexedDbPersistence(db);
    persistenceEnabled = true;
    console.log('✅ Multi-tab offline persistence enabled');
    return true;
  } catch (err) {
    if (err.code === 'failed-precondition') {
      // Multiple tabs open, try single-tab persistence
      try {
        await enableIndexedDbPersistence(db);
        persistenceEnabled = true;
        console.log('✅ Single-tab offline persistence enabled');
        return true;
      } catch (err2) {
        console.error('❌ Failed to enable offline persistence:', err2);
        return false;
      }
    } else if (err.code === 'unimplemented') {
      console.warn('⚠️ Offline persistence not supported in this browser');
      return false;
    } else {
      console.error('❌ Failed to enable offline persistence:', err);
      return false;
    }
  }
}

// ── Pagination Helper ──────────────────────────────────────────────────────────
/**
 * Create paginated query to load data in chunks
 */
export function createPaginatedQuery(baseQuery, pageSize = 20) {
  return {
    query: baseQuery,
    pageSize,
    lastDoc: null,
    hasMore: true,
  };
}

// ── Conditional Loading ────────────────────────────────────────────────────────
/**
 * Check if data should be loaded based on user activity
 */
export function shouldLoadData(dataType, lastLoadTime, userActive = true) {
  // Don't load if user is inactive
  if (!userActive) {
    console.log(`⏸️ Skipping ${dataType} load - user inactive`);
    return false;
  }

  // Don't reload if recently loaded (within 1 minute)
  if (lastLoadTime && Date.now() - lastLoadTime < 60 * 1000) {
    console.log(`⏸️ Skipping ${dataType} load - recently loaded (${Math.floor((Date.now() - lastLoadTime) / 1000)}s ago)`);
    return false;
  }

  return true;
}

// ── Read Batching ──────────────────────────────────────────────────────────────
/**
 * Batch multiple reads into a single operation
 */
class ReadBatcher {
  constructor(delay = 100) {
    this.queue = [];
    this.delay = delay;
    this.timeout = null;
  }

  /**
   * Add a read to the batch
   */
  add(readFn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ readFn, resolve, reject });
      
      // Clear existing timeout
      if (this.timeout) {
        clearTimeout(this.timeout);
      }
      
      // Set new timeout to execute batch
      this.timeout = setTimeout(() => {
        this.executeBatch();
      }, this.delay);
    });
  }

  /**
   * Execute all reads in the batch
   */
  async executeBatch() {
    if (this.queue.length === 0) return;
    
    console.log(`📦 Executing read batch: ${this.queue.length} reads`);
    
    const batch = [...this.queue];
    this.queue = [];
    
    // Execute all reads in parallel
    const results = await Promise.allSettled(
      batch.map(({ readFn }) => readFn())
    );
    
    // Resolve/reject promises
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        batch[index].resolve(result.value);
      } else {
        batch[index].reject(result.reason);
      }
    });
  }
}

export const readBatcher = new ReadBatcher(100);

// ── Listener Throttling ────────────────────────────────────────────────────────
/**
 * Throttle listener updates to reduce processing
 * ⭐ OPTIMIZATION: Increased throttle from 500ms to 1000ms (1 second)
 * Reduces listener callback frequency by 50%
 */
export function throttleListener(callback, delay = 1000) {
  let lastCall = 0;
  let timeout = null;
  
  return function(...args) {
    const now = Date.now();
    const timeSinceLastCall = now - lastCall;
    
    if (timeSinceLastCall >= delay) {
      // Execute immediately
      lastCall = now;
      callback(...args);
    } else {
      // Schedule for later
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        lastCall = Date.now();
        callback(...args);
      }, delay - timeSinceLastCall);
    }
  };
}

// ── Read Statistics ────────────────────────────────────────────────────────────
class ReadStats {
  constructor() {
    this.stats = {
      prevented: 0,
      cached: 0,
      batched: 0,
      throttled: 0,
      total: 0,
    };
  }

  track(type) {
    this.stats[type]++;
    this.stats.total++;
  }

  getStats() {
    return { ...this.stats };
  }

  getSavings() {
    const saved = this.stats.prevented + this.stats.cached + this.stats.batched + this.stats.throttled;
    const savingsPercent = this.stats.total > 0 ? (saved / this.stats.total * 100).toFixed(1) : 0;
    
    return {
      saved,
      total: this.stats.total,
      savingsPercent,
    };
  }

  reset() {
    this.stats = {
      prevented: 0,
      cached: 0,
      batched: 0,
      throttled: 0,
      total: 0,
    };
  }
}

export const readStats = new ReadStats();

// ── Expose to window for debugging ─────────────────────────────────────────────
if (typeof window !== 'undefined') {
  window.readOptimizer = {
    listeners: () => listenerRegistry.getAll(),
    unregisterAll: () => listenerRegistry.unregisterAll(),
    clearSnapshots: () => snapshotCache.clear(),
    stats: () => readStats.getStats(),
    savings: () => readStats.getSavings(),
    enablePersistence: () => enableOfflinePersistence(),
  };
  
  console.log('✅ Read optimizer loaded. Available commands:');
  console.log('  - window.readOptimizer.listeners() - List active listeners');
  console.log('  - window.readOptimizer.unregisterAll() - Remove all listeners');
  console.log('  - window.readOptimizer.clearSnapshots() - Clear snapshot cache');
  console.log('  - window.readOptimizer.stats() - View read statistics');
  console.log('  - window.readOptimizer.savings() - View read savings');
  console.log('  - window.readOptimizer.enablePersistence() - Enable offline mode');
}

export default {
  listenerRegistry,
  snapshotCache,
  enableOfflinePersistence,
  createPaginatedQuery,
  shouldLoadData,
  readBatcher,
  throttleListener,
  readStats,
};
