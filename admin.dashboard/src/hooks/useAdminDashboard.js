/**
 * Custom Hook for Admin Dashboard with Optimizations
 * Uses aggregations and optimized queries
 */

import { useState, useEffect, useCallback } from 'react';
import { subscribeToAdminAggregation, getAdminAggregationWithFallback } from '../lib/adminAggregationService';
import { getOrganizationsPaginated } from '../lib/optimizedOrganizationService';

/**
 * Hook to load admin dashboard data with optimizations
 * @param {Object} options - { useRealtime, pageSize }
 * @returns {Object} - { stats, organizations, loading, error, loadMore, hasMore }
 */
export function useAdminDashboard(options = {}) {
  const { useRealtime = true, pageSize = 20 } = options;
  
  const [stats, setStats] = useState(null);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  
  // Load aggregated stats
  useEffect(() => {
    let unsubscribe = null;
    
    if (useRealtime) {
      // Real-time subscription (async)
      subscribeToAdminAggregation((data) => {
        if (data) {

          setStats(data);
          setLoading(false);
        } else {

          loadStatsWithFallback();
        }
      }).then(unsub => {
        unsubscribe = unsub;
      }).catch(err => {

        loadStatsWithFallback();
      });
      
      return () => {
        if (unsubscribe && typeof unsubscribe === 'function') {
          unsubscribe();
        }
      };
    } else {
      // One-time load
      loadStatsWithFallback();
    }
  }, [useRealtime]);
  
  const loadStatsWithFallback = async () => {
    try {
      const data = await getAdminAggregationWithFallback();
      setStats(data);
      setLoading(false);
    } catch (err) {

      setError(err);
      setLoading(false);
    }
  };
  
  // Load organizations (paginated)
  const loadOrganizations = useCallback(async (reset = false) => {
    try {
      const result = await getOrganizationsPaginated({
        pageSize,
        lastDoc: reset ? null : lastDoc
      });
      
      if (reset) {
        setOrganizations(result.organizations);
      } else {
        setOrganizations(prev => [...prev, ...result.organizations]);
      }
      
      setLastDoc(result.lastDoc);
      setHasMore(result.hasMore);
    } catch (err) {

      setError(err);
    }
  }, [pageSize, lastDoc]);
  
  // Load first page on mount
  useEffect(() => {
    loadOrganizations(true);
  }, []);
  
  // Load more function
  const loadMore = useCallback(() => {
    if (hasMore && !loading) {
      loadOrganizations(false);
    }
  }, [hasMore, loading, loadOrganizations]);
  
  return {
    stats,
    organizations,
    loading,
    error,
    loadMore,
    hasMore,
    refresh: () => loadOrganizations(true)
  };
}

/**
 * Hook to load admin stats only (no organizations)
 * @param {boolean} useRealtime - Use real-time subscription
 * @returns {Object} - { stats, loading, error }
 */
export function useAdminStats(useRealtime = true) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    let unsubscribe = null;
    
    if (useRealtime) {
      subscribeToAdminAggregation((data) => {
        if (data) {
          setStats(data);
          setLoading(false);
        }
      }).then(unsub => {
        unsubscribe = unsub;
      }).catch(err => {

        setError(err);
        loadStats();
      });
      
      return () => {
        if (unsubscribe && typeof unsubscribe === 'function') {
          unsubscribe();
        }
      };
    } else {
      loadStats();
    }
  }, [useRealtime]);
  
  const loadStats = async () => {
    try {
      const data = await getAdminAggregationWithFallback();
      setStats(data);
      setLoading(false);
    } catch (err) {
      setError(err);
      setLoading(false);
    }
  };
  
  return { stats, loading, error };
}
