/**
 * Feature Flags
 * Control rollout of new features
 */

// Feature flags stored in localStorage
const FEATURE_FLAGS_KEY = 'taskzy_feature_flags';

const DEFAULT_FLAGS = {
  // Server-side task filtering (requires migration + indexes)
  serverSideTaskFiltering: false,
  
  // Server-side activity filtering
  serverSideActivityFiltering: false,
  
  // Image lazy loading
  imageLazyLoading: true,
  
  // Advanced caching
  advancedCaching: false,
};

/**
 * Get all feature flags
 */
export function getFeatureFlags() {
  try {
    const stored = localStorage.getItem(FEATURE_FLAGS_KEY);
    if (stored) {
      return { ...DEFAULT_FLAGS, ...JSON.parse(stored) };
    }
  } catch (error) {

  }
  return DEFAULT_FLAGS;
}

/**
 * Get a specific feature flag
 */
export function getFeatureFlag(flagName) {
  const flags = getFeatureFlags();
  return flags[flagName] ?? false;
}

/**
 * Set a feature flag
 */
export function setFeatureFlag(flagName, value) {
  try {
    const flags = getFeatureFlags();
    flags[flagName] = value;
    localStorage.setItem(FEATURE_FLAGS_KEY, JSON.stringify(flags));

    return true;
  } catch (error) {

    return false;
  }
}

/**
 * Enable server-side filtering (after migration)
 */
export function enableServerSideFiltering() {
  setFeatureFlag('serverSideTaskFiltering', true);
  setFeatureFlag('serverSideActivityFiltering', true);

}

/**
 * Disable server-side filtering (rollback)
 */
export function disableServerSideFiltering() {
  setFeatureFlag('serverSideTaskFiltering', false);
  setFeatureFlag('serverSideActivityFiltering', false);

}

/**
 * Reset all feature flags to defaults
 */
export function resetFeatureFlags() {
  localStorage.removeItem(FEATURE_FLAGS_KEY);

}

// Expose to window for console access
if (typeof window !== 'undefined') {
  window.featureFlags = {
    get: getFeatureFlags,
    set: setFeatureFlag,
    enable: enableServerSideFiltering,
    disable: disableServerSideFiltering,
    reset: resetFeatureFlags,
  };

}

export default {
  getFeatureFlags,
  getFeatureFlag,
  setFeatureFlag,
  enableServerSideFiltering,
  disableServerSideFiltering,
  resetFeatureFlags,
};
