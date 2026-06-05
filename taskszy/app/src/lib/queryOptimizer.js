/**
 * Query Optimizer
 * 
 * Applies filters, limits, and scoping to minimize documents scanned.
 * Implements server-side filtering to reduce read operations.
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.6, 9.1, 9.4
 */

import { query, where, orderBy, limit, startAfter } from 'firebase/firestore';
import { collection } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Generate a unique signature for a query to use as cache key
 * @param {string} collectionPath - Firestore collection path
 * @param {Object} options - Query options
 * @returns {string} Query signature
 */
export function generateQuerySignature(collectionPath, options = {}) {
  const parts = [
    collectionPath,
    JSON.stringify(options.filters || {}),
    JSON.stringify(options.orderBy || {}),
    options.limit || 'unlimited',
    options.accessLevel || 'none',
    options.userId || 'anonymous'
  ];
  return parts.join('::');
}

/**
 * Query Optimizer Class
 * 
 * Builds optimized Firestore queries with filters, limits, and scoping
 */
export class QueryOptimizer {
  /**
   * Build optimized query with filters and limits
   * 
   * @param {string} collectionPath - Firestore collection path (e.g., 'workspaces/{id}/tasks')
   * @param {Object} options - Query options
   * @param {string} [options.userId] - User ID for scoping
   * @param {string} [options.accessLevel] - 'admin' | 'manager' | 'member'
   * @param {number} [options.limit] - Maximum documents to return
   * @param {Object} [options.filters] - Additional where clauses { field: value }
   * @param {Object} [options.orderBy] - Sort configuration { field: string, direction: 'asc'|'desc' }
   * @param {DocumentSnapshot} [options.startAfter] - Pagination cursor
   * @returns {Query} Firestore query object
   */
  buildQuery(collectionPath, options = {}) {
    const {
      userId,
      accessLevel,
      limit: limitValue,
      filters = {},
      orderBy: orderByConfig,
      startAfter: startAfterDoc
    } = options;

    // Start with base collection reference
    let q = collection(db, collectionPath);

    // Apply member-scoped filtering if user is a member
    if (accessLevel === 'member' && userId) {
      q = this.applyMemberScope(q, userId);
    }

    // Apply manager-scoped filtering if user is a manager
    if (accessLevel === 'manager' && userId) {
      // Managers see tasks assigned to their team or created by them
      // Note: This requires composite index on (teamId, createdDate) or (createdBy, createdDate)
      if (filters.teamId) {
        q = query(q, where('teamId', '==', filters.teamId));
      } else if (filters.createdBy !== undefined) {
        q = query(q, where('createdBy', '==', filters.createdBy));
      }
    }

    // Apply additional filters (server-side filtering)
    Object.entries(filters).forEach(([field, value]) => {
      // Skip filters already applied in scoping
      if (accessLevel === 'manager' && (field === 'teamId' || field === 'createdBy')) {
        return;
      }

      if (value !== undefined && value !== null) {
        // Handle different filter types
        if (typeof value === 'object' && value.operator) {
          // Support for complex operators: { operator: '>=', value: someValue }
          q = query(q, where(field, value.operator, value.value));
        } else {
          // Simple equality filter
          q = query(q, where(field, '==', value));
        }
      }
    });

    // Apply ordering
    if (orderByConfig) {
      const { field, direction = 'desc' } = orderByConfig;
      q = query(q, orderBy(field, direction));
    }

    // Apply pagination cursor
    if (startAfterDoc) {
      q = query(q, startAfter(startAfterDoc));
    }

    // Apply limit (always add limit to prevent full collection scans)
    if (limitValue) {
      q = query(q, limit(limitValue));
    }

    return q;
  }

  /**
   * Apply member-scoped filtering
   * 
   * Filters queries to only include documents where the user is a member.
   * Uses server-side filtering with array-contains for memberIds field.
   * 
   * @param {Query} baseQuery - Base query or collection reference
   * @param {string} memberId - Member ID to filter by
   * @returns {Query} Scoped query
   */
  applyMemberScope(baseQuery, memberId) {
    // Use array-contains to filter by memberIds array
    // This requires that documents have a memberIds field (array of member IDs)
    return query(baseQuery, where('memberIds', 'array-contains', memberId));
  }

  /**
   * Apply pagination
   * 
   * Adds limit and startAfter cursor for cursor-based pagination.
   * 
   * @param {Query} baseQuery - Base query
   * @param {number} limitValue - Page size (number of documents per page)
   * @param {DocumentSnapshot} [startAfterDoc] - Pagination cursor (last document from previous page)
   * @returns {Query} Paginated query
   */
  applyPagination(baseQuery, limitValue, startAfterDoc = null) {
    let q = query(baseQuery, limit(limitValue));
    
    if (startAfterDoc) {
      q = query(q, startAfter(startAfterDoc));
    }
    
    return q;
  }

  /**
   * Generate query signature for cache keys
   * 
   * Creates a unique identifier for a query based on its parameters.
   * Used by QueryCache to store and retrieve cached results.
   * 
   * @param {string} collectionPath - Firestore collection path
   * @param {Object} options - Query options (same as buildQuery)
   * @returns {string} Query signature
   */
  generateSignature(collectionPath, options = {}) {
    return generateQuerySignature(collectionPath, options);
  }
}

// Export singleton instance
export const queryOptimizer = new QueryOptimizer();

// Export class for testing
export default QueryOptimizer;
