import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';

/**
 * Property 4: onAuthStateChanged handler resolves to handleLogin for any non-null user.
 *
 * This test exercises the handler logic extracted from AppShell in isolation,
 * so we don't need to mount a React component. The logic under test is:
 *
 *   if (user) {
 *     const profile = await getProfile(user.uid);
 *     if (profile) handleLogin(profile.role, profile.memberId, profile.email);
 *   }
 *   setAuthLoading(false);
 */

// Simulates the onAuthStateChanged callback as written in AppShell
async function onAuthChangedHandler(user, { getProfile, handleLogin, setAuthLoading }) {
  if (user) {
    const profile = await getProfile(user.uid);
    if (profile) {
      handleLogin(profile.role, profile.memberId, profile.email);
    }
  }
  setAuthLoading(false);
}

describe('AppShell onAuthStateChanged handler (Property 4)', () => {
  it('calls handleLogin with non-null role, memberId, and email for any non-null user with a profile', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate arbitrary uid strings
        fc.string({ minLength: 1, maxLength: 64 }),
        // Generate valid role values
        fc.constantFrom('admin', 'management', 'member'),
        // Generate memberId: number or null
        fc.oneof(fc.integer({ min: 1, max: 99999 }), fc.constant(null)),
        // Generate email
        fc.emailAddress(),
        async (uid, role, memberId, email) => {
          const handleLogin    = vi.fn();
          const setAuthLoading = vi.fn();
          const getProfile     = vi.fn().mockResolvedValue({ role, memberId, email });

          await onAuthChangedHandler(
            { uid },
            { getProfile, handleLogin, setAuthLoading }
          );

          // handleLogin must be called exactly once
          expect(handleLogin).toHaveBeenCalledTimes(1);

          const [calledRole, calledMemberId, calledEmail] = handleLogin.mock.calls[0];

          // All three args must be non-null/undefined
          expect(calledRole).toBeTruthy();
          expect(calledEmail).toBeTruthy();
          // memberId can be null (admin) but must not be undefined
          expect(calledMemberId).not.toBeUndefined();

          // Values must match the profile exactly
          expect(calledRole).toBe(role);
          expect(calledMemberId).toBe(memberId);
          expect(calledEmail).toBe(email);

          // setAuthLoading(false) must always be called
          expect(setAuthLoading).toHaveBeenCalledWith(false);
        }
      ),
      { numRuns: 200 }
    );
  });

  it('does NOT call handleLogin when user is null', async () => {
    const handleLogin    = vi.fn();
    const setAuthLoading = vi.fn();
    const getProfile     = vi.fn();

    await onAuthChangedHandler(null, { getProfile, handleLogin, setAuthLoading });

    expect(handleLogin).not.toHaveBeenCalled();
    expect(getProfile).not.toHaveBeenCalled();
    expect(setAuthLoading).toHaveBeenCalledWith(false);
  });

  it('does NOT call handleLogin when profile is null (account exists in Auth but not Firestore)', async () => {
    const handleLogin    = vi.fn();
    const setAuthLoading = vi.fn();
    const getProfile     = vi.fn().mockResolvedValue(null);

    await onAuthChangedHandler({ uid: 'some-uid' }, { getProfile, handleLogin, setAuthLoading });

    expect(handleLogin).not.toHaveBeenCalled();
    expect(setAuthLoading).toHaveBeenCalledWith(false);
  });
});
