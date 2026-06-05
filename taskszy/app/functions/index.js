const { onCall, onRequest, HttpsError } = require('firebase-functions/v2/https');
const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore, FieldValue, Timestamp } = require('firebase-admin/firestore');
const nodemailer = require('nodemailer');
const cors = require('cors')({ 
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
    'http://localhost:5177',
    'http://localhost:5178',
    'http://localhost:5179',
    'http://localhost:5180',
    'http://localhost:5181',
    'http://localhost:5182',
    'https://taskzy-9c2e5.web.app',
    'https://taskzy-9c2e5.firebaseapp.com',
    'https://taskszy.com',
    'https://www.taskszy.com',
    'https://app.taskszy.com',
    'https://admin.taskszy.com',
    'https://taskszy-website.pages.dev',
    'https://taskszy-app.pages.dev',
    'https://taskszy-admin.pages.dev'
  ],
  credentials: true 
});

initializeApp();

// ══════════════════════════════════════════════════════════════════════
// GMAIL SMTP TRANSPORTER CONFIGURATION
// ══════════════════════════════════════════════════════════════════════

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // Use SSL
  auth: {
    user: process.env.GMAIL_USER || 'support.taskszy@gmail.com',
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// ══════════════════════════════════════════════════════════════════════
// EXPORT RAZORPAY FUNCTIONS
// ══════════════════════════════════════════════════════════════════════

const razorpayFunctions = require('./razorpay');
exports.createRazorpayOrder = razorpayFunctions.createRazorpayOrder;
exports.verifyRazorpayPayment = razorpayFunctions.verifyRazorpayPayment;
exports.activateFreePlan = razorpayFunctions.activateFreePlan;

// ══════════════════════════════════════════════════════════════════════
// EXPORT AGGREGATION TRIGGERS
// ══════════════════════════════════════════════════════════════════════

const aggregationTriggers = require('./aggregationTriggers');
exports.onTaskCreate = aggregationTriggers.onTaskCreate;
exports.onTaskUpdate = aggregationTriggers.onTaskUpdate;
exports.onTaskDelete = aggregationTriggers.onTaskDelete;
exports.onTeamMemberCreate = aggregationTriggers.onTeamMemberCreate;
exports.onTeamMemberUpdate = aggregationTriggers.onTeamMemberUpdate;
exports.onTeamMemberDelete = aggregationTriggers.onTeamMemberDelete;
exports.onPaymentCreate = aggregationTriggers.onPaymentCreate;
exports.onPaymentUpdate = aggregationTriggers.onPaymentUpdate;
exports.onPaymentDelete = aggregationTriggers.onPaymentDelete;
exports.rebuildAggregationsDaily = aggregationTriggers.rebuildAggregationsDaily;

// ══════════════════════════════════════════════════════════════════════
// EXPORT INITIALIZATION FUNCTION (ONE-TIME USE)
// ══════════════════════════════════════════════════════════════════════

const initializeAggregations = require('./initializeAggregations');
exports.initializeAggregations = initializeAggregations.initializeAggregations;

const initializeAdminAggregations = require('./initializeAdminAggregations');
exports.initializeAdminAggregations = initializeAdminAggregations.initializeAdminAggregations;

// ══════════════════════════════════════════════════════════════════════
// EXPORT ADMIN DASHBOARD AGGREGATION TRIGGERS
// ══════════════════════════════════════════════════════════════════════

const adminAggregationTriggers = require('./adminAggregationTriggers');
exports.onWorkspaceCreate = adminAggregationTriggers.onWorkspaceCreate;
exports.onWorkspaceUpdate = adminAggregationTriggers.onWorkspaceUpdate;
exports.onWorkspaceDelete = adminAggregationTriggers.onWorkspaceDelete;
exports.onUserCreate = adminAggregationTriggers.onUserCreate;
exports.onUserUpdate = adminAggregationTriggers.onUserUpdate;
exports.onUserDelete = adminAggregationTriggers.onUserDelete;
exports.rebuildAdminAggregationDaily = adminAggregationTriggers.rebuildAdminAggregationDaily;

/**
 * createMember — called by admin from TeamPage to create a Firebase Auth
 * account + Firestore user profile for a new team member.
 *
 * Request data: { email, password, role, workspaceId, memberId, name, phone }
 * Returns: { success: boolean, uid: string, message: string }
 */
exports.createMember = onCall({ 
  region: 'us-central1',
}, async (request) => {
  // ══════════════════════════════════════════════════════════════════════
  // 1. AUTHENTICATION CHECK
  // ══════════════════════════════════════════════════════════════════════
  
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be signed in.');
  }

  const { email, password, role, workspaceId, memberId, name, phone } = request.data;

  // ══════════════════════════════════════════════════════════════════════
  // 2. VALIDATE INPUT
  // ══════════════════════════════════════════════════════════════════════
  
  if (!email || !password || !role || !workspaceId) {
    throw new HttpsError('invalid-argument', 'Missing required fields: email, password, role, workspaceId.');
  }

  if (password.length < 6) {
    throw new HttpsError('invalid-argument', 'Password must be at least 6 characters.');
  }

  if (!['admin', 'management', 'member'].includes(role)) {
    throw new HttpsError('invalid-argument', 'Role must be one of: admin, management, member.');
  }

  const auth = getAuth();
  const db   = getFirestore();

  // ══════════════════════════════════════════════════════════════════════
  // 3. AUTHORIZATION CHECK
  // ══════════════════════════════════════════════════════════════════════
  
  // Verify the caller owns this workspace and has permission
  const callerDoc = await db.doc(`users/${request.auth.uid}`).get();
  if (!callerDoc.exists) {
    throw new HttpsError('permission-denied', 'User profile not found.');
  }
  
  const callerData = callerDoc.data();
  if (callerData.workspaceId !== workspaceId) {
    throw new HttpsError('permission-denied', 'Not authorized for this workspace.');
  }
  
  // Only admin and management can create members
  if (callerData.role !== 'admin' && callerData.role !== 'management') {
    throw new HttpsError('permission-denied', 'Only administrators and management can create team members.');
  }

  // ══════════════════════════════════════════════════════════════════════
  // 4. CREATE FIREBASE AUTH ACCOUNT
  // ══════════════════════════════════════════════════════════════════════
  
  let uid;
  try {
    const userRecord = await auth.createUser({ 
      email: email.toLowerCase().trim(), 
      password,
      displayName: name || email.split('@')[0],
      emailVerified: false,
    });
    uid = userRecord.uid;
  } catch (err) {
    if (err.code === 'auth/email-already-exists') {
      throw new HttpsError('already-exists', 'An account with this email already exists.');
    }
    if (err.code === 'auth/invalid-email') {
      throw new HttpsError('invalid-argument', 'Invalid email address.');
    }
    if (err.code === 'auth/weak-password') {
      throw new HttpsError('invalid-argument', 'Password is too weak.');
    }
    throw new HttpsError('internal', 'Failed to create auth account: ' + err.message);
  }

  // ══════════════════════════════════════════════════════════════════════
  // 5. CREATE FIRESTORE USER PROFILE
  // ══════════════════════════════════════════════════════════════════════
  
  try {
    await db.doc(`users/${uid}`).set({
      email: email.toLowerCase().trim(),
      name: name || null,
      phone: phone || null,
      role,
      memberId: memberId || null,
      workspaceId,
      loginTime: null,
      lastActivityTime: null,
      hasSeenWelcomeAnimation: false,
      createdAt: FieldValue.serverTimestamp(),
      createdBy: request.auth.uid,
    });
  } catch (err) {
    // If profile creation fails, delete the auth account to maintain consistency
    try {
      await auth.deleteUser(uid);
    } catch (deleteErr) {
      console.error('Failed to cleanup auth account:', deleteErr);
    }
    throw new HttpsError('internal', 'Failed to create user profile. Auth account cleaned up.');
  }

  // ══════════════════════════════════════════════════════════════════════
  // 6. LOG ACTIVITY (optional, non-fatal)
  // ══════════════════════════════════════════════════════════════════════
  
  try {
    await db.collection(`workspaces/${workspaceId}/activity`).add({
      type: 'member',
      title: 'Member Added',
      sub: `${name || email} — ${role}`,
      time: FieldValue.serverTimestamp(),
      createdBy: request.auth.uid,
    });
  } catch (err) {
    console.error('Failed to log activity:', err);
  }

  // ══════════════════════════════════════════════════════════════════════
  // 7. RETURN SUCCESS
  // ══════════════════════════════════════════════════════════════════════
  
  return {
    success: true,
    uid,
    message: `Team member created successfully.`,
    email: email.toLowerCase().trim(),
  };
});

/**
 * generateTaskId — generates a unique task ID in format: ABCD1234
 * (4 uppercase letters + 4 digits)
 * 
 * Request data: { workspaceId: string }
 * Returns: { taskId: string }
 */
exports.generateTaskId = onCall({
  enforceAppCheck: false,
  cors: true, // Allow all origins for callable functions (they handle CORS automatically)
  region: 'us-central1',
}, async (request) => {
  // ══════════════════════════════════════════════════════════════════════
  // 1. AUTHENTICATION CHECK
  // ══════════════════════════════════════════════════════════════════════
  
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be signed in.');
  }

  const { workspaceId } = request.data;

  // ══════════════════════════════════════════════════════════════════════
  // 2. VALIDATE INPUT
  // ══════════════════════════════════════════════════════════════════════
  
  if (!workspaceId) {
    throw new HttpsError('invalid-argument', 'Missing required field: workspaceId.');
  }

  const db = getFirestore();

  // ══════════════════════════════════════════════════════════════════════
  // 3. AUTHORIZATION CHECK
  // ══════════════════════════════════════════════════════════════════════
  
  const callerDoc = await db.doc(`users/${request.auth.uid}`).get();
  if (!callerDoc.exists) {
    throw new HttpsError('permission-denied', 'User profile not found.');
  }
  
  const callerData = callerDoc.data();
  if (callerData.workspaceId !== workspaceId) {
    throw new HttpsError('permission-denied', 'Not authorized for this workspace.');
  }

  // ══════════════════════════════════════════════════════════════════════
  // 4. GENERATE UNIQUE TASK ID
  // ══════════════════════════════════════════════════════════════════════
  
  const generateId = () => {
    // Generate 8-character ID with mixed letters and numbers
    // Pattern: 4 letters + 4 numbers in random positions
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const digits = '0123456789';
    
    // Create array of 8 positions
    const positions = Array(8).fill(null);
    
    // Randomly select 4 positions for letters
    const letterPositions = [];
    while (letterPositions.length < 4) {
      const pos = Math.floor(Math.random() * 8);
      if (!letterPositions.includes(pos)) {
        letterPositions.push(pos);
      }
    }
    
    // Fill letter positions
    letterPositions.forEach(pos => {
      positions[pos] = letters.charAt(Math.floor(Math.random() * letters.length));
    });
    
    // Fill remaining positions with digits
    for (let i = 0; i < 8; i++) {
      if (positions[i] === null) {
        positions[i] = digits.charAt(Math.floor(Math.random() * digits.length));
      }
    }
    
    return positions.join('');
  };

  // Keep trying until we find a unique ID
  let taskId;
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    taskId = generateId();
    
    // Check if this ID already exists in the workspace
    const existingTask = await db.doc(`workspaces/${workspaceId}/tasks/${taskId}`).get();
    
    if (!existingTask.exists) {
      // Found a unique ID
      break;
    }
    
    attempts++;
  }

  if (attempts >= maxAttempts) {
    throw new HttpsError('internal', 'Failed to generate unique task ID after multiple attempts.');
  }

  // ══════════════════════════════════════════════════════════════════════
  // 5. RETURN UNIQUE TASK ID
  // ══════════════════════════════════════════════════════════════════════
  
  return {
    taskId,
  };
});

// ══════════════════════════════════════════════════════════════════════
// WELCOME EMAIL FUNCTION (Nodemailer + Gmail SMTP)
// ══════════════════════════════════════════════════════════════════════

/**
 * sendWelcomeEmail — Sends welcome email via Gmail SMTP when new user is created
 * Triggers automatically when a new document is added to 'users' collection
 */
exports.sendWelcomeEmail = onDocumentCreated({
  document: 'users/{userId}',
  region: 'us-central1',
}, async (event) => {
  const userData = event.data.data();
  const userId = event.params.userId;
  
  if (!userData || !userData.email) {
    return null;
  }

  const email = userData.email;
  const name = userData.name || email.split('@')[0];

  // Professional HTML email template with Stripo styling
  const htmlContent = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"><html dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="en"><head><meta charset="UTF-8"><meta content="width=device-width, initial-scale=1" name="viewport"><meta name="x-apple-disable-message-reformatting"><meta content="IE=edge" http-equiv="X-UA-Compatible"><meta content="telephone=no" name="format-detection"><title>Welcome to TasksZy</title><!--[if (mso 16)]><style type="text/css">a {text-decoration: none;}</style><![endif]--><!--[if gte mso 9]><style>sup { font-size: 100% !important; }</style><![endif]--><!--[if gte mso 9]><noscript><xml><o:OfficeDocumentSettings><o:AllowPNG></o:AllowPNG><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]--><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Prompt:wght@500&display=swap"><!--[if mso]><xml><w:WordDocument xmlns:w="urn:schemas-microsoft-com:office:word"><w:DontUseAdvancedTypographyReadingMail/></w:WordDocument></xml><![endif]--><style type="text/css">.rollover:hover .rollover-first {max-height:0px!important;display:none!important;}.rollover:hover .rollover-second {max-height:none!important;display:block!important;}.rollover span {font-size:0px;}#outlook a {padding:0;}span.MsoHyperlink,span.MsoHyperlinkFollowed {color:inherit;mso-style-priority:99;}a.es-button {mso-style-priority:100!important;text-decoration:none!important;}a[x-apple-data-detectors],#MessageViewBody a {color:inherit!important;text-decoration:none!important;font-size:inherit!important;font-family:inherit!important;font-weight:inherit!important;line-height:inherit!important;}.es-desk-hidden {display:none;float:left;overflow:hidden;width:0;max-height:0;line-height:0;mso-hide:all;}.es-button-border:hover {border-color:#42d159 #42d159 #42d159 #42d159!important;background:#48dbea!important;}.es-button-border:hover a.es-button,.es-button-border:hover button.es-button,.es-button-border:hover label.es-button {background:#48dbea!important;color:#ffffff!important;}@media only screen and (max-width:600px) {.es-m-p0r { padding-right:0px!important } .es-p-default { } *[class="gmail-fix"] { display:none!important } p, a { line-height:150%!important } h1, h1 a { line-height:120%!important } h2, h2 a { line-height:120%!important } h3, h3 a { line-height:120%!important } h4, h4 a { line-height:120%!important } h5, h5 a { line-height:120%!important } h6, h6 a { line-height:120%!important } h1 { font-size:30px!important; text-align:left } h2 { font-size:24px!important; text-align:left } h3 { font-size:20px!important; text-align:left } h4 { font-size:24px!important; text-align:left } h5 { font-size:20px!important; text-align:left } h6 { font-size:16px!important; text-align:left } .es-header-body h1 a, .es-content-body h1 a, .es-footer-body h1 a { font-size:30px!important } .es-header-body h2 a, .es-content-body h2 a, .es-footer-body h2 a { font-size:24px!important } .es-header-body h3 a, .es-content-body h3 a, .es-footer-body h3 a { font-size:20px!important } .es-header-body h4 a, .es-content-body h4 a, .es-footer-body h4 a { font-size:24px!important } .es-header-body h5 a, .es-content-body h5 a, .es-footer-body h5 a { font-size:20px!important } .es-header-body h6 a, .es-content-body h6 a, .es-footer-body h6 a { font-size:16px!important } .es-menu td a { font-size:12px!important } .es-header-body p, .es-header-body a { font-size:14px!important } .es-content-body p, .es-content-body a { font-size:14px!important } .es-footer-body p, .es-footer-body a { font-size:12px!important } .es-infoblock p, .es-infoblock a { font-size:12px!important } .es-m-txt-c, .es-m-txt-c h1, .es-m-txt-c h2, .es-m-txt-c h3, .es-m-txt-c h4, .es-m-txt-c h5, .es-m-txt-c h6 { text-align:center!important } .es-m-txt-r, .es-m-txt-r h1, .es-m-txt-r h2, .es-m-txt-r h3, .es-m-txt-r h4, .es-m-txt-r h5, .es-m-txt-r h6 { text-align:right!important } .es-m-txt-j, .es-m-txt-j h1, .es-m-txt-j h2, .es-m-txt-j h3, .es-m-txt-j h4, .es-m-txt-j h5, .es-m-txt-j h6 { text-align:justify!important } .es-m-txt-l, .es-m-txt-l h1, .es-m-txt-l h2, .es-m-txt-l h3, .es-m-txt-l h4, .es-m-txt-l h5, .es-m-txt-l h6 { text-align:left!important } .es-m-txt-r img, .es-m-txt-c img, .es-m-txt-l img { display:inline!important } .es-m-txt-r .rollover:hover .rollover-second, .es-m-txt-c .rollover:hover .rollover-second, .es-m-txt-l .rollover:hover .rollover-second { display:inline!important } .es-m-txt-r .rollover span, .es-m-txt-c .rollover span, .es-m-txt-l .rollover span { line-height:0!important; font-size:0!important; display:block } .es-m-txt-r .es-menu td { float:right!important } .es-m-txt-l .es-menu td { float:left!important } .es-m-txt-c .es-menu td { display:inline-block } .es-spacer { display:inline-table } a.es-button, button.es-button { display:inline-block!important; font-size:16px!important; padding:10px 20px 10px 20px!important; line-height:120%!important } .es-button-border { display:inline-block!important } .es-m-fw, .es-m-fw.es-fw, .es-m-fw .es-button { display:block!important } .es-m-il, .es-m-il .es-button, .es-social, .es-social td, .es-menu.es-table-not-adapt { display:inline-block!important } .es-adaptive table, .es-left, .es-right { width:100%!important; border-collapse:separate!important } .es-content table, .es-header table, .es-footer table, .es-content, .es-footer, .es-header { width:100%!important; max-width:600px!important } .adapt-img { width:100%!important; height:auto!important } .es-adapt-td { display:block!important; width:100%!important } .es-mobile-hidden, .es-hidden { display:none!important } .es-container-hidden { display:none!important } .es-desk-hidden { width:auto!important; overflow:visible!important; float:none!important; max-height:inherit!important; line-height:inherit!important } tr.es-desk-hidden { display:table-row!important } table.es-desk-hidden { display:table!important } td.es-desk-hidden { display:table-cell!important } td.es-desk-menu-hidden { display:table-cell!important } .es-m-txt-c .es-menu td.es-desk-menu-hidden { display:inline-block!important } .es-menu td { width:1%!important } table.es-table-not-adapt, .esd-block-html table, .es-m-txt-r .es-menu td, .es-m-txt-l .es-menu td, .es-m-txt-c .es-menu td { width:auto!important } .h-auto { height:auto!important } }@media screen and (max-width:384px) {.mail-message-content { width:414px!important } }</style></head><body class="body" style="width:100%;height:100%;font-family:arial, 'helvetica neue', helvetica, sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;padding:0;Margin:0"><div dir="ltr" class="es-wrapper-color" lang="en" style="background-color:#E2E1E1"><table cellspacing="0" cellpadding="0" width="100%" class="es-wrapper" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;padding:0;Margin:0;width:100%;height:100%;background-repeat:repeat;background-position:center top"><tr><td valign="top" style="padding:0;Margin:0"><table align="center" cellspacing="0" cellpadding="0" class="es-content" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;width:100%;table-layout:fixed !important"><tr><td align="center" style="padding:0;Margin:0"><table cellspacing="0" cellpadding="0" bgcolor="#ffffff" align="center" class="es-content-body" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#ffffff;width:600px" role="none"><tr><td align="left" style="padding:20px 20px 0;Margin:0"><table cellpadding="0" cellspacing="0" width="100%" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"><tr><td align="center" valign="top" style="padding:0;Margin:0;width:560px"><table cellspacing="0" width="100%" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:separate;border-spacing:0px;border-bottom:1px solid #dfdfdf;border-radius:30px;border-left:1px solid #dfdfdf;border-right:1px solid #dfdfdf;border-top:1px solid #dfdfdf" role="presentation"><tr><td align="center" style="padding:20px;Margin:0;font-size:0px"><img src="https://firebasestorage.googleapis.com/v0/b/taskzy-9c2e5.firebasestorage.app/o/public%2Ftaskzylogo.png?alt=media" alt="TasksZy Logo" width="518" title="TasksZy" class="adapt-img" style="display:block;font-size:14px;border:0;outline:none;text-decoration:none;margin:0;border-radius:20px" height="91"></td></tr></table></td></tr></table></td></tr><tr><td align="left" style="Margin:0;padding:30px 20px"><table width="100%" cellspacing="0" cellpadding="0" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"><tr><td valign="top" align="center" class="es-m-p0r" style="padding:0;Margin:0;width:560px"><table width="100%" cellspacing="0" cellpadding="0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"><tr><td align="center" style="padding:0;Margin:0"><h1 style="Margin:0;font-family:Prompt, sans-serif;mso-line-height-rule:exactly;letter-spacing:0;font-size:36px;font-style:normal;font-weight:normal;line-height:54px;color:#333333">Welcome to TasksZy</h1><p style="Margin:0;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;letter-spacing:0;color:#333333;font-size:14px">The Modern Workspace for Teams, Projects &amp; Growth</p><p style="Margin:0;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;letter-spacing:0;color:#333333;font-size:14px"><br></p></td></tr><tr><td align="center" style="padding:0;Margin:0"><span class="es-button-border msohide" style="border-style:solid;border-color:#2CB543;background:#1ACAE3;border-width:0px;display:inline-block;border-radius:30px;width:auto;mso-hide:all"><a target="_blank" href="https://www.taskszy.com" class="es-button" style="mso-style-priority:100 !important;text-decoration:none !important;mso-line-height-rule:exactly;color:#FFFFFF;font-size:18px;padding:10px 20px;display:inline-block;background:#1ACAE3;border-radius:30px;font-family:Prompt, sans-serif;font-weight:normal;font-style:normal;line-height:22px;width:auto;text-align:center;letter-spacing:0;mso-padding-alt:0;mso-border-alt:10px solid #1ACAE3">Get Started</a></span></td></tr><tr><td align="left" style="padding:20px 0 30px;Margin:0"><p style="Margin:0;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;letter-spacing:0;color:#333333;font-size:14px">Hi ${name},</p><p style="Margin:0;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;letter-spacing:0;color:#333333;font-size:14px"><br></p><p style="Margin:0;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;letter-spacing:0;color:#333333;font-size:14px">Welcome to TasksZy.</p><p style="Margin:0;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;letter-spacing:0;color:#333333;font-size:14px"><br></p><p style="Margin:0;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;letter-spacing:0;color:#333333;font-size:14px">We're excited to have you join our growing community of professionals, teams, and businesses.</p><p style="Margin:0;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;letter-spacing:0;color:#333333;font-size:14px"><br></p><p style="Margin:0;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;letter-spacing:0;color:#333333;font-size:14px">TasksZy is designed to help you organize work, streamline collaboration, and achieve your goals with confidence. Whether you're managing projects, coordinating teams, or overseeing daily operations, our platform provides a powerful and intuitive workspace to keep everything moving forward.</p><p style="Margin:0;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;letter-spacing:0;color:#333333;font-size:14px"><br></p><p style="Margin:0;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;letter-spacing:0;color:#333333;font-size:14px">Your account is now ready, and you're just a few steps away from creating your first workspace and unlocking the full potential of TasksZy.</p><p style="Margin:0;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;letter-spacing:0;color:#333333;font-size:14px"><br></p><p style="Margin:0;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;letter-spacing:0;color:#333333;font-size:14px">Thank you for choosing us. We look forward to being part of your success journey.</p><p style="Margin:0;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;letter-spacing:0;color:#333333;font-size:14px"><br></p><p style="Margin:0;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;letter-spacing:0;color:#333333;font-size:14px">Warm regards,</p><p style="Margin:0;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;letter-spacing:0;color:#333333;font-size:14px"><br></p><p style="Margin:0;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;letter-spacing:0;color:#333333;font-size:14px">The TasksZy Team</p></td></tr></table></td></tr></table></td></tr></table></td></tr></table><table cellspacing="0" align="center" cellpadding="0" class="es-footer" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;width:100%;table-layout:fixed !important;background-color:transparent;background-repeat:repeat;background-position:center top"><tr><td align="center" style="padding:0;Margin:0"><table align="center" cellpadding="0" cellspacing="0" bgcolor="#ffffff" class="es-footer-body" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:600px"><tr><td align="left" style="padding:20px;Margin:0"><table cellpadding="0" cellspacing="0" width="100%" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"><tr><td align="left" style="padding:0;Margin:0;width:560px"><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"><tr><td align="center" style="padding:0;Margin:0"><p style="Margin:0;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;letter-spacing:0;color:#333333;font-size:14px"><a target="_blank" href="https://www.taskszy.com" style="mso-line-height-rule:exactly;text-decoration:none;color:#333333;font-size:14px"> www.taskszy.com <br>support.taskszy@gmail.com <br> <br>© 2026 TasksZy. All rights reserved. <br> </a></p></td></tr><tr><td align="center" style="padding:10px 0;Margin:0"><p style="Margin:0;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:24px;letter-spacing:0;color:#757279;font-size:12px"><a target="_blank" href="https://www.taskszy.com/privacy" style="mso-line-height-rule:exactly;text-decoration:none;color:#333333;font-size:12px;line-height:24px">Privacy</a>&nbsp;| <a target="_blank" style="mso-line-height-rule:exactly;text-decoration:none;color:#333333;font-size:12px;line-height:24px" href="https://www.taskszy.com/preferences">Manage Preferences</a></p></td></tr></table></td></tr></table></td></tr><tr></tr></table></td></tr></table></td></tr></table></div></body></html>`;

  try {
    // Send email via Gmail SMTP
    const info = await transporter.sendMail({
      from: '"TasksZy" <support.taskszy@gmail.com>',
      to: email,
      subject: 'Welcome to TasksZy!',
      html: htmlContent,
      text: `Hi ${name},\n\nThank you for signing up for TasksZy! We're excited to have you on board.\n\nTasksZy helps you organize better and scale faster with powerful task management features designed for teams of all sizes.\n\nGet started at: https://www.taskszy.com\n\nIf you have any questions, reach out to support.taskszy@gmail.com\n\nBest regards,\nThe TasksZy Team`,
    });

  } catch (error) {
    console.error('Failed to send welcome email:', error);
    // Non-fatal - don't block user creation
  }

  return null;
});

// ══════════════════════════════════════════════════════════════════════
// PASSWORD RESET EMAIL FUNCTION (Custom with TasksZy branding)
// ══════════════════════════════════════════════════════════════════════

/**
 * sendPasswordResetEmail — Sends branded password reset email
 * This is a callable function that sends custom password reset emails
 * 
 * Request data: { email: string, resetLink: string, userName: string }
 * Returns: { success: boolean, message: string }
 */
exports.sendPasswordResetEmail = onCall({
  region: 'us-central1',
}, async (request) => {
  const { email, resetLink, userName } = request.data;

  if (!email || !resetLink) {
    throw new HttpsError('invalid-argument', 'Missing required fields: email, resetLink');
  }

  const name = userName || email.split('@')[0];

  // Professional HTML email template with TasksZy branding (same style as welcome email)
  const htmlContent = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"><html dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="en"><head><meta charset="UTF-8"><meta content="width=device-width, initial-scale=1" name="viewport"><meta name="x-apple-disable-message-reformatting"><meta content="IE=edge" http-equiv="X-UA-Compatible"><meta content="telephone=no" name="format-detection"><title>Password Reset - TasksZy</title><!--[if (mso 16)]><style type="text/css">a {text-decoration: none;}</style><![endif]--><!--[if gte mso 9]><style>sup { font-size: 100% !important; }</style><![endif]--><!--[if gte mso 9]><noscript><xml><o:OfficeDocumentSettings><o:AllowPNG></o:AllowPNG><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]--><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Prompt:wght@500&display=swap"><!--[if mso]><xml><w:WordDocument xmlns:w="urn:schemas-microsoft-com:office:word"><w:DontUseAdvancedTypographyReadingMail/></w:WordDocument></xml><![endif]--><style type="text/css">.rollover:hover .rollover-first {max-height:0px!important;display:none!important;}.rollover:hover .rollover-second {max-height:none!important;display:block!important;}.rollover span {font-size:0px;}#outlook a {padding:0;}span.MsoHyperlink,span.MsoHyperlinkFollowed {color:inherit;mso-style-priority:99;}a.es-button {mso-style-priority:100!important;text-decoration:none!important;}a[x-apple-data-detectors],#MessageViewBody a {color:inherit!important;text-decoration:none!important;font-size:inherit!important;font-family:inherit!important;font-weight:inherit!important;line-height:inherit!important;}.es-desk-hidden {display:none;float:left;overflow:hidden;width:0;max-height:0;line-height:0;mso-hide:all;}.es-button-border:hover {border-color:#42d159 #42d159 #42d159 #42d159!important;background:#48dbea!important;}.es-button-border:hover a.es-button,.es-button-border:hover button.es-button,.es-button-border:hover label.es-button {background:#48dbea!important;color:#ffffff!important;}@media only screen and (max-width:600px) {.es-m-p0r { padding-right:0px!important } .es-p-default { } *[class="gmail-fix"] { display:none!important } p, a { line-height:150%!important } h1, h1 a { line-height:120%!important } h2, h2 a { line-height:120%!important } h3, h3 a { line-height:120%!important } h4, h4 a { line-height:120%!important } h5, h5 a { line-height:120%!important } h6, h6 a { line-height:120%!important } h1 { font-size:30px!important; text-align:left } h2 { font-size:24px!important; text-align:left } h3 { font-size:20px!important; text-align:left } h4 { font-size:24px!important; text-align:left } h5 { font-size:20px!important; text-align:left } h6 { font-size:16px!important; text-align:left } .es-header-body h1 a, .es-content-body h1 a, .es-footer-body h1 a { font-size:30px!important } .es-header-body h2 a, .es-content-body h2 a, .es-footer-body h2 a { font-size:24px!important } .es-header-body h3 a, .es-content-body h3 a, .es-footer-body h3 a { font-size:20px!important } .es-header-body h4 a, .es-content-body h4 a, .es-footer-body h4 a { font-size:24px!important } .es-header-body h5 a, .es-content-body h5 a, .es-footer-body h5 a { font-size:20px!important } .es-header-body h6 a, .es-content-body h6 a, .es-footer-body h6 a { font-size:16px!important } .es-menu td a { font-size:12px!important } .es-header-body p, .es-header-body a { font-size:14px!important } .es-content-body p, .es-content-body a { font-size:14px!important } .es-footer-body p, .es-footer-body a { font-size:12px!important } .es-infoblock p, .es-infoblock a { font-size:12px!important } .es-m-txt-c, .es-m-txt-c h1, .es-m-txt-c h2, .es-m-txt-c h3, .es-m-txt-c h4, .es-m-txt-c h5, .es-m-txt-c h6 { text-align:center!important } .es-m-txt-r, .es-m-txt-r h1, .es-m-txt-r h2, .es-m-txt-r h3, .es-m-txt-r h4, .es-m-txt-r h5, .es-m-txt-r h6 { text-align:right!important } .es-m-txt-j, .es-m-txt-j h1, .es-m-txt-j h2, .es-m-txt-j h3, .es-m-txt-j h4, .es-m-txt-j h5, .es-m-txt-j h6 { text-align:justify!important } .es-m-txt-l, .es-m-txt-l h1, .es-m-txt-l h2, .es-m-txt-l h3, .es-m-txt-l h4, .es-m-txt-l h5, .es-m-txt-l h6 { text-align:left!important } .es-m-txt-r img, .es-m-txt-c img, .es-m-txt-l img { display:inline!important } .es-m-txt-r .rollover:hover .rollover-second, .es-m-txt-c .rollover:hover .rollover-second, .es-m-txt-l .rollover:hover .rollover-second { display:inline!important } .es-m-txt-r .rollover span, .es-m-txt-c .rollover span, .es-m-txt-l .rollover span { line-height:0!important; font-size:0!important; display:block } .es-m-txt-r .es-menu td { float:right!important } .es-m-txt-l .es-menu td { float:left!important } .es-m-txt-c .es-menu td { display:inline-block } .es-spacer { display:inline-table } a.es-button, button.es-button { display:inline-block!important; font-size:16px!important; padding:10px 20px 10px 20px!important; line-height:120%!important } .es-button-border { display:inline-block!important } .es-m-fw, .es-m-fw.es-fw, .es-m-fw .es-button { display:block!important } .es-m-il, .es-m-il .es-button, .es-social, .es-social td, .es-menu.es-table-not-adapt { display:inline-block!important } .es-adaptive table, .es-left, .es-right { width:100%!important; border-collapse:separate!important } .es-content table, .es-header table, .es-footer table, .es-content, .es-footer, .es-header { width:100%!important; max-width:600px!important } .adapt-img { width:100%!important; height:auto!important } .es-adapt-td { display:block!important; width:100%!important } .es-mobile-hidden, .es-hidden { display:none!important } .es-container-hidden { display:none!important } .es-desk-hidden { width:auto!important; overflow:visible!important; float:none!important; max-height:inherit!important; line-height:inherit!important } tr.es-desk-hidden { display:table-row!important } table.es-desk-hidden { display:table!important } td.es-desk-hidden { display:table-cell!important } td.es-desk-menu-hidden { display:table-cell!important } .es-m-txt-c .es-menu td.es-desk-menu-hidden { display:inline-block!important } .es-menu td { width:1%!important } table.es-table-not-adapt, .esd-block-html table, .es-m-txt-r .es-menu td, .es-m-txt-l .es-menu td, .es-m-txt-c .es-menu td { width:auto!important } .h-auto { height:auto!important } }@media screen and (max-width:384px) {.mail-message-content { width:414px!important } }</style></head><body class="body" style="width:100%;height:100%;font-family:arial, 'helvetica neue', helvetica, sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;padding:0;Margin:0"><div dir="ltr" class="es-wrapper-color" lang="en" style="background-color:#E2E1E1"><table cellspacing="0" cellpadding="0" width="100%" class="es-wrapper" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;padding:0;Margin:0;width:100%;height:100%;background-repeat:repeat;background-position:center top"><tr><td valign="top" style="padding:0;Margin:0"><table align="center" cellspacing="0" cellpadding="0" class="es-content" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;width:100%;table-layout:fixed !important"><tr><td align="center" style="padding:0;Margin:0"><table cellspacing="0" cellpadding="0" bgcolor="#ffffff" align="center" class="es-content-body" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#ffffff;width:600px" role="none"><tr><td align="left" style="padding:20px 20px 0;Margin:0"><table cellpadding="0" cellspacing="0" width="100%" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"><tr><td align="center" valign="top" style="padding:0;Margin:0;width:560px"><table cellspacing="0" width="100%" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:separate;border-spacing:0px;border-bottom:1px solid #dfdfdf;border-radius:30px;border-left:1px solid #dfdfdf;border-right:1px solid #dfdfdf;border-top:1px solid #dfdfdf" role="presentation"><tr><td align="center" style="padding:20px;Margin:0;font-size:0px"><img src="https://firebasestorage.googleapis.com/v0/b/taskzy-9c2e5.firebasestorage.app/o/public%2Ftaskzylogo.png?alt=media" alt="TasksZy Logo" width="518" title="TasksZy" class="adapt-img" style="display:block;font-size:14px;border:0;outline:none;text-decoration:none;margin:0;border-radius:20px" height="91"></td></tr></table></td></tr></table></td></tr><tr><td align="left" style="Margin:0;padding:30px 20px"><table width="100%" cellspacing="0" cellpadding="0" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"><tr><td valign="top" align="center" class="es-m-p0r" style="padding:0;Margin:0;width:560px"><table width="100%" cellspacing="0" cellpadding="0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"><tr><td align="center" style="padding:0;Margin:0"><h1 style="Margin:0;font-family:Prompt, sans-serif;mso-line-height-rule:exactly;letter-spacing:0;font-size:36px;font-style:normal;font-weight:normal;line-height:54px;color:#333333">Password Reset Request</h1><p style="Margin:0;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;letter-spacing:0;color:#333333;font-size:14px">Secure access to your TasksZy account</p><p style="Margin:0;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;letter-spacing:0;color:#333333;font-size:14px"><br></p></td></tr><tr><td align="center" style="padding:0;Margin:0"><span class="es-button-border msohide" style="border-style:solid;border-color:#2CB543;background:#1ACAE3;border-width:0px;display:inline-block;border-radius:30px;width:auto;mso-hide:all"><a target="_blank" href="${resetLink}" class="es-button" style="mso-style-priority:100 !important;text-decoration:none !important;mso-line-height-rule:exactly;color:#FFFFFF;font-size:18px;padding:10px 20px;display:inline-block;background:#1ACAE3;border-radius:30px;font-family:Prompt, sans-serif;font-weight:normal;font-style:normal;line-height:22px;width:auto;text-align:center;letter-spacing:0;mso-padding-alt:0;mso-border-alt:10px solid #1ACAE3">Reset Password</a></span></td></tr><tr><td align="left" style="padding:20px 0 30px;Margin:0"><p style="Margin:0;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;letter-spacing:0;color:#333333;font-size:14px">Hi ${name},</p><p style="Margin:0;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;letter-spacing:0;color:#333333;font-size:14px"><br></p><p style="Margin:0;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;letter-spacing:0;color:#333333;font-size:14px">We received a request to reset the password for your TasksZy account.</p><p style="Margin:0;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;letter-spacing:0;color:#333333;font-size:14px"><br></p><p style="Margin:0;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;letter-spacing:0;color:#333333;font-size:14px">To create a new password, click the button above. For your security, this link will expire after a limited time.</p><p style="Margin:0;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;letter-spacing:0;color:#333333;font-size:14px"><br></p><p style="Margin:0;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;letter-spacing:0;color:#333333;font-size:14px">If you did not request a password reset, you can safely ignore this email. Your account will remain secure and no changes will be made.</p><p style="Margin:0;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;letter-spacing:0;color:#333333;font-size:14px"><br></p><p style="Margin:0;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;letter-spacing:0;color:#333333;font-size:14px">If you need assistance, please contact our support team.</p><p style="Margin:0;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;letter-spacing:0;color:#333333;font-size:14px"><br></p><p style="Margin:0;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;letter-spacing:0;color:#333333;font-size:14px">Best regards,</p><p style="Margin:0;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;letter-spacing:0;color:#333333;font-size:14px"><br></p><p style="Margin:0;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;letter-spacing:0;color:#333333;font-size:14px">The TasksZy Team</p></td></tr></table></td></tr></table></td></tr></table></td></tr></table><table cellspacing="0" align="center" cellpadding="0" class="es-footer" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;width:100%;table-layout:fixed !important;background-color:transparent;background-repeat:repeat;background-position:center top"><tr><td align="center" style="padding:0;Margin:0"><table align="center" cellpadding="0" cellspacing="0" bgcolor="#ffffff" class="es-footer-body" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:600px"><tr><td align="left" style="padding:20px;Margin:0"><table cellpadding="0" cellspacing="0" width="100%" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"><tr><td align="left" style="padding:0;Margin:0;width:560px"><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"><tr><td align="center" style="padding:0;Margin:0"><p style="Margin:0;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;letter-spacing:0;color:#333333;font-size:14px"><a target="_blank" href="https://www.taskszy.com" style="mso-line-height-rule:exactly;text-decoration:none;color:#333333;font-size:14px"> www.taskszy.com <br>support.taskszy@gmail.com <br> <br>© 2026 TasksZy. All rights reserved. <br> </a></p></td></tr><tr><td align="center" style="padding:10px 0;Margin:0"><p style="Margin:0;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:24px;letter-spacing:0;color:#757279;font-size:12px"><a target="_blank" href="https://www.taskszy.com/privacy" style="mso-line-height-rule:exactly;text-decoration:none;color:#333333;font-size:12px;line-height:24px">Privacy</a>&nbsp;| <a target="_blank" style="mso-line-height-rule:exactly;text-decoration:none;color:#333333;font-size:12px;line-height:24px" href="https://www.taskszy.com/preferences">Manage Preferences</a></p></td></tr></table></td></tr></table></td></tr><tr></tr></table></td></tr></table></td></tr></table></div></body></html>`;

  try {
    // Send email via Gmail SMTP
    await transporter.sendMail({
      from: '"TasksZy" <support.taskszy@gmail.com>',
      to: email,
      subject: 'Password Reset Request - TasksZy',
      html: htmlContent,
      text: `Hi ${name},\n\nWe received a request to reset the password for your TasksZy account.\n\nTo create a new password, click this link:\n${resetLink}\n\nFor your security, this link will expire after a limited time.\n\nIf you did not request a password reset, you can safely ignore this email. Your account will remain secure and no changes will be made.\n\nIf you need assistance, please contact support.taskszy@gmail.com\n\nBest regards,\nThe TasksZy Team`,
    });

    return {
      success: true,
      message: 'Password reset email sent successfully',
    };
  } catch (error) {
    throw new HttpsError('internal', `Failed to send password reset email: ${error.message}`);
  }
});

// ══════════════════════════════════════════════════════════════════════
// GENERATE PASSWORD RESET LINK (Custom branded email)
// ══════════════════════════════════════════════════════════════════════

/**
 * generatePasswordResetLink — Generates password reset link and sends branded email
 * This replaces Firebase's default password reset email with our custom branded template
 * 
 * Request data: { email: string }
 * Returns: { success: boolean, message: string }
 */
exports.generatePasswordResetLink = onCall({
  region: 'us-central1',
}, async (request) => {
  const { email } = request.data;

  if (!email) {
    throw new HttpsError('invalid-argument', 'Missing required field: email');
  }

  const auth = getAuth();
  const db = getFirestore();

  try {
    // Check if user exists
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(email);
    } catch (error) {
      // Don't reveal if email exists or not for security
      return {
        success: true,
        message: 'If this email is registered, you will receive a password reset link.',
      };
    }

    // Get user profile for display name
    let userName = email.split('@')[0];
    try {
      const userDoc = await db.doc(`users/${userRecord.uid}`).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        userName = userData.name || userName;
      }
    } catch (err) {
      // Use email as fallback
    }

    // Generate password reset link (expires in 1 hour)
    const resetLink = await auth.generatePasswordResetLink(email, {
      url: 'https://taskzy-9c2e5.web.app/login',
      handleCodeInApp: false,
    });

    // Professional HTML email template with TasksZy branding
    const htmlContent = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"><html dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="en"><head><meta charset="UTF-8"><meta content="width=device-width, initial-scale=1" name="viewport"><meta name="x-apple-disable-message-reformatting"><meta content="IE=edge" http-equiv="X-UA-Compatible"><meta content="telephone=no" name="format-detection"><title>Password Reset - TasksZy</title><!--[if (mso 16)]><style type="text/css">a {text-decoration: none;}</style><![endif]--><!--[if gte mso 9]><style>sup { font-size: 100% !important; }</style><![endif]--><!--[if gte mso 9]><noscript><xml><o:OfficeDocumentSettings><o:AllowPNG></o:AllowPNG><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]--><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Prompt:wght@500&display=swap"><!--[if mso]><xml><w:WordDocument xmlns:w="urn:schemas-microsoft-com:office:word"><w:DontUseAdvancedTypographyReadingMail/></w:WordDocument></xml><![endif]--><style type="text/css">.rollover:hover .rollover-first {max-height:0px!important;display:none!important;}.rollover:hover .rollover-second {max-height:none!important;display:block!important;}.rollover span {font-size:0px;}#outlook a {padding:0;}span.MsoHyperlink,span.MsoHyperlinkFollowed {color:inherit;mso-style-priority:99;}a.es-button {mso-style-priority:100!important;text-decoration:none!important;}a[x-apple-data-detectors],#MessageViewBody a {color:inherit!important;text-decoration:none!important;font-size:inherit!important;font-family:inherit!important;font-weight:inherit!important;line-height:inherit!important;}.es-desk-hidden {display:none;float:left;overflow:hidden;width:0;max-height:0;line-height:0;mso-hide:all;}.es-button-border:hover {border-color:#42d159 #42d159 #42d159 #42d159!important;background:#48dbea!important;}.es-button-border:hover a.es-button,.es-button-border:hover button.es-button,.es-button-border:hover label.es-button {background:#48dbea!important;color:#ffffff!important;}@media only screen and (max-width:600px) {.es-m-p0r { padding-right:0px!important } .es-p-default { } *[class="gmail-fix"] { display:none!important } p, a { line-height:150%!important } h1, h1 a { line-height:120%!important } h2, h2 a { line-height:120%!important } h3, h3 a { line-height:120%!important } h4, h4 a { line-height:120%!important } h5, h5 a { line-height:120%!important } h6, h6 a { line-height:120%!important } h1 { font-size:30px!important; text-align:left } h2 { font-size:24px!important; text-align:left } h3 { font-size:20px!important; text-align:left } h4 { font-size:24px!important; text-align:left } h5 { font-size:20px!important; text-align:left } h6 { font-size:16px!important; text-align:left } .es-header-body h1 a, .es-content-body h1 a, .es-footer-body h1 a { font-size:30px!important } .es-header-body h2 a, .es-content-body h2 a, .es-footer-body h2 a { font-size:24px!important } .es-header-body h3 a, .es-content-body h3 a, .es-footer-body h3 a { font-size:20px!important } .es-header-body h4 a, .es-content-body h4 a, .es-footer-body h4 a { font-size:24px!important } .es-header-body h5 a, .es-content-body h5 a, .es-footer-body h5 a { font-size:20px!important } .es-header-body h6 a, .es-content-body h6 a, .es-footer-body h6 a { font-size:16px!important } .es-menu td a { font-size:12px!important } .es-header-body p, .es-header-body a { font-size:14px!important } .es-content-body p, .es-content-body a { font-size:14px!important } .es-footer-body p, .es-footer-body a { font-size:12px!important } .es-infoblock p, .es-infoblock a { font-size:12px!important } .es-m-txt-c, .es-m-txt-c h1, .es-m-txt-c h2, .es-m-txt-c h3, .es-m-txt-c h4, .es-m-txt-c h5, .es-m-txt-c h6 { text-align:center!important } .es-m-txt-r, .es-m-txt-r h1, .es-m-txt-r h2, .es-m-txt-r h3, .es-m-txt-r h4, .es-m-txt-r h5, .es-m-txt-r h6 { text-align:right!important } .es-m-txt-j, .es-m-txt-j h1, .es-m-txt-j h2, .es-m-txt-j h3, .es-m-txt-j h4, .es-m-txt-j h5, .es-m-txt-j h6 { text-align:justify!important } .es-m-txt-l, .es-m-txt-l h1, .es-m-txt-l h2, .es-m-txt-l h3, .es-m-txt-l h4, .es-m-txt-l h5, .es-m-txt-l h6 { text-align:left!important } .es-m-txt-r img, .es-m-txt-c img, .es-m-txt-l img { display:inline!important } .es-m-txt-r .rollover:hover .rollover-second, .es-m-txt-c .rollover:hover .rollover-second, .es-m-txt-l .rollover:hover .rollover-second { display:inline!important } .es-m-txt-r .rollover span, .es-m-txt-c .rollover span, .es-m-txt-l .rollover span { line-height:0!important; font-size:0!important; display:block } .es-m-txt-r .es-menu td { float:right!important } .es-m-txt-l .es-menu td { float:left!important } .es-m-txt-c .es-menu td { display:inline-block } .es-spacer { display:inline-table } a.es-button, button.es-button { display:inline-block!important; font-size:16px!important; padding:10px 20px 10px 20px!important; line-height:120%!important } .es-button-border { display:inline-block!important } .es-m-fw, .es-m-fw.es-fw, .es-m-fw .es-button { display:block!important } .es-m-il, .es-m-il .es-button, .es-social, .es-social td, .es-menu.es-table-not-adapt { display:inline-block!important } .es-adaptive table, .es-left, .es-right { width:100%!important; border-collapse:separate!important } .es-content table, .es-header table, .es-footer table, .es-content, .es-footer, .es-header { width:100%!important; max-width:600px!important } .adapt-img { width:100%!important; height:auto!important } .es-adapt-td { display:block!important; width:100%!important } .es-mobile-hidden, .es-hidden { display:none!important } .es-container-hidden { display:none!important } .es-desk-hidden { width:auto!important; overflow:visible!important; float:none!important; max-height:inherit!important; line-height:inherit!important } tr.es-desk-hidden { display:table-row!important } table.es-desk-hidden { display:table!important } td.es-desk-hidden { display:table-cell!important } td.es-desk-menu-hidden { display:table-cell!important } .es-m-txt-c .es-menu td.es-desk-menu-hidden { display:inline-block!important } .es-menu td { width:1%!important } table.es-table-not-adapt, .esd-block-html table, .es-m-txt-r .es-menu td, .es-m-txt-l .es-menu td, .es-m-txt-c .es-menu td { width:auto!important } .h-auto { height:auto!important } }@media screen and (max-width:384px) {.mail-message-content { width:414px!important } }</style></head><body class="body" style="width:100%;height:100%;font-family:arial, 'helvetica neue', helvetica, sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;padding:0;Margin:0"><div dir="ltr" class="es-wrapper-color" lang="en" style="background-color:#E2E1E1"><!--[if gte mso 9]><v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="t"><v:fill type="tile"  color="#e2e1e1" origin="0.5, 0" position="0.5, 0"></v:fill></v:background><![endif]--><table cellspacing="0" cellpadding="0" width="100%" class="es-wrapper" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;padding:0;Margin:0;width:100%;height:100%;background-repeat:repeat;background-position:center top"><tr><td valign="top" style="padding:0;Margin:0"><table align="center" cellspacing="0" cellpadding="0" class="es-content" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;width:100%;table-layout:fixed !important"><tr><td align="center" style="padding:0;Margin:0"><table cellspacing="0" cellpadding="0" bgcolor="#ffffff" align="center" class="es-content-body" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#ffffff;width:600px" role="none"><tr><td align="left" style="padding:20px 20px 0;Margin:0"><table cellpadding="0" cellspacing="0" width="100%" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"><tr><td align="center" valign="top" style="padding:0;Margin:0;width:560px"><table cellspacing="0" width="100%" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:separate;border-spacing:0px;border-bottom:1px solid #dfdfdf;border-radius:30px;border-left:1px solid #dfdfdf;border-right:1px solid #dfdfdf;border-top:1px solid #dfdfdf" role="presentation"><tr><td align="center" style="padding:20px;Margin:0;font-size:0px"><img src="https://firebasestorage.googleapis.com/v0/b/taskzy-9c2e5.firebasestorage.app/o/public%2Ftaskzylogo.png?alt=media" alt="TasksZy" width="518" title="TasksZy" class="adapt-img" style="display:block;font-size:14px;border:0;outline:none;text-decoration:none;margin:0;border-radius:20px" height="91"></td></tr></table></td></tr></table></td></tr><tr><td align="left" style="Margin:0;padding:30px 20px"><table width="100%" cellspacing="0" cellpadding="0" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"><tr><td valign="top" align="center" class="es-m-p0r" style="padding:0;Margin:0;width:560px"><table width="100%" cellspacing="0" cellpadding="0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"><tr><td align="center" style="padding:0;Margin:0"><h1 style="Margin:0;font-family:Prompt, sans-serif;mso-line-height-rule:exactly;letter-spacing:0;font-size:36px;font-style:normal;font-weight:normal;line-height:43px;color:#333333">Password Reset Request</h1><p style="Margin:0;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;letter-spacing:0;color:#333333;font-size:14px">Secure access to your TasksZy account</p><p style="Margin:0;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;letter-spacing:0;color:#333333;font-size:14px"><br></p></td></tr><tr><td align="center" style="padding:0;Margin:0"><!--[if mso]><a href="${resetLink}" target="_blank" hidden><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" esdevVmlButton href="${resetLink}" style="height:41px; v-text-anchor:middle; width:197px" arcsize="50%" stroke="f"  fillcolor="#1acae3"><w:anchorlock></w:anchorlock><center style='color:#ffffff; font-family:Prompt, sans-serif; font-size:15px; font-weight:400; line-height:15px;  mso-text-raise:1px'>Reset Password</center></v:roundrect></a><![endif]--><!--[if !mso]><!-- --><span class="es-button-border msohide" style="border-style:solid;border-color:#2CB543;background:#1ACAE3;border-width:0px;display:inline-block;border-radius:30px;width:auto;mso-hide:all"><a target="_blank" href="${resetLink}" class="es-button" style="mso-style-priority:100 !important;text-decoration:none !important;mso-line-height-rule:exactly;color:#FFFFFF;font-size:18px;padding:10px 20px;display:inline-block;background:#1ACAE3;border-radius:30px;font-family:Prompt, sans-serif;font-weight:normal;font-style:normal;line-height:22px;width:auto;text-align:center;letter-spacing:0;mso-padding-alt:0;mso-border-alt:10px solid #1ACAE3">Reset Password</a></span><!--<![endif]--></td></tr><tr><td align="left" style="padding:20px 0 30px;Margin:0"><p style="Margin:0;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;letter-spacing:0;color:#333333;font-size:14px">Hi ${userName},</p><p style="Margin:0;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;letter-spacing:0;color:#333333;font-size:14px"><br></p><p style="Margin:0;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;letter-spacing:0;color:#333333;font-size:14px">We received a request to reset the password for your TasksZy account.</p><p style="Margin:0;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;letter-spacing:0;color:#333333;font-size:14px"><br></p><p style="Margin:0;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;letter-spacing:0;color:#333333;font-size:14px">To create a new password, click the button above.</p><p style="Margin:0;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;letter-spacing:0;color:#333333;font-size:14px"><br></p><p style="Margin:0;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;letter-spacing:0;color:#333333;font-size:14px">For your security, this link will expire after a limited time.</p><p style="Margin:0;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;letter-spacing:0;color:#333333;font-size:14px"><br></p><p style="Margin:0;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;letter-spacing:0;color:#333333;font-size:14px">If you did not request a password reset, you can safely ignore this email. Your account will remain secure and no changes will be made.</p><p style="Margin:0;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;letter-spacing:0;color:#333333;font-size:14px"><br></p><p style="Margin:0;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;letter-spacing:0;color:#333333;font-size:14px">If you need assistance, please contact our support team.</p><p style="Margin:0;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;letter-spacing:0;color:#333333;font-size:14px"><br></p><p style="Margin:0;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;letter-spacing:0;color:#333333;font-size:14px">Best regards,</p><p style="Margin:0;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;letter-spacing:0;color:#333333;font-size:14px"><br></p><p style="Margin:0;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;letter-spacing:0;color:#333333;font-size:14px">The TasksZy Team</p></td></tr></table></td></tr></table></td></tr></table></td></tr></table><table cellspacing="0" align="center" cellpadding="0" class="es-footer" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;width:100%;table-layout:fixed !important;background-color:transparent;background-repeat:repeat;background-position:center top"><tr><td align="center" style="padding:0;Margin:0"><table align="center" cellpadding="0" cellspacing="0" bgcolor="#ffffff" class="es-footer-body" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:600px"><tr><td align="left" style="padding:20px;Margin:0"><table cellpadding="0" cellspacing="0" width="100%" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"><tr><td align="left" style="padding:0;Margin:0;width:560px"><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"><tr><td align="center" style="padding:0;Margin:0"><p style="Margin:0;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;letter-spacing:0;color:#333333;font-size:14px"><a target="_blank" href="https://www.taskszy.com" style="mso-line-height-rule:exactly;text-decoration:none;color:#333333;font-size:14px"> www.taskszy.com <br>support.taskszy@gmail.com <br> <br>© 2026 TasksZy. All rights reserved. <br> </a></p></td></tr><tr><td align="center" style="padding:10px 0;Margin:0"><p style="Margin:0;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:24px;letter-spacing:0;color:#757279;font-size:12px"><a target="_blank" href="https://www.taskszy.com/privacy" style="mso-line-height-rule:exactly;text-decoration:none;color:#333333;font-size:12px;line-height:24px">Privacy</a>&nbsp;| <a target="_blank" style="mso-line-height-rule:exactly;text-decoration:none;color:#333333;font-size:12px;line-height:24px" href="https://www.taskszy.com/preferences">Manage Preferences</a></p></td></tr></table></td></tr></table></td></tr><tr></tr></table></td></tr></table></td></tr></table></div></body></html>`;

    // Send email via Gmail SMTP
    await transporter.sendMail({
      from: '"TasksZy" <support.taskszy@gmail.com>',
      to: email,
      subject: 'Password Reset Request - TasksZy',
      html: htmlContent,
      text: `Hi ${userName},\n\nWe received a request to reset the password for your TasksZy account.\n\nTo create a new password, click this link:\n${resetLink}\n\nFor your security, this link will expire after a limited time.\n\nIf you did not request a password reset, you can safely ignore this email. Your account will remain secure and no changes will be made.\n\nIf you need assistance, please contact support.taskszy@gmail.com\n\nBest regards,\nThe TasksZy Team`,
    });

    return {
      success: true,
      message: 'If this email is registered, you will receive a password reset link.',
    };
  } catch (error) {
    throw new HttpsError('internal', `Failed to send password reset email: ${error.message}`);
  }
});
