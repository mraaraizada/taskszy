import { useState, useRef } from 'react';

export function useAdminPassword() {
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  
  // Track authenticated pages - key is page identifier, value is timestamp
  const authenticatedPagesRef = useRef({});
  const currentPageRef = useRef(null);
  
  // Session timeout: 30 minutes per page
  const SESSION_TIMEOUT = 30 * 60 * 1000;

  const requestAdminPassword = (actionName, callback, pageIdentifier = null) => {
    // Determine current page identifier
    const pageName = pageIdentifier || window.location.pathname + window.location.hash;
    currentPageRef.current = pageName;
    
    // Check if this page is already authenticated and not expired
    const authTime = authenticatedPagesRef.current[pageName];
    const now = Date.now();
    
    if (authTime && (now - authTime) < SESSION_TIMEOUT) {
      // Page is already authenticated and session not expired - execute directly
      console.log('[useAdminPassword] Page already authenticated:', pageName);
      if (callback) callback();
      return;
    }
    
    // Not authenticated or session expired - show password modal
    console.log('[useAdminPassword] Requesting password for page:', pageName);
    setPendingAction({ actionName, callback, pageIdentifier: pageName });
    setShowPasswordModal(true);
  };

  const handlePasswordConfirm = () => {
    if (pendingAction?.callback) {
      pendingAction.callback();
    }
    
    // Mark current page as authenticated
    if (pendingAction?.pageIdentifier) {
      authenticatedPagesRef.current[pendingAction.pageIdentifier] = Date.now();
      console.log('[useAdminPassword] Page authenticated:', pendingAction.pageIdentifier);
    }
    
    setPendingAction(null);
    setShowPasswordModal(false);
  };

  const handlePasswordCancel = () => {
    setPendingAction(null);
    setShowPasswordModal(false);
  };
  
  // Manual method to clear authentication for a specific page (optional)
  const clearPageAuth = (pageIdentifier = null) => {
    const pageName = pageIdentifier || currentPageRef.current;
    if (pageName && authenticatedPagesRef.current[pageName]) {
      delete authenticatedPagesRef.current[pageName];
      console.log('[useAdminPassword] Cleared authentication for page:', pageName);
    }
  };
  
  // Manual method to clear all page authentications (optional)
  const clearAllAuth = () => {
    authenticatedPagesRef.current = {};
    console.log('[useAdminPassword] Cleared all page authentications');
  };

  return {
    showPasswordModal,
    pendingAction,
    requestAdminPassword,
    handlePasswordConfirm,
    handlePasswordCancel,
    clearPageAuth,
    clearAllAuth,
  };
}
