/**
 * Paginated Query Service
 * 
 * Implements cursor-based pagination for Firestore queries
 * Load data in chunks instead of all at once
 * 
 * GOAL: Reduce initial page load reads by 80%+
 */

import { query, limit, startAfter, getDocs } from 'firebase/firestore';

// ── Paginated Query Manager ───────────────────────────────────────────────────
export class PaginatedQuery {
  constructor(baseQuery, pageSize = 20) {
    this.baseQuery = baseQuery;
    this.pageSize = pageSize;
    this.lastDoc = null;
    this.hasMore = true;
    this.loading = false;
    this.allDocs = [];
  }
  
  /**
   * Load first page
   */
  async loadFirst() {
    if (this.loading) return null;
    
    this.loading = true;
    this.lastDoc = null;
    this.allDocs = [];
    
    try {
      const q = query(this.baseQuery, limit(this.pageSize));
      const snapshot = await getDocs(q);
      
      console.log(`📄 Loaded first page: ${snapshot.docs.length} documents`);
      
      this.allDocs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      this.lastDoc = snapshot.docs[snapshot.docs.length - 1];
      this.hasMore = snapshot.docs.length === this.pageSize;
      
      return this.allDocs;
    } catch (error) {
      console.error('❌ Failed to load first page:', error);
      return null;
    } finally {
      this.loading = false;
    }
  }
  
  /**
   * Load next page
   */
  async loadNext() {
    if (this.loading || !this.hasMore || !this.lastDoc) return null;
    
    this.loading = true;
    
    try {
      const q = query(
        this.baseQuery,
        startAfter(this.lastDoc),
        limit(this.pageSize)
      );
      const snapshot = await getDocs(q);
      
      console.log(`📄 Loaded next page: ${snapshot.docs.length} documents`);
      
      const newDocs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      this.allDocs = [...this.allDocs, ...newDocs];
      this.lastDoc = snapshot.docs[snapshot.docs.length - 1];
      this.hasMore = snapshot.docs.length === this.pageSize;
      
      return newDocs;
    } catch (error) {
      console.error('❌ Failed to load next page:', error);
      return null;
    } finally {
      this.loading = false;
    }
  }
  
  /**
   * Load all remaining pages
   */
  async loadAll() {
    while (this.hasMore && !this.loading) {
      await this.loadNext();
    }
    
    console.log(`📄 Loaded all pages: ${this.allDocs.length} total documents`);
    return this.allDocs;
  }
  
  /**
   * Reset pagination
   */
  reset() {
    this.lastDoc = null;
    this.hasMore = true;
    this.allDocs = [];
    this.loading = false;
  }
  
  /**
   * Get current data
   */
  getData() {
    return this.allDocs;
  }
  
  /**
   * Get pagination state
   */
  getState() {
    return {
      hasMore: this.hasMore,
      loading: this.loading,
      count: this.allDocs.length,
      pageSize: this.pageSize
    };
  }
}

// ── React Hook for Paginated Queries ──────────────────────────────────────────
import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Hook for paginated Firestore queries
 * 
 * @param {Query} baseQuery - Firestore query (without limit)
 * @param {number} pageSize - Documents per page
 * @returns {Object} Pagination state and controls
 */
export function usePaginatedQuery(baseQuery, pageSize = 20) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  
  const paginatorRef = useRef(null);
  
  // Initialize paginator
  useEffect(() => {
    if (baseQuery) {
      paginatorRef.current = new PaginatedQuery(baseQuery, pageSize);
    }
  }, [baseQuery, pageSize]);
  
  /**
   * Load first page
   */
  const loadFirst = useCallback(async () => {
    if (!paginatorRef.current) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await paginatorRef.current.loadFirst();
      if (result) {
        setData(result);
        setHasMore(paginatorRef.current.hasMore);
      }
    } catch (err) {
      console.error('Failed to load first page:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);
  
  /**
   * Load next page
   */
  const loadNext = useCallback(async () => {
    if (!paginatorRef.current || loading || !hasMore) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const newDocs = await paginatorRef.current.loadNext();
      if (newDocs) {
        setData(paginatorRef.current.getData());
        setHasMore(paginatorRef.current.hasMore);
      }
    } catch (err) {
      console.error('Failed to load next page:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore]);
  
  /**
   * Load all pages
   */
  const loadAll = useCallback(async () => {
    if (!paginatorRef.current) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await paginatorRef.current.loadAll();
      if (result) {
        setData(result);
        setHasMore(false);
      }
    } catch (err) {
      console.error('Failed to load all pages:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);
  
  /**
   * Reset pagination
   */
  const reset = useCallback(() => {
    if (paginatorRef.current) {
      paginatorRef.current.reset();
      setData([]);
      setHasMore(true);
      setError(null);
    }
  }, []);
  
  return {
    data,
    loading,
    hasMore,
    error,
    loadFirst,
    loadNext,
    loadAll,
    reset
  };
}

// ── Infinite Scroll Hook ──────────────────────────────────────────────────────
/**
 * Hook for infinite scroll pagination
 * Automatically loads next page when scrolling near bottom
 */
export function useInfiniteScroll(loadNext, hasMore, threshold = 200) {
  const [isFetching, setIsFetching] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      // Check if near bottom of page
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;
      
      const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);
      
      if (distanceFromBottom < threshold && hasMore && !isFetching) {
        setIsFetching(true);
        loadNext().finally(() => {
          setIsFetching(false);
        });
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadNext, hasMore, isFetching, threshold]);
  
  return { isFetching };
}

export default {
  PaginatedQuery,
  usePaginatedQuery,
  useInfiniteScroll
};
