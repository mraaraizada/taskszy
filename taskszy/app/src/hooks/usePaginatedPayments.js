/**
 * Custom Hook for Paginated Payments
 * Uses Firestore cursor-based pagination for efficient loading
 * 
 * OPTIMIZATION: Loads only 15 payments per page instead of all 200+
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { createPaymentsPaginatedQuery } from '../lib/paginationService';
import { useApp } from '../context/AppContext';

/**
 * Hook for paginated payment loading
 * @param {number} pageSize - Number of items per page (default: 15)
 * @returns {Object} Paginated payments state and controls
 */
export function usePaginatedPayments(pageSize = 15) {
  const { workspaceId, tasks } = useApp();
  const [currentPage, setCurrentPage] = useState(1);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  
  // Keep reference to pagination query
  const paginationQueryRef = useRef(null);

  // Initialize pagination query
  useEffect(() => {
    if (workspaceId && !paginationQueryRef.current) {
      paginationQueryRef.current = createPaymentsPaginatedQuery(workspaceId, pageSize);
      
      if (process.env.NODE_ENV === 'development') {

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
        createdAt: doc.createdAt?.toDate ? doc.createdAt.toDate() : new Date(doc.createdAt),
        paidAt: doc.paidAt?.toDate ? doc.paidAt.toDate() : null,
      }));
      
      setPayments(processedDocs);
      setHasMore(result.hasMore);
      setTotalPages(result.totalPages);
      setCurrentPage(pageNumber);
      
      // Preload next page in background
      if (result.hasMore) {
        paginationQueryRef.current.preloadNextPage(pageNumber);
      }
      
      if (process.env.NODE_ENV === 'development') {

      }
    } catch (error) {

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
      if (process.env.NODE_ENV === 'development') {

      }
      paginationQueryRef.current.clearCache();
      loadPage(1); // Always go to page 1 after refresh to see newest payments
    }
  }, [loadPage]);

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
  }, [workspaceId, loadPage]);

  return {
    // Data
    payments,
    tasks, // Pass through from context
    
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
    showingFrom: payments.length === 0 ? 0 : (currentPage - 1) * pageSize + 1,
    showingTo: (currentPage - 1) * pageSize + payments.length,
    
    // Debug
    getCacheStats,
  };
}

export default usePaginatedPayments;
