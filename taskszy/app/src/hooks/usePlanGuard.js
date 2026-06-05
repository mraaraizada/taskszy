import { useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { notify } from '../lib/notify';

/**
 * Returns a guard function. Wrap any action button's onClick with it.
 * If the plan is inactive, shows a toast and blocks the action.
 * Usage: onClick={guard(() => doSomething())}
 */
export function usePlanGuard() {
  const { isPlanActive } = useApp();

  const guard = useCallback((fn) => {
    return (...args) => {
      if (!isPlanActive) {
        notify.error('Your plan is inactive. Please upgrade to continue.');
        return;
      }
      return fn?.(...args);
    };
  }, [isPlanActive]);

  return { guard, isPlanActive };
}
