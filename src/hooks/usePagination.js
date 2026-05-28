/**
 * Reusable Pagination Hook
 * Provides consistent pagination logic across all pages
 * 
 * OPTIMIZATION: Reduces re-renders and provides consistent UX
 */

import { useState, useMemo, useCallback } from 'react';

/**
 * Custom hook for pagination
 * @param {Array} items - Array of items to paginate
 * @param {number} itemsPerPage - Number of items per page (default: 15)
 * @returns {Object} Pagination state and controls
 */
export function usePagination(items = [], itemsPerPage = 15) {
  const [currentPage, setCurrentPage] = useState(1);
  
  // Calculate pagination values
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  
  // Get paginated items
  const paginatedItems = useMemo(() => {
    return items.slice(startIndex, endIndex);
  }, [items, startIndex, endIndex]);
  
  // Navigation functions
  const goToPage = useCallback((page) => {
    const validPage = Math.max(1, Math.min(totalPages, page));
    setCurrentPage(validPage);
  }, [totalPages]);
  
  const nextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  }, [currentPage, totalPages]);
  
  const prevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  }, [currentPage]);
  
  const goToFirstPage = useCallback(() => {
    setCurrentPage(1);
  }, []);
  
  const goToLastPage = useCallback(() => {
    setCurrentPage(totalPages);
  }, [totalPages]);
  
  // Reset to first page when items change significantly
  const resetPagination = useCallback(() => {
    setCurrentPage(1);
  }, []);
  
  return {
    // Paginated data
    paginatedItems,
    
    // Pagination state
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    startIndex,
    endIndex,
    
    // Navigation
    goToPage,
    nextPage,
    prevPage,
    goToFirstPage,
    goToLastPage,
    resetPagination,
    
    // Helpers
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
    isFirstPage: currentPage === 1,
    isLastPage: currentPage === totalPages,
    
    // Display helpers
    showingFrom: totalItems === 0 ? 0 : startIndex + 1,
    showingTo: Math.min(endIndex, totalItems),
  };
}

/**
 * Pagination Controls Component
 * Reusable UI component for pagination
 */
export function PaginationControls({ 
  currentPage, 
  totalPages, 
  onPrevPage, 
  onNextPage,
  showingFrom,
  showingTo,
  totalItems,
  compact = false 
}) {
  if (totalPages <= 1) return null;
  
  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: compact ? 6 : 10,
      padding: compact ? '4px 8px' : '8px 12px',
      background: 'var(--bg-subtle)',
      borderRadius: 9,
    }}>
      {!compact && (
        <span style={{ 
          fontSize: 11, 
          fontWeight: 600, 
          color: 'var(--text-secondary)',
          marginRight: 4
        }}>
          {showingFrom}-{showingTo} of {totalItems}
        </span>
      )}
      
      <button
        onClick={onPrevPage}
        disabled={currentPage === 1}
        style={{
          width: 26,
          height: 26,
          borderRadius: 7,
          border: '1.5px solid var(--border)',
          background: currentPage === 1 ? 'var(--bg-subtle)' : 'var(--bg-surface)',
          cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: currentPage === 1 ? 0.5 : 1,
          color: 'var(--text-secondary)',
          fontSize: 14,
          fontWeight: 700,
        }}
      >
        ‹
      </button>
      
      <span style={{ 
        fontSize: 11, 
        fontWeight: 600, 
        color: 'var(--text-secondary)', 
        minWidth: 50, 
        textAlign: 'center' 
      }}>
        {currentPage} / {totalPages}
      </span>
      
      <button
        onClick={onNextPage}
        disabled={currentPage === totalPages}
        style={{
          width: 26,
          height: 26,
          borderRadius: 7,
          border: '1.5px solid var(--border)',
          background: currentPage === totalPages ? 'var(--bg-subtle)' : 'var(--bg-surface)',
          cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: currentPage === totalPages ? 0.5 : 1,
          color: 'var(--text-secondary)',
          fontSize: 14,
          fontWeight: 700,
        }}
      >
        ›
      </button>
    </div>
  );
}

export default usePagination;
