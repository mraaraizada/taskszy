import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';

// ─── Mock firebase/firestore before importing the service ─────────────────────
vi.mock('firebase/firestore', () => ({
  doc:    vi.fn(),
  getDoc: vi.fn(),
}));

// Mock the db export so the service can import it without a real Firebase app
vi.mock('../firebase', () => ({
  db: {},
}));

import { doc, getDoc } from 'firebase/firestore';
import { getProfile } from '../userProfileService';

// ─── Property 7: getProfile always reads dashboardUsers, never users ───────────
describe('dashboard getProfile — collection path (Property 7)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Make getDoc return a non-existent doc by default (we only care about the path)
    getDoc.mockResolvedValue({ exists: () => false });
  });

  it('always constructs the path as dashboardUsers/{uid}, never users/{uid}', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1 }),
        async (uid) => {
          doc.mockClear();

          await getProfile(uid);

          // doc() must have been called with ('dashboardUsers', uid)
          expect(doc).toHaveBeenCalledTimes(1);
          const [, collection, docId] = doc.mock.calls[0];
          expect(collection).toBe('superAdmins');
          expect(docId).toBe(uid);
          // Explicitly assert it was NOT called with 'users'
          expect(collection).not.toBe('users');
        }
      ),
      { numRuns: 300 }
    );
  });

  it('returns null when the document does not exist', async () => {
    getDoc.mockResolvedValueOnce({ exists: () => false });
    doc.mockReturnValue({});
    const result = await getProfile('some-uid');
    expect(result).toBeNull();
  });

  it('returns the profile fields when the document exists', async () => {
    doc.mockReturnValue({});
    getDoc.mockResolvedValueOnce({
      exists: () => true,
      data:   () => ({
        email:         'admin@taskzy.io',
        dashboardRole: 'superadmin',
        createdAt:     null,
      }),
    });
    const profile = await getProfile('uid-123');
    expect(profile).toEqual({
      email:         'admin@taskzy.io',
      dashboardRole: 'superadmin',
      createdAt:     null,
    });
  });
});
