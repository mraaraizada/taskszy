/**
 * Unit Tests for QueryOptimizer
 * 
 * Tests specific examples, edge cases, and integration points
 * Requirements: 3.7, 9.7
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { QueryOptimizer, generateQuerySignature } from '../queryOptimizer';

// Mock Firebase Firestore
vi.mock('../firebase', () => ({
  db: {}
}));

vi.mock('firebase/firestore', () => {
  // Create mock query builder that tracks operations
  const createMockQuery = (operations = []) => {
    return {
      _operations: operations,
      _type: 'query'
    };
  };

  return {
    collection: vi.fn((db, path) => ({
      _type: 'collection',
      _path: path,
      _operations: []
    })),
    query: vi.fn((baseQuery, ...constraints) => {
      const operations = baseQuery._operations || [];
      return createMockQuery([...operations, ...constraints]);
    }),
    where: vi.fn((field, operator, value) => ({
      _type: 'where',
      field,
      operator,
      value
    })),
    orderBy: vi.fn((field, direction) => ({
      _type: 'orderBy',
      field,
      direction
    })),
    limit: vi.fn((value) => ({
      _type: 'limit',
      value
    })),
    startAfter: vi.fn((doc) => ({
      _type: 'startAfter',
      doc
    }))
  };
});

describe('QueryOptimizer', () => {
  let optimizer;

  beforeEach(() => {
    optimizer = new QueryOptimizer();
    vi.clearAllMocks();
  });

  describe('buildQuery', () => {
    it('should build a basic query with limit', () => {
      const query = optimizer.buildQuery('workspaces/ws1/tasks', {
        limit: 25
      });

      expect(query._operations).toBeDefined();
      const limitOp = query._operations.find(op => op._type === 'limit');
      expect(limitOp).toBeDefined();
      expect(limitOp.value).toBe(25);
    });

    it('should apply member scope for member-level users', () => {
      const query = optimizer.buildQuery('workspaces/ws1/tasks', {
        userId: 'member123',
        accessLevel: 'member',
        limit: 25
      });

      expect(query._operations).toBeDefined();
      const whereOp = query._operations.find(op => op._type === 'where' && op.field === 'memberIds');
      expect(whereOp).toBeDefined();
      expect(whereOp.operator).toBe('array-contains');
      expect(whereOp.value).toBe('member123');
    });

    it('should apply manager scope with teamId filter', () => {
      const query = optimizer.buildQuery('workspaces/ws1/tasks', {
        userId: 'manager123',
        accessLevel: 'manager',
        filters: { teamId: 'team1' },
        limit: 50
      });

      expect(query._operations).toBeDefined();
      const whereOp = query._operations.find(op => op._type === 'where' && op.field === 'teamId');
      expect(whereOp).toBeDefined();
      expect(whereOp.value).toBe('team1');
    });

    it('should apply orderBy configuration', () => {
      const query = optimizer.buildQuery('workspaces/ws1/tasks', {
        orderBy: { field: 'createdDate', direction: 'desc' },
        limit: 25
      });

      expect(query._operations).toBeDefined();
      const orderByOp = query._operations.find(op => op._type === 'orderBy');
      expect(orderByOp).toBeDefined();
      expect(orderByOp.field).toBe('createdDate');
      expect(orderByOp.direction).toBe('desc');
    });

    it('should apply multiple filters', () => {
      const query = optimizer.buildQuery('workspaces/ws1/tasks', {
        filters: {
          stage: 'Start',
          priority: 'high'
        },
        limit: 25
      });

      expect(query._operations).toBeDefined();
      const whereOps = query._operations.filter(op => op._type === 'where');
      expect(whereOps.length).toBeGreaterThanOrEqual(2);
      
      const stageFilter = whereOps.find(op => op.field === 'stage');
      expect(stageFilter).toBeDefined();
      expect(stageFilter.value).toBe('Start');
      
      const priorityFilter = whereOps.find(op => op.field === 'priority');
      expect(priorityFilter).toBeDefined();
      expect(priorityFilter.value).toBe('high');
    });

    it('should apply pagination cursor', () => {
      const mockDoc = { id: 'doc123' };
      const query = optimizer.buildQuery('workspaces/ws1/tasks', {
        limit: 25,
        startAfter: mockDoc
      });

      expect(query._operations).toBeDefined();
      const startAfterOp = query._operations.find(op => op._type === 'startAfter');
      expect(startAfterOp).toBeDefined();
      expect(startAfterOp.doc).toBe(mockDoc);
    });

    it('should handle admin access level without scoping', () => {
      const query = optimizer.buildQuery('workspaces/ws1/tasks', {
        userId: 'admin123',
        accessLevel: 'admin',
        limit: 100
      });

      expect(query._operations).toBeDefined();
      // Should not have memberIds filter for admin
      const memberFilter = query._operations.find(op => op._type === 'where' && op.field === 'memberIds');
      expect(memberFilter).toBeUndefined();
    });

    it('should handle complex filter operators', () => {
      const query = optimizer.buildQuery('workspaces/ws1/tasks', {
        filters: {
          deadline: { operator: '>=', value: new Date('2024-01-01') }
        },
        limit: 25
      });

      expect(query._operations).toBeDefined();
      const whereOp = query._operations.find(op => op._type === 'where' && op.field === 'deadline');
      expect(whereOp).toBeDefined();
      expect(whereOp.operator).toBe('>=');
    });

    it('should skip undefined and null filter values', () => {
      const query = optimizer.buildQuery('workspaces/ws1/tasks', {
        filters: {
          stage: 'Start',
          priority: undefined,
          status: null
        },
        limit: 25
      });

      expect(query._operations).toBeDefined();
      const whereOps = query._operations.filter(op => op._type === 'where');
      
      // Should only have stage filter, not priority or status
      const stageFilter = whereOps.find(op => op.field === 'stage');
      expect(stageFilter).toBeDefined();
      
      const priorityFilter = whereOps.find(op => op.field === 'priority');
      expect(priorityFilter).toBeUndefined();
      
      const statusFilter = whereOps.find(op => op.field === 'status');
      expect(statusFilter).toBeUndefined();
    });
  });

  describe('applyMemberScope', () => {
    it('should add array-contains filter for memberIds', async () => {
      const { query: queryFn, where: whereFn } = await import('firebase/firestore');
      const baseQuery = { _operations: [] };
      
      const result = optimizer.applyMemberScope(baseQuery, 'member456');
      
      expect(queryFn).toHaveBeenCalled();
      expect(whereFn).toHaveBeenCalledWith('memberIds', 'array-contains', 'member456');
    });

    it('should work with different member IDs', async () => {
      const { where: whereFn } = await import('firebase/firestore');
      const baseQuery = { _operations: [] };
      
      optimizer.applyMemberScope(baseQuery, 'member789');
      
      expect(whereFn).toHaveBeenCalledWith('memberIds', 'array-contains', 'member789');
    });
  });

  describe('applyPagination', () => {
    it('should add limit without cursor', async () => {
      const { query: queryFn, limit: limitFn } = await import('firebase/firestore');
      const baseQuery = { _operations: [] };
      
      const result = optimizer.applyPagination(baseQuery, 50);
      
      expect(queryFn).toHaveBeenCalled();
      expect(limitFn).toHaveBeenCalledWith(50);
    });

    it('should add limit and startAfter cursor', async () => {
      const { query: queryFn, limit: limitFn, startAfter: startAfterFn } = await import('firebase/firestore');
      const baseQuery = { _operations: [] };
      const mockDoc = { id: 'lastDoc' };
      
      const result = optimizer.applyPagination(baseQuery, 50, mockDoc);
      
      expect(queryFn).toHaveBeenCalled();
      expect(limitFn).toHaveBeenCalledWith(50);
      expect(startAfterFn).toHaveBeenCalledWith(mockDoc);
    });

    it('should handle different page sizes', async () => {
      const { limit: limitFn } = await import('firebase/firestore');
      const baseQuery = { _operations: [] };
      
      optimizer.applyPagination(baseQuery, 10);
      expect(limitFn).toHaveBeenCalledWith(10);
      
      optimizer.applyPagination(baseQuery, 100);
      expect(limitFn).toHaveBeenCalledWith(100);
    });
  });

  describe('generateSignature', () => {
    it('should generate consistent signatures for same parameters', () => {
      const sig1 = optimizer.generateSignature('workspaces/ws1/tasks', {
        limit: 25,
        accessLevel: 'member',
        userId: 'user123'
      });

      const sig2 = optimizer.generateSignature('workspaces/ws1/tasks', {
        limit: 25,
        accessLevel: 'member',
        userId: 'user123'
      });

      expect(sig1).toBe(sig2);
    });

    it('should generate different signatures for different parameters', () => {
      const sig1 = optimizer.generateSignature('workspaces/ws1/tasks', {
        limit: 25,
        accessLevel: 'member'
      });

      const sig2 = optimizer.generateSignature('workspaces/ws1/tasks', {
        limit: 50,
        accessLevel: 'admin'
      });

      expect(sig1).not.toBe(sig2);
    });

    it('should include filters in signature', () => {
      const sig1 = optimizer.generateSignature('workspaces/ws1/tasks', {
        filters: { stage: 'Start' }
      });

      const sig2 = optimizer.generateSignature('workspaces/ws1/tasks', {
        filters: { stage: 'Complete' }
      });

      expect(sig1).not.toBe(sig2);
    });

    it('should include orderBy in signature', () => {
      const sig1 = optimizer.generateSignature('workspaces/ws1/tasks', {
        orderBy: { field: 'createdDate', direction: 'desc' }
      });

      const sig2 = optimizer.generateSignature('workspaces/ws1/tasks', {
        orderBy: { field: 'updatedDate', direction: 'asc' }
      });

      expect(sig1).not.toBe(sig2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty options object', () => {
      const query = optimizer.buildQuery('workspaces/ws1/tasks', {});
      
      expect(query).toBeDefined();
      expect(query._operations).toBeDefined();
    });

    it('should handle missing userId with member accessLevel', () => {
      const query = optimizer.buildQuery('workspaces/ws1/tasks', {
        accessLevel: 'member',
        limit: 25
      });
      
      // Should not crash, but won't apply member scope without userId
      expect(query).toBeDefined();
    });

    it('should handle empty filters object', () => {
      const query = optimizer.buildQuery('workspaces/ws1/tasks', {
        filters: {},
        limit: 25
      });
      
      expect(query).toBeDefined();
      expect(query._operations).toBeDefined();
    });

    it('should handle orderBy with default direction', () => {
      const query = optimizer.buildQuery('workspaces/ws1/tasks', {
        orderBy: { field: 'createdDate' },
        limit: 25
      });

      expect(query._operations).toBeDefined();
      const orderByOp = query._operations.find(op => op._type === 'orderBy');
      expect(orderByOp).toBeDefined();
      expect(orderByOp.direction).toBe('desc'); // Default direction
    });

    it('should handle zero limit', () => {
      const query = optimizer.buildQuery('workspaces/ws1/tasks', {
        limit: 0
      });
      
      // Zero limit should not be applied (falsy value)
      expect(query).toBeDefined();
    });
  });

  describe('Permission Boundary Conditions', () => {
    it('should not apply member scope for admin users', () => {
      const query = optimizer.buildQuery('workspaces/ws1/tasks', {
        userId: 'admin123',
        accessLevel: 'admin',
        limit: 100
      });

      const memberFilter = query._operations.find(op => op._type === 'where' && op.field === 'memberIds');
      expect(memberFilter).toBeUndefined();
    });

    it('should not apply member scope for manager users', () => {
      const query = optimizer.buildQuery('workspaces/ws1/tasks', {
        userId: 'manager123',
        accessLevel: 'manager',
        limit: 50
      });

      const memberFilter = query._operations.find(op => op._type === 'where' && op.field === 'memberIds');
      expect(memberFilter).toBeUndefined();
    });

    it('should apply member scope only for member users', () => {
      const query = optimizer.buildQuery('workspaces/ws1/tasks', {
        userId: 'member123',
        accessLevel: 'member',
        limit: 25
      });

      const memberFilter = query._operations.find(op => op._type === 'where' && op.field === 'memberIds');
      expect(memberFilter).toBeDefined();
    });

    it('should handle unknown access levels gracefully', () => {
      const query = optimizer.buildQuery('workspaces/ws1/tasks', {
        userId: 'user123',
        accessLevel: 'unknown',
        limit: 25
      });

      // Should not crash with unknown access level
      expect(query).toBeDefined();
    });
  });
});

describe('generateQuerySignature', () => {
  it('should generate signature from collection path and options', () => {
    const signature = generateQuerySignature('workspaces/ws1/tasks', {
      limit: 25,
      filters: { stage: 'Start' },
      orderBy: { field: 'createdDate', direction: 'desc' }
    });

    expect(signature).toBeDefined();
    expect(typeof signature).toBe('string');
    expect(signature.length).toBeGreaterThan(0);
  });

  it('should include all relevant parameters in signature', () => {
    const signature = generateQuerySignature('workspaces/ws1/tasks', {
      limit: 25,
      filters: { stage: 'Start' },
      orderBy: { field: 'createdDate', direction: 'desc' },
      accessLevel: 'member',
      userId: 'user123'
    });

    expect(signature).toContain('workspaces/ws1/tasks');
    expect(signature).toContain('25');
    expect(signature).toContain('member');
  });

  it('should handle missing options', () => {
    const signature = generateQuerySignature('workspaces/ws1/tasks');

    expect(signature).toBeDefined();
    expect(signature).toContain('workspaces/ws1/tasks');
    expect(signature).toContain('unlimited');
  });
});
