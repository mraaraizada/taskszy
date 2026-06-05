/**
 * Dashboard Optimizer
 * 
 * Optimizes dashboard data loading and rendering
 * Implements progressive loading, caching, and deferred updates
 * 
 * GOAL: Instant dashboard loading with minimal Firebase reads
 */

import { useState, useEffect, useCallback, useMemo } from 'react';

// ── Progressive Data Loading ──────────────────────────────────────────────────
/**
 * Load dashboard data in stages for faster perceived performance
 * 
 * Stage 1 (0ms): Show skeleton
 * Stage 2 (100ms): Load critical stats (aggregations)
 * Stage 3 (500ms): Load recent activity
 * Stage 4 (1000ms): Load calendar events
 * Stage 5 (2000ms): Load analytics/charts
 */
export function useProgressiveDashboardLoad(workspaceId) {
  const [stage, setStage] = useState(0);
  const [criticalDataLoaded, setCriticalDataLoaded] = useState(false);
  const [activityLoaded, setActivityLoaded] = useState(false);
  const [calendarLoaded, setCalendarLoaded] = useState(false);
  const [analyticsLoaded, setAnalyticsLoaded] = useState(false);
  
  useEffect(() => {
    if (!workspaceId) return;
    
    // Stage 1: Immediate (skeleton)
    setStage(1);
    
    // Stage 2: Load critical stats (100ms delay)
    const timer1 = setTimeout(() => {
      setStage(2);
      setCriticalDataLoaded(true);
    }, 100);
    
    // Stage 3: Load activity (500ms delay)
    const timer2 = setTimeout(() => {
      setStage(3);
      setActivityLoaded(true);
    }, 500);
    
    // Stage 4: Load calendar (1000ms delay)
    const timer3 = setTimeout(() => {
      setStage(4);
      setCalendarLoaded(true);
    }, 1000);
    
    // Stage 5: Load analytics (2000ms delay)
    const timer4 = setTimeout(() => {
      setStage(5);
      setAnalyticsLoaded(true);
    }, 2000);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [workspaceId]);
  
  return {
    stage,
    shouldLoadCritical: criticalDataLoaded,
    shouldLoadActivity: activityLoaded,
    shouldLoadCalendar: calendarLoaded,
    shouldLoadAnalytics: analyticsLoaded
  };
}

// ── Memoized Dashboard Stats ──────────────────────────────────────────────────
/**
 * Memoize expensive dashboard calculations
 * Prevents recalculation on every render
 */
export function useMemoizedDashboardStats(tasks, team, payments) {
  const taskStats = useMemo(() => {
    if (!tasks || tasks.length === 0) return null;
    
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    return {
      total: tasks.length,
      completed: tasks.filter(t => t.stage === 'Complete').length,
      active: tasks.filter(t => {
        if (t.stage === 'Complete') return false;
        const deadline = new Date(t.extendedDeadline || t.deadline);
        return deadline >= sevenDaysAgo;
      }).length,
      pending: tasks.filter(t => {
        if (t.stage === 'Complete') return false;
        const deadline = new Date(t.extendedDeadline || t.deadline);
        return deadline < sevenDaysAgo;
      }).length,
      byStage: tasks.reduce((acc, t) => {
        acc[t.stage] = (acc[t.stage] || 0) + 1;
        return acc;
      }, {})
    };
  }, [tasks]);
  
  const teamStats = useMemo(() => {
    if (!team || team.length === 0) return null;
    
    return {
      total: team.length,
      active: team.filter(m => m.status === 'Active').length,
      inactive: team.filter(m => m.status !== 'Active').length,
      byRole: team.reduce((acc, m) => {
        acc[m.role] = (acc[m.role] || 0) + 1;
        return acc;
      }, {})
    };
  }, [team]);
  
  const financialStats = useMemo(() => {
    if (!payments || payments.length === 0) return null;
    
    return {
      totalBudget: tasks?.reduce((sum, t) => sum + (t.totalBudget || 0), 0) || 0,
      totalPaid: payments.reduce((sum, p) => sum + (p.paidAmount || 0), 0),
      totalPending: payments.reduce((sum, p) => sum + ((p.amount || 0) - (p.paidAmount || 0)), 0),
      paymentsCount: payments.length
    };
  }, [tasks, payments]);
  
  return {
    taskStats,
    teamStats,
    financialStats
  };
}

// ── Debounced Dashboard Updates ───────────────────────────────────────────────
/**
 * Debounce dashboard updates to prevent excessive re-renders
 * Useful when multiple data sources update simultaneously
 */
export function useDebouncedDashboardData(data, delay = 300) {
  const [debouncedData, setDebouncedData] = useState(data);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedData(data);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [data, delay]);
  
  return debouncedData;
}

// ── Conditional Dashboard Sections ────────────────────────────────────────────
/**
 * Show/hide dashboard sections based on user role and permissions
 * Reduces unnecessary rendering and data loading
 */
export function useDashboardSections(userRole, permissions = {}) {
  return useMemo(() => {
    const sections = {
      taskOverview: true,
      calendar: true,
      activity: true,
      broadcasts: true,
      financials: false,
      analytics: false,
      teamManagement: false
    };
    
    // Admin sees everything
    if (userRole === 'admin') {
      sections.financials = true;
      sections.analytics = true;
      sections.teamManagement = true;
    }
    
    // Management sees financials and team
    if (userRole === 'management') {
      sections.financials = permissions.viewFinancials !== false;
      sections.teamManagement = permissions.viewTeam !== false;
    }
    
    // Members see limited sections
    if (userRole === 'member') {
      sections.financials = permissions.viewOwnPayments === true;
      sections.analytics = false;
      sections.teamManagement = false;
    }
    
    return sections;
  }, [userRole, permissions]);
}

// ── Dashboard Performance Metrics ──────────────────────────────────────────────
/**
 * Track dashboard load performance
 * Helps identify bottlenecks
 */
export function useDashboardPerformance() {
  const [metrics, setMetrics] = useState({
    loadStartTime: null,
    loadEndTime: null,
    loadDuration: null,
    readsCount: 0,
    componentsRendered: 0
  });
  
  const startLoad = useCallback(() => {
    setMetrics(prev => ({
      ...prev,
      loadStartTime: Date.now(),
      loadEndTime: null,
      loadDuration: null
    }));
  }, []);
  
  const endLoad = useCallback(() => {
    setMetrics(prev => {
      const endTime = Date.now();
      return {
        ...prev,
        loadEndTime: endTime,
        loadDuration: prev.loadStartTime ? endTime - prev.loadStartTime : null
      };
    });
  }, []);
  
  const trackRead = useCallback((count = 1) => {
    setMetrics(prev => ({
      ...prev,
      readsCount: prev.readsCount + count
    }));
  }, []);
  
  const trackRender = useCallback(() => {
    setMetrics(prev => ({
      ...prev,
      componentsRendered: prev.componentsRendered + 1
    }));
  }, []);
  
  const reset = useCallback(() => {
    setMetrics({
      loadStartTime: null,
      loadEndTime: null,
      loadDuration: null,
      readsCount: 0,
      componentsRendered: 0
    });
  }, []);
  
  return {
    metrics,
    startLoad,
    endLoad,
    trackRead,
    trackRender,
    reset
  };
}

// ── Smart Data Refresh ────────────────────────────────────────────────────────
/**
 * Intelligently refresh dashboard data
 * Only refresh when necessary (user active, data stale, etc.)
 */
export function useSmartRefresh(refreshFn, options = {}) {
  const {
    interval = 60000, // 1 minute default
    onlyWhenActive = true,
    staleTime = 30000 // 30 seconds
  } = options;
  
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const [isActive, setIsActive] = useState(true);
  
  // Track user activity
  useEffect(() => {
    if (!onlyWhenActive) return;
    
    const handleActivity = () => setIsActive(true);
    const handleInactive = () => setIsActive(false);
    
    window.addEventListener('focus', handleActivity);
    window.addEventListener('blur', handleInactive);
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    
    return () => {
      window.removeEventListener('focus', handleActivity);
      window.removeEventListener('blur', handleInactive);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
    };
  }, [onlyWhenActive]);
  
  // Auto-refresh
  useEffect(() => {
    if (!isActive && onlyWhenActive) return;
    
    const timer = setInterval(() => {
      const now = Date.now();
      const timeSinceRefresh = now - lastRefresh;
      
      if (timeSinceRefresh >= staleTime) {

        refreshFn();
        setLastRefresh(now);
      }
    }, interval);
    
    return () => clearInterval(timer);
  }, [refreshFn, interval, lastRefresh, isActive, onlyWhenActive, staleTime]);
  
  const manualRefresh = useCallback(() => {

    refreshFn();
    setLastRefresh(Date.now());
  }, [refreshFn]);
  
  return {
    lastRefresh,
    isActive,
    manualRefresh
  };
}

export default {
  useProgressiveDashboardLoad,
  useMemoizedDashboardStats,
  useDebouncedDashboardData,
  useDashboardSections,
  useDashboardPerformance,
  useSmartRefresh
};
