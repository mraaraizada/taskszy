/**
 * Listener Throttler for Project Dashboard
 * Reduces listener callback frequency to improve performance
 */

/**
 * Throttle a Firestore listener callback
 * @param {Function} callback - Listener callback function
 * @param {number} delay - Throttle delay in milliseconds (default: 1000ms)
 * @returns {Function} - Throttled callback
 */
export function throttleListener(callback, delay = 1000) {
  let lastCall = 0;
  let timeoutId = null;
  let pendingArgs = null;
  
  return function throttled(...args) {
    const now = Date.now();
    const timeSinceLastCall = now - lastCall;
    
    // Clear any pending timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    
    // If enough time has passed, call immediately
    if (timeSinceLastCall >= delay) {
      lastCall = now;
      callback.apply(this, args);
    } else {
      // Otherwise, schedule a call
      pendingArgs = args;
      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        callback.apply(this, pendingArgs);
        timeoutId = null;
        pendingArgs = null;
      }, delay - timeSinceLastCall);
    }
  };
}

/**
 * Debounce a function (wait for calls to stop before executing)
 * @param {Function} func - Function to debounce
 * @param {number} delay - Debounce delay in milliseconds
 * @returns {Function} - Debounced function
 */
export function debounce(func, delay = 300) {
  let timeoutId = null;
  
  return function debounced(...args) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      func.apply(this, args);
      timeoutId = null;
    }, delay);
  };
}

/**
 * Registry to prevent duplicate listeners
 */
class ListenerRegistry {
  constructor() {
    this.listeners = new Map();
  }
  
  has(key) {
    return this.listeners.has(key);
  }
  
  register(key, unsubscribe) {
    if (this.listeners.has(key)) {
      console.warn(`⚠️ Listener ${key} already registered`);
      return false;
    }
    this.listeners.set(key, unsubscribe);
    console.log(`✅ Registered listener: ${key}`);
    return true;
  }
  
  unregister(key) {
    const unsubscribe = this.listeners.get(key);
    if (unsubscribe) {
      unsubscribe();
      this.listeners.delete(key);
      console.log(`✅ Unregistered listener: ${key}`);
      return true;
    }
    return false;
  }
  
  clear() {
    this.listeners.forEach((unsubscribe, key) => {
      unsubscribe();
      console.log(`✅ Cleared listener: ${key}`);
    });
    this.listeners.clear();
  }
  
  size() {
    return this.listeners.size;
  }
}

export const listenerRegistry = new ListenerRegistry();
