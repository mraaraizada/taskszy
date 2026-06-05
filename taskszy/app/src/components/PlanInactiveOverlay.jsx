import { useApp } from '../context/AppContext';
import { notify } from '../lib/notify';

/**
 * Transparent overlay that blocks page content clicks when plan is inactive.
 * Shows a toast: "An error occurred. Please contact your admin."
 * Used by management and member dashboards.
 */
export default function PlanInactiveOverlay() {
  const { isPlanActive } = useApp();
  if (isPlanActive) return null;

  return (
    <div
      onClick={() => notify.error('An error occurred, Please contact admin')}
      style={{
        position: 'absolute', inset: 0,
        zIndex: 500,
        cursor: 'default',
        background: 'transparent',
      }}
    />
  );
}
