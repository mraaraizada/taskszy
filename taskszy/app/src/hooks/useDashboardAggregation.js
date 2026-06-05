/**
 * Dashboard Aggregation Hook
 * 
 * React hook for loading dashboard stats from aggregation documents
 * Replaces heavy queries with single aggregation read
 * 
 * USAGE:
 * const { stats, loading, error, rebuild } = useDashboardAggregation(workspaceId);
 */

import { useState, useEffect, useCallback } from 'react';
import {
  subscribeToDashboardAggregation,
  getDashboardAggregation,
  rebuildDashboardAggregation
} from '../lib/aggregationService';

/**
 * Hook for dashboard aggregation data
 * 
 * @param {string} workspaceId - Workspace ID
 * @param {Object} options - Configuration options
 * @param {boolean} options.realtime - Subscribe to real-time updates (default: true)
 * @param {boolean} options.autoRebuild - Auto-rebuild if missing (default: false)
 * @returns {Object} Aggregation state and controls
 */
export function useDashboardAggregation(workspaceId, options = {}) {
  const { realtime = true, autoRebuild = false } = options;
  
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  /**
   * Load aggregation once (no real-time updates)
   */
  const loadOnce = useCallback(async () => {
    if (!workspaceId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const aggData = await getDashboardAggregation(workspaceId);
      
      if (aggData) {
        setStats(aggData);
        setLastUpdated(aggData.lastUpdated);

      } else {

        setError(new Error('Aggregation not found'));
        
        // Auto-rebuild if enabled
        if (autoRebuild) {

          // Note: This requires tasks, team, payments, activity data
          // In production, trigger Cloud Function to rebuild
        }
      }
    } catch (err) {

      setError(err);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, autoRebuild]);
  
  /**
   * Subscribe to real-time updates
   */
  useEffect(() => {
    if (!workspaceId || !realtime) {
      // If not realtime, load once
      if (!realtime) {
        loadOnce();
      }
      return;
    }
    
    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToDashboardAggregation(workspaceId, (aggData) => {
      if (aggData) {
        setStats(aggData);
        setLastUpdated(aggData.lastUpdated);
        setLoading(false);

      } else {

        setError(new Error('Aggregation not found'));
        setLoading(false);
      }
    });
    
    return () => {

      unsubscribe();
    };
  }, [workspaceId, realtime, loadOnce]);
  
  /**
   * Manually rebuild aggregation
   * Call this after major data changes or if aggregation is missing
   */
  const rebuild = useCallback(async (tasks, team, payments, activity) => {
    if (!workspaceId) return false;
    
    setLoading(true);
    setError(null);
    
    try {

      const success = await rebuildDashboardAggregation(
        workspaceId,
        tasks,
        team,
        payments,
        activity
      );
      
      if (success) {

        // Reload aggregation
        if (!realtime) {
          await loadOnce();
        }
      } else {
        throw new Error('Failed to rebuild aggregation');
      }
      
      return success;
    } catch (err) {

      setError(err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [workspaceId, realtime, loadOnce]);
  
  /**
   * Refresh aggregation (reload from Firestore)
   */
  const refresh = useCallback(async () => {
    await loadOnce();
  }, [loadOnce]);
  
  return {
    stats,
    loading,
    error,
    lastUpdated,
    rebuild,
    refresh
  };
}

/**
 * Hook for member-specific aggregation
 * 
 * @param {string} workspaceId - Workspace ID
 * @param {string} memberId - Member ID
 * @param {Object} options - Configuration options
 * @returns {Object} Member aggregation state
 */
export function useMemberAggregation(workspaceId, memberId, options = {}) {
  const { realtime = true } = options;
  
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (!workspaceId || !memberId) return;
    
    if (!realtime) {
      // Load once
      import('../lib/aggregationService').then(({ getMemberAggregation }) => {
        getMemberAggregation(workspaceId, memberId).then(aggData => {
          setStats(aggData);
          setLoading(false);
        }).catch(err => {
          setError(err);
          setLoading(false);
        });
      });
      return;
    }
    
    // Subscribe to real-time updates
    setLoading(true);
    
    import('../lib/aggregationService').then(({ subscribeToMemberAggregation }) => {
      const unsubscribe = subscribeToMemberAggregation(workspaceId, memberId, (aggData) => {
        setStats(aggData);
        setLoading(false);
      });
      
      return () => unsubscribe();
    });
  }, [workspaceId, memberId, realtime]);
  
  return {
    stats,
    loading,
    error
  };
}

/**
 * Hook for dashboard stats with fallback to full query
 * Use this for gradual migration - falls back to full query if aggregation missing
 */
export function useDashboardStatsWithFallback(workspaceId, tasks, team, payments, activity) {
  const { stats: aggStats, loading: aggLoading, error: aggError } = useDashboardAggregation(workspaceId);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (aggLoading) {
      setLoading(true);
      return;
    }
    
    if (aggStats && !aggError) {
      // Use aggregation stats

      setStats(aggStats);
      setLoading(false);
    } else {
      // Fallback to calculating from full data

      const taskStats = {
        total: tasks.length,
        completed: tasks.filter(t => t.stage === 'Complete').length,
        active: tasks.filter(t => t.stage !== 'Complete').length,
        pending: 0,
        byStage: {}
      };
      
      tasks.forEach(t => {
        taskStats.byStage[t.stage] = (taskStats.byStage[t.stage] || 0) + 1;
      });
      
      const teamStats = {
        total: team.length,
        active: team.filter(m => m.status === 'Active').length,
        inactive: team.filter(m => m.status !== 'Active').length,
        byRole: {}
      };
      
      team.forEach(m => {
        teamStats.byRole[m.role] = (teamStats.byRole[m.role] || 0) + 1;
      });
      
      const financialStats = {
        totalBudget: tasks.reduce((sum, t) => sum + (t.totalBudget || 0), 0),
        totalPaid: payments.reduce((sum, p) => sum + (p.paidAmount || 0), 0),
        totalPending: payments.reduce((sum, p) => sum + ((p.amount || 0) - (p.paidAmount || 0)), 0),
        paymentsCount: payments.length
      };
      
      setStats({
        tasks: taskStats,
        team: teamStats,
        financials: financialStats
      });
      setLoading(false);
    }
  }, [aggStats, aggLoading, aggError, tasks, team, payments, activity]);
  
  return {
    stats,
    loading,
    usingAggregation: !!aggStats && !aggError
  };
}

export default {
  useDashboardAggregation,
  useMemberAggregation,
  useDashboardStatsWithFallback
};
