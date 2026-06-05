/**
 * Query Cache Tests
 * Unit tests for QueryCache class with TTL support, pattern-based invalidation,
 * LRU eviction, and cache hit rate tracking.
 * 
 * Requirements: 7.1, 7.4, 7.5, 7.6, 18.1, 18.2, 18.7, 18.8
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { QueryCache, generateQuerySignature } from '../queryCache.js';

describe('QueryCache', () => {
  let cache;

  beforeEach(() => {
    cache = new QueryCache();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('get() method with expiration checking', () => {
    it('should return null for non-existent cache entry', () => {
      const result = cache.get('non-existent-key');
      expect(result).toBeNull();
    });

    it('should return cached data for valid entry', () => {
      const testData = { id: 1, name: 'Test' };
      cache.set('test-key', testData, 5000);
      
      const result = cache.get('test-key');
      expect(result).toEqual(testData);
    });

    it('should return null for expired entry', () => {
      const testData = { id: 1, name: 'Test' };
      cache.set('test-key', testData, 1000); // 1 second TTL
      
      // Fast-forward time by 1.5 seconds
      vi.advanceTimersByTime(1500);
      
      const result = cache.get('test-key');
      expect(result).toBeNull();
    });

    it('should remove expired entry from cache', () => {
      const testData = { id: 1, name: 'Test' };
      cache.set('test-key', testData, 1000);
      
      expect(cache.cache.has('test-key')).toBe(true);
      
      vi.advanceTimersByTime(1500);
      cache.get('test-key');
      
      expect(cache.cache.has('test-key')).toBe(false);
    });

    it('should increment hit count for valid cache access', () => {
      cache.set('test-key', { data: 'test' }, 5000);
      
      cache.get('test-key');
      cache.get('test-key');
      cache.get('test-key');
      
      const stats = cache.getStats();
      expect(stats.hits).toBe(3);
    });

    it('should increment miss count for cache miss', () => {
      cache.get('non-existent-1');
      cache.get('non-existent-2');
      
      const stats = cache.getStats();
      expect(stats.misses).toBe(2);
    });

    it('should update lastAccessed timestamp on cache hit', () => {
      cache.set('test-key', { data: 'test' }, 5000);
      
      const entry = cache.cache.get('test-key');
      const initialAccess = entry.lastAccessed;
      
      vi.advanceTimersByTime(1000);
      cache.get('test-key');
      
      expect(entry.lastAccessed).toBeGreaterThan(initialAccess);
    });
  });

  describe('set() method with TTL configuration', () => {
    it('should cache data with default TTL', () => {
      const testData = { id: 1, name: 'Test' };
      cache.set('test-key', testData);
      
      const result = cache.get('test-key');
      expect(result).toEqual(testData);
    });

    it('should cache data with custom TTL', () => {
      const testData = { id: 1, name: 'Test' };
      cache.set('test-key', testData, 2000); // 2 seconds
      
      // Should be valid after 1 second
      vi.advanceTimersByTime(1000);
      expect(cache.get('test-key')).toEqual(testData);
      
      // Should be expired after 2.5 seconds
      vi.advanceTimersByTime(1500);
      expect(cache.get('test-key')).toBeNull();
    });

    it('should update existing entry with new data', () => {
      cache.set('test-key', { version: 1 }, 5000);
      cache.set('test-key', { version: 2 }, 5000);
      
      const result = cache.get('test-key');
      expect(result).toEqual({ version: 2 });
    });

    it('should update totalSize when adding entry', () => {
      const initialSize = cache.totalSize;
      cache.set('test-key', { data: 'test' }, 5000);
      
      expect(cache.totalSize).toBeGreaterThan(initialSize);
    });

    it('should update totalSize when replacing entry', () => {
      cache.set('test-key', { small: 'data' }, 5000);
      const sizeAfterFirst = cache.totalSize;
      
      cache.set('test-key', { large: 'data'.repeat(1000) }, 5000);
      const sizeAfterSecond = cache.totalSize;
      
      expect(sizeAfterSecond).not.toBe(sizeAfterFirst);
    });

    it('should not cache entry larger than max cache size', () => {
      // Create a very large object (> 50MB)
      const largeData = { data: 'x'.repeat(60 * 1024 * 1024) };
      
      cache.set('large-key', largeData, 5000);
      
      expect(cache.get('large-key')).toBeNull();
    });

    it('should trigger LRU eviction when cache is full', () => {
      // Fill cache with entries (use 13MB each to fit 3 entries = 39MB, leaving room for 1 more)
      const largeData = 'x'.repeat(13 * 1024 * 1024); // 13MB each
      
      cache.set('key1', { data: largeData }, 5000);
      vi.advanceTimersByTime(10);
      cache.set('key2', { data: largeData }, 5000);
      vi.advanceTimersByTime(10);
      cache.set('key3', { data: largeData }, 5000);
      
      const entriesBeforeEviction = cache.cache.size;
      
      // Access key1 and key2 to make key3 the LRU
      vi.advanceTimersByTime(10);
      cache.get('key1');
      vi.advanceTimersByTime(10);
      cache.get('key2');
      
      // Add another large entry, should trigger eviction
      vi.advanceTimersByTime(10);
      cache.set('key4', { data: largeData }, 5000);
      
      // Verify eviction occurred
      const stats = cache.getStats();
      expect(stats.evictions).toBeGreaterThan(0);
      
      // Verify key4 was added
      expect(cache.cache.has('key4')).toBe(true);
      
      // Verify cache size is maintained under limit
      expect(cache.totalSize).toBeLessThanOrEqual(50 * 1024 * 1024);
    });
  });

  describe('invalidate() method with pattern matching', () => {
    beforeEach(() => {
      cache.set('workspaces/ws1/tasks::{}::{}::25', { data: 'tasks1' }, 5000);
      cache.set('workspaces/ws1/team::{}::{}::30', { data: 'team1' }, 5000);
      cache.set('workspaces/ws2/tasks::{}::{}::25', { data: 'tasks2' }, 5000);
      cache.set('workspaces/ws2/activity::{}::{}::50', { data: 'activity2' }, 5000);
    });

    it('should invalidate entries matching string pattern', () => {
      cache.invalidate('workspaces/ws1');
      
      expect(cache.get('workspaces/ws1/tasks::{}::{}::25')).toBeNull();
      expect(cache.get('workspaces/ws1/team::{}::{}::30')).toBeNull();
      expect(cache.get('workspaces/ws2/tasks::{}::{}::25')).not.toBeNull();
      expect(cache.get('workspaces/ws2/activity::{}::{}::50')).not.toBeNull();
    });

    it('should invalidate entries matching regex pattern', () => {
      cache.invalidate(/tasks/);
      
      expect(cache.get('workspaces/ws1/tasks::{}::{}::25')).toBeNull();
      expect(cache.get('workspaces/ws2/tasks::{}::{}::25')).toBeNull();
      expect(cache.get('workspaces/ws1/team::{}::{}::30')).not.toBeNull();
      expect(cache.get('workspaces/ws2/activity::{}::{}::50')).not.toBeNull();
    });

    it('should invalidate all entries matching collection type', () => {
      cache.invalidate(/\/tasks::/);
      
      expect(cache.get('workspaces/ws1/tasks::{}::{}::25')).toBeNull();
      expect(cache.get('workspaces/ws2/tasks::{}::{}::25')).toBeNull();
      expect(cache.get('workspaces/ws1/team::{}::{}::30')).not.toBeNull();
    });

    it('should update invalidation count in stats', () => {
      cache.invalidate('workspaces/ws1');
      
      const stats = cache.getStats();
      expect(stats.invalidations).toBe(2); // tasks1 and team1
    });

    it('should update totalSize after invalidation', () => {
      const sizeBeforeInvalidation = cache.totalSize;
      cache.invalidate('workspaces/ws1');
      
      expect(cache.totalSize).toBeLessThan(sizeBeforeInvalidation);
    });

    it('should handle invalidation with no matches', () => {
      const initialSize = cache.cache.size;
      cache.invalidate('non-existent-pattern');
      
      expect(cache.cache.size).toBe(initialSize);
    });
  });

  describe('getStats() for cache hit rate tracking', () => {
    it('should return correct statistics structure', () => {
      const stats = cache.getStats();
      
      expect(stats).toHaveProperty('hits');
      expect(stats).toHaveProperty('misses');
      expect(stats).toHaveProperty('hitRate');
      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('sizeBytes');
      expect(stats).toHaveProperty('entries');
      expect(stats).toHaveProperty('evictions');
      expect(stats).toHaveProperty('invalidations');
      expect(stats).toHaveProperty('maxSize');
    });

    it('should calculate hit rate correctly', () => {
      cache.set('key1', { data: 'test1' }, 5000);
      cache.set('key2', { data: 'test2' }, 5000);
      
      // 3 hits
      cache.get('key1');
      cache.get('key2');
      cache.get('key1');
      
      // 2 misses
      cache.get('non-existent-1');
      cache.get('non-existent-2');
      
      const stats = cache.getStats();
      expect(stats.hits).toBe(3);
      expect(stats.misses).toBe(2);
      expect(stats.hitRate).toBe('60.00%'); // 3/5 = 60%
    });

    it('should return 0% hit rate when no requests made', () => {
      const stats = cache.getStats();
      expect(stats.hitRate).toBe('0.00%');
    });

    it('should return correct entry count', () => {
      cache.set('key1', { data: 'test1' }, 5000);
      cache.set('key2', { data: 'test2' }, 5000);
      cache.set('key3', { data: 'test3' }, 5000);
      
      const stats = cache.getStats();
      expect(stats.entries).toBe(3);
    });

    it('should track eviction count', () => {
      const largeData = 'x'.repeat(15 * 1024 * 1024); // 15MB
      
      cache.set('key1', { data: largeData }, 5000);
      cache.set('key2', { data: largeData }, 5000);
      cache.set('key3', { data: largeData }, 5000);
      cache.set('key4', { data: largeData }, 5000); // Should trigger eviction
      
      const stats = cache.getStats();
      expect(stats.evictions).toBeGreaterThan(0);
    });

    it('should format size in human-readable format', () => {
      cache.set('key1', { data: 'test' }, 5000);
      
      const stats = cache.getStats();
      expect(stats.size).toMatch(/\d+(\.\d+)? (Bytes|KB|MB|GB)/);
    });
  });

  describe('LRU eviction when cache exceeds 50MB limit', () => {
    it('should evict least recently used entry when cache is full', () => {
      // Use 9MB entries to have clear room for testing
      // 9MB * 5 = 45MB, adding 6th would be 54MB (over limit)
      // Should evict LRU entries to make room
      const largeData = 'x'.repeat(9 * 1024 * 1024); // 9MB each
      
      cache.set('key1', { data: largeData }, 5000);
      vi.advanceTimersByTime(10);
      cache.set('key2', { data: largeData }, 5000);
      vi.advanceTimersByTime(10);
      cache.set('key3', { data: largeData }, 5000);
      vi.advanceTimersByTime(10);
      cache.set('key4', { data: largeData }, 5000);
      vi.advanceTimersByTime(10);
      cache.set('key5', { data: largeData }, 5000);
      
      // key1 is now LRU (oldest and not accessed)
      vi.advanceTimersByTime(10);
      cache.get('key2'); // Access key2
      
      vi.advanceTimersByTime(10);
      cache.get('key3'); // Access key3
      
      vi.advanceTimersByTime(10);
      cache.get('key4'); // Access key4
      
      vi.advanceTimersByTime(10);
      cache.get('key5'); // Access key5
      
      // Add key6, should evict key1 (LRU)
      vi.advanceTimersByTime(10);
      cache.set('key6', { data: largeData }, 5000);
      
      // Verify key1 was evicted (LRU)
      expect(cache.get('key1')).toBeNull();
      
      // Verify key6 was added
      expect(cache.cache.has('key6')).toBe(true);
      
      // Verify cache size is maintained under limit
      expect(cache.totalSize).toBeLessThanOrEqual(50 * 1024 * 1024);
      
      // Verify at least one eviction occurred
      const stats = cache.getStats();
      expect(stats.evictions).toBeGreaterThan(0);
    });

    it('should maintain cache size under 50MB limit', () => {
      const largeData = 'x'.repeat(15 * 1024 * 1024); // 15MB each
      
      cache.set('key1', { data: largeData }, 5000);
      cache.set('key2', { data: largeData }, 5000);
      cache.set('key3', { data: largeData }, 5000);
      cache.set('key4', { data: largeData }, 5000);
      
      const maxSize = 50 * 1024 * 1024;
      expect(cache.totalSize).toBeLessThanOrEqual(maxSize);
    });

    it('should evict multiple entries if needed to fit new entry', () => {
      const mediumData = 'x'.repeat(8 * 1024 * 1024); // 8MB each
      
      // Fill cache with 6 entries (48MB total)
      cache.set('key1', { data: mediumData }, 5000);
      cache.set('key2', { data: mediumData }, 5000);
      cache.set('key3', { data: mediumData }, 5000);
      cache.set('key4', { data: mediumData }, 5000);
      cache.set('key5', { data: mediumData }, 5000);
      cache.set('key6', { data: mediumData }, 5000);
      
      // Access key4, key5, key6 to make key1, key2, key3 LRU
      cache.get('key4');
      cache.get('key5');
      cache.get('key6');
      
      // Add a 20MB entry, should evict multiple LRU entries
      const largeData = 'x'.repeat(20 * 1024 * 1024);
      cache.set('key7', { data: largeData }, 5000);
      
      const stats = cache.getStats();
      expect(stats.evictions).toBeGreaterThan(1);
    });

    it('should update eviction count correctly', () => {
      const largeData = 'x'.repeat(15 * 1024 * 1024);
      
      cache.set('key1', { data: largeData }, 5000);
      cache.set('key2', { data: largeData }, 5000);
      cache.set('key3', { data: largeData }, 5000);
      
      const statsBeforeEviction = cache.getStats();
      const evictionsBefore = statsBeforeEviction.evictions;
      
      cache.set('key4', { data: largeData }, 5000);
      
      const statsAfterEviction = cache.getStats();
      expect(statsAfterEviction.evictions).toBeGreaterThan(evictionsBefore);
    });
  });

  describe('clear() method', () => {
    it('should remove all cache entries', () => {
      cache.set('key1', { data: 'test1' }, 5000);
      cache.set('key2', { data: 'test2' }, 5000);
      cache.set('key3', { data: 'test3' }, 5000);
      
      cache.clear();
      
      expect(cache.cache.size).toBe(0);
      expect(cache.totalSize).toBe(0);
    });

    it('should reset totalSize to zero', () => {
      cache.set('key1', { data: 'test' }, 5000);
      cache.clear();
      
      expect(cache.totalSize).toBe(0);
    });
  });

  describe('resetStats() method', () => {
    it('should reset all statistics', () => {
      cache.set('key1', { data: 'test' }, 5000);
      cache.get('key1');
      cache.get('non-existent');
      cache.invalidate('key1');
      
      cache.resetStats();
      
      const stats = cache.getStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.evictions).toBe(0);
      expect(stats.invalidations).toBe(0);
    });
  });
});

describe('generateQuerySignature', () => {
  it('should generate signature from collection path only', () => {
    const signature = generateQuerySignature('workspaces/ws1/tasks');
    expect(signature).toBe('workspaces/ws1/tasks::{}::{}::unlimited');
  });

  it('should include filters in signature', () => {
    const signature = generateQuerySignature('workspaces/ws1/tasks', {
      filters: { stage: 'Start', memberIds: ['m1'] }
    });
    expect(signature).toContain('{"stage":"Start","memberIds":["m1"]}');
  });

  it('should include orderBy in signature', () => {
    const signature = generateQuerySignature('workspaces/ws1/tasks', {
      orderBy: { field: 'createdDate', direction: 'desc' }
    });
    expect(signature).toContain('{"field":"createdDate","direction":"desc"}');
  });

  it('should include limit in signature', () => {
    const signature = generateQuerySignature('workspaces/ws1/tasks', {
      limit: 25
    });
    expect(signature).toContain('::25');
  });

  it('should generate consistent signatures for same query', () => {
    const options = {
      filters: { stage: 'Start' },
      orderBy: { field: 'createdDate', direction: 'desc' },
      limit: 25
    };
    
    const sig1 = generateQuerySignature('workspaces/ws1/tasks', options);
    const sig2 = generateQuerySignature('workspaces/ws1/tasks', options);
    
    expect(sig1).toBe(sig2);
  });

  it('should generate different signatures for different queries', () => {
    const sig1 = generateQuerySignature('workspaces/ws1/tasks', { limit: 25 });
    const sig2 = generateQuerySignature('workspaces/ws1/tasks', { limit: 50 });
    
    expect(sig1).not.toBe(sig2);
  });
});
