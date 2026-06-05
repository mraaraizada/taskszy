import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { mapAuthError, mapPasswordResetError } from '../authService';

// ─── Known error-code → message mapping ───────────────────────────────────────
const KNOWN_SIGN_IN_CODES = {
  'auth/user-not-found':      'Invalid email or password. Please try again.',
  'auth/wrong-password':      'Invalid email or password. Please try again.',
  'auth/invalid-credential':  'Invalid email or password. Please try again.',
  'auth/too-many-requests':   'Too many failed attempts. Please try again later.',
  'auth/email-already-in-use':'An account with this email already exists.',
  'auth/weak-password':       'Password must be at least 6 characters.',
};

// ─── Property 2: mapAuthError returns the correct message for every known code ─
describe('mapAuthError — known codes', () => {
  it('returns the exact message for every known error code', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...Object.keys(KNOWN_SIGN_IN_CODES)),
        (code) => {
          expect(mapAuthError(code)).toBe(KNOWN_SIGN_IN_CODES[code]);
        }
      ),
      { numRuns: 200 }
    );
  });
});

// ─── Property 3: mapAuthError returns a non-empty string for ANY code ──────────
describe('mapAuthError — any code', () => {
  it('never returns null, undefined, or empty string for any input', () => {
    fc.assert(
      fc.property(
        fc.string(),
        (code) => {
          const result = mapAuthError(code);
          expect(result).toBeTruthy();
          expect(typeof result).toBe('string');
          expect(result.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 500 }
    );
  });
});

// ─── mapPasswordResetError — known codes ──────────────────────────────────────
describe('mapPasswordResetError — known codes', () => {
  it('returns the correct message for auth/user-not-found', () => {
    expect(mapPasswordResetError('auth/user-not-found')).toBe(
      'No account found with that email address.'
    );
  });

  it('returns fallback message for any unknown code', () => {
    fc.assert(
      fc.property(
        fc.string().filter((s) => s !== 'auth/user-not-found'),
        (code) => {
          expect(mapPasswordResetError(code)).toBe(
            'Failed to send reset email. Please try again.'
          );
        }
      ),
      { numRuns: 200 }
    );
  });
});
