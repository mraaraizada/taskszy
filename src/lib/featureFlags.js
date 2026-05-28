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
    console.error('Failed to load feature flags:', error);
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
    console.log(`✅ Feature flag "${flagName}" set to:`, value);
    return true;
  } catch (error) {
    console.error('Failed to set feature flag:', error);
    return false;
  }
}

/**
 * Enable server-side filtering (after migration)
 */
export function enableServerSideFiltering() {
  setFeatureFlag('serverSideTaskFiltering', true);
  setFeatureFlag('serverSideActivityFiltering', true);
  console.log('✅ Server-side filtering enabled!');
  console.log('🔄 Please refresh the page for changes to take effect.');
}

/**
 * Disable server-side filtering (rollback)
 */
export function disableServerSideFiltering() {
  setFeatureFlag('serverSideTaskFiltering', false);
  setFeatureFlag('serverSideActivityFiltering', false);
  console.log('⚠️ Server-side filtering disabled!');
  console.log('🔄 Please refresh the page for changes to take effect.');
}

/**
 * Reset all feature flags to defaults
 */
export function resetFeatureFlags() {
  localStorage.removeItem(FEATURE_FLAGS_KEY);
  console.log('✅ Feature flags reset to defaults');
  console.log('🔄 Please refresh the page for changes to take effect.');
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
  
  console.log('✅ Feature flags loaded. Available commands:');
  console.log('  - window.featureFlags.get()');
  console.log('  - window.featureFlags.set("flagName", true/false)');
  console.log('  - window.featureFlags.enable()  // Enable server-side filtering');
  console.log('  - window.featureFlags.disable() // Disable server-side filtering');
  console.log('  - window.featureFlags.reset()');
}

export default {
  getFeatureFlags,
  getFeatureFlag,
  setFeatureFlag,
  enableServerSideFiltering,
  disableServerSideFiltering,
  resetFeatureFlags,
};
