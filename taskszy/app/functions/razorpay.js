const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const Razorpay = require('razorpay');
const crypto = require('crypto');

// ══════════════════════════════════════════════════════════════════════
// RAZORPAY CONFIGURATION
// ══════════════════════════════════════════════════════════════════════

// Use environment variables for Razorpay keys
// For local development, create functions/.env file with:
// RAZORPAY_KEY_ID=rzp_live_SwQkTJ7VdTAUhE
// RAZORPAY_KEY_SECRET=c2Ot2dlkie0wDWlem2OHc1qO

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_live_SwQkTJ7VdTAUhE';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'c2Ot2dlkie0wDWlem2OHc1qO';

const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});

// ══════════════════════════════════════════════════════════════════════
// PLAN PRICING CONFIGURATION
// ══════════════════════════════════════════════════════════════════════

const PLAN_PRICES = {
  starter: {
    monthly: 1599,
    yearly: 15350, // 1599 * 12 * 0.8 (20% discount)
  },
  professional: {
    monthly: 2499,
    yearly: 23990, // 2499 * 12 * 0.8
  },
  business: {
    monthly: 4599,
    yearly: 44150, // 4599 * 12 * 0.8
  },
  enterprise: {
    monthly: 7199,
    yearly: 69110, // 7199 * 12 * 0.8
  },
};

// ══════════════════════════════════════════════════════════════════════
// HELPER: CALCULATE FINAL AMOUNT
// ══════════════════════════════════════════════════════════════════════

async function calculateFinalAmount(plan, billingCycle, couponCode, quantity = 1) {
  const db = getFirestore();
  
  // Get base price
  if (!PLAN_PRICES[plan] || !PLAN_PRICES[plan][billingCycle]) {
    throw new HttpsError('invalid-argument', 'Invalid plan or billing cycle.');
  }
  
  let basePrice = PLAN_PRICES[plan][billingCycle] * quantity;
  let discount = 0;
  let couponData = null;
  
  // Apply coupon if provided
  if (couponCode) {
    const couponSnapshot = await db.collection('coupons')
      .where('code', '==', couponCode.toUpperCase())
      .where('active', '==', true)
      .limit(1)
      .get();
    
    if (couponSnapshot.empty) {
      throw new HttpsError('invalid-argument', 'Invalid or inactive coupon code.');
    }
    
    couponData = { id: couponSnapshot.docs[0].id, ...couponSnapshot.docs[0].data() };
    
    // Check usage limit
    if (couponData.limit && couponData.used >= couponData.limit) {
      throw new HttpsError('invalid-argument', 'Coupon usage limit exceeded.');
    }
    
    // Check plan restriction
    if (couponData.plan && couponData.plan !== 'all' && couponData.plan !== plan) {
      throw new HttpsError('invalid-argument', `This coupon is only valid for the ${couponData.plan} plan.`);
    }
    
    // Calculate discount
    if (couponData.type === 'percentage') {
      discount = Math.round(basePrice * couponData.value / 100);
    } else if (couponData.type === 'duration') {
      // Duration coupon: fixed price override
      basePrice = couponData.value || 0;
      discount = 0;
    }
  }
  
  const finalAmount = Math.max(0, basePrice - discount);
  
  return {
    basePrice,
    discount,
    finalAmount,
    couponData,
  };
}

// ══════════════════════════════════════════════════════════════════════
// CLOUD FUNCTION: CREATE RAZORPAY ORDER
// ══════════════════════════════════════════════════════════════════════

exports.createRazorpayOrder = onCall({
  enforceAppCheck: false,
  cors: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'https://taskzy-9c2e5.web.app', 'https://taskzy-9c2e5.firebaseapp.com', 'https://taskszy.com', 'https://www.taskszy.com'],
  region: 'us-central1',
}, async (request) => {
  try {
    console.log('🔵 createRazorpayOrder called by UID:', request.auth?.uid);
    
    // ══════════════════════════════════════════════════════════════════════
    // 1. AUTHENTICATION CHECK
    // ══════════════════════════════════════════════════════════════════════
    
    if (!request.auth) {
      console.error('❌ No authentication');
      throw new HttpsError('unauthenticated', 'Must be signed in.');
    }

    const { plan, billingCycle, couponCode, workspaceId, quantity = 1 } = request.data;
    console.log('📦 Request data:', { plan, billingCycle, couponCode, workspaceId, quantity });

    // ══════════════════════════════════════════════════════════════════════
    // 2. VALIDATE INPUT
    // ══════════════════════════════════════════════════════════════════════
    
    if (!plan || !billingCycle || !workspaceId) {
      console.error('❌ Missing required fields');
      throw new HttpsError('invalid-argument', 'Missing required fields: plan, billingCycle, workspaceId.');
    }

    if (!['starter', 'professional', 'business', 'enterprise'].includes(plan)) {
      console.error('❌ Invalid plan:', plan);
      throw new HttpsError('invalid-argument', 'Invalid plan.');
    }

    if (!['monthly', 'yearly'].includes(billingCycle)) {
      console.error('❌ Invalid billing cycle:', billingCycle);
      throw new HttpsError('invalid-argument', 'Invalid billing cycle.');
    }

    const db = getFirestore();

    // ══════════════════════════════════════════════════════════════════════
    // 3. AUTHORIZATION CHECK (RELAXED FOR EXISTING USERS)
    // ══════════════════════════════════════════════════════════════════════
    
    try {
      const callerDoc = await db.doc(`users/${request.auth.uid}`).get();
      console.log('👤 User document exists:', callerDoc.exists);
      
      if (callerDoc.exists) {
        const callerData = callerDoc.data();
        console.log('📄 User data:', { workspaceId: callerData.workspaceId, role: callerData.role });
        
        // Only check workspace match if user has a workspaceId set
        if (callerData.workspaceId && callerData.workspaceId !== workspaceId) {
          console.error('❌ Workspace mismatch:', { userWorkspaceId: callerData.workspaceId, providedWorkspaceId: workspaceId });
          throw new HttpsError('permission-denied', `Workspace mismatch. Your workspace: ${callerData.workspaceId}, Requested: ${workspaceId}`);
        }
      } else {
        console.warn('⚠️ User profile not found, but allowing for new signups');
      }
    } catch (error) {
      console.error('❌ Authorization check failed:', error);
      throw error;
    }

    // ══════════════════════════════════════════════════════════════════════
    // 4. CALCULATE FINAL AMOUNT (BACKEND VALIDATION)
    // ══════════════════════════════════════════════════════════════════════
    
    console.log('💰 Calculating final amount...');
    const { basePrice, discount, finalAmount, couponData } = await calculateFinalAmount(
      plan,
      billingCycle,
      couponCode,
      quantity
    );
    console.log('💵 Pricing:', { basePrice, discount, finalAmount });

    // If amount is zero (free due to coupon), skip Razorpay order creation
    if (finalAmount === 0) {
      console.log('🎁 Free order (100% discount)');
      return {
        success: true,
        isFree: true,
        orderId: null,
        amount: 0,
        basePrice,
        discount,
        couponData: couponData ? {
          id: couponData.id,
          code: couponData.code,
          type: couponData.type,
          value: couponData.value,
          duration: couponData.duration,
        } : null,
      };
    }

    // ══════════════════════════════════════════════════════════════════════
    // 5. CREATE RAZORPAY ORDER
    // ══════════════════════════════════════════════════════════════════════
    
    // Generate a short receipt ID (max 40 chars for Razorpay)
    const timestamp = Date.now().toString().slice(-8); // Last 8 digits of timestamp
    const wsShort = workspaceId.slice(-8); // Last 8 chars of workspace ID
    const receiptId = `ord_${wsShort}_${timestamp}`; // Format: ord_12345678_12345678 (max 27 chars)
    
    try {
      console.log('🔷 Creating Razorpay order...');
      console.log('🔑 Razorpay instance:', razorpay ? 'initialized' : 'NOT initialized');
      console.log('🔑 Razorpay key_id:', RAZORPAY_KEY_ID);
      console.log('📝 Receipt ID:', receiptId, '(length:', receiptId.length, ')');
      
      const orderData = {
        amount: finalAmount * 100, // Convert to paise
        currency: 'INR',
        receipt: receiptId,
        notes: {
          plan,
          billingCycle,
          couponCode: couponCode || '',
          userId: request.auth.uid,
          workspaceId,
          quantity: quantity.toString(),
          basePrice: basePrice.toString(),
          discount: discount.toString(),
        },
      };
      console.log('📋 Order data:', JSON.stringify(orderData, null, 2));
      
      const order = await razorpay.orders.create(orderData);
      console.log('✅ Razorpay order created:', order.id);

      // ══════════════════════════════════════════════════════════════════════
      // 6. STORE ORDER IN FIRESTORE (FOR VERIFICATION)
      // ══════════════════════════════════════════════════════════════════════
      
      await db.collection('razorpayOrders').doc(order.id).set({
        orderId: order.id,
        workspaceId,
        userId: request.auth.uid,
        plan,
        billingCycle,
        quantity,
        basePrice,
        discount,
        finalAmount,
        couponCode: couponCode || null,
        couponId: couponData?.id || null,
        status: 'created',
        createdAt: FieldValue.serverTimestamp(),
      });
      console.log('✅ Order saved to Firestore');

      // ══════════════════════════════════════════════════════════════════════
      // 7. RETURN ORDER DETAILS
      // ══════════════════════════════════════════════════════════════════════
      
      return {
        success: true,
        isFree: false,
        orderId: order.id,
        amount: finalAmount,
        basePrice,
        discount,
        couponData: couponData ? {
          id: couponData.id,
          code: couponData.code,
          type: couponData.type,
          value: couponData.value,
          duration: couponData.duration,
        } : null,
      };
    } catch (err) {
      console.error('❌ Razorpay order creation failed:', err);
      console.error('❌ Error name:', err.name);
      console.error('❌ Error message:', err.message);
      console.error('❌ Error code:', err.code);
      console.error('❌ Error statusCode:', err.statusCode);
      console.error('❌ Error description:', err.description);
      console.error('❌ Full error:', JSON.stringify(err, null, 2));
      console.error('❌ Error stack:', err.stack);
      
      const errorMsg = err.message || err.description || err.error?.description || 'Unknown Razorpay error';
      throw new HttpsError('internal', 'Failed to create payment order: ' + errorMsg);
    }
  } catch (error) {
    // Catch any unhandled errors
    console.error('❌ Unhandled error in createRazorpayOrder:', error);
    console.error('❌ Error type:', error.constructor.name);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error stack:', error.stack);
    
    // Re-throw HttpsError as-is, wrap others
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', `Unexpected error: ${error.message || 'Unknown error'}`);
  }
});

// ══════════════════════════════════════════════════════════════════════
// CLOUD FUNCTION: VERIFY PAYMENT SIGNATURE
// ══════════════════════════════════════════════════════════════════════

exports.verifyRazorpayPayment = onCall({
  enforceAppCheck: false,
  cors: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'https://taskzy-9c2e5.web.app', 'https://taskzy-9c2e5.firebaseapp.com', 'https://taskszy.com', 'https://www.taskszy.com'],
  region: 'us-central1',
}, async (request) => {
  // ══════════════════════════════════════════════════════════════════════
  // 1. AUTHENTICATION CHECK
  // ══════════════════════════════════════════════════════════════════════
  
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be signed in.');
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = request.data;

  // ══════════════════════════════════════════════════════════════════════
  // 2. VALIDATE INPUT
  // ══════════════════════════════════════════════════════════════════════
  
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    throw new HttpsError('invalid-argument', 'Missing payment verification data.');
  }

  const db = getFirestore();

  // ══════════════════════════════════════════════════════════════════════
  // 3. VERIFY SIGNATURE
  // ══════════════════════════════════════════════════════════════════════
  
  const generatedSignature = crypto
    .createHmac('sha256', RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (generatedSignature !== razorpay_signature) {
    throw new HttpsError('invalid-argument', 'Invalid payment signature.');
  }

  // ══════════════════════════════════════════════════════════════════════
  // 4. GET ORDER DETAILS FROM FIRESTORE
  // ══════════════════════════════════════════════════════════════════════
  
  const orderDoc = await db.collection('razorpayOrders').doc(razorpay_order_id).get();
  
  if (!orderDoc.exists) {
    throw new HttpsError('not-found', 'Order not found.');
  }

  const orderData = orderDoc.data();

  // Check if already processed
  if (orderData.status === 'completed') {
    throw new HttpsError('already-exists', 'Payment already processed.');
  }

  // Verify user authorization
  if (orderData.userId !== request.auth.uid) {
    throw new HttpsError('permission-denied', 'Not authorized for this order.');
  }

  // ══════════════════════════════════════════════════════════════════════
  // 5. CALCULATE EXPIRY DATE
  // ══════════════════════════════════════════════════════════════════════
  
  const now = new Date();
  let expiryDate = new Date(now);
  
  // Check if coupon has duration override
  if (orderData.couponId) {
    const couponDoc = await db.collection('coupons').doc(orderData.couponId).get();
    if (couponDoc.exists) {
      const couponData = couponDoc.data();
      if (couponData.type === 'duration' && couponData.duration) {
        const { value, unit } = couponData.duration;
        if (unit === 'months') {
          expiryDate.setMonth(expiryDate.getMonth() + value * orderData.quantity);
        } else if (unit === 'days') {
          expiryDate.setDate(expiryDate.getDate() + value * orderData.quantity);
        }
      } else {
        // Regular percentage coupon - use billing cycle
        if (orderData.billingCycle === 'yearly') {
          expiryDate.setFullYear(expiryDate.getFullYear() + orderData.quantity);
        } else {
          expiryDate.setMonth(expiryDate.getMonth() + orderData.quantity);
        }
      }
    }
  } else {
    // No coupon - use billing cycle
    if (orderData.billingCycle === 'yearly') {
      expiryDate.setFullYear(expiryDate.getFullYear() + orderData.quantity);
    } else {
      expiryDate.setMonth(expiryDate.getMonth() + orderData.quantity);
    }
  }

  // ══════════════════════════════════════════════════════════════════════
  // 6. UPDATE WORKSPACE PLAN
  // ══════════════════════════════════════════════════════════════════════
  
  try {
    await db.doc(`workspaces/${orderData.workspaceId}`).set({
      plan: {
        name: orderData.plan.charAt(0).toUpperCase() + orderData.plan.slice(1),
        billingCycle: orderData.billingCycle,
        amountPaid: orderData.finalAmount,
        couponUsed: orderData.couponCode || null,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        activatedAt: FieldValue.serverTimestamp(),
        expiryDate: expiryDate.toISOString(),
        isActive: true,
        quantity: orderData.quantity,
      },
    }, { merge: true });

    // ══════════════════════════════════════════════════════════════════════
    // 7. UPDATE ORDER STATUS
    // ══════════════════════════════════════════════════════════════════════
    
    await db.collection('razorpayOrders').doc(razorpay_order_id).update({
      status: 'completed',
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
      completedAt: FieldValue.serverTimestamp(),
    });

    // ══════════════════════════════════════════════════════════════════════
    // 8. INCREMENT COUPON USAGE
    // ══════════════════════════════════════════════════════════════════════
    
    if (orderData.couponId) {
      await db.collection('coupons').doc(orderData.couponId).update({
        used: FieldValue.increment(1),
      });
    }

    // ══════════════════════════════════════════════════════════════════════
    // 9. LOG ACTIVITY
    // ══════════════════════════════════════════════════════════════════════
    
    try {
      await db.collection(`workspaces/${orderData.workspaceId}/activity`).add({
        type: 'payment',
        title: 'Plan Upgraded',
        sub: `${orderData.plan} — ${orderData.billingCycle} — ₹${orderData.finalAmount}`,
        time: FieldValue.serverTimestamp(),
        createdBy: request.auth.uid,
      });
    } catch (err) {
      console.error('Failed to log activity:', err);
    }

    // ══════════════════════════════════════════════════════════════════════
    // 10. RETURN SUCCESS
    // ══════════════════════════════════════════════════════════════════════
    
    return {
      success: true,
      message: 'Payment verified and plan activated successfully.',
      expiryDate: expiryDate.toISOString(),
    };
  } catch (err) {
    console.error('Failed to update workspace plan:', err);
    throw new HttpsError('internal', 'Payment verified but failed to activate plan: ' + err.message);
  }
});

// ══════════════════════════════════════════════════════════════════════
// CLOUD FUNCTION: ACTIVATE FREE PLAN (ZERO AMOUNT)
// ══════════════════════════════════════════════════════════════════════

exports.activateFreePlan = onCall({
  enforceAppCheck: false,
  cors: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'https://taskzy-9c2e5.web.app', 'https://taskzy-9c2e5.firebaseapp.com', 'https://taskszy.com', 'https://www.taskszy.com'],
  region: 'us-central1',
}, async (request) => {
  // ══════════════════════════════════════════════════════════════════════
  // 1. AUTHENTICATION CHECK
  // ══════════════════════════════════════════════════════════════════════
  
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be signed in.');
  }

  const { plan, billingCycle, couponCode, workspaceId, quantity = 1 } = request.data;

  // ══════════════════════════════════════════════════════════════════════
  // 2. VALIDATE INPUT
  // ══════════════════════════════════════════════════════════════════════
  
  if (!plan || !billingCycle || !workspaceId) {
    throw new HttpsError('invalid-argument', 'Missing required fields.');
  }

  const db = getFirestore();

  // ══════════════════════════════════════════════════════════════════════
  // 3. AUTHORIZATION CHECK (RELAXED FOR EXISTING USERS)
  // ══════════════════════════════════════════════════════════════════════
  
  try {
    const callerDoc = await db.doc(`users/${request.auth.uid}`).get();
    
    if (callerDoc.exists) {
      const callerData = callerDoc.data();
      
      // Only check workspace match if user has a workspaceId set
      if (callerData.workspaceId && callerData.workspaceId !== workspaceId) {
        throw new HttpsError('permission-denied', `Workspace mismatch. Your workspace: ${callerData.workspaceId}, Requested: ${workspaceId}`);
      }
    }
  } catch (error) {
    console.error('Authorization check failed:', error);
    throw error;
  }

  // ══════════════════════════════════════════════════════════════════════
  // 4. VERIFY AMOUNT IS ZERO
  // ══════════════════════════════════════════════════════════════════════
  
  const { finalAmount, couponData } = await calculateFinalAmount(
    plan,
    billingCycle,
    couponCode,
    quantity
  );

  if (finalAmount !== 0) {
    throw new HttpsError('invalid-argument', 'This function is only for free plans (amount = 0).');
  }

  // ══════════════════════════════════════════════════════════════════════
  // 5. CALCULATE EXPIRY DATE
  // ══════════════════════════════════════════════════════════════════════
  
  const now = new Date();
  let expiryDate = new Date(now);
  
  if (couponData && couponData.type === 'duration' && couponData.duration) {
    const { value, unit } = couponData.duration;
    if (unit === 'months') {
      expiryDate.setMonth(expiryDate.getMonth() + value * quantity);
    } else if (unit === 'days') {
      expiryDate.setDate(expiryDate.getDate() + value * quantity);
    }
  } else {
    if (billingCycle === 'yearly') {
      expiryDate.setFullYear(expiryDate.getFullYear() + quantity);
    } else {
      expiryDate.setMonth(expiryDate.getMonth() + quantity);
    }
  }

  // ══════════════════════════════════════════════════════════════════════
  // 6. UPDATE WORKSPACE PLAN
  // ══════════════════════════════════════════════════════════════════════
  
  try {
    await db.doc(`workspaces/${workspaceId}`).set({
      plan: {
        name: plan.charAt(0).toUpperCase() + plan.slice(1),
        billingCycle,
        amountPaid: 0,
        couponUsed: couponCode || null,
        razorpayOrderId: null,
        razorpayPaymentId: null,
        activatedAt: FieldValue.serverTimestamp(),
        expiryDate: expiryDate.toISOString(),
        isActive: true,
        quantity,
      },
    }, { merge: true });

    // ══════════════════════════════════════════════════════════════════════
    // 7. INCREMENT COUPON USAGE
    // ══════════════════════════════════════════════════════════════════════
    
    if (couponData) {
      await db.collection('coupons').doc(couponData.id).update({
        used: FieldValue.increment(1),
      });
    }

    // ══════════════════════════════════════════════════════════════════════
    // 8. LOG ACTIVITY
    // ══════════════════════════════════════════════════════════════════════
    
    try {
      await db.collection(`workspaces/${workspaceId}/activity`).add({
        type: 'payment',
        title: 'Plan Activated',
        sub: `${plan} — ${billingCycle} — Free (Coupon: ${couponCode})`,
        time: FieldValue.serverTimestamp(),
        createdBy: request.auth.uid,
      });
    } catch (err) {
      console.error('Failed to log activity:', err);
    }

    // ══════════════════════════════════════════════════════════════════════
    // 9. RETURN SUCCESS
    // ══════════════════════════════════════════════════════════════════════
    
    return {
      success: true,
      message: 'Free plan activated successfully.',
      expiryDate: expiryDate.toISOString(),
    };
  } catch (err) {
    console.error('Failed to activate free plan:', err);
    throw new HttpsError('internal', 'Failed to activate plan: ' + err.message);
  }
});
