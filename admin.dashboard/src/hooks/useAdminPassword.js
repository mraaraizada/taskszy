import { useState } from 'react';

export function useAdminPassword() {
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  const requestAdminPassword = (actionName, callback) => {
    setPendingAction({ actionName, callback });
    setShowPasswordModal(true);
  };

  const handlePasswordConfirm = () => {
    if (pendingAction?.callback) {
      pendingAction.callback();
    }
    setPendingAction(null);
    setShowPasswordModal(false);
  };

  const handlePasswordCancel = () => {
    setPendingAction(null);
    setShowPasswordModal(false);
  };

  return {
    showPasswordModal,
    pendingAction,
    requestAdminPassword,
    handlePasswordConfirm,
    handlePasswordCancel,
  };
}
