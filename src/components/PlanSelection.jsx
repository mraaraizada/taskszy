import { useState, useEffect } from 'react';
import { useLottie } from 'lottie-react';
import { Check, Mail, ArrowLeft, Tag, Lock, User, Phone, AtSign, Plus, X, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { toast } from 'sonner';

// Dynamic lottie loaders — keep heavy JSONs out of the initial bundle
function useSuccessConfetti() {
  const [data, setData] = useState(null);
  useEffect(() => { import('../lottie/success-confetti.json').then(m => setData(m.default)); }, []);
  return data;
}
function useRocketAnimation() {
  const [data, setData] = useState(null);
  useEffect(() => { import('../lottie/Businessman flies up with rocket.json').then(m => setData(m.default)); }, []);
  return data;
}

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 1599,
    users: 7,
    period: 'month',
    features: ['Up to 7 users', 'Basic task management', 'Email support', '10GB storage'],
    color: '#3B5BFC',
    popular: false,
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 2499,
    users: 15,
    period: 'month',
    features: ['Up to 15 users', 'Advanced analytics', 'Priority support', '50GB storage', 'Custom roles'],
    color: '#7C3AED',
    popular: true,
  },
  {
    id: 'business',
    name: 'Business',
    price: 4599,
    users: 30,
    period: 'month',
    features: ['Up to 30 users', 'Full analytics suite', '24/7 support', '200GB storage', 'API access', 'Custom integrations'],
    color: '#12C479',
    popular: false,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 7199,
    users: 50,
    period: 'month',
    features: ['Up to 50 users', 'All features included', 'Premium support', 'Unlimited storage', 'White-label option', 'Dedicated account manager'],
    color: '#F97316',
    popular: false,
  },
  {
    id: 'custom',
    name: 'Custom',
    price: null,
    users: 'Custom',
    period: 'custom',
    features: ['Tailored user limits', 'Custom features', 'Dedicated account manager', 'Custom integrations', 'SLA guarantees', 'On-premise option'],
    color: '#EC4899',
    popular: false,
    isCustom: true,
  },
];

const VALID_COUPONS = {
  'TASKZY20': { discount: 20, label: '20% off' },
  'LAUNCH50': { discount: 50, label: '50% off' },
  'FIRST10':  { discount: 10, label: '10% off' },
};

// Load dynamic coupons from Firestore (created in project-dashboard)
async function loadDynamicCoupons() {
  try {
    const { collection, getDocs } = await import('firebase/firestore');
    const { db } = await import('../lib/firebase');
    
    const couponsRef = collection(db, 'coupons');
    const snapshot = await getDocs(couponsRef);
    
    const map = {};
    snapshot.docs.forEach(doc => {
      const c = doc.data();
      if (c.active && c.code) {
        map[c.code.toUpperCase()] = {
          discount: c.type === 'percentage' ? c.value : 0,
          label: c.type === 'percentage' ? `${c.value}% off` : `${c.duration?.value} ${c.duration?.unit}`,
          type: c.type,
          amount: c.type !== 'percentage' ? c.value : null,
          duration: c.duration || null,
          plan: c.plan || 'all',
          id: doc.id,
        };
      }
    });
    return map;
  } catch (err) {
    console.error('Failed to load coupons from Firestore:', err);
    return {};
  }
}

function ConfettiPlayer() {
  const animationData = useSuccessConfetti();
  const { View } = useLottie({
    animationData: animationData ?? null,
    loop: false,
    autoplay: !!animationData,
    style: { width: 220, height: 220 },
  });
  if (!animationData) return <div style={{ width: 220, height: 220 }} />;
  return <div style={{ position: 'relative', zIndex: 1, marginBottom: 8 }}>{View}</div>;
}

function RocketPlayer() {
  const animationData = useRocketAnimation();
  const { View } = useLottie({
    animationData: animationData ?? null,
    loop: true,
    autoplay: !!animationData,
    style: { width: '100%', height: '100%', objectFit: 'contain' },
  });
  if (!animationData) return null;
  return View;
}

function Divider() {
  return <div style={{ height: 1, background: '#F0F2F8', margin: '18px 0' }} />;
}

function CheckoutStep({ plan, billingCycle, email, workspaceId, onBack, onConfirm, onCancel, readOnly = false }) {
  const { currentUser, setCurrentUser, planExpiryDate, planExpiryTimestamp, currentPlan, currentUid } = useApp();

  const [fullName, setFullName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [userEmail, setUserEmail] = useState(email || currentUser?.email || '');
  
  // Load user profile data from Firestore
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!currentUid) return;
      
      try {
        const { doc, getDoc } = await import('firebase/firestore');
        const { db } = await import('../lib/firebase');
        
        const userDoc = await getDoc(doc(db, 'users', currentUid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          console.log('📋 Loaded user profile:', userData);
          
          // Update state with user data
          if (userData.name && !fullName) setFullName(userData.name);
          if (userData.phone && !phone) setPhone(userData.phone);
          if (userData.email && !userEmail) setUserEmail(userData.email);
          
          // Update context
          setCurrentUser(prev => ({
            ...prev,
            name: userData.name || prev?.name,
            phone: userData.phone || prev?.phone,
            email: userData.email || prev?.email,
          }));
        }
      } catch (err) {
        console.error('Failed to load user profile:', err);
      }
    };
    
    loadUserProfile();
  }, [currentUid]);
  
  const [couponOpen, setCouponOpen] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponApplied, setCouponApplied] = useState(null);
  const [couponCode, setCouponCode] = useState('');
  const [processing, setProcessing] = useState(false);
  const [showRocket, setShowRocket] = useState(false);
  const [success, setSuccess] = useState(false);
  const [nameFocus, setNameFocus] = useState(false);
  const [phoneFocus, setPhoneFocus] = useState(false);
  const [emailFocus, setEmailFocus] = useState(false);
  const [quantity, setQuantity] = useState(1);
  
  // extraMonths: Always default to 1 for UI display
  // The pricing logic will handle whether this is base subscription or extra months
  const [extraMonths, setExtraMonths] = useState(1);

  // Store the ORIGINAL expiry date when component mounts (before any preview updates)
  const [originalExpiryDate, setOriginalExpiryDate] = useState(null);
  const [originalExpiryTimestamp, setOriginalExpiryTimestamp] = useState(null);
  
  // Fetch original expiry from Firestore on mount (don't use context - it might be preview)
  useEffect(() => {
    const fetchOriginalExpiry = async () => {
      try {
        const { doc: firestoreDoc, getDoc } = await import('firebase/firestore');
        const { db } = await import('../lib/firebase');
        
        // Determine workspace ID
        let wsId = workspaceId;
        if (!wsId && currentUid) {
          const userDoc = await getDoc(firestoreDoc(db, 'users', currentUid));
          if (userDoc.exists()) {
            wsId = userDoc.data().workspaceId || `ws_${currentUid}`;
          } else {
            wsId = `ws_${currentUid}`;
          }
        }
        
        if (wsId) {
          const workspaceDoc = await getDoc(firestoreDoc(db, 'workspaces', wsId));
          if (workspaceDoc.exists()) {
            const wsData = workspaceDoc.data();
            if (wsData.plan?.expiryTimestamp) {
              const expiryTimestamp = wsData.plan.expiryTimestamp;
              const expiryDate = expiryTimestamp.toDate ? expiryTimestamp.toDate() : new Date(expiryTimestamp);
              const expiryStr = expiryDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
              
              setOriginalExpiryDate(expiryStr);
              setOriginalExpiryTimestamp(expiryTimestamp);
              
              console.log('📅 PlanSelection: Fetched ORIGINAL expiry from Firestore:', {
                expiryStr,
                expiryDate
              });
            }
          }
        }
      } catch (err) {
        console.warn('Could not fetch original expiry from Firestore:', err);
        // Fallback to context values
        setOriginalExpiryDate(planExpiryDate);
        setOriginalExpiryTimestamp(planExpiryTimestamp);
      }
    };
    
    fetchOriginalExpiry();
  }, []); // Empty deps - only run once on mount

  // Active plan may be overridden by a duration coupon
  const [activePlan, setActivePlan] = useState(plan);
  const [activeBillingCycle, setActiveBillingCycle] = useState(billingCycle);
  
  // Calculate remaining months from current plan
  const getRemainingMonths = () => {
    if (!planExpiryDate) return 0;
    const now = new Date();
    const expiry = new Date(planExpiryDate);
    if (expiry <= now) return 0;
    
    const diffTime = expiry - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.ceil(diffDays / 30); // Convert days to months
  };
  
  const remainingMonths = getRemainingMonths();
  
  // Get base duration for plans (monthly = 1, yearly = 12)
  const getBaseDuration = (cycle) => cycle === 'yearly' ? 12 : 1;
  
  // Calculate monthly rate for a plan
  const getMonthlyRate = (planObj, cycle) => {
    const baseDuration = getBaseDuration(cycle);
    if (cycle === 'yearly') {
      return Math.round((planObj.price * 12 * 0.8) / 12); // 20% discount for yearly
    }
    return planObj.price;
  };
  
  // Determine if this is an upgrade or downgrade
  const PLAN_HIERARCHY = { starter: 1, professional: 2, business: 3, enterprise: 4, custom: 5 };
  const isUpgrade = currentPlan && PLAN_HIERARCHY[activePlan.id] > PLAN_HIERARCHY[currentPlan.id];
  const isDowngrade = currentPlan && PLAN_HIERARCHY[activePlan.id] < PLAN_HIERARCHY[currentPlan.id];
  
  // Calculate pricing breakdown
  const calculatePricing = () => {
    const selectedMonthlyRate = getMonthlyRate(activePlan, activeBillingCycle);
    
    let upgradeFee = 0;
    let extraMonthsFee = 0;
    
    // PART 1: Upgrade/Downgrade Fee (only for remaining months)
    if (isUpgrade && remainingMonths > 0 && currentPlan) {
      const oldPlan = PLANS.find(p => p.id === currentPlan.id);
      if (oldPlan) {
        const oldMonthlyRate = getMonthlyRate(oldPlan, currentPlan.billingCycle || 'monthly');
        const newMonthlyRate = selectedMonthlyRate;
        
        // Prorated difference for remaining months
        upgradeFee = Math.round((newMonthlyRate - oldMonthlyRate) * remainingMonths);
        
        console.log('💰 PlanSelection: Upgrade calculation', {
          oldPlan: oldPlan.name,
          newPlan: activePlan.name,
          oldMonthlyRate,
          newMonthlyRate,
          remainingMonths,
          upgradeFee
        });
      }
    }
    // Downgrade = no fee
    
    // PART 2: Extra Months Fee
    // For users with active plans: extraMonths represents ADDITIONAL months beyond base renewal
    // For new users: extraMonths represents the total subscription duration
    // Don't charge extra months if duration coupon is applied (duration is fixed)
    if (extraMonths > 0 && !(couponApplied && couponApplied.type === 'duration')) {
      if (currentPlan && remainingMonths > 0) {
        // User has active plan - extraMonths are EXTRA beyond the base renewal
        // So if extraMonths = 1, this is 1 EXTRA month (total 2 months: 1 base + 1 extra)
        // We'll charge for these extra months separately from the base fee
        extraMonthsFee = Math.round(selectedMonthlyRate * (extraMonths - 1)); // Subtract 1 because base is charged separately
      } else {
        // New user or expired plan - extraMonths is the total subscription duration
        extraMonthsFee = Math.round(selectedMonthlyRate * extraMonths);
      }
      
      console.log('📅 PlanSelection: Extra months calculation', {
        plan: activePlan.name,
        monthlyRate: selectedMonthlyRate,
        extraMonths,
        extraMonthsFee,
        hasActivePlan: !!(currentPlan && remainingMonths > 0)
      });
    }
    
    // PART 3: Base subscription fee
    let baseFee = 0;
    if (currentPlan && remainingMonths > 0) {
      // User has active plan - charge base renewal fee (1 month or 1 year)
      baseFee = activeBillingCycle === 'yearly' 
        ? Math.round(selectedMonthlyRate * 12) 
        : selectedMonthlyRate;
      
      console.log('🔄 PlanSelection: Active plan renewal', {
        plan: activePlan.name,
        billingCycle: activeBillingCycle,
        monthlyRate: selectedMonthlyRate,
        baseFee
      });
    } else if (!currentPlan || remainingMonths === 0) {
      // New user or expired plan - base fee is covered by extraMonthsFee
      baseFee = 0;
      
      console.log('🆕 PlanSelection: New subscription (fee covered by extraMonths)', {
        plan: activePlan.name,
        monthlyRate: selectedMonthlyRate,
        extraMonths,
        totalFee: extraMonthsFee
      });
    }
    
    // Apply coupon discount
    const subtotal = upgradeFee + extraMonthsFee + baseFee;
    const discount = couponApplied && couponApplied.type === 'percentage'
      ? Math.round(subtotal * couponApplied.discount / 100)
      : 0;
    
    // For duration coupons, total = coupon amount (flat price override)
    const total = couponApplied && couponApplied.type !== 'percentage'
      ? (couponApplied.amount || 0)
      : subtotal - discount;
    
    console.log('💵 PlanSelection: Final pricing', {
      selectedMonthlyRate,
      upgradeFee,
      extraMonthsFee,
      baseFee,
      subtotal,
      discount,
      total,
      isUpgrade,
      isDowngrade,
      hasCurrentPlan: !!currentPlan,
      remainingMonths,
      extraMonths
    });
    
    return {
      selectedMonthlyRate,
      upgradeFee,
      extraMonthsFee,
      baseFee,
      subtotal,
      discount,
      total
    };
  };
  
  const pricing = calculatePricing();

  const billingLabel = activeBillingCycle === 'yearly' ? 'year' : activePlan.period === 'one-time' ? 'one-time' : 'month';

  // Auto-transition: Rocket → Success → Close panel → Confetti on dashboard
  useEffect(() => {
    if (showRocket) {
      const timer = setTimeout(() => {
        setShowRocket(false);
        setSuccess(true);
      }, 3000); // 3 seconds rocket animation
      
      return () => clearTimeout(timer);
    }
  }, [showRocket]);
  
  // After success screen, close panel and trigger confetti
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        // Close panel and trigger confetti on dashboard
        if (onConfirm) {
          onConfirm(plan, activeBillingCycle, couponApplied);
        }
        if (onCancel) {
          onCancel();
        }
      }, 2500); // 2.5 seconds success screen
      
      return () => clearTimeout(timer);
    }
  }, [success, onConfirm, onCancel, couponApplied, plan, activeBillingCycle]);

  // ── Rocket animation screen ──
  if (showRocket) {
    return (
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
        zIndex: 10,
        padding: '40px',
      }}>
        {/* Background video */}
        <video
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260319_015952_e1deeb12-8fb7-4071-a42a-60779fc64ab6.mp4"
          autoPlay muted loop playsInline
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0, pointerEvents: 'none' }}
        />
        {/* Overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(240,242,248,0.55)', zIndex: 1, pointerEvents: 'none' }} />
        
        {/* Content */}
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* Rocket Lottie */}
          <div style={{ width: '100%', maxWidth: 500, height: 400, marginBottom: 32 }}>
            <RocketPlayer />
          </div>

          {/* Message */}
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: '#1A1D2E', letterSpacing: '-0.8px', marginBottom: 8 }}>Processing Your Upgrade</h2>
            <p style={{ fontSize: 15, color: '#6B7280' }}>Your {plan.name} plan is being activated...</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Success screen ──
  if (success) {
    return (
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
        zIndex: 10,
      }}>
        {/* Background video */}
        <video
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260319_015952_e1deeb12-8fb7-4071-a42a-60779fc64ab6.mp4"
          autoPlay muted loop playsInline
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0, pointerEvents: 'none' }}
        />
        {/* Gradient overlay */}
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${plan.color}ee, ${plan.color}cc)`, zIndex: 1, pointerEvents: 'none' }} />
        
        {/* Content */}
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* Lottie animation above the text */}
          <ConfettiPlayer />

          {/* Success message */}
          <div style={{ textAlign: 'center', padding: '0 40px' }}>
            <h2 style={{ fontSize: 32, fontWeight: 800, color: '#fff', letterSpacing: '-0.8px', marginBottom: 8 }}>Payment Successful!</h2>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.85)', marginBottom: 4 }}>{plan.name} Plan activated</p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>Redirecting you to your dashboard…</p>
          </div>
        </div>
      </div>
    );
  }

  const handleApplyCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    
    // Get workspace ID
    const { getAuth } = await import('firebase/auth');
    const auth = getAuth();
    const currentUid = auth.currentUser?.uid;
    let wsId = workspaceId || currentUser?.workspaceId;
    
    if (!wsId && currentUid) {
      // Try to fetch from Firestore
      try {
        const { getProfile } = await import('../lib/userProfileService');
        const profile = await getProfile(currentUid);
        wsId = profile?.workspaceId || `ws_${currentUid}`;
      } catch (err) {
        wsId = `ws_${currentUid}`;
      }
    }
    
    if (!wsId) {
      setCouponError('Unable to verify workspace. Please try again.');
      setCouponApplied(null);
      return;
    }
    
    // Check coupon eligibility (includes workspace usage limit check)
    const { checkCouponEligibility } = await import('../lib/couponService');
    const eligibility = await checkCouponEligibility(code, wsId);
    
    if (!eligibility.eligible) {
      setCouponError(eligibility.error || 'Invalid coupon code');
      setCouponApplied(null);
      return;
    }
    
    const found = eligibility.coupon;
    
    // Convert to expected format
    const couponData = {
      discount: found.type === 'percentage' ? found.value : 0,
      label: found.type === 'percentage' ? `${found.value}% off` : `${found.duration?.value} ${found.duration?.unit}`,
      type: found.type,
      amount: found.type !== 'percentage' ? found.value : null,
      duration: found.duration || null,
      plan: found.plan || 'all',
      id: found.id,
    };

    // Check plan restriction
    if (couponData.plan && couponData.plan !== 'all' && couponData.plan !== activePlan.id) {
      setCouponError(`This coupon is only valid for the ${couponData.plan.charAt(0).toUpperCase() + couponData.plan.slice(1)} plan`);
      setCouponApplied(null);
      return;
    }

    setCouponApplied(couponData);
    setCouponCode(code);
    setCouponError('');

    // If duration coupon — lock quantity to 1 and update plan if specified
    if (couponData.type === 'duration') {
      setQuantity(1); // duration is fixed, quantity doesn't apply
      if (couponData.plan && couponData.plan !== 'all') {
        const targetPlan = PLANS.find(p => p.id === couponData.plan);
        if (targetPlan) {
          setActivePlan(targetPlan);
          setActiveBillingCycle('monthly');
        }
      }
    }
    
    console.log('✅ Coupon applied successfully (usage will be incremented after payment)');
  };

  const handleRemoveCoupon = () => {
    setCouponCode('');
    setCouponInput('');
    setCouponApplied(null);
    setCouponError('');
    setCouponOpen(false);
    setQuantity(1);
    // Reset plan back to original
    setActivePlan(plan);
    setActiveBillingCycle(billingCycle);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setProcessing(true);
    
    // Save name, phone, and email to user profile in context AND Firestore
    if (fullName.trim() || phone.trim() || userEmail.trim()) {
      setCurrentUser(prev => ({
        ...prev,
        name:  fullName.trim() || prev?.name,
        phone: phone.trim()    || prev?.phone,
        email: userEmail.trim() || prev?.email,
      }));
      
      // Save to Firestore user profile
      import('../lib/firebase').then(({ db }) => {
        import('firebase/firestore').then(({ doc, updateDoc }) => {
          import('firebase/auth').then(({ getAuth }) => {
            const auth = getAuth();
            const currentUid = auth.currentUser?.uid;
            if (currentUid) {
              // Filter out undefined values to avoid Firestore error
              const updates = {};
              if (fullName.trim()) updates.name = fullName.trim();
              if (phone.trim()) updates.phone = phone.trim();
              if (userEmail.trim()) updates.email = userEmail.trim();
              
              // Only update if there are fields to update
              if (Object.keys(updates).length > 0) {
                updateDoc(doc(db, 'users', currentUid), updates)
                  .catch(err => console.error('Failed to save user profile:', err));
              }
            }
          });
        });
      });
    }
    
    try {
      // Get current user UID
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const currentUid = auth.currentUser?.uid;
      
      if (!currentUid) {
        throw new Error('You must be logged in to upgrade your plan. Please log in and try again.');
      }
      
      console.log('🔍 Current UID:', currentUid);
      console.log('🔍 workspaceId prop:', workspaceId);
      console.log('🔍 currentUser:', currentUser);
      
      // Get workspace ID from prop, currentUser, or fetch from Firestore
      let wsId = workspaceId || currentUser?.workspaceId;
      
      if (!wsId) {
        console.log('⚠️ workspaceId not in props/context, fetching from Firestore...');
        // Try to fetch workspaceId from user profile in Firestore
        const { getProfile } = await import('../lib/userProfileService');
        
        const profile = await getProfile(currentUid);
        console.log('📄 User profile from Firestore:', profile);
        
        if (profile && profile.workspaceId) {
          wsId = profile.workspaceId;
          console.log('✅ Found workspaceId in profile:', wsId);
        } else {
          // If still no workspaceId, generate one based on UID (fallback for existing users)
          wsId = `ws_${currentUid}`;
          console.log('⚠️ No workspaceId in profile, using generated ID:', wsId);
        }
      }
      
      console.log('🎯 Final workspaceId:', wsId);

      // Prepare checkout data
      const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
      const { db } = await import('../lib/firebase');
      
      // Calculate expiry date based on upgrade/downgrade logic
      const now = new Date();
      let expiryDate;
      
      // Determine the starting point for expiry calculation
      // IMPORTANT: Don't use planExpiryDate from context - it's already been updated by handlePlanSelect preview
      // We need to calculate from the ACTUAL current expiry in Firestore, not the preview
      
      // Check if user has an active plan by looking at workspace data
      let actualCurrentExpiryDate = null;
      try {
        const { doc: firestoreDoc, getDoc } = await import('firebase/firestore');
        const workspaceDoc = await getDoc(firestoreDoc(db, 'workspaces', wsId));
        if (workspaceDoc.exists()) {
          const wsData = workspaceDoc.data();
          if (wsData.plan?.expiryTimestamp) {
            const expiryTimestamp = wsData.plan.expiryTimestamp;
            actualCurrentExpiryDate = expiryTimestamp.toDate ? expiryTimestamp.toDate() : new Date(expiryTimestamp);
            
            // Check if it's actually active (not expired)
            if (actualCurrentExpiryDate < now) {
              actualCurrentExpiryDate = null; // Expired, treat as new subscription
            }
          }
        }
      } catch (err) {
        console.warn('Could not fetch actual expiry date:', err);
      }
      
      // If user has active plan with remaining time, extend from ACTUAL current expiry
      if (actualCurrentExpiryDate) {
        expiryDate = new Date(actualCurrentExpiryDate);
        console.log('📅 Extending from actual current expiry:', actualCurrentExpiryDate);
      } else {
        // New subscription or expired plan - start from today
        expiryDate = new Date(now);
        console.log('📅 Starting new subscription from today');
      }
      
      // Add base duration (1 month or 1 year)
      if (activeBillingCycle === 'yearly') {
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);
      } else {
        expiryDate.setMonth(expiryDate.getMonth() + 1);
      }
      
      // Add extra months (only if user explicitly selected more than 1 month)
      // For active plans: extraMonths=1 means base renewal only (no additional months)
      // For new users: extraMonths=1 means 1 month total (already added above)
      const additionalMonths = actualCurrentExpiryDate ? Math.max(0, extraMonths - 1) : 0;
      if (additionalMonths > 0) {
        expiryDate.setMonth(expiryDate.getMonth() + additionalMonths);
        console.log('📅 Adding additional months:', additionalMonths);
      }
      
      // Prepare complete checkout data
      const checkoutData = {
        // Plan details
        plan: {
          id: activePlan.id,
          name: activePlan.name,
          billingCycle: activeBillingCycle,
          users: activePlan.users,
          color: activePlan.color,
          expiryDate: expiryDate.toISOString(),
          expiryTimestamp: expiryDate.getTime(),
          isActive: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        // Pricing breakdown
        pricing: {
          selectedMonthlyRate: pricing.selectedMonthlyRate,
          upgradeFee: pricing.upgradeFee,
          extraMonthsFee: pricing.extraMonthsFee,
          baseFee: pricing.baseFee,
          subtotal: pricing.subtotal,
          discount: pricing.discount,
          total: pricing.total,
          extraMonths: extraMonths,
          isUpgrade: isUpgrade,
          isDowngrade: isDowngrade,
        },
        // Previous plan info (for reference)
        previousPlan: currentPlan ? {
          id: currentPlan.id,
          name: currentPlan.name,
          billingCycle: currentPlan.billingCycle || 'monthly',
          remainingMonths: remainingMonths,
          expiryDate: planExpiryDate,
        } : null,
        // Coupon info
        coupon: couponApplied ? {
          code: couponCode,
          type: couponApplied.type,
          discount: couponApplied.discount,
          amount: couponApplied.amount,
          duration: couponApplied.duration,
        } : null,
        // User info
        userInfo: {
          name: fullName,
          phone: phone,
          email: userEmail,
        },
        // Transaction metadata
        transactionDate: serverTimestamp(),
        workspaceId: wsId,
        userId: currentUid,
        status: 'pending',
        fromHeaderUpgrade: currentPlan ? true : false, // Track if upgrade from existing plan
      };
      
      console.log('💾 Checkout data prepared:', checkoutData);
      
      // If total is 0, activate directly without payment
      if (pricing.total === 0) {
        console.log('💰 Total is ₹0, activating plan directly');
        
        checkoutData.status = 'completed';
        checkoutData.paymentId = 'free_upgrade';
        
        // Create payment entry
        const paymentId = `${wsId}_${Date.now()}`;
        await setDoc(doc(db, 'payments', paymentId), checkoutData);
        
        // Update workspace with plan
        await setDoc(doc(db, 'workspaces', wsId), {
          plan: checkoutData.plan,
        }, { merge: true });
        
        // Increment coupon usage if coupon was applied
        if (couponApplied && couponApplied.id) {
          const { incrementCouponUsage } = await import('../lib/couponService');
          await incrementCouponUsage(couponApplied.id, wsId);
        }
        
        setProcessing(false);
        setShowRocket(true);
        return;
      }
      
      // Create Razorpay order on backend
      console.log('💳 Initiating Razorpay payment for ₹' + pricing.total);
      
      const { httpsCallable } = await import('firebase/functions');
      const { functions } = await import('../lib/firebase');
      const createOrder = httpsCallable(functions, 'createRazorpayOrder');
      
      const orderResult = await createOrder({
        plan: activePlan.id,
        billingCycle: activeBillingCycle,
        couponCode: couponCode || null,
        workspaceId: wsId,
        quantity: extraMonths,
      });
      
      if (!orderResult.data.success) {
        throw new Error('Failed to create payment order');
      }
      
      const orderId = orderResult.data.orderId;
      console.log('✅ Razorpay order created:', orderId);
      
      // Create payment entry with pending status
      const paymentId = `${wsId}_${Date.now()}`;
      checkoutData.status = 'pending';
      checkoutData.orderId = orderId;
      await setDoc(doc(db, 'payments', paymentId), checkoutData);
      console.log('💾 Payment entry created with pending status:', paymentId);
      
      // Load Razorpay script
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
      
      script.onload = () => {
        const options = {
          key: 'rzp_test_Skaa4Xfmz2vE2G',
          order_id: orderId,
          amount: pricing.total * 100,
          currency: 'INR',
          name: 'Taskzy',
          description: `${activePlan.name} Plan - ${billingLabel}`,
          prefill: {
            name: fullName,
            email: userEmail,
            contact: phone,
          },
          theme: {
            color: activePlan.color,
          },
          handler: async function (response) {
            try {
              console.log('✅ Razorpay payment successful:', response);
              
              // Update payment entry with completed status
              checkoutData.status = 'completed';
              checkoutData.paymentId = response.razorpay_payment_id;
              checkoutData.orderId = response.razorpay_order_id;
              checkoutData.signature = response.razorpay_signature;
              
              await setDoc(doc(db, 'payments', paymentId), checkoutData);
              
              // Update workspace with plan
              await setDoc(doc(db, 'workspaces', wsId), {
                plan: checkoutData.plan,
              }, { merge: true });
              
              // Increment coupon usage if coupon was applied
              if (couponApplied && couponApplied.id) {
                const { incrementCouponUsage } = await import('../lib/couponService');
                await incrementCouponUsage(couponApplied.id, wsId);
              }
              
              setProcessing(false);
              setShowRocket(true);
            } catch (err) {
              console.error('Payment processing error:', err);
              setProcessing(false);
              alert('Payment processing failed. Please contact support.');
            }
          },
          modal: {
            ondismiss: function() {
              console.log('⚠️ Payment cancelled by user');
              setProcessing(false);
              // Payment entry remains with 'pending' status
            }
          }
        };
        
        const razorpay = new window.Razorpay(options);
        razorpay.open();
      };
      
      script.onerror = () => {
        console.error('Failed to load Razorpay script');
        setProcessing(false);
        alert('Failed to load payment gateway. Please try again.');
      };
    } catch (err) {
      console.error('Payment error:', err);
      setProcessing(false);
      alert('Payment failed: ' + (err.message || 'Please try again.'));
    }
  };
              
  const inp = (focused) => ({
    width: '100%',
    height: 48,
    borderRadius: 10,
    border: `1.5px solid ${focused ? '#3B5BFC' : '#E5E7EB'}`,
    padding: '0 16px 0 42px',
    fontSize: 14,
    color: '#1A1D2E',
    outline: 'none',
    background: focused ? '#F5F7FF' : '#FAFBFF',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s, background 0.2s',
    boxShadow: focused ? '0 0 0 3px rgba(59,91,252,0.10)' : 'none',
  });

  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', flexDirection: 'column',
      alignItems: 'flex-start',
      padding: '32px 56px 48px',
      overflowY: 'auto',
      boxSizing: 'border-box',
      position: 'relative',
    }}>
      {/* Background video */}
      <video
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260319_015952_e1deeb12-8fb7-4071-a42a-60779fc64ab6.mp4"
        autoPlay muted loop playsInline
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0, pointerEvents: 'none' }}
      />
      {/* Overlay */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(240,242,248,0.55)', zIndex: 1, pointerEvents: 'none' }} />
      {/* Content */}
      <div style={{ position: 'relative', zIndex: 2, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
      {/* Header — top-left, same as plan selection */}
      <div style={{ marginBottom: 24, width: '100%' }}>
        <button
          onClick={onBack}
          style={{ background: 'none', border: 'none', color: '#6B7280', fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6, padding: 0 }}
        >
          <ArrowLeft size={13} /> Back to plans
        </button>
        <h2 style={{ fontSize: 28, fontWeight: 800, color: '#1A1D2E', letterSpacing: '-0.8px', lineHeight: 1.2, marginBottom: 6 }}>Complete your order</h2>
        <p style={{ fontSize: 14, color: '#9CA3AF', marginBottom: 2 }}>Fill in your details to proceed with payment</p>
        <p style={{ fontSize: 12, color: '#6B7280' }}>Logged in as: <span style={{ fontWeight: 600, color: '#3B5BFC' }}>{email}</span></p>
      </div>

      {/* White card — centered horizontally */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
        <div style={{
          width: '100%', maxWidth: 520,
          background: '#fff',
          borderRadius: 24,
          padding: '32px 36px 28px',
          boxShadow: '0 4px 32px rgba(59,91,252,0.08), 0 1px 4px rgba(0,0,0,0.04)',
          border: '1px solid rgba(255,255,255,0.9)',
        }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

          {/* ── Section 1: Your Information ── */}
          <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 10 }}>
            Your Information
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 0 }}>
            {/* Full Name */}
            <div style={{ position: 'relative' }}>
              <User size={15} color="#9CA3AF" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', zIndex: 1 }} />
              <input
                required
                value={fullName}
                onChange={readOnly ? undefined : e => setFullName(e.target.value)}
                readOnly={readOnly}
                placeholder="Full Name"
                style={{ ...inp(nameFocus), background: readOnly ? '#F3F4F6' : undefined, cursor: readOnly ? 'default' : undefined }}
                onFocus={() => !readOnly && setNameFocus(true)}
                onBlur={() => setNameFocus(false)}
              />
            </div>
            {/* Phone */}
            <div style={{ position: 'relative' }}>
              <Phone size={15} color="#9CA3AF" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', zIndex: 1 }} />
              <input
                required
                type="tel"
                value={phone}
                onChange={readOnly ? undefined : e => setPhone(e.target.value.replace(/[^\d+\-\s()]/g, ''))}
                readOnly={readOnly}
                placeholder="Phone Number"
                style={{ ...inp(phoneFocus), background: readOnly ? '#F3F4F6' : undefined, cursor: readOnly ? 'default' : undefined }}
                onFocus={() => !readOnly && setPhoneFocus(true)}
                onBlur={() => setPhoneFocus(false)}
              />
            </div>
            {/* Email */}
            <div style={{ position: 'relative' }}>
              <AtSign size={15} color="#9CA3AF" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', zIndex: 1 }} />
              <input
                required
                type="email"
                value={userEmail}
                readOnly={true}
                placeholder="Email Address"
                style={{ ...inp(false), background: '#F3F4F6', cursor: 'default', color: '#6B7280' }}
              />
            </div>
          </div>

          <Divider />

          {/* ── Section 2: Plan Summary ── */}
          <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 10 }}>
            Plan Summary
          </div>
          {/* Plan header row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: `${activePlan.color}08`, borderRadius: 12, border: `1.5px solid ${activePlan.color}20`, marginBottom: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: `${activePlan.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Check size={16} color={activePlan.color} strokeWidth={2.5} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#1A1D2E' }}>{activePlan.name} Plan</div>
              <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 1 }}>
                {activeBillingCycle === 'yearly' ? 'Billed yearly' : activePlan.period === 'one-time' ? 'One-time payment' : 'Billed monthly'}
                {' · '}Up to {activePlan.users}{typeof activePlan.users === 'number' ? ' users' : ''}
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, color: activePlan.color, marginTop: 4 }}>
                Active till{' '}
                {(() => {
                  if (activePlan.period === 'one-time') return 'Lifetime';
                  
                  // Calculate preview expiry date using ORIGINAL expiry (captured on mount)
                  // This prevents double-counting when Header already updated the preview
                  
                  let d;
                  
                  // Check if current plan is active (not expired) using ORIGINAL timestamp
                  const isCurrentPlanActive = originalExpiryTimestamp 
                    ? (typeof originalExpiryTimestamp.toMillis === 'function' 
                        ? originalExpiryTimestamp.toMillis() >= Date.now()
                        : new Date(originalExpiryTimestamp).getTime() >= Date.now())
                    : (originalExpiryDate && new Date(originalExpiryDate) >= new Date());
                  
                  // Use ORIGINAL expiry date, not the updated one from context
                  if (isCurrentPlanActive && originalExpiryTimestamp) {
                    d = originalExpiryTimestamp.toDate ? originalExpiryTimestamp.toDate() : new Date(originalExpiryTimestamp);
                    console.log('📅 PlanSelection Preview: Starting from ORIGINAL expiry timestamp:', d);
                  } else {
                    d = new Date();
                    console.log('📅 PlanSelection Preview: Starting from today (new subscription)');
                  }
                  
                  // Duration coupon overrides the active period
                  if (couponApplied && couponApplied.type === 'duration' && couponApplied.duration) {
                    const { value, unit } = couponApplied.duration;
                    if (unit === 'months') d.setMonth(d.getMonth() + value);
                    else d.setDate(d.getDate() + value);
                    console.log('📅 PlanSelection Preview: Applied duration coupon:', value, unit, '→', d);
                  } else if (activeBillingCycle === 'yearly') {
                    d.setFullYear(d.getFullYear() + 1);
                    console.log('📅 PlanSelection Preview: Added 1 year →', d);
                  } else {
                    // Always add base 1 month subscription
                    d.setMonth(d.getMonth() + 1);
                    console.log('📅 PlanSelection Preview: Added 1 month →', d);
                  }
                  
                  // Add extra months (only if not using duration coupon)
                  // For active plans: extraMonths includes the base month (so extraMonths=1 means just base renewal)
                  // For new users: extraMonths is the total duration
                  if (extraMonths > 0 && !(couponApplied && couponApplied.type === 'duration')) {
                    // For active plans, extraMonths=1 means base renewal only (no additional months)
                    // For new users, extraMonths=1 means 1 month total (already added above)
                    const additionalMonths = isCurrentPlanActive ? Math.max(0, extraMonths - 1) : 0;
                    if (additionalMonths > 0) {
                      d.setMonth(d.getMonth() + additionalMonths);
                      console.log('📅 PlanSelection Preview: Added extra months:', additionalMonths, '→', d);
                    }
                  }
                  
                  const finalDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                  console.log('📅 PlanSelection: Final Active till date:', finalDate);
                  return finalDate;
                })()}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              {/* Quantity selector for extra months — hidden when a duration coupon is applied */}
              {!(couponApplied && couponApplied.type === 'duration') && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, marginBottom: 6 }}>
                  <button
                    type="button"
                    onClick={() => setExtraMonths(m => Math.max(1, m - 1))}
                    disabled={extraMonths <= 1}
                    style={{
                      width: 24, height: 24, borderRadius: 6,
                      background: extraMonths <= 1 ? '#F3F4F6' : '#fff',
                      border: `1.5px solid ${extraMonths <= 1 ? '#E5E7EB' : activePlan.color}`,
                      color: extraMonths <= 1 ? '#9CA3AF' : activePlan.color,
                      fontSize: 16, fontWeight: 700,
                      cursor: extraMonths <= 1 ? 'default' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >−</button>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#1A1D2E', minWidth: 20, textAlign: 'center' }}>{extraMonths}</span>
                  <button
                    type="button"
                    onClick={() => setExtraMonths(m => m + 1)}
                    style={{
                      width: 24, height: 24, borderRadius: 6,
                      background: '#fff',
                      border: `1.5px solid ${activePlan.color}`,
                      color: activePlan.color,
                      fontSize: 16, fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >+</button>
                </div>
              )}
              {/* Duration coupon — show fixed period badge instead of quantity */}
              {couponApplied && couponApplied.type === 'duration' && couponApplied.duration && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: 6 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 8,
                    background: '#ECFDF5', color: '#12C479', border: '1px solid #BBF7D0',
                  }}>
                    {couponApplied.duration.value} {couponApplied.duration.value === 1 
                      ? couponApplied.duration.unit.replace(/s$/, '') 
                      : couponApplied.duration.unit}
                  </span>
                </div>
              )}
              {/* Show pricing based on upgrade/downgrade */}
              <div style={{ fontSize: 18, fontWeight: 800, color: activePlan.color }}>
                ₹{pricing.selectedMonthlyRate.toLocaleString()}
              </div>
              <div style={{ fontSize: 11, color: '#9CA3AF' }}>/month</div>
            </div>
          </div>

          <Divider />

          {/* Pricing Breakdown - Only Total */}
          <div>
            {/* Total */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: `${activePlan.color}08`, borderRadius: 10 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#1A1D2E' }}>Total Amount</span>
              <span style={{ fontSize: 20, fontWeight: 800, color: activePlan.color }}>
                ₹{pricing.total.toLocaleString()}
              </span>
            </div>
          </div>

          <Divider />

          {/* ── Section 3: Coupon — collapsed behind + button ── */}
          <div>
            {!couponApplied && !couponOpen && (
              <button
                type="button"
                onClick={() => setCouponOpen(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#3B5BFC', fontSize: 13, fontWeight: 600 }}
              >
                <div style={{ width: 20, height: 20, borderRadius: 6, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Plus size={12} color="#3B5BFC" strokeWidth={2.5} />
                </div>
                Add coupon code
              </button>
            )}

            {couponOpen && !couponApplied && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>Coupon Code</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <Tag size={14} color="#9CA3AF" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                    <input
                      autoFocus
                      value={couponInput}
                      onChange={e => { setCouponInput(e.target.value.toUpperCase()); setCouponError(''); }}
                      placeholder="Enter code"
                      style={{ width: '100%', height: 44, borderRadius: 10, border: `1.5px solid ${couponError ? '#FCA5A5' : '#E5E7EB'}`, padding: '0 14px 0 38px', fontSize: 14, color: '#1A1D2E', outline: 'none', background: '#FAFBFF', boxSizing: 'border-box', transition: 'border-color 0.2s', letterSpacing: '0.5px', fontWeight: 600 }}
                      onFocus={e => e.target.style.borderColor = couponError ? '#FCA5A5' : '#3B5BFC'}
                      onBlur={e => e.target.style.borderColor = couponError ? '#FCA5A5' : '#E5E7EB'}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    style={{ padding: '0 18px', height: 44, borderRadius: 10, border: 'none', background: '#EEF2FF', color: '#3B5BFC', fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
                  >
                    Apply
                  </button>
                  <button
                    type="button"
                    onClick={() => { setCouponOpen(false); setCouponInput(''); setCouponError(''); }}
                    style={{ width: 44, height: 44, borderRadius: 10, border: '1.5px solid #E5E7EB', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
                  >
                    <X size={14} color="#9CA3AF" />
                  </button>
                </div>
                {couponError && <div style={{ fontSize: 12, color: '#EF4444', marginTop: 5, fontWeight: 500 }}>⚠ {couponError}</div>}
              </div>
            )}

            {couponApplied && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#ECFDF5', borderRadius: 10, border: '1.5px solid #BBF7D0' }}>
                <Tag size={13} color="#12C479" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#12C479' }}>Coupon Applied</div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#059669', letterSpacing: '0.5px', marginTop: 1 }}>{couponCode}</div>
                </div>
                {couponApplied.type === 'percentage' && (
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#12C479' }}>−₹{pricing.discount.toLocaleString()}</span>
                )}
                {couponApplied.type !== 'percentage' && couponApplied.duration && (
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#12C479' }}>
                    {couponApplied.duration.value} {couponApplied.duration.value === 1 
                      ? couponApplied.duration.unit.replace(/s$/, '') 
                      : couponApplied.duration.unit}
                  </span>
                )}
                <button type="button" onClick={handleRemoveCoupon} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0, marginLeft: 4 }}>
                  <X size={13} color="#9CA3AF" />
                </button>
              </div>
            )}
          </div>

          {/* ── Pay button ── */}
          <button
            type="submit"
            disabled={processing}
            style={{ width: '100%', height: 50, borderRadius: 12, border: 'none', background: `linear-gradient(135deg, ${activePlan.color}, ${activePlan.color}CC)`, color: '#fff', fontSize: 15, fontWeight: 700, cursor: processing ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: `0 6px 20px ${activePlan.color}35`, transition: 'transform 0.15s, box-shadow 0.2s', marginTop: 16 }}
            onMouseEnter={e => { if (!processing) e.currentTarget.style.boxShadow = `0 10px 28px ${activePlan.color}50`; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = `0 6px 20px ${activePlan.color}35`; }}
            onMouseDown={e => { if (!processing) e.currentTarget.style.transform = 'scale(0.97)'; }}
            onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            {processing ? (
              <span style={{ width: 18, height: 18, border: '2.5px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
            ) : pricing.total === 0 ? (
              <>
                Proceed
                <ArrowRight size={16} />
              </>
            ) : (
              <>
                <Lock size={14} />
                Pay ₹{pricing.total.toLocaleString()}
              </>
            )}
          </button>

          <p style={{ textAlign: 'center', fontSize: 11, color: '#C4C9D4', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 10 }}>
            <Lock size={10} /> Secured by 256-bit SSL encryption
          </p>
        </form>
        </div>
      </div>
      </div>
    </div>
  );
}

export default function PlanSelection({ email, workspaceId, onSelectPlan, onBack, onCancel, onProcessingStart, backText = 'Back to login', readOnly = false, activeTeamMembers = 0 }) {
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [checkoutPlan, setCheckoutPlan] = useState(null);
  const [showCustomize, setShowCustomize] = useState(false);

  const handlePlanSelect = (plan) => {
    if (plan.isCustom) { setShowCustomize(true); return; }
    
    // Check if plan has enough capacity for current active members
    if (typeof plan.users === 'number' && activeTeamMembers > plan.users) {
      return; // Don't allow selection if team is too large
    }
    
    setSelectedPlan(plan.id);
    setCheckoutPlan(plan);
  };

  const handleCheckoutConfirm = (plan, billingCycle, couponInfo) => {
    // Call onSelectPlan to trigger confetti and update the UI
    console.log('📋 Checkout confirmed, triggering confetti...', { plan, billingCycle, couponInfo });
    if (onSelectPlan) {
      onSelectPlan(plan, billingCycle, couponInfo);
    }
  };

  const getPrice = (plan) => {
    if (plan.period === 'one-time') return plan.price;
    if (billingCycle === 'yearly') return Math.round(plan.price * 12 * 0.8);
    return plan.price;
  };
  
  // Check if plan is disabled due to team size
  const isPlanDisabled = (plan) => {
    if (plan.isCustom) return false;
    return typeof plan.users === 'number' && activeTeamMembers > plan.users;
  };

  if (checkoutPlan) {
    return (
      <CheckoutStep
        plan={checkoutPlan}
        billingCycle={billingCycle}
        email={email}
        workspaceId={workspaceId}
        onBack={() => { setCheckoutPlan(null); setSelectedPlan(null); }}
        onConfirm={handleCheckoutConfirm}
        onCancel={onCancel}
        readOnly={readOnly}
      />
    );
  }

  return (
    <div className="plan-selection-enter" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch', padding: '20px 32px 20px', overflow: 'hidden', position: 'relative' }}>
      {/* Background video */}
      <video
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260319_015952_e1deeb12-8fb7-4071-a42a-60779fc64ab6.mp4"
        autoPlay
        muted
        loop
        playsInline
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }}
      />
      {/* Overlay */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(240,242,248,0.55)', zIndex: 1, pointerEvents: 'none' }} />
      {/* Content above video */}
      <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      {/* Header left + Toggle center — same row */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14, width: '100%', flexShrink: 0 }}>
        {/* Left: header */}
        <div style={{ flex: 1 }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#6B7280', fontSize: 12, fontWeight: 600, cursor: 'pointer', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6, padding: 0 }}>
            ← {backText}
          </button>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1A1D2E', letterSpacing: '-0.8px', lineHeight: 1.2, marginBottom: 3 }}>Choose Your Plan</h2>
          <p style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 1 }}>Select the perfect plan for your team</p>
          <p style={{ fontSize: 11, color: '#6B7280' }}>Logged in as: <span style={{ fontWeight: 600, color: '#3B5BFC' }}>{email}</span></p>
        </div>
        {/* Center: toggle */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: billingCycle === 'monthly' ? '#1A1D2E' : '#9CA3AF' }}>Monthly</span>
          <button
            onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
            style={{ width: 48, height: 26, borderRadius: 13, background: billingCycle === 'yearly' ? 'linear-gradient(135deg, #3B5BFC, #7C3AED)' : '#E5E7EB', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.3s ease' }}
          >
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: billingCycle === 'yearly' ? 25 : 3, transition: 'left 0.3s ease', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
          </button>
          <span style={{ fontSize: 13, fontWeight: 600, color: billingCycle === 'yearly' ? '#1A1D2E' : '#9CA3AF' }}>
            Yearly
            <span style={{ marginLeft: 5, fontSize: 10, fontWeight: 700, color: '#12C479', background: '#ECFDF5', padding: '2px 5px', borderRadius: 4 }}>Save 20%</span>
          </span>
        </div>
        {/* Right: spacer */}
        <div style={{ flex: 1 }} />
      </div>

      {/* Plans Grid */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', alignItems: 'stretch', alignContent: 'center', width: '100%', flex: 1 }}>
        {PLANS.map((plan) => {
          const price = getPrice(plan);
          const isSelected = selectedPlan === plan.id;
          const isDisabled = isPlanDisabled(plan);

          if (plan.isCustom) {
            return (
              <div
                key={plan.id}
                onClick={() => handlePlanSelect(plan)}
                style={{ background: 'linear-gradient(135deg, #FDF2F8 0%, #FCE7F3 50%, #FFF1F2 100%)', borderRadius: 16, padding: '18px 16px', border: `2px dashed ${plan.color}`, cursor: 'pointer', position: 'relative', transition: 'all 0.2s ease', width: 'calc(33.33% - 8px)', minWidth: 160, boxSizing: 'border-box', transform: isSelected ? 'scale(1.02)' : 'scale(1)', boxShadow: isSelected ? `0 8px 24px ${plan.color}30` : '0 2px 8px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)'; e.currentTarget.style.boxShadow = `0 12px 32px ${plan.color}40`; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'; }}
              >
                <div style={{ marginBottom: 12, textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: `linear-gradient(135deg, ${plan.color}, #F43F5E)`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', boxShadow: `0 8px 20px ${plan.color}40` }}>
                    <Mail size={24} color="#fff" />
                  </div>
                  <h3 style={{ fontSize: 17, fontWeight: 800, color: '#1A1D2E', marginBottom: 3 }}>{plan.name}</h3>
                  <div style={{ marginBottom: 4 }}>
                    <span style={{ fontSize: 24, fontWeight: 800, background: `linear-gradient(135deg, ${plan.color}, #F43F5E)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', letterSpacing: '-0.5px' }}>Let's Talk</span>
                  </div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', marginBottom: 10 }}>Tailored for your needs</p>
                </div>
                <button
                  style={{ width: '100%', height: 38, borderRadius: 10, border: 'none', background: `linear-gradient(135deg, ${plan.color}, #F43F5E)`, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', marginTop: 'auto', boxShadow: `0 4px 12px ${plan.color}40`, transition: 'transform 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                >
                  Contact Sales
                </button>
              </div>
            );
          }

          return (
            <div
              key={plan.id}
              onClick={() => !isDisabled && handlePlanSelect(plan)}
              style={{ 
                background: '#fff', 
                borderRadius: 16, 
                padding: '18px 16px', 
                border: `2px solid ${isSelected ? plan.color : '#E5E7EB'}`, 
                cursor: isDisabled ? 'not-allowed' : 'pointer', 
                position: 'relative', 
                transition: 'all 0.2s ease', 
                width: 'calc(33.33% - 8px)', 
                minWidth: 160, 
                boxSizing: 'border-box', 
                transform: isSelected ? 'scale(1.02)' : 'scale(1)', 
                boxShadow: isSelected ? `0 8px 24px ${plan.color}30` : '0 2px 8px rgba(0,0,0,0.04)', 
                display: 'flex', 
                flexDirection: 'column',
                opacity: 1,
                pointerEvents: 'auto'
              }}
              onMouseEnter={e => { if (!isSelected && !isDisabled) { e.currentTarget.style.borderColor = plan.color; e.currentTarget.style.transform = 'translateY(-3px)'; } }}
              onMouseLeave={e => { if (!isSelected && !isDisabled) { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.transform = 'translateY(0)'; } }}
              title={isDisabled ? `Cannot downgrade: You have ${activeTeamMembers} active members (limit: ${plan.users})` : ''}
            >
              {isDisabled && (
                <div style={{ position: 'absolute', top: -10, right: 16, background: '#EF4444', color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 10, boxShadow: '0 4px 12px rgba(239,68,68,0.3)', letterSpacing: '0.5px' }}>LIMIT</div>
              )}
              {plan.popular && !isDisabled && (
                <div style={{ position: 'absolute', top: -9, right: 16, background: 'linear-gradient(135deg, #3B5BFC, #7C3AED)', color: '#fff', fontSize: 9, fontWeight: 700, padding: '3px 10px', borderRadius: 10, boxShadow: '0 4px 12px rgba(59,91,252,0.3)' }}>POPULAR</div>
              )}
              <div style={{ marginBottom: 10 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1A1D2E', marginBottom: 3 }}>{plan.name}</h3>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 3, marginBottom: 4 }}>
                  <span style={{ fontSize: 28, fontWeight: 800, color: plan.color, letterSpacing: '-1px' }}>₹{price.toLocaleString()}</span>
                  {plan.period !== 'one-time' && (
                    <span style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 500 }}>/{billingCycle === 'yearly' ? 'yr' : 'mo'}</span>
                  )}
                </div>
                <p style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', marginBottom: 10 }}>
                  {plan.id === 'lifetime' ? '♾ Unlimited team members' : `Up to ${plan.users}${typeof plan.users === 'number' ? ' users' : ''}`}
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7, flex: 1 }}>
                {plan.features.map((feature, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div style={{ width: 16, height: 16, borderRadius: '50%', background: `${plan.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Check size={10} color={plan.color} strokeWidth={3} />
                    </div>
                    <span style={{ fontSize: 12, color: '#4B5563' }}>{feature}</span>
                  </div>
                ))}
              </div>
              <button
                disabled={isDisabled}
                style={{ 
                  width: '100%', 
                  height: 38, 
                  borderRadius: 10, 
                  border: 'none', 
                  background: isDisabled ? '#F3F4F6' : (isSelected ? plan.color : `${plan.color}12`), 
                  color: isDisabled ? '#9CA3AF' : (isSelected ? '#fff' : plan.color), 
                  fontSize: 13, 
                  fontWeight: 700, 
                  cursor: isDisabled ? 'not-allowed' : 'pointer', 
                  marginTop: 14, 
                  transition: 'all 0.2s', 
                  flexShrink: 0,
                  opacity: isDisabled ? 0.6 : 1
                }}
                onMouseEnter={e => { if (!isDisabled) { e.currentTarget.style.background = plan.color; e.currentTarget.style.color = '#fff'; } }}
                onMouseLeave={e => { if (!isDisabled) { e.currentTarget.style.background = isSelected ? plan.color : `${plan.color}12`; e.currentTarget.style.color = isSelected ? '#fff' : plan.color; } }}
              >
                {isSelected ? 'Selected' : 'Select Plan'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Customize Modal */}
      {showCustomize && (
        <div
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setShowCustomize(false)}
        >
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 20, padding: '32px', maxWidth: 500, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <h3 style={{ fontSize: 24, fontWeight: 800, color: '#1A1D2E', marginBottom: 12 }}>Contact Team</h3>
            <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 24 }}>Tell us about your requirements. We'll respond within 24 hours with a tailored solution.</p>
            <input 
              type="email" 
              placeholder="Your email" 
              value={email} 
              readOnly 
              style={{ width: '100%', height: 48, borderRadius: 10, border: '1.5px solid #E5E7EB', padding: '0 16px', fontSize: 14, marginBottom: 12, outline: 'none', background: '#F3F4F6', cursor: 'default', color: '#6B7280', boxSizing: 'border-box' }} 
            />
            <textarea 
              id="custom-requirements"
              placeholder="Describe your requirements..." 
              style={{ width: '100%', height: 120, borderRadius: 10, border: '1.5px solid #E5E7EB', padding: '12px 16px', fontSize: 14, marginBottom: 16, outline: 'none', resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} 
            />
            <div style={{ display: 'flex', gap: 12 }}>
              <button 
                onClick={() => setShowCustomize(false)} 
                style={{ flex: 1, height: 44, borderRadius: 10, border: '1.5px solid #E5E7EB', background: '#fff', color: '#6B7280', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                onClick={async () => { 
                  const description = document.getElementById('custom-requirements').value.trim();
                  
                  if (!description) {
                    alert('Please describe your requirements');
                    return;
                  }
                  
                  try {
                    // Get current user and workspace info
                    const { getAuth } = await import('firebase/auth');
                    const auth = getAuth();
                    const currentUid = auth.currentUser?.uid;
                    
                    if (!currentUid) {
                      alert('You must be logged in to submit a request');
                      return;
                    }
                    
                    // Get workspace ID
                    let wsId = workspaceId || currentUser?.workspaceId;
                    
                    if (!wsId) {
                      const { getProfile } = await import('../lib/userProfileService');
                      const profile = await getProfile(currentUid);
                      wsId = profile?.workspaceId || `ws_${currentUid}`;
                    }
                    
                    // Save to Firestore - Create NEW entry each time
                    const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
                    const { db } = await import('../lib/firebase');
                    
                    const requestId = `${wsId}_${Date.now()}`;
                    console.log('💾 Creating new custom plan request:', requestId);
                    
                    await addDoc(collection(db, 'customPlanRequests'), {
                      workspaceId: wsId,
                      email: email,
                      description: description,
                      requestDate: serverTimestamp(),
                      status: 'pending',
                      requestId: requestId,
                    });
                    
                    console.log('✅ Custom plan request created:', requestId);
                    
                    // Close custom modal first
                    setShowCustomize(false);
                    
                    // Close entire plan selection panel
                    if (onCancel) {
                      setTimeout(() => {
                        onCancel();
                      }, 100);
                    }
                    
                    // Show toast after panel closes
                    setTimeout(() => {
                      toast.success('Submitted');
                    }, 400);
                  } catch (err) {
                    console.error('❌ Failed to save custom plan request:', err);
                    toast.error('Failed to submit request. Please try again.');
                  }
                }} 
                style={{ flex: 1, height: 44, borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #3B5BFC, #7C3AED)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
