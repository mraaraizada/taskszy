import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';

/**
 * Property 6: Admin-created member profile has the correct role and memberId.
 *
 * Tests the admin-creates-member logic extracted from TeamPage.MemberModal in isolation:
 *
 *   const credential = await signUp(email, password);
 *   await createProfile(uid, { email, role, memberId: newMember.id });
 */

async function adminCreateMemberHandler(
  { email, password, role, memberId },
  { signUp, createProfile }
) {
  const credential = await signUp(email, password);
  const uid = credential.user.uid;
  await createProfile(uid, { email, role, memberId });
  return uid;
}

describe('Admin-created member profile (Property 6)', () => {
  it('always calls createProfile with the exact role and memberId provided', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('admin', 'management', 'member'),
        fc.integer({ min: 1, max: 99999 }),
        fc.emailAddress(),
        fc.string({ minLength: 6 }),
        async (role, memberId, email, password) => {
          const uid = `uid-${Math.random().toString(36).slice(2)}`;
          const signUp = vi.fn().mockResolvedValue({ user: { uid } });
          const createProfile = vi.fn().mockResolvedValue(undefined);

          await adminCreateMemberHandler(
            { email, password, role, memberId },
            { signUp, createProfile }
          );

          expect(createProfile).toHaveBeenCalledTimes(1);
          const [calledUid, profileData] = createProfile.mock.calls[0];

          // UID must match what signUp returned
          expect(calledUid).toBe(uid);
          // Role and memberId must exactly match what was passed in
          expect(profileData.role).toBe(role);
          expect(profileData.memberId).toBe(memberId);
          expect(profileData.email).toBe(email);
        }
      ),
      { numRuns: 200 }
    );
  });

  it('does NOT call createProfile when signUp fails with email-already-in-use', async () => {
    const signUp = vi.fn().mockRejectedValue({ code: 'auth/email-already-in-use' });
    const createProfile = vi.fn();

    try {
      await adminCreateMemberHandler(
        { email: 'existing@test.com', password: 'pass123', role: 'member', memberId: 1 },
        { signUp, createProfile }
      );
    } catch {
      // expected to throw
    }

    expect(createProfile).not.toHaveBeenCalled();
  });
});
