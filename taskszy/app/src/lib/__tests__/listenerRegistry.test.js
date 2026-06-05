import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { listenerRegistry } from '../readOptimizer.js';

describe('ListenerRegistry - Enhanced Features', () => {
  beforeEach(() => {
    // Clear all listeners before each test
    listenerRegistry.unregisterAll();
  });

  afterEach(() => {
    // Clean up after each test
    listenerRegistry.unregisterAll();
    vi.clearAllTimers();
  });

  describe('registerShared() - Listener Deduplication', () => {
    it('should create a new shared listener when none exists', () => {
      const mockUnsubscribe = vi.fn();
      const listenerFactory = vi.fn(() => mockUnsubscribe);

      const unsubscribe = listenerRegistry.registerShared('test-listener', listenerFactory);

      expect(listenerFactory).toHaveBeenCalledTimes(1);
      expect(typeof unsubscribe).toBe('function');
      
      const stats = listenerRegistry.getStats();
      expect(stats.shared).toBe(1);
      expect(stats.totalSubscribers).toBe(1);
    });

    it('should reuse existing shared listener instead of creating duplicate', () => {
      const mockUnsubscribe = vi.fn();
      const listenerFactory = vi.fn(() => mockUnsubscribe);

      // First subscriber
      const unsub1 = listenerRegistry.registerShared('test-listener', listenerFactory);
      
      // Second subscriber - should reuse existing listener
      const unsub2 = listenerRegistry.registerShared('test-listener', listenerFactory);

      // Factory should only be called once
      expect(listenerFactory).toHaveBeenCalledTimes(1);
      
      const stats = listenerRegistry.getStats();
      expect(stats.shared).toBe(1); // Only one shared listener
      expect(stats.totalSubscribers).toBe(2); // But two subscribers
    });

    it('should cancel disposal timeout when new subscriber joins', () => {
      vi.useFakeTimers();
      
      const mockUnsubscribe = vi.fn();
      const listenerFactory = vi.fn(() => mockUnsubscribe);

      // Create and immediately unsubscribe
      const unsub1 = listenerRegistry.registerShared('test-listener', listenerFactory);
      unsub1();

      // Verify disposal is scheduled
      let stats = listenerRegistry.getStats();
      expect(stats.shared).toBe(1); // Still exists during grace period

      // New subscriber joins before grace period expires
      const unsub2 = listenerRegistry.registerShared('test-listener', listenerFactory);

      // Advance time past grace period
      vi.advanceTimersByTime(6000);

      // Listener should still exist because new subscriber joined
      stats = listenerRegistry.getStats();
      expect(stats.shared).toBe(1);
      expect(stats.totalSubscribers).toBe(1);
      expect(mockUnsubscribe).not.toHaveBeenCalled();

      vi.useRealTimers();
    });

    it('should dispose listener after grace period when no subscribers remain', () => {
      vi.useFakeTimers();
      
      const mockUnsubscribe = vi.fn();
      const listenerFactory = vi.fn(() => mockUnsubscribe);

      const unsub = listenerRegistry.registerShared('test-listener', listenerFactory);
      unsub();

      // Listener should still exist during grace period
      let stats = listenerRegistry.getStats();
      expect(stats.shared).toBe(1);

      // Advance time past grace period (5 seconds)
      vi.advanceTimersByTime(6000);

      // Listener should be disposed
      stats = listenerRegistry.getStats();
      expect(stats.shared).toBe(0);
      expect(mockUnsubscribe).toHaveBeenCalledTimes(1);

      vi.useRealTimers();
    });

    it('should support priority levels for listeners', () => {
      const mockUnsubscribe = vi.fn();
      const listenerFactory = vi.fn(() => mockUnsubscribe);

      listenerRegistry.registerShared('critical-listener', listenerFactory, { priority: 'critical' });
      listenerRegistry.registerShared('normal-listener', listenerFactory, { priority: 'normal' });
      listenerRegistry.registerShared('low-listener', listenerFactory, { priority: 'low' });

      const stats = listenerRegistry.getStats();
      expect(stats.byPriority.critical).toBe(1);
      expect(stats.byPriority.normal).toBe(1);
      expect(stats.byPriority.low).toBe(1);
    });
  });

  describe('subscribe() - Multiple Subscribers', () => {
    it('should allow subscribing to existing shared listener', () => {
      const mockUnsubscribe = vi.fn();
      const listenerFactory = vi.fn(() => mockUnsubscribe);

      // Create shared listener
      listenerRegistry.registerShared('test-listener', listenerFactory);

      // Subscribe to it
      const callback = vi.fn();
      const unsub = listenerRegistry.subscribe('test-listener', callback);

      expect(typeof unsub).toBe('function');
      
      const stats = listenerRegistry.getStats();
      expect(stats.totalSubscribers).toBe(2); // Original + new subscriber
    });

    it('should return no-op unsubscribe for non-existent listener', () => {
      const callback = vi.fn();
      const unsub = listenerRegistry.subscribe('non-existent', callback);

      expect(typeof unsub).toBe('function');
      unsub(); // Should not throw
    });

    it('should cancel disposal timeout when subscribing', () => {
      vi.useFakeTimers();
      
      const mockUnsubscribe = vi.fn();
      const listenerFactory = vi.fn(() => mockUnsubscribe);

      // Create and unsubscribe
      const unsub1 = listenerRegistry.registerShared('test-listener', listenerFactory);
      unsub1();

      // Subscribe before grace period expires
      const callback = vi.fn();
      const unsub2 = listenerRegistry.subscribe('test-listener', callback);

      // Advance past grace period
      vi.advanceTimersByTime(6000);

      // Listener should still exist
      const stats = listenerRegistry.getStats();
      expect(stats.shared).toBe(1);
      expect(mockUnsubscribe).not.toHaveBeenCalled();

      vi.useRealTimers();
    });
  });

  describe('pauseNonCritical() - Visibility-Based Management', () => {
    it('should pause non-critical listeners', () => {
      const mockUnsubscribe = vi.fn();
      const listenerFactory = vi.fn(() => mockUnsubscribe);

      listenerRegistry.registerShared('critical-listener', listenerFactory, { priority: 'critical' });
      listenerRegistry.registerShared('normal-listener', listenerFactory, { priority: 'normal' });
      listenerRegistry.registerShared('low-listener', listenerFactory, { priority: 'low' });

      const pausedCount = listenerRegistry.pauseNonCritical();

      expect(pausedCount).toBe(2); // normal and low should be paused
      expect(mockUnsubscribe).toHaveBeenCalledTimes(2);
      
      const stats = listenerRegistry.getStats();
      expect(stats.paused).toBe(2);
    });

    it('should not pause critical listeners', () => {
      const mockUnsubscribe = vi.fn();
      const listenerFactory = vi.fn(() => mockUnsubscribe);

      listenerRegistry.registerShared('critical-listener', listenerFactory, { priority: 'critical' });

      const pausedCount = listenerRegistry.pauseNonCritical();

      expect(pausedCount).toBe(0);
      expect(mockUnsubscribe).not.toHaveBeenCalled();
    });

    it('should not pause listeners in criticalKeys array', () => {
      const mockUnsubscribe = vi.fn();
      const listenerFactory = vi.fn(() => mockUnsubscribe);

      listenerRegistry.registerShared('important-listener', listenerFactory, { priority: 'normal' });
      listenerRegistry.registerShared('other-listener', listenerFactory, { priority: 'normal' });

      const pausedCount = listenerRegistry.pauseNonCritical(['important-listener']);

      expect(pausedCount).toBe(1); // Only other-listener should be paused
    });

    it('should not pause already paused listeners', () => {
      const mockUnsubscribe = vi.fn();
      const listenerFactory = vi.fn(() => mockUnsubscribe);

      listenerRegistry.registerShared('normal-listener', listenerFactory, { priority: 'normal' });

      // Pause once
      listenerRegistry.pauseNonCritical();
      expect(mockUnsubscribe).toHaveBeenCalledTimes(1);

      // Pause again
      listenerRegistry.pauseNonCritical();
      expect(mockUnsubscribe).toHaveBeenCalledTimes(1); // Should not call again
    });
  });

  describe('resumeAll() - Listener Resumption', () => {
    it('should resume all paused listeners', () => {
      const mockUnsubscribe = vi.fn();
      const listenerFactory = vi.fn(() => mockUnsubscribe);

      listenerRegistry.registerShared('listener-1', listenerFactory, { priority: 'normal' });
      listenerRegistry.registerShared('listener-2', listenerFactory, { priority: 'low' });

      // Pause listeners
      listenerRegistry.pauseNonCritical();
      let stats = listenerRegistry.getStats();
      expect(stats.paused).toBe(2);

      // Resume listeners
      const resumedCount = listenerRegistry.resumeAll();
      expect(resumedCount).toBe(2);

      stats = listenerRegistry.getStats();
      expect(stats.paused).toBe(0);
    });

    it('should not affect non-paused listeners', () => {
      const mockUnsubscribe = vi.fn();
      const listenerFactory = vi.fn(() => mockUnsubscribe);

      listenerRegistry.registerShared('critical-listener', listenerFactory, { priority: 'critical' });

      const resumedCount = listenerRegistry.resumeAll();
      expect(resumedCount).toBe(0);
    });
  });

  describe('getStats() - Monitoring', () => {
    it('should return accurate statistics', () => {
      const mockUnsubscribe = vi.fn();
      const listenerFactory = vi.fn(() => mockUnsubscribe);

      // Create various listeners
      listenerRegistry.registerShared('critical-1', listenerFactory, { priority: 'critical' });
      listenerRegistry.registerShared('normal-1', listenerFactory, { priority: 'normal' });
      listenerRegistry.registerShared('normal-2', listenerFactory, { priority: 'normal' });
      listenerRegistry.registerShared('low-1', listenerFactory, { priority: 'low' });

      // Add additional subscribers
      listenerRegistry.subscribe('normal-1', vi.fn());
      listenerRegistry.subscribe('normal-1', vi.fn());

      const stats = listenerRegistry.getStats();

      expect(stats.shared).toBe(4);
      expect(stats.totalSubscribers).toBe(6); // 4 original + 2 additional
      expect(stats.byPriority.critical).toBe(1);
      expect(stats.byPriority.normal).toBe(2);
      expect(stats.byPriority.low).toBe(1);
      expect(stats.paused).toBe(0);
    });

    it('should track paused listeners', () => {
      const mockUnsubscribe = vi.fn();
      const listenerFactory = vi.fn(() => mockUnsubscribe);

      listenerRegistry.registerShared('normal-1', listenerFactory, { priority: 'normal' });
      listenerRegistry.registerShared('normal-2', listenerFactory, { priority: 'normal' });

      listenerRegistry.pauseNonCritical();

      const stats = listenerRegistry.getStats();
      expect(stats.paused).toBe(2);
    });
  });

  describe('Grace Period - 5 seconds', () => {
    it('should wait 5 seconds before disposing listener', () => {
      vi.useFakeTimers();
      
      const mockUnsubscribe = vi.fn();
      const listenerFactory = vi.fn(() => mockUnsubscribe);

      const unsub = listenerRegistry.registerShared('test-listener', listenerFactory);
      unsub();

      // After 4 seconds - should still exist
      vi.advanceTimersByTime(4000);
      let stats = listenerRegistry.getStats();
      expect(stats.shared).toBe(1);
      expect(mockUnsubscribe).not.toHaveBeenCalled();

      // After 6 seconds total - should be disposed
      vi.advanceTimersByTime(2000);
      stats = listenerRegistry.getStats();
      expect(stats.shared).toBe(0);
      expect(mockUnsubscribe).toHaveBeenCalledTimes(1);

      vi.useRealTimers();
    });

    it('should use exactly 5000ms grace period', () => {
      vi.useFakeTimers();
      
      const mockUnsubscribe = vi.fn();
      const listenerFactory = vi.fn(() => mockUnsubscribe);

      const unsub = listenerRegistry.registerShared('test-listener', listenerFactory);
      unsub();

      // At exactly 5000ms - should still exist (disposal happens after)
      vi.advanceTimersByTime(5000);
      let stats = listenerRegistry.getStats();
      expect(stats.shared).toBe(1);

      // Just after 5000ms - should be disposed
      vi.advanceTimersByTime(1);
      stats = listenerRegistry.getStats();
      expect(stats.shared).toBe(0);

      vi.useRealTimers();
    });
  });

  describe('Integration - Multiple Subscribers with Grace Period', () => {
    it('should handle complex subscriber lifecycle', () => {
      vi.useFakeTimers();
      
      const mockUnsubscribe = vi.fn();
      const listenerFactory = vi.fn(() => mockUnsubscribe);

      // Create first subscriber
      const unsub1 = listenerRegistry.registerShared('test-listener', listenerFactory);
      
      // Add second subscriber
      const unsub2 = listenerRegistry.subscribe('test-listener', vi.fn());
      
      // Add third subscriber
      const unsub3 = listenerRegistry.registerShared('test-listener', listenerFactory);

      let stats = listenerRegistry.getStats();
      expect(stats.totalSubscribers).toBe(3);

      // Unsubscribe first
      unsub1();
      stats = listenerRegistry.getStats();
      expect(stats.totalSubscribers).toBe(2);

      // Unsubscribe second
      unsub2();
      stats = listenerRegistry.getStats();
      expect(stats.totalSubscribers).toBe(1);

      // Unsubscribe third - should start grace period
      unsub3();
      stats = listenerRegistry.getStats();
      expect(stats.totalSubscribers).toBe(0);
      expect(stats.shared).toBe(1); // Still exists during grace period

      // Wait for grace period
      vi.advanceTimersByTime(6000);
      stats = listenerRegistry.getStats();
      expect(stats.shared).toBe(0); // Now disposed
      expect(mockUnsubscribe).toHaveBeenCalledTimes(1);

      vi.useRealTimers();
    });
  });
});
