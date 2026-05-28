/**
 * Custom Hook for Paginated Tasks
 * Uses Firestore cursor-based pagination for efficient loading
 * 
 * OPTIMIZATION: Loads only 15 tasks per page instead of all 100+
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { createTasksPaginatedQuery } from '../lib/paginationService';
import { useApp } from '../context/AppContext';

/**
 * Hook for paginated task loading
 * @param {number} pageSize - Number of items per page (default: 15)
 * @returns {Object} Paginated tasks state and controls
 */
export function usePaginatedTasks(pageSize = 15) {
  const { workspaceId } = useApp();
  const [currentPage, setCurrentPage] = useState(1);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  
  // Keep reference to pagination query
  const paginationQueryRef = useRef(null);

  // Initialize pagination query
  useEffect(() => {
    if (workspaceId && !paginationQueryRef.current) {
      paginationQueryRef.current = createTasksPaginatedQuery(workspaceId, pageSize);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('📊 Initialized paginated tasks query');
      }
    }
  }, [workspaceId, pageSize]);

  /**
   * Load a specific page
   */
  const loadPage = useCallback(async (pageNumber) => {
    if (!paginationQueryRef.current) return;
    
    setLoading(true);
    
    try {
      const result = await paginationQueryRef.current.loadPage(pageNumber);
      
      // Convert Firestore timestamps to Date objects
      const processedDocs = result.docs.map(doc => ({
        ...doc,
        createdDate: doc.createdDate?.toDate ? doc.createdDate.toDate() : new Date(doc.createdDate),
        deadline: doc.deadline?.toDate ? doc.deadline.toDate() : (doc.deadline ? new Date(doc.deadline) : null),
      }));
      
      setTasks(processedDocs);
      setHasMore(result.hasMore);
      setTotalPages(result.totalPages);
      setCurrentPage(pageNumber);
      
      // Preload next page in background
      if (result.hasMore) {
        paginationQueryRef.current.preloadNextPage(pageNumber);
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`📄 Loaded page ${pageNumber}:`, {
          tasks: processedDocs.length,
          hasMore: result.hasMore,
          totalPages: result.totalPages,
        });
      }
    } catch (error) {
      console.error('Failed to load tasks page:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Navigate to next page
   */
  const nextPage = useCallback(() => {
    if (hasMore && !loading) {
      loadPage(currentPage + 1);
    }
  }, [currentPage, hasMore, loading, loadPage]);

  /**
   * Navigate to previous page
   */
  const prevPage = useCallback(() => {
    if (currentPage > 1 && !loading) {
      loadPage(currentPage - 1);
    }
  }, [currentPage, loading, loadPage]);

  /**
   * Go to specific page
   */
  const goToPage = useCallback((pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages && !loading) {
      loadPage(pageNumber);
    }
  }, [totalPages, loading, loadPage]);

  /**
   * Refresh current page (clear cache and reload)
   */
  const refresh = useCallback(() => {
    if (paginationQueryRef.current) {
      paginationQueryRef.current.clearCache();
      loadPage(currentPage);
    }
  }, [currentPage, loadPage]);

  /**
   * Get cache statistics
   */
  const getCacheStats = useCallback(() => {
    if (paginationQueryRef.current) {
      return paginationQueryRef.current.getCacheStats();
    }
    return null;
  }, []);

  // Load first page on mount
  useEffect(() => {
    if (workspaceId && paginationQueryRef.current) {
      loadPage(1);
    }
  }, [workspaceId]); // Only run when workspaceId changes

  return {
    // Data
    tasks,
    
    // Pagination state
    currentPage,
    totalPages,
    pageSize,
    hasMore,
    loading,
    
    // Navigation
    nextPage,
    prevPage,
    goToPage,
    refresh,
    
    // Helpers
    isFirstPage: currentPage === 1,
    isLastPage: !hasMore,
    showingFrom: tasks.length === 0 ? 0 : (currentPage - 1) * pageSize + 1,
    showingTo: (currentPage - 1) * pageSize + tasks.length,
    
    // Debug
    getCacheStats,
  };
}

export default usePaginatedTasks;
