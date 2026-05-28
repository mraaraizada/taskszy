import { db } from './firebase';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';

/**
 * Check if a workspace can use a coupon
 * @param {string} couponCode - The coupon code to check
 * @param {string} workspaceId - The workspace ID
 * @returns {Promise<{eligible: boolean, error?: string, coupon?: Object}>}
 */
export async function checkCouponEligibility(couponCode, workspaceId) {
  try {
    console.log('🎟️ CouponService: Checking eligibility', { couponCode, workspaceId });
    
    if (!couponCode || !workspaceId) {
      return { eligible: false, error: 'Invalid coupon code' };
    }
    
    // Find coupon by code
    const { collection, query, where, getDocs } = await import('firebase/firestore');
    const couponsRef = collection(db, 'coupons');
    const q = query(couponsRef, where('code', '==', couponCode.toUpperCase()));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return { eligible: false, error: 'Invalid coupon code' };
    }
    
    const couponDoc = snapshot.docs[0];
    const coupon = { id: couponDoc.id, ...couponDoc.data() };
    
    // Check if coupon is active
    if (!coupon.active) {
      return { eligible: false, error: 'Invalid coupon code' };
    }
    
    // Check total count limit (across all workspaces)
    if (coupon.totalCountLimit && coupon.totalCountLimit > 0) {
      const totalUsed = coupon.totalUsed || 0;
      
      if (totalUsed >= coupon.totalCountLimit) {
        return { 
          eligible: false, 
          error: 'Invalid coupon code' 
        };
      }
    }
    
    // Check workspace usage limit
    if (coupon.limit && coupon.limit > 0) {
      const workspaceUsage = coupon.usageByWorkspace?.[workspaceId] || 0;
      
      if (workspaceUsage >= coupon.limit) {
        return { 
          eligible: false, 
          error: 'Invalid coupon code'
        };
      }
    }
    
    console.log('✅ CouponService: Coupon is eligible', { couponCode, workspaceId });
    
    return { eligible: true, coupon };
  } catch (error) {
    console.error('❌ CouponService: Error checking eligibility', error);
    return { eligible: false, error: 'Invalid coupon code' };
  }
}

/**
 * Increment coupon usage for a workspace
 * @param {string} couponId - The coupon document ID
 * @param {string} workspaceId - The workspace ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function incrementCouponUsage(couponId, workspaceId) {
  try {
    console.log('📈 CouponService: Incrementing usage', { couponId, workspaceId });
    
    if (!couponId || !workspaceId) {
      return { success: false, error: 'Missing coupon ID or workspace ID' };
    }
    
    const couponRef = doc(db, 'coupons', couponId);
    
    // Increment total usage and workspace-specific usage
    await updateDoc(couponRef, {
      totalUsed: increment(1),
      [`usageByWorkspace.${workspaceId}`]: increment(1),
    });
    
    console.log('✅ CouponService: Usage incremented', { couponId, workspaceId });
    
    return { success: true };
  } catch (error) {
    console.error('❌ CouponService: Error incrementing usage', error);
    return { success: false, error: 'Failed to update coupon usage' };
  }
}

/**
 * Get coupon usage statistics
 * @param {string} couponId - The coupon document ID
 * @returns {Promise<{totalUsed: number, usageByWorkspace: Object, limit: number}>}
 */
export async function getCouponUsage(couponId) {
  try {
    const couponRef = doc(db, 'coupons', couponId);
    const couponDoc = await getDoc(couponRef);
    
    if (!couponDoc.exists()) {
      return { totalUsed: 0, usageByWorkspace: {}, limit: 0 };
    }
    
    const data = couponDoc.data();
    return {
      totalUsed: data.totalUsed || 0,
      usageByWorkspace: data.usageByWorkspace || {},
      limit: data.limit || 0,
    };
  } catch (error) {
    console.error('❌ CouponService: Error getting usage', error);
    return { totalUsed: 0, usageByWorkspace: {}, limit: 0 };
  }
}
