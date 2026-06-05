import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';

// ─── Mock firebase/firestore before importing the service ─────────────────────
vi.mock('firebase/firestore', () => ({
  doc:             vi.fn(),
  getDoc:          vi.fn(),
  setDoc:          vi.fn(),
  updateDoc:       vi.fn(),
  serverTimestamp: vi.fn(() => ({ _type: 'serverTimestamp' })),
}));

// Mock the db export so the service can import it without a real Firebase app
vi.mock('../firebase', () => ({
  db: {},
}));

import { getDoc, doc } from 'firebase/firestore';
import { getProfile } from '../userProfileService';

// ─── Property 1: getProfile fields map correctly to onLogin args ───────────────
describe('getProfile — field mapping (Property 1)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // doc() just needs to return something; getDoc() is what we control
    doc.mockReturnValue({ path: 'users/test-uid' });
  });

  it('returns exactly the role, memberId, and email from the Firestore document', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('admin', 'management', 'member'),
        fc.oneof(fc.integer({ min: 1, max: 99999 }), fc.constant(null)),
        fc.emailAddress(),
        async (role, memberId, email) => {
          const fakeData = { email, role, memberId, createdAt: null };

          getDoc.mockResolvedValueOnce({
            exists: () => true,
            data:   () => fakeData,
          });

          const profile = await getProfile('any-uid');

          // The values passed to onLogin must exactly match the document fields
          expect(profile.role).toBe(role);
          expect(profile.memberId).toBe(memberId);
          expect(profile.email).toBe(email);
        }
      ),
      { numRuns: 200 }
    );
  });

  it('returns null when the document does not exist', async () => {
    getDoc.mockResolvedValueOnce({ exists: () => false });
    const profile = await getProfile('missing-uid');
    expect(profile).toBeNull();
  });
});
