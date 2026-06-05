import { useEffect, useState } from 'react';
import { getAuth, applyActionCode, verifyPasswordResetCode, confirmPasswordReset } from 'firebase/auth';
import { CheckCircle, AlertCircle, Lock, Eye, EyeOff } from 'lucide-react';

export default function AuthActionPage() {
  const [mode, setMode] = useState(null);
  const [actionCode, setActionCode] = useState(null);
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    // Get URL parameters without React Router
    const urlParams = new URLSearchParams(window.location.search);
    const modeParam = urlParams.get('mode');
    const codeParam = urlParams.get('oobCode');

    if (!modeParam || !codeParam) {
      setStatus('error');
      setMessage('Invalid or missing parameters in the link.');
      return;
    }

    setMode(modeParam);
    setActionCode(codeParam);

    // Handle different modes
    if (modeParam === 'verifyEmail') {
      handleVerifyEmail(codeParam);
    } else if (modeParam === 'resetPassword') {
      handleResetPasswordInit(codeParam);
    } else if (modeParam === 'recoverEmail') {
      handleRecoverEmail(codeParam);
    } else {
      setStatus('error');
      setMessage('The selected page mode is invalid.');
    }
  }, []);

  const handleVerifyEmail = async (code) => {
    const auth = getAuth();
    try {
      await applyActionCode(auth, code);
      setStatus('success');
      setMessage('Your email has been verified. You can now sign in with your new account.');
      setTimeout(() => window.location.href = '/', 3000);
    } catch (error) {

      setStatus('error');
      setMessage(getErrorMessage(error.code));
    }
  };

  const handleResetPasswordInit = async (code) => {
    const auth = getAuth();
    try {
      const userEmail = await verifyPasswordResetCode(auth, code);
      setEmail(userEmail);
      setStatus('reset-form');
      setMessage('Enter your new password below.');
    } catch (error) {

      setStatus('error');
      setMessage(getErrorMessage(error.code));
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setMessage('Password must be at least 6 characters long.');
      return;
    }

    const auth = getAuth();
    try {
      setStatus('loading');
      await confirmPasswordReset(auth, actionCode, newPassword);
      setStatus('success');
      setMessage('Your password has been reset successfully! Redirecting to login...');
      setTimeout(() => window.location.href = '/', 3000);
    } catch (error) {

      setStatus('error');
      setMessage(getErrorMessage(error.code));
    }
  };

  const handleRecoverEmail = async (code) => {
    const auth = getAuth();
    try {
      await applyActionCode(auth, code);
      setStatus('success');
      setMessage('Your email has been recovered successfully!');
      setTimeout(() => window.location.href = '/', 3000);
    } catch (error) {

      setStatus('error');
      setMessage(getErrorMessage(error.code));
    }
  };

  const getErrorMessage = (errorCode) => {
    switch (errorCode) {
      case 'auth/expired-action-code':
        return 'This link has expired. Please request a new one.';
      case 'auth/invalid-action-code':
        return 'This link is invalid or has already been used.';
      case 'auth/user-disabled':
        return 'This user account has been disabled.';
      case 'auth/user-not-found':
        return 'No user found with this email address.';
      case 'auth/weak-password':
        return 'Password is too weak. Please use a stronger password.';
      default:
        return 'An error occurred. Please try again or contact support.';
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated background elements */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        right: '-5%',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: 'rgba(255, 255, 255, 0.1)',
        filter: 'blur(60px)',
        animation: 'float 6s ease-in-out infinite'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-10%',
        left: '-5%',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: 'rgba(255, 255, 255, 0.1)',
        filter: 'blur(60px)',
        animation: 'float 8s ease-in-out infinite reverse'
      }} />

      <div style={{
        background: '#fff',
        borderRadius: '24px',
        padding: '48px',
        maxWidth: '480px',
        width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1)',
        textAlign: 'center',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Logo */}
        <div style={{
          width: '96px',
          height: '96px',
          margin: '0 auto 28px',
          borderRadius: '24px',
          background: 'linear-gradient(135deg, #3B5BFC, #2142D9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 12px 32px rgba(59,91,252,0.4)',
          position: 'relative'
        }}>
          <div style={{
            position: 'absolute',
            inset: '-4px',
            borderRadius: '26px',
            background: 'linear-gradient(135deg, rgba(59,91,252,0.2), rgba(33,66,217,0.2))',
            filter: 'blur(8px)',
            zIndex: -1
          }} />
          <img 
            src="/logo.png" 
            alt="TasksZy" 
            style={{ width: '70px', height: '70px', objectFit: 'contain' }}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.parentElement.innerHTML += '<span style="font-size: 40px; font-weight: 800; color: #fff; letter-spacing: -2px;">T</span>';
            }}
          />
        </div>

        <h1 style={{
          fontSize: '28px',
          fontWeight: '800',
          color: '#1A1D2E',
          marginBottom: '8px',
          letterSpacing: '-0.5px'
        }}>
          TasksZy
        </h1>
        <p style={{
          fontSize: '14px',
          color: '#6B7280',
          marginBottom: '32px',
          fontWeight: '500'
        }}>
          Organize Better, Scale Faster
        </p>

        {/* Loading State */}
        {status === 'loading' && (
          <div style={{ padding: '20px 0' }}>
            <div style={{
              width: '56px',
              height: '56px',
              margin: '32px auto',
              border: '5px solid #EEF2FF',
              borderTopColor: '#3B5BFC',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite'
            }} />
            <p style={{ fontSize: '18px', fontWeight: '600', color: '#1A1D2E', marginBottom: '8px' }}>
              Processing...
            </p>
            <p style={{ fontSize: '14px', color: '#9CA3AF' }}>
              Please wait a moment
            </p>
          </div>
        )}

        {/* Success State */}
        {status === 'success' && (
          <div style={{ padding: '20px 0' }}>
            <div style={{
              width: '80px',
              height: '80px',
              margin: '32px auto',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #ECFDF5, #D1FAE5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(18,196,121,0.2)',
              animation: 'scaleIn 0.5s ease-out'
            }}>
              <CheckCircle size={40} color="#12C479" strokeWidth={2.5} />
            </div>
            <p style={{ fontSize: '24px', fontWeight: '800', color: '#1A1D2E', marginBottom: '12px', letterSpacing: '-0.5px' }}>
              Success!
            </p>
            <p style={{ fontSize: '15px', color: '#6B7280', lineHeight: '1.6', maxWidth: '360px', margin: '0 auto' }}>
              {message}
            </p>
          </div>
        )}

        {/* Error State */}
        {status === 'error' && (
          <div style={{ padding: '20px 0' }}>
            <div style={{
              width: '80px',
              height: '80px',
              margin: '32px auto',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #FEF2F2, #FEE2E2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(239,68,68,0.2)',
              animation: 'scaleIn 0.5s ease-out'
            }}>
              <AlertCircle size={40} color="#EF4444" strokeWidth={2.5} />
            </div>
            <p style={{ fontSize: '24px', fontWeight: '800', color: '#1A1D2E', marginBottom: '12px', letterSpacing: '-0.5px' }}>
              Error
            </p>
            <p style={{ fontSize: '15px', color: '#6B7280', marginBottom: '32px', lineHeight: '1.6', maxWidth: '360px', margin: '0 auto 32px' }}>
              {message}
            </p>
            <button
              onClick={() => window.location.href = '/'}
              style={{
                padding: '14px 32px',
                background: 'linear-gradient(135deg, #3B5BFC, #2142D9)',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(59,91,252,0.3)',
                transition: 'all 0.2s',
                letterSpacing: '-0.2px'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px rgba(59,91,252,0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 16px rgba(59,91,252,0.3)';
              }}
            >
              Go to Login
            </button>
          </div>
        )}

        {/* Password Reset Form */}
        {status === 'reset-form' && (
          <form onSubmit={handleResetPasswordSubmit}>
            <div style={{
              width: '80px',
              height: '80px',
              margin: '32px auto',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #EEF2FF, #E0E7FF)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(59,91,252,0.2)',
              animation: 'scaleIn 0.5s ease-out'
            }}>
              <Lock size={40} color="#3B5BFC" strokeWidth={2.5} />
            </div>
            <p style={{ fontSize: '24px', fontWeight: '800', color: '#1A1D2E', marginBottom: '8px', letterSpacing: '-0.5px' }}>
              Reset Password
            </p>
            <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '32px', fontWeight: '500' }}>
              {email}
            </p>

            <div style={{ marginBottom: '16px', textAlign: 'left' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>
                New Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                  minLength={6}
                  style={{
                    width: '100%',
                    padding: '12px 40px 12px 16px',
                    border: '1.5px solid #E8EAEF',
                    borderRadius: '10px',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3B5BFC'}
                  onBlur={(e) => e.target.style.borderColor = '#E8EAEF'}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {showNewPassword ? <EyeOff size={18} color="#6B7280" /> : <Eye size={18} color="#6B7280" />}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '24px', textAlign: 'left' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>
                Confirm Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                  minLength={6}
                  style={{
                    width: '100%',
                    padding: '12px 40px 12px 16px',
                    border: '1.5px solid #E8EAEF',
                    borderRadius: '10px',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3B5BFC'}
                  onBlur={(e) => e.target.style.borderColor = '#E8EAEF'}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {showConfirmPassword ? <EyeOff size={18} color="#6B7280" /> : <Eye size={18} color="#6B7280" />}
                </button>
              </div>
            </div>

            {message && (
              <p style={{ fontSize: '13px', color: '#EF4444', marginBottom: '16px' }}>{message}</p>
            )}

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '14px 24px',
                background: 'linear-gradient(135deg, #3B5BFC, #2142D9)',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(59,91,252,0.3)',
                transition: 'all 0.2s',
                letterSpacing: '-0.2px'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px rgba(59,91,252,0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 16px rgba(59,91,252,0.3)';
              }}
            >
              Reset Password
            </button>
          </form>
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes scaleIn {
          from { 
            transform: scale(0.8);
            opacity: 0;
          }
          to { 
            transform: scale(1);
            opacity: 1;
          }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
      `}</style>
    </div>
  );
}
