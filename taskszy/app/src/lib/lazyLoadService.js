/**
 * Lazy Load Service
 * 
 * Implements deferred loading for non-critical dashboard sections
 * Load only what's visible, defer the rest
 * 
 * GOAL: Reduce initial dashboard load by 70%+
 */

import { useState, useEffect, useRef } from 'react';

// ── Intersection Observer Hook ────────────────────────────────────────────────
/**
 * Hook to detect when element enters viewport
 * Use this to lazy load dashboard sections
 */
export function useInView(options = {}) {
  const [isInView, setIsInView] = useState(false);
  const [hasBeenInView, setHasBeenInView] = useState(false);
  const ref = useRef(null);
  
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        const inView = entry.isIntersecting;
        setIsInView(inView);
        
        // Once in view, mark as loaded (don't unload)
        if (inView && !hasBeenInView) {
          setHasBeenInView(true);
        }
      },
      {
        threshold: options.threshold || 0.1,
        rootMargin: options.rootMargin || '50px'
      }
    );
    
    observer.observe(element);
    
    return () => {
      observer.disconnect();
    };
  }, [hasBeenInView, options.threshold, options.rootMargin]);
  
  return { ref, isInView, hasBeenInView };
}

// ── Deferred Data Loading ─────────────────────────────────────────────────────
/**
 * Hook to defer data loading until needed
 * Prevents loading all data on mount
 */
export function useDeferredLoad(loadFn, delay = 1000) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const timeoutRef = useRef(null);
  
  const load = async () => {
    if (loaded || loading) return;
    
    setLoading(true);
    try {
      const result = await loadFn();
      setData(result);
      setLoaded(true);
    } catch (error) {

    } finally {
      setLoading(false);
    }
  };
  
  const scheduleLoad = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      load();
    }, delay);
  };
  
  const cancelLoad = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };
  
  useEffect(() => {
    return () => {
      cancelLoad();
    };
  }, []);
  
  return { data, loading, loaded, load, scheduleLoad, cancelLoad };
}

// ── Priority Loading ──────────────────────────────────────────────────────────
/**
 * Load data in priority order
 * Critical data first, then nice-to-have
 */
export class PriorityLoader {
  constructor() {
    this.queue = {
      critical: [],
      high: [],
      normal: [],
      low: []
    };
    this.loading = false;
  }
  
  /**
   * Add task to queue
   */
  add(priority, loadFn, callback) {
    if (!this.queue[priority]) {

      priority = 'normal';
    }
    
    this.queue[priority].push({ loadFn, callback });
    
    // Start processing if not already loading
    if (!this.loading) {
      this.process();
    }
  }
  
  /**
   * Process queue in priority order
   */
  async process() {
    this.loading = true;
    
    // Process in order: critical -> high -> normal -> low
    const priorities = ['critical', 'high', 'normal', 'low'];
    
    for (const priority of priorities) {
      while (this.queue[priority].length > 0) {
        const task = this.queue[priority].shift();
        
        try {

          const result = await task.loadFn();
          task.callback(result);
        } catch (error) {

          task.callback(null, error);
        }
        
        // Small delay between loads to prevent blocking
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
    
    this.loading = false;

  }
  
  /**
   * Clear all pending loads
   */
  clear() {
    this.queue = {
      critical: [],
      high: [],
      normal: [],
      low: []
    };
  }
}

// Global priority loader instance
export const priorityLoader = new PriorityLoader();

// ── Skeleton Placeholders ─────────────────────────────────────────────────────
/**
 * Show skeleton while data loads
 * Better UX than blank screen
 */
export function LazySection({ children, skeleton, delay = 500 }) {
  const { ref, hasBeenInView } = useInView({ threshold: 0.1, rootMargin: '100px' });
  const [showContent, setShowContent] = useState(false);
  
  useEffect(() => {
    if (hasBeenInView) {
      // Small delay to prevent flash
      const timer = setTimeout(() => {
        setShowContent(true);
      }, delay);
      
      return () => clearTimeout(timer);
    }
  }, [hasBeenInView, delay]);
  
  return (
    <div ref={ref}>
      {showContent ? children : skeleton}
    </div>
  );
}

// ── Batch Loading ─────────────────────────────────────────────────────────────
/**
 * Batch multiple data loads into single operation
 * Reduces Firebase read operations
 */
export class BatchLoader {
  constructor(batchSize = 5, delay = 100) {
    this.batchSize = batchSize;
    this.delay = delay;
    this.queue = [];
    this.timeout = null;
  }
  
  /**
   * Add load to batch
   */
  add(loadFn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ loadFn, resolve, reject });
      
      // Clear existing timeout
      if (this.timeout) {
        clearTimeout(this.timeout);
      }
      
      // Process batch when full or after delay
      if (this.queue.length >= this.batchSize) {
        this.process();
      } else {
        this.timeout = setTimeout(() => {
          this.process();
        }, this.delay);
      }
    });
  }
  
  /**
   * Process batch
   */
  async process() {
    if (this.queue.length === 0) return;

    const batch = [...this.queue];
    this.queue = [];
    
    // Execute all loads in parallel
    const results = await Promise.allSettled(
      batch.map(({ loadFn }) => loadFn())
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

// Global batch loader instance
export const batchLoader = new BatchLoader(5, 100);

// ── Progressive Loading ───────────────────────────────────────────────────────
/**
 * Load data progressively (10 items, then 20, then all)
 * Faster initial render
 */
export function useProgressiveLoad(allData, initialCount = 10, increment = 20) {
  const [displayCount, setDisplayCount] = useState(initialCount);
  const [hasMore, setHasMore] = useState(allData.length > initialCount);
  
  useEffect(() => {
    setHasMore(allData.length > displayCount);
  }, [allData.length, displayCount]);
  
  const loadMore = () => {
    const newCount = Math.min(displayCount + increment, allData.length);
    setDisplayCount(newCount);
    setHasMore(newCount < allData.length);
  };
  
  const loadAll = () => {
    setDisplayCount(allData.length);
    setHasMore(false);
  };
  
  const reset = () => {
    setDisplayCount(initialCount);
    setHasMore(allData.length > initialCount);
  };
  
  return {
    displayData: allData.slice(0, displayCount),
    displayCount,
    hasMore,
    loadMore,
    loadAll,
    reset
  };
}

export default {
  useInView,
  useDeferredLoad,
  PriorityLoader,
  priorityLoader,
  LazySection,
  BatchLoader,
  batchLoader,
  useProgressiveLoad
};
