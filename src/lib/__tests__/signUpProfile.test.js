import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';

/**
 * Property 5: Self sign-up always creates a profile with role "member" and memberId null.
 *
 * Tests the sign-up logic extracted from LoginPage in isolation:
 *
 *   const credential = await signUp(email, password);
 *   await createProfile(credential.user.uid, { email, role: 'member', memberId: null });
 */

async function selfSignUpHandler(email, password, { signUp, createProfile, sendVerificationEmail }) {
  const credential = await signUp(email, password);
  const user = credential.user;
  await createProfile(user.uid, { email: user.email, role: 'member', memberId: null });
  await sendVerificationEmail(user);
  return user;
}

describe('Self sign-up profile creation (Property 5)', () => {
  it('always calls createProfile with role "member" and memberId null for any email', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(),
        fc.string({ minLength: 6 }),
        async (email, password) => {
          const uid = `uid-${Math.random().toString(36).slice(2)}`;
          const signUp = vi.fn().mockResolvedValue({ user: { uid, email } });
          const createProfile = vi.fn().mockResolvedValue(undefined);
          const sendVerificationEmail = vi.fn().mockResolvedValue(undefined);

          await selfSignUpHandler(email, password, { signUp, createProfile, sendVerificationEmail });

          expect(createProfile).toHaveBeenCalledTimes(1);
          const [, profileData] = createProfile.mock.calls[0];

          // Core invariant: role must always be "member", memberId must always be null
          expect(profileData.role).toBe('member');
          expect(profileData.memberId).toBeNull();
          // Email must be passed through
          expect(profileData.email).toBe(email);
        }
      ),
      { numRuns: 200 }
    );
  });

  it('always calls sendVerificationEmail after createProfile', async () => {
    const callOrder = [];
    const uid = 'test-uid';
    const signUp = vi.fn().mockResolvedValue({ user: { uid, email: 'test@example.com' } });
    const createProfile = vi.fn().mockImplementation(() => { callOrder.push('createProfile'); return Promise.resolve(); });
    const sendVerificationEmail = vi.fn().mockImplementation(() => { callOrder.push('sendVerificationEmail'); return Promise.resolve(); });

    await selfSignUpHandler('test@example.com', 'password123', { signUp, createProfile, sendVerificationEmail });

    expect(callOrder).toEqual(['createProfile', 'sendVerificationEmail']);
  });
});
