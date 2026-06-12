import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Eye, EyeOff, CheckCircle, AlertCircle, Lock } from 'lucide-react';
import { useApp } from '../context/AppContext';
import PlanSelection from '../components/PlanSelection';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import { useLottie } from 'lottie-react';
import { Turnstile } from '@marsidev/react-turnstile';
import { signIn, signUp, sendPasswordReset, sendVerificationEmail, mapAuthError, mapPasswordResetError, signInWithGoogle, signOutUser } from '../lib/authService';
import { getProfile, createAdminProfile, stampLogin } from '../lib/userProfileService';
import { db } from '../lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { getCarouselImages, DEFAULT_CAROUSEL_IMAGES } from '../lib/carouselService';
import { getAuth, applyActionCode, verifyPasswordResetCode, confirmPasswordReset } from 'firebase/auth';

// Fallback hardcoded images (high quality URLs from service)
const FALLBACK_IMAGES = DEFAULT_CAROUSEL_IMAGES;

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.707A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.961L3.964 6.293C4.672 4.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877F2">
      <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073c0 6.027 4.389 11.022 10.125 11.927v-8.434H7.078v-3.493h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.493h-2.796v8.434C19.612 23.095 24 18.1 24 12.073z"/>
    </svg>
  );
}

function TwitterIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="#1DA1F2">
      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="#0A66C2">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="url(#ig-gradient)">
      <defs>
        <linearGradient id="ig-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#f09433"/>
          <stop offset="25%" stopColor="#e6683c"/>
          <stop offset="50%" stopColor="#dc2743"/>
          <stop offset="75%" stopColor="#cc2366"/>
          <stop offset="100%" stopColor="#bc1888"/>
        </linearGradient>
      </defs>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
    </svg>
  );
}

const slideAnimStyle = `
@keyframes slideContentIn {
  from { opacity: 1; transform: translateY(0); }
  to   { opacity: 1; transform: translateY(0); }
}
.slide-content-anim {}
@keyframes formSlideIn {
  from { opacity: 1; transform: scale(1); }
  to   { opacity: 1; transform: scale(1); }
}
@keyframes formSlideInLeft {
  from { opacity: 1; transform: scale(1); }
  to   { opacity: 1; transform: scale(1); }
}
.form-enter {}
.form-enter-left {}
`;

// Dynamically import heavy lottie JSONs so they don't bloat the initial bundle
function useEmailSentAnimation() {
  const [data, setData] = useState(null);
  useEffect(() => { import('../lottie/Email Sent by Todd Rocheford.json').then(m => setData(m.default)); }, []);
  return data;
}
function useLoginAnimation() {
  const [data, setData] = useState(null);
  useEffect(() => { import('../lottie/Login.json').then(m => setData(m.default)); }, []);
  return data;
}

function EmailSentLottie() {
  const animationData = useEmailSentAnimation();
  const { View, animationItem } = useLottie({
    animationData: animationData ?? null,
    loop: false,
    autoplay: !!animationData,
  });

  useEffect(() => {
    if (!animationItem || !animationData) return;

    let phase = 1; // phase 1: play 0→124, phase 2: play 0→2 then stop

    const onEnterFrame = () => {
      try {
        if (phase === 1 && animationItem.currentFrame >= 124) {
          phase = 2;
          animationItem.goToAndPlay(0, true);
        } else if (phase === 2 && animationItem.currentFrame >= 30) {
          animationItem.goToAndStop(30, true);
        }
      } catch {}
    };

    animationItem.addEventListener('enterFrame', onEnterFrame);
    return () => {
      try { animationItem.removeEventListener('enterFrame', onEnterFrame); } catch {}
    };
  }, [animationItem, animationData]);

  if (!animationData) return <div style={{ width: 120, height: 120 }} />;
  return <div style={{ width: 120, height: 120, pointerEvents: 'none' }}>{View}</div>;
}

function LoginLottie() {
  const animationData = useLoginAnimation();
  const { View } = useLottie({
    animationData: animationData ?? null,
    loop: true,
    autoplay: !!animationData,
    style: { width: '100%', height: '100%', objectFit: 'contain' },
  });
  if (!animationData) return <div style={{ width: '100%', height: '100%' }} />;
  return View;
}

export default function LoginPage({ onLogin, sessionExpired = false, onClearExpired, checkPlanOnMount = false }) {
  const { setCurrentPlan, setPlanExpiryDate } = useApp();
  const [slideIndex, setSlideIndex] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [emailFocus, setEmailFocus] = useState(false);
  const [passFocus, setPassFocus] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPlanSelection, setShowPlanSelection] = useState(false);
  const [authenticatedUser, setAuthenticatedUser] = useState(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [carouselApi, setCarouselApi] = useState(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [confirmPasswordSignUp, setConfirmPasswordSignUp] = useState('');
  const [showConfirmPassSignUp, setShowConfirmPassSignUp] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [formDir, setFormDir] = useState('right'); // 'right' or 'left'
  
  // Cloudflare Turnstile state
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileError, setTurnstileError] = useState(false);
  
  // Carousel images state - starts with fallback, then loads from cache/Firebase
  const [carouselImages, setCarouselImages] = useState(FALLBACK_IMAGES);

  // Auth action states (password reset, email verification)
  const [authActionMode, setAuthActionMode] = useState(null); // 'resetPassword', 'verifyEmail', 'recoverEmail'
  const [authActionCode, setAuthActionCode] = useState(null);
  const [authActionStatus, setAuthActionStatus] = useState(null); // 'loading', 'success', 'error', 'reset-form'
  const [authActionMessage, setAuthActionMessage] = useState('');
  const [authActionEmail, setAuthActionEmail] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [showResetNewPassword, setShowResetNewPassword] = useState(false);
  const [showResetConfirmPassword, setShowResetConfirmPassword] = useState(false);

  // Check if current authenticated user needs to complete plan selection
  useEffect(() => {
    // Only run this check if explicitly requested via prop OR if user is already authenticated
    if (!checkPlanOnMount) return;
    
    let unsubscribe = () => {};
    
    const checkUserPlan = async () => {
      try {
        // Import Firebase auth dynamically
        const { getAuth, onAuthStateChanged: onAuthChanged } = await import('firebase/auth');
        const auth = getAuth();
        
        // Use onAuthStateChanged to wait for auth to be ready
        unsubscribe = onAuthChanged(auth, async (currentUser) => {
          // Only check if user is authenticated and we're not already showing plan selection
          if (currentUser && !showPlanSelection) {
            try {
              const profile = await getProfile(currentUser.uid);
              
              // Only check for admin users
              if (profile && profile.role === 'admin' && profile.workspaceId) {
                const workspaceSnap = await getDoc(doc(db, 'workspaces', profile.workspaceId));
                
                if (workspaceSnap.exists()) {
                  const wsData = workspaceSnap.data();
                  const hasPlan = wsData?.plan?.id != null;
                  
                  // If no plan, show plan selection
                  if (!hasPlan) {
                    const completedSetup = wsData?.settings?.hasCompletedSetup === true;
                    setEmail(currentUser.email || ''); // Set email state for PlanSelection component
                    setAuthenticatedUser({ 
                      email: currentUser.email, 
                      role: 'admin', 
                      memberId: null, 
                      workspaceId: profile.workspaceId,
                      completedSetup: completedSetup,
                      isNewSignup: false 
                    });
                    setShowPlanSelection(true);
                    
                    // Unsubscribe immediately after detecting and setting state
                    unsubscribe();
                  }
                } else {
                  // Workspace doesn't exist - new signup, show plan selection
                  setEmail(currentUser.email || ''); // Set email state for PlanSelection component
                  setAuthenticatedUser({ 
                    email: currentUser.email, 
                    role: 'admin', 
                    memberId: null, 
                    workspaceId: profile.workspaceId,
                    completedSetup: false,
                    isNewSignup: false 
                  });
                  setShowPlanSelection(true);
                  
                  // Unsubscribe immediately after detecting and setting state
                  unsubscribe();
                }
              }
            } catch (err) {
            }
          }
        });
      } catch (err) {
      }
    };
    
    checkUserPlan();
    
    // Cleanup subscription on unmount
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [checkPlanOnMount]); // Re-run when prop changes

  // Check for auth action URL parameters on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');
    const oobCode = urlParams.get('oobCode');

    if (mode && oobCode) {
      setAuthActionMode(mode);
      setAuthActionCode(oobCode);
      setAuthActionStatus('loading');

      // Handle different auth actions
      if (mode === 'verifyEmail') {
        handleVerifyEmail(oobCode);
      } else if (mode === 'resetPassword') {
        handleResetPasswordInit(oobCode);
      } else if (mode === 'recoverEmail') {
        handleRecoverEmail(oobCode);
      } else {
        setAuthActionStatus('error');
        setAuthActionMessage('The selected page mode is invalid.');
      }
    }
  }, []);

  const handleVerifyEmail = async (code) => {
    const auth = getAuth();
    try {
      await applyActionCode(auth, code);
      setAuthActionStatus('success');
      setAuthActionMessage('Your email has been verified. You can now sign in with your new account.');
      setTimeout(() => {
        window.history.replaceState({}, '', window.location.pathname);
        setAuthActionMode(null);
      }, 3000);
    } catch (error) {

      setAuthActionStatus('error');
      setAuthActionMessage(getAuthActionErrorMessage(error.code));
    }
  };

  const handleResetPasswordInit = async (code) => {
    const auth = getAuth();
    try {
      const userEmail = await verifyPasswordResetCode(auth, code);
      setAuthActionEmail(userEmail);
      setAuthActionStatus('reset-form');
      setAuthActionMessage('Enter your new password below.');
    } catch (error) {

      setAuthActionStatus('error');
      setAuthActionMessage(getAuthActionErrorMessage(error.code));
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();

    if (resetNewPassword !== resetConfirmPassword) {
      setAuthActionMessage('Passwords do not match.');
      return;
    }

    if (resetNewPassword.length < 6) {
      setAuthActionMessage('Password must be at least 6 characters long.');
      return;
    }

    const auth = getAuth();
    try {
      setAuthActionStatus('loading');
      await confirmPasswordReset(auth, authActionCode, resetNewPassword);
      setAuthActionStatus('success');
      setAuthActionMessage('Your password has been reset successfully! You can now sign in.');
      setTimeout(() => {
        window.history.replaceState({}, '', window.location.pathname);
        setAuthActionMode(null);
        setEmail(authActionEmail);
      }, 3000);
    } catch (error) {

      setAuthActionStatus('error');
      setAuthActionMessage(getAuthActionErrorMessage(error.code));
    }
  };

  const handleRecoverEmail = async (code) => {
    const auth = getAuth();
    try {
      await applyActionCode(auth, code);
      setAuthActionStatus('success');
      setAuthActionMessage('Your email has been recovered successfully!');
      setTimeout(() => {
        window.history.replaceState({}, '', window.location.pathname);
        setAuthActionMode(null);
      }, 3000);
    } catch (error) {

      setAuthActionStatus('error');
      setAuthActionMessage(getAuthActionErrorMessage(error.code));
    }
  };

  const getAuthActionErrorMessage = (errorCode) => {
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

  // Load carousel images on mount
  useEffect(() => {

    const initialImages = getCarouselImages((updatedImages) => {

      setCarouselImages(updatedImages);
    });
    
    // If we got different images immediately (from cache), use them
    if (JSON.stringify(initialImages) !== JSON.stringify(FALLBACK_IMAGES)) {
      setCarouselImages(initialImages);
    }
  }, []);

  // Check for deactivation reason in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reason = params.get('reason');
    
    if (reason === 'deactivated') {
      setError('Your account has been deactivated.');
    }
    // No message for 'another-device' - silent logout
    
    // Clear the URL parameter
    if (reason) {
      window.history.replaceState({}, '', '/app/');
    }
  }, []);

  const switchForm = (dir = 'right') => {
    setFormDir(dir);
    setFormKey(k => k + 1);
  };

  // Convert carousel images to slides format
  const portfolioSlides = carouselImages.map(img => ({ imageUrl: img }));
  const slide = portfolioSlides[slideIndex];

  // Update slideIndex when carousel changes
  useEffect(() => {
    if (!carouselApi) return;

    carouselApi.on('select', () => {
      setSlideIndex(carouselApi.selectedScrollSnap());
    });
  }, [carouselApi]);

  // Auto-play functionality
  useEffect(() => {
    if (!carouselApi) return;

    const autoplay = setInterval(() => {
      carouselApi.scrollNext();
    }, 3500);

    return () => clearInterval(autoplay);
  }, [carouselApi]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    // Verify Turnstile token
    if (!turnstileToken) {
      setError('Please complete the security verification.');
      setTurnstileError(true);
      return;
    }

    // Sign-up flow
    if (isSignUp) {
      if (password !== confirmPasswordSignUp) {
        setError('Passwords do not match.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
      setLoading(true);
      let authUser = null;
      try {
        const credential = await signUp(email, password);
        authUser = credential.user;
      } catch (err) {
        setLoading(false);
        setError(mapAuthError(err.code));
        return;
      }
      // Auth account created — now create Firestore profile
      try {
        await createAdminProfile(authUser.uid, { email: authUser.email });
      } catch (err) {
        // Profile creation failed - this is critical for plan selection

        setLoading(false);
        setError('Failed to create user profile. Please try again or contact support.');
        // Sign out the user since profile creation failed
        try {
          await signOutUser();
        } catch (signOutErr) {

        }
        return;
      }
      // Welcome email sent automatically by Firebase Function on user creation
      setLoading(false);
      setError('');
      setAuthenticatedUser({ email: authUser.email, role: 'admin', memberId: null, workspaceId: `ws_${authUser.uid}`, isNewSignup: true });
      setShowPlanSelection(true);
      return;
    }

    // Basic validation
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const credential = await signIn(email, password);
      const user = credential.user;
      
      // CRITICAL: Set auth state to 'authenticating' IMMEDIATELY to block onAuthStateChanged
      if (window.kiroAuthState) {
        window.kiroAuthState.current = 'authenticating';
      }
      if (window.kiroLoginHandled) {
        window.kiroLoginHandled.current = true;
      }
      if (window.kiroLastLoginAttempt) {
        window.kiroLastLoginAttempt.current = Date.now();
      }
      
      // Fetch profile AFTER setting the state
      const profile = await getProfile(user.uid);
      
      setLoading(false);
      if (!profile) {
        setError('Account setup incomplete. Please contact your administrator.');
        // Reset auth state on error
        if (window.kiroAuthState) window.kiroAuthState.current = 'idle';
        return;
      }
      
      // Stamp loginTime + lastActivityTime on every sign-in
      stampLogin(user.uid).catch(() => {});
      
      // Check team member status for non-admin users
      // Skip this check if user is logging out or session expired
      if ((profile.role === 'management' || profile.role === 'member') && profile.workspaceId && profile.memberId && user) {
        try {
          const teamMemberSnap = await getDoc(doc(db, `workspaces/${profile.workspaceId}/team/${profile.memberId}`));
          if (teamMemberSnap.exists()) {
            const memberData = teamMemberSnap.data();
            if (memberData.status === 'Inactive') {
              setLoading(false);
              setError('Your account has been deactivated.');
              return;
            }
          }
        } catch (err) {

          // Continue login if check fails - don't block access
          // This can happen during logout or if permissions aren't ready yet
        }
      }
      
      // Check if user has completed workspace setup
      let completedSetup = profile.hasCompletedSetup === true; // Check user's own setup status
      let hasPlan = true; // Default assume plan exists

      // Load workspace data for admin and management users to check setup status
      if ((profile.role === 'admin' || profile.role === 'management') && profile.workspaceId) {
        try {
          const workspaceSnap = await getDoc(doc(db, 'workspaces', profile.workspaceId));
          if (workspaceSnap.exists()) {
            const wsData = workspaceSnap.data();
            
            // Check if plan is selected (for admin only)
            if (profile.role === 'admin') {
              hasPlan = wsData?.plan?.id != null;
            }
            
            // Check workspace setup status (for admin/management)
            const workspaceSetupComplete = wsData?.settings?.hasCompletedSetup === true;
            
            // For workspace owners, use workspace setup flag
            if (profile.workspaceId === `ws_${user.uid}`) {
              completedSetup = workspaceSetupComplete;

            }
            
            // Load workspace settings for WorkspaceSetup (if needed)
            if (wsData?.settings && wsData.settings.workspaceName) {
              const workspaceData = {
                workspaceName: wsData.settings.workspaceName || '',
                workspaceSub: wsData.settings.workspaceSub || '',
                workspaceLogo: wsData.settings.workspaceLogo || null,
              };

            }
          } else {
            // Workspace doesn't exist - needs plan and setup
            if (profile.role === 'admin') {
              hasPlan = false;
            }
            completedSetup = false;
          }
        } catch (err) {

          // If this is a session re-login, assume setup is complete to avoid blocking
          if (sessionExpired) {
            completedSetup = true;
          }
        }
      }
      
      // If admin without plan, show plan selection BEFORE proceeding to dashboard/workspace setup
      if (profile.role === 'admin' && !hasPlan) {
        setLoading(false);
        setAuthenticatedUser({ 
          email: user.email, 
          role: 'admin', 
          memberId: null, 
          workspaceId: profile.workspaceId,
          completedSetup: completedSetup,
          isNewSignup: false 
        });
        setShowPlanSelection(true);
        // Keep authState as 'authenticating' so onAuthStateChanged stays blocked
        return;
      }
      
      // Plan exists (or user is not admin) - proceed to workspace setup or dashboard
      // Call onLogin immediately - authState was already set right after signIn
      onLogin(profile.role, profile.memberId, user.email, profile.workspaceId || null, completedSetup, false);
    } catch (err) {
      setLoading(false);
      setError(mapAuthError(err.code));
      // Reset auth state on error
      if (window.kiroAuthState) window.kiroAuthState.current = 'idle';
      if (window.kiroLoginHandled) window.kiroLoginHandled.current = false;
    }
  };

  const handlePlanSelect = async (plan, billingCycle, couponInfo) => {
    const planData = { id: plan.id, name: plan.name, users: plan.users, color: plan.color, billingCycle };
    setCurrentPlan(planData);
    // Calculate expiry date
    const expiryDate = new Date();
    if (couponInfo && couponInfo.type === 'duration' && couponInfo.duration) {
      const { value, unit } = couponInfo.duration;
      if (unit === 'months') expiryDate.setMonth(expiryDate.getMonth() + value);
      else expiryDate.setDate(expiryDate.getDate() + value);
    } else if (plan.period === 'one-time') {
      expiryDate.setFullYear(expiryDate.getFullYear() + 99);
    } else if (billingCycle === 'yearly') {
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    } else {
      expiryDate.setMonth(expiryDate.getMonth() + 1);
    }
    const expiryStr = expiryDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    setPlanExpiryDate(expiryStr);

    // Write full plan schema to Firestore workspace doc
    const wsId = authenticatedUser?.workspaceId;
    
    if (wsId) {
      try {
        await setDoc(doc(db, `workspaces/${wsId}`), {
          plan: {
            id:              planData.id,
            name:            planData.name,
            billingCycle:    planData.billingCycle,
            users:           planData.users,
            color:           planData.color,
            expiryDate:      expiryStr,
            expiryTimestamp: expiryDate,
            isActive:        true,
            createdAt:       new Date(),
            updatedAt:       new Date(),
          },
        }, { merge: true });
        
        // ROBUST: Wait and verify plan was written before proceeding
        let planVerified = false;
        for (let attempt = 0; attempt < 5; attempt++) {
          await new Promise(resolve => setTimeout(resolve, 300 * (attempt + 1))); // Exponential backoff
          
          const workspaceDoc = await getDoc(doc(db, `workspaces/${wsId}`));
          if (workspaceDoc.exists() && workspaceDoc.data()?.plan?.id === planData.id) {
            planVerified = true;
            break;
          }
        }
      } catch (err) {
        // Don't block login on plan write error
      }
    }

    // Proceed to onLogin after plan is confirmed
    setTimeout(() => {
      onLogin(authenticatedUser.role, authenticatedUser.memberId, authenticatedUser.email, authenticatedUser.workspaceId || null, authenticatedUser.completedSetup ?? false, authenticatedUser.isNewSignup === true);
    }, 100);
  };

  const handleBackToLogin = () => {
    setShowPlanSelection(false);
    setAuthenticatedUser(null);
    setPassword('');
  };

  const handleForgotPassword = () => {
    setShowForgotPassword(true);
    setForgotEmail(email); // Pre-fill with email if entered
    setForgotError('');
    setForgotSuccess('');
    switchForm('right');
  };

  const handleBackToLoginForm = () => {
    setShowForgotPassword(false);
    setForgotEmail('');
    setForgotError('');
    setForgotSuccess('');
    switchForm('left');
  };

  const handleGoogleSignIn = async () => {
    setError('');
    
    // Verify Turnstile token for Google sign-in too
    if (!turnstileToken) {
      setError('Please complete the security verification.');
      setTurnstileError(true);
      return;
    }
    
    setLoading(true);
    try {
      const credential = await signInWithGoogle();
      const user = credential.user;
      
      // CRITICAL: Set auth state to 'authenticating' IMMEDIATELY to block onAuthStateChanged
      if (window.kiroAuthState) {
        window.kiroAuthState.current = 'authenticating';
      }
      if (window.kiroLoginHandled) {
        window.kiroLoginHandled.current = true;
      }
      if (window.kiroLastLoginAttempt) {
        window.kiroLastLoginAttempt.current = Date.now();
      }
      
      const profile = await getProfile(user.uid);

      if (isSignUp) {
        // Sign-up via Google — create admin profile if not exists
        if (!profile) {
          try {
            await createAdminProfile(user.uid, { email: user.email });
          } catch (err) {

            setLoading(false);
            setError('Failed to create user profile. Please try again or contact support.');
            // Sign out the user since profile creation failed
            try {
              await signOutUser();
            } catch (signOutErr) {

            }
            return;
          }
          setLoading(false);
          // New Google signup — go through plan selection
          setAuthenticatedUser({ email: user.email, role: 'admin', memberId: null, workspaceId: `ws_${user.uid}`, isNewSignup: true });
          setShowPlanSelection(true);
        } else {
          // Already has an account — sign in directly
          setLoading(false);
          stampLogin(user.uid).catch(() => {});
          
          // Check team member status for non-admin users
          // Skip this check if user is logging out or session expired
          if ((profile.role === 'management' || profile.role === 'member') && profile.workspaceId && profile.memberId && user) {
            try {
              const teamMemberSnap = await getDoc(doc(db, `workspaces/${profile.workspaceId}/team/${profile.memberId}`));
              if (teamMemberSnap.exists()) {
                const memberData = teamMemberSnap.data();
                if (memberData.status === 'Inactive') {
                  setLoading(false);
                  setError('Your account has been deactivated.');
                  return;
                }
              }
            } catch (err) {

              // Continue login if check fails - don't block access
              // This can happen during logout or if permissions aren't ready yet
            }
          }
          
          // Check if user has selected a plan and completed workspace setup
          let completedSetup = profile.hasCompletedSetup === true; // Check user's own setup status
          let hasPlan = true;
          
          if (profile.role === 'admin' && profile.workspaceId) {
            try {
              const workspaceSnap = await getDoc(doc(db, 'workspaces', profile.workspaceId));
              if (workspaceSnap.exists()) {
                const wsData = workspaceSnap.data();
                hasPlan = wsData?.plan?.id != null;
                // Also check workspace setup status
                completedSetup = wsData?.settings?.hasCompletedSetup === true;
              } else {
                hasPlan = false;
                completedSetup = false;
              }
            } catch {
              hasPlan = false;
              completedSetup = false;
            }
          }
          
          // If no plan selected, show plan selection panel (setup comes after)
          if (profile.role === 'admin' && !hasPlan) {
            setAuthenticatedUser({ 
              email: user.email, 
              role: 'admin', 
              memberId: null, 
              workspaceId: profile.workspaceId,
              completedSetup: completedSetup, // Pass this for later
              isNewSignup: false 
            });
            setShowPlanSelection(true);
            return;
          }
          
          // If has plan but setup not complete, proceed to App.jsx for WorkspaceSetup
          onLogin(profile.role, profile.memberId, user.email, profile.workspaceId || null, completedSetup, false);
        }
      } else {
        // Sign-in via Google — must have existing account
        setLoading(false);
        if (!profile) {
          setError('No account found for this Google email. Please sign up first.');
          return;
        }
        // Direct sign-in, no plan selection
        stampLogin(user.uid).catch(() => {});
        
        // Check team member status for non-admin users
        // Skip this check if user is logging out or session expired
        if ((profile.role === 'management' || profile.role === 'member') && profile.workspaceId && profile.memberId && user) {
          try {
            const teamMemberSnap = await getDoc(doc(db, `workspaces/${profile.workspaceId}/team/${profile.memberId}`));
            if (teamMemberSnap.exists()) {
              const memberData = teamMemberSnap.data();
              if (memberData.status === 'Inactive') {
                setLoading(false);
                setError('Your account has been deactivated.');
                return;
              }
            }
          } catch (err) {

            // Continue login if check fails - don't block access
            // This can happen during logout or if permissions aren't ready yet
          }
        }
        
        // Check if user has selected a plan and completed workspace setup
        let completedSetup = profile.hasCompletedSetup === true; // Check user's own setup status
        let hasPlan = true;
        
        if (profile.role === 'admin' && profile.workspaceId) {
          try {
            const workspaceSnap = await getDoc(doc(db, 'workspaces', profile.workspaceId));
            if (workspaceSnap.exists()) {
              const wsData = workspaceSnap.data();
              hasPlan = wsData?.plan?.id != null;
              // Also check workspace setup status
              completedSetup = wsData?.settings?.hasCompletedSetup === true;
            } else {
              hasPlan = false;
              completedSetup = false;
            }
          } catch {
            hasPlan = false;
            completedSetup = false;
          }
        }
        
        // If no plan selected, show plan selection panel (setup comes after)
        if (profile.role === 'admin' && !hasPlan) {
          setLoading(false);
          setAuthenticatedUser({ 
            email: user.email, 
            role: 'admin', 
            memberId: null, 
            workspaceId: profile.workspaceId,
            completedSetup: completedSetup, // Pass this for later
            isNewSignup: false 
          });
          setShowPlanSelection(true);
          return;
        }
        
        // If has plan but setup not complete, proceed to App.jsx for WorkspaceSetup
        onLogin(profile.role, profile.memberId, user.email, profile.workspaceId || null, completedSetup, false);
      }
    } catch (err) {
      setLoading(false);
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') return;
      const errorMessage = mapAuthError(err.code || 'unknown');
      if (errorMessage) {
        setError(errorMessage);
      }
    }
  };

  const handleSendPasswordReset = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');
    setLoading(true);
    try {
      await sendPasswordReset(forgotEmail);
      setForgotSuccess('Password reset email sent. Please check your inbox.');
    } catch (err) {
      setForgotError(mapPasswordResetError(err.code));
    } finally {
      setLoading(false);
    }
  };

  // Carousel autoplay — no unused variables needed

  return (
    <>
    <style>{slideAnimStyle}</style>
    <style>{`
      .login-panel-right {
        /* no transition */
      }
      .login-panel-right.slide-out {
        display: none;
      }
      .plan-selection-enter {
        animation: slideInFromRight 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards;
      }
      @keyframes slideInFromRight {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      @keyframes fadeSlideIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      @keyframes fadeSlideOut {
        from {
          opacity: 1;
          transform: translateY(0);
        }
        to {
          opacity: 0;
          transform: translateY(-10px);
        }
      }
      .form-view-enter {
        animation: fadeSlideIn 0.35s cubic-bezier(0.22, 1, 0.36, 1) forwards;
      }
      .form-view-exit {
        animation: fadeSlideOut 0.25s cubic-bezier(0.22, 1, 0.36, 1) forwards;
      }
    `}</style>
    
    {/* Responsive styles */}
    <style>{`
      @media (max-width: 1024px) {
        .login-panel-left {
          display: none !important;
        }
        .login-panel-right {
          width: 100% !important;
        }
      }
      
      @media (max-width: 768px) {
        .login-form-card {
          padding: 24px 20px !important;
          max-width: 100% !important;
        }
      }
    `}</style>
    
    <div
      className="flex login-enter"
      style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        fontFamily: "'Inter', sans-serif",
        background: '#fff',
      }}
    >
        {/* ─── LEFT: Visual Panel with Carousel ─── */}
        <div className="login-panel-left" style={{ width: '46%', height: '100%', flexShrink: 0 }}>
        <Carousel
          opts={{
            loop: true,
            watchDrag: false, // Disable drag/swipe interaction
            watchSlides: false, // Disable slide watching for better performance
          }}
          setApi={setCarouselApi}
          className="h-full"
          style={{ pointerEvents: 'none' }} // Disable all pointer interactions
        >
          <CarouselContent className="h-full -ml-0">
            {portfolioSlides.map((slideData, index) => (
              <CarouselItem key={index} className="h-full pl-0">
                <div
                  style={{
                    height: '100vh',
                    width: '100%',
                    backgroundImage: `url(${slideData.imageUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                  }}
                />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
        </div>

        {/* ─── RIGHT: Login Form or Plan Selection ─── */}
        <div
          className="login-panel-right flex flex-col justify-center flex-1"
          style={{
            padding: showPlanSelection ? 0 : '32px 56px',
            height: '100%',
            overflowY: 'hidden',
            position: 'relative',
          }}
        >
          {/* Background video */}
          <video
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260319_015952_e1deeb12-8fb7-4071-a42a-60779fc64ab6.mp4"
            autoPlay
            muted
            loop
            playsInline
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              zIndex: 0,
            }}
          />
          {/* Overlay to keep form readable */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(240,242,248,0.55)',
            zIndex: 1,
            pointerEvents: 'none',
          }} />
          
          {!showPlanSelection ? (
            <>
          {/* Form section — centered */}
          <div key={formKey} className={`login-form-card ${formDir === 'right' ? 'form-enter' : 'form-enter-left'}`} style={{
            maxWidth: 520, width: '100%', margin: '0 auto',
            background: '#fff', borderRadius: 24,
            position: 'relative', zIndex: 2,
            padding: '28px 40px 24px',
            boxShadow: '0 4px 32px rgba(59,91,252,0.08), 0 1px 4px rgba(0,0,0,0.04)',
            border: '1px solid rgba(255,255,255,0.9)',
          }}
        >
          {/* Auth Action UI (Password Reset, Email Verification) */}
          {authActionMode ? (
            <>
              {/* Loading State */}
              {authActionStatus === 'loading' && (
                <div style={{ padding: '20px 0', textAlign: 'center' }}>
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
              {authActionStatus === 'success' && (
                <div style={{ padding: '20px 0', textAlign: 'center' }}>
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
                    {authActionMessage}
                  </p>
                </div>
              )}

              {/* Error State */}
              {authActionStatus === 'error' && (
                <div style={{ padding: '20px 0', textAlign: 'center' }}>
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
                    {authActionMessage}
                  </p>
                  <button
                    onClick={() => {
                      window.history.replaceState({}, '', window.location.pathname);
                      setAuthActionMode(null);
                    }}
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
              {authActionStatus === 'reset-form' && (
                <div style={{ padding: '20px 0' }}>
                  {/* Lottie Animation */}
                  <div style={{
                    width: '120px',
                    height: '120px',
                    margin: '0 auto 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <LoginLottie />
                  </div>

                  <p style={{ fontSize: '24px', fontWeight: '800', color: '#1A1D2E', marginBottom: '8px', letterSpacing: '-0.5px', textAlign: 'center' }}>
                    Reset Your Password
                  </p>
                  <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '32px', fontWeight: '500', textAlign: 'center' }}>
                    {authActionEmail}
                  </p>

                  <form onSubmit={handleResetPasswordSubmit}>
                    {/* New Password */}
                    <div style={{ marginBottom: '16px', textAlign: 'left' }}>
                      <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>
                        New Password
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type={showResetNewPassword ? 'text' : 'password'}
                          value={resetNewPassword}
                          onChange={(e) => setResetNewPassword(e.target.value)}
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
                            boxSizing: 'border-box',
                            transition: 'border-color 0.2s'
                          }}
                          onFocus={(e) => e.target.style.borderColor = '#3B5BFC'}
                          onBlur={(e) => e.target.style.borderColor = '#E8EAEF'}
                        />
                        <button
                          type="button"
                          onClick={() => setShowResetNewPassword(!showResetNewPassword)}
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
                          {showResetNewPassword ? <EyeOff size={18} color="#6B7280" /> : <Eye size={18} color="#6B7280" />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div style={{ marginBottom: '24px', textAlign: 'left' }}>
                      <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>
                        Confirm Password
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type={showResetConfirmPassword ? 'text' : 'password'}
                          value={resetConfirmPassword}
                          onChange={(e) => setResetConfirmPassword(e.target.value)}
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
                            boxSizing: 'border-box',
                            transition: 'border-color 0.2s'
                          }}
                          onFocus={(e) => e.target.style.borderColor = '#3B5BFC'}
                          onBlur={(e) => e.target.style.borderColor = '#E8EAEF'}
                        />
                        <button
                          type="button"
                          onClick={() => setShowResetConfirmPassword(!showResetConfirmPassword)}
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
                          {showResetConfirmPassword ? <EyeOff size={18} color="#6B7280" /> : <Eye size={18} color="#6B7280" />}
                        </button>
                      </div>
                    </div>

                    {/* Error Message */}
                    {authActionMessage && authActionStatus === 'reset-form' && (
                      <p style={{ fontSize: '13px', color: '#EF4444', marginBottom: '16px', textAlign: 'center' }}>{authActionMessage}</p>
                    )}

                    {/* Update Password Button */}
                    <button
                      type="submit"
                      disabled={loading}
                      style={{
                        width: '100%',
                        padding: '14px 24px',
                        background: loading ? '#9CA3AF' : 'linear-gradient(135deg, #3B5BFC, #2142D9)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '12px',
                        fontSize: '15px',
                        fontWeight: '700',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        boxShadow: loading ? 'none' : '0 4px 16px rgba(59,91,252,0.3)',
                        transition: 'all 0.2s',
                        letterSpacing: '-0.2px'
                      }}
                      onMouseEnter={(e) => {
                        if (!loading) {
                          e.target.style.transform = 'translateY(-2px)';
                          e.target.style.boxShadow = '0 6px 20px rgba(59,91,252,0.4)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!loading) {
                          e.target.style.transform = 'translateY(0)';
                          e.target.style.boxShadow = '0 4px 16px rgba(59,91,252,0.3)';
                        }
                      }}
                    >
                      {loading ? 'Updating...' : 'Update Password'}
                    </button>
                  </form>
                </div>
              )}
            </>
          ) : !showForgotPassword ? (
            <>
            <div
              style={{
                fontSize: 28,
                fontWeight: 800,
                color: '#1A1D2E',
                letterSpacing: '-1px',
                lineHeight: 1.1,
                marginBottom: 4,
              }}
            >
              {isSignUp ? 'Create an account 👋' : 'Welcome to Taskzy 👋'}
            </div>
            <p style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 16 }}>
              {isSignUp ? 'Sign up to your account' : 'Sign in to your account'}
            </p>

            {/* Session expired banner */}
            {sessionExpired && !isSignUp && (
              <div style={{ background: '#FFF7ED', border: '1.5px solid #FED7AA', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#C2410C', fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>⏱</span>
                <span>Your session expired. Please sign in again.</span>
                <button type="button" onClick={onClearExpired} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#C2410C', fontSize: 16, lineHeight: 1 }}>×</button>
              </div>
            )}

            {/* Sign-in / Sign-up form */}
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* Login Lottie Animation */}
              <div style={{ display: 'flex', justifyContent: 'center', margin: '8px 0 16px' }}>
                <div style={{ width: 200, height: 200 }}>
                  <LoginLottie />
                </div>
              </div>
              
              {/* Email */}
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  onFocus={() => setEmailFocus(true)}
                  onBlur={() => setEmailFocus(false)}
                  style={{
                    width: '100%',
                    height: 48,
                    borderRadius: 10,
                    border: `1.5px solid ${emailFocus ? '#3B5BFC' : '#E5E7EB'}`,
                    padding: '0 16px',
                    fontSize: 14,
                    color: '#1A1D2E',
                    outline: 'none',
                    background: emailFocus ? '#F5F7FF' : '#FAFBFF',
                    transition: 'border-color 0.2s, background 0.2s',
                    boxShadow: emailFocus ? '0 0 0 3px rgba(59,91,252,0.10)' : 'none',
                  }}
                />
              </div>

              {/* Password */}
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setPassFocus(true)}
                  onBlur={() => setPassFocus(false)}
                  style={{
                    width: '100%',
                    height: 48,
                    borderRadius: 10,
                    border: `1.5px solid ${passFocus ? '#3B5BFC' : '#E5E7EB'}`,
                    padding: '0 44px 0 16px',
                    fontSize: 14,
                    color: '#1A1D2E',
                    outline: 'none',
                    background: passFocus ? '#F5F7FF' : '#FAFBFF',
                    transition: 'border-color 0.2s, background 0.2s',
                    boxShadow: passFocus ? '0 0 0 3px rgba(59,91,252,0.10)' : 'none',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute',
                    right: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    color: '#9CA3AF',
                  }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Confirm Password — sign up only */}
              {isSignUp && (
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirmPassSignUp ? 'text' : 'password'}
                    placeholder="Confirm Password"
                    value={confirmPasswordSignUp}
                    onChange={(e) => setConfirmPasswordSignUp(e.target.value)}
                    style={{
                      width: '100%',
                      height: 48,
                      borderRadius: 10,
                      border: '1.5px solid #E5E7EB',
                      padding: '0 44px 0 16px',
                      fontSize: 14,
                      color: '#1A1D2E',
                      outline: 'none',
                      background: '#FAFBFF',
                      transition: 'border-color 0.2s, background 0.2s',
                    }}
                    onFocus={(e) => { e.target.style.borderColor = '#3B5BFC'; e.target.style.background = '#F5F7FF'; e.target.style.boxShadow = '0 0 0 3px rgba(59,91,252,0.10)'; }}
                    onBlur={(e) => { e.target.style.borderColor = '#E5E7EB'; e.target.style.background = '#FAFBFF'; e.target.style.boxShadow = 'none'; }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassSignUp(!showConfirmPassSignUp)}
                    style={{
                      position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#9CA3AF',
                    }}
                  >
                    {showConfirmPassSignUp ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              )}

              {/* Forgot — login only */}
              {!isSignUp && (
              <div style={{ textAlign: 'right', marginTop: -6 }}>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#3B5BFC',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Forgot password ?
                </button>
              </div>
              )}

              {/* Cloudflare Turnstile */}
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8, marginBottom: 4 }}>
                <Turnstile
                  siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY || '0x4AAAAAADfjyyUsdMWtCILb'}
                  onSuccess={(token) => {
                    setTurnstileToken(token);
                    setTurnstileError(false);
                  }}
                  onError={() => {
                    setTurnstileError(true);
                    setError('Security verification failed. Please try again.');
                  }}
                  onExpire={() => {
                    setTurnstileToken('');
                    setError('Security verification expired. Please verify again.');
                  }}
                  options={{
                    theme: 'light',
                    size: 'normal',
                    appearance: 'always'
                  }}
                />
              </div>
              {turnstileError && !turnstileToken && (
                <div style={{ fontSize: 12, color: '#DC2626', textAlign: 'center', marginTop: -4 }}>
                  Please complete the security check
                </div>
              )}

              {/* Divider */}
              <div className="flex items-center gap-3" style={{ marginTop: -4 }}>
                <div style={{ flex: 1, height: 1, background: '#F0F2F5' }} />
                <span style={{ fontSize: 12, color: '#B0B8C8' }}>or</span>
                <div style={{ flex: 1, height: 1, background: '#F0F2F5' }} />
              </div>

              {/* Google */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                style={{
                  width: '100%',
                  height: 50,
                  borderRadius: 10,
                  border: '1.5px solid #E5E7EB',
                  background: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#1A1D2E',
                  cursor: loading ? 'default' : 'pointer',
                  transition: 'background 0.15s, border-color 0.15s, transform 0.15s',
                }}
                onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.background = '#F8F9FF'; e.currentTarget.style.borderColor = '#3B5BFC'; } }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#E5E7EB'; }}
                onMouseDown={(e) => { if (!loading) e.currentTarget.style.transform = 'scale(0.98)'; }}
                onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
              >
                <GoogleIcon /> {isSignUp ? 'Sign up with Google' : 'Sign in with Google'}
              </button>

              {/* Success message (e.g. after sign-up redirects back to sign-in) */}
              {!isSignUp && forgotSuccess && (
                <div style={{ background: '#F0FDF4', border: '1.5px solid #BBF7D0', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#16A34A', fontWeight: 500 }}>
                  {forgotSuccess}
                </div>
              )}

              {/* Error */}
              {error && (
                <div style={{ background: '#FEF2F2', border: '1.5px solid #FECACA', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#DC2626', fontWeight: 500 }}>
                  {error}
                </div>
              )}

              {/* Single CTA button */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%', height: 50, borderRadius: 12, border: 'none',
                  background: 'linear-gradient(135deg, #3B5BFC 0%, #2142D9 100%)',
                  color: '#fff', fontSize: 15, fontWeight: 700,
                  cursor: loading ? 'default' : 'pointer',
                  transition: 'transform 0.15s, box-shadow 0.2s',
                  boxShadow: '0 6px 20px rgba(59,91,252,0.35)',
                  letterSpacing: '0.3px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
                onMouseEnter={(e) => { if (!loading) e.currentTarget.style.boxShadow = '0 10px 28px rgba(59,91,252,0.45)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 6px 20px rgba(59,91,252,0.35)'; }}
                onMouseDown={(e) => { if (!loading) e.currentTarget.style.transform = 'scale(0.96)'; }}
                onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
              >
                {loading ? (
                  <>
                    <span style={{ width: 16, height: 16, border: '2.5px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                    Signing in…
                  </>
                ) : isSignUp ? 'Create Account' : 'Sign In'}
              </button>
            </form>

            {/* Sign up / Sign in toggle */}
            <p style={{ textAlign: 'center', fontSize: 13, color: '#9CA3AF', marginTop: 16 }}>
              {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
              <span
                style={{ color: '#3B5BFC', fontWeight: 700, cursor: 'pointer' }}
                onClick={() => { 
                    setIsSignUp(v => !v); 
                    setError(''); 
                    setPassword(''); 
                    setConfirmPasswordSignUp('');
                    switchForm('right');
                  }}
              >
                {isSignUp ? 'Sign in' : 'Sign up'}
              </span>
            </p>
            </>
            ) : (
              <>
                <div style={{ marginBottom: 20 }}>
                  <button
                    onClick={handleBackToLoginForm}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#6B7280',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      marginBottom: 16,
                    }}
                  >
                    <ChevronLeft size={16} /> Back to login
                  </button>
                  <div
                    style={{
                      fontSize: 28,
                      fontWeight: 800,
                      color: '#1A1D2E',
                      letterSpacing: '-0.8px',
                      lineHeight: 1.1,
                      marginBottom: 6,
                    }}
                  >
                    Reset Password
                  </div>
                  <p style={{ fontSize: 14, color: '#9CA3AF', marginBottom: 20 }}>
                    Enter your email and we'll send you a reset link
                  </p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', margin: '4px 0 16px' }}>
                  <EmailSentLottie />
                </div>

                <form onSubmit={handleSendPasswordReset} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <input
                    type="email"
                    placeholder="Email address"
                    value={forgotEmail}
                    onChange={(e) => { setForgotEmail(e.target.value); setForgotError(''); setForgotSuccess(''); }}
                    style={{
                      width: '100%',
                      height: 48,
                      borderRadius: 10,
                      border: '1.5px solid #E5E7EB',
                      padding: '0 16px',
                      fontSize: 14,
                      color: '#1A1D2E',
                      outline: 'none',
                      background: '#FAFBFF',
                      transition: 'border-color 0.2s, background 0.2s',
                    }}
                    onFocus={(e) => { e.target.style.borderColor = '#3B5BFC'; e.target.style.background = '#F5F7FF'; e.target.style.boxShadow = '0 0 0 3px rgba(59,91,252,0.10)'; }}
                    onBlur={(e) => { e.target.style.borderColor = '#E5E7EB'; e.target.style.background = '#FAFBFF'; e.target.style.boxShadow = 'none'; }}
                  />

                  {forgotError && (
                    <div style={{ background: '#FEF2F2', border: '1.5px solid #FECACA', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#DC2626', fontWeight: 500 }}>
                      {forgotError}
                    </div>
                  )}

                  {forgotSuccess && (
                    <div style={{ background: '#F0FDF4', border: '1.5px solid #BBF7D0', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#16A34A', fontWeight: 500 }}>
                      {forgotSuccess}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || !forgotEmail.trim()}
                    style={{
                      width: '100%',
                      height: 50,
                      borderRadius: 12,
                      border: 'none',
                      background: 'linear-gradient(135deg, #3B5BFC 0%, #2142D9 100%)',
                      color: '#fff',
                      fontSize: 15,
                      fontWeight: 700,
                      cursor: (loading || !forgotEmail.trim()) ? 'default' : 'pointer',
                      opacity: !forgotEmail.trim() ? 0.6 : 1,
                      boxShadow: '0 6px 20px rgba(59,91,252,0.35)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      transition: 'opacity 0.2s',
                    }}
                  >
                    {loading ? (
                      <>
                        <span style={{ width: 16, height: 16, border: '2.5px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                        Sending…
                      </>
                    ) : 'Send Reset Email'}
                  </button>
                </form>
              </>
            )}
            </div> {/* end login-form-card */}
            </>
          ) : (
            <div style={{ position: 'relative', zIndex: 2, width: '100%', height: '100%' }}>
              <PlanSelection
                email={email}
                workspaceId={authenticatedUser?.workspaceId}
                activeTeamMembers={0}
                onSelectPlan={handlePlanSelect}
                onBack={handleBackToLogin}
              />
            </div>
          )}
        </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes caret-blink {
          0%, 70%, 100% { opacity: 1; }
          20%, 50% { opacity: 0; }
        }
        .animate-caret-blink {
          animation: caret-blink 1.2s ease-out infinite;
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
      `}</style>
    </div>
    </>
  );
}
