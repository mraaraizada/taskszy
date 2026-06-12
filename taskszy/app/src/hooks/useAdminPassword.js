import { useState, useRef, useEffect } from 'react';

// Singleton storage outside the hook to persist across all component instances
const authenticatedPages = {};

export function useAdminPassword() {
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [currentPage, setCurrentPage] = useState('');
  
  // Session timeout: 30 minutes per page
  const SESSION_TIMEOUT = 30 * 60 * 1000;
  
  // Listen for admin password changes and clear all authentications
  useEffect(() => {
    const handlePasswordChange = (event) => {
      // Clear all authenticated pages when password changes
      Object.keys(authenticatedPages).forEach(key => delete authenticatedPages[key]);
    };
    
    window.addEventListener('adminPasswordChanged', handlePasswordChange);
    return () => window.removeEventListener('adminPasswordChanged', handlePasswordChange);
  }, []);
  
  // Track current page based on URL changes
  useEffect(() => {
    const updateCurrentPage = () => {
      const pageName = window.location.pathname + window.location.hash;
      setCurrentPage(pageName);
    };
    
    updateCurrentPage();
    
    // Listen for hash changes
    window.addEventListener('hashchange', updateCurrentPage);
    return () => window.removeEventListener('hashchange', updateCurrentPage);
  }, []);

  const requestAdminPassword = (actionName, callback, pageIdentifier = null) => {
    // Get current page identifier (allow override for specific cases)
    const pageName = pageIdentifier || window.location.pathname + window.location.hash;
    
    // Check if this page is already authenticated and not expired
    const authTime = authenticatedPages[pageName];
    const now = Date.now();
    
    if (authTime && (now - authTime) < SESSION_TIMEOUT) {
      // Page is already authenticated and session not expired - execute directly
      if (callback) callback();
      return;
    }
    
    // Not authenticated or session expired - show password modal
    setPendingAction({ actionName, callback, pageIdentifier: pageName });
    setShowPasswordModal(true);
  };

  const handlePasswordConfirm = () => {
    if (pendingAction?.callback) {
      pendingAction.callback();
    }
    
    // Mark current page as authenticated in singleton storage
    if (pendingAction?.pageIdentifier) {
      authenticatedPages[pendingAction.pageIdentifier] = Date.now();
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
    const pageName = pageIdentifier || currentPage;
    if (pageName && authenticatedPages[pageName]) {
      delete authenticatedPages[pageName];
    }
  };
  
  // Manual method to clear all page authentications (optional)
  const clearAllAuth = () => {
    Object.keys(authenticatedPages).forEach(key => delete authenticatedPages[key]);
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
