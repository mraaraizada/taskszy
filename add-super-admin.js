/**
 * Script to add a super admin to Firestore
 * Run this script with: node add-super-admin.js <email>
 * 
 * This will add the user with the given email to the superAdmins collection
 */

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function addSuperAdmin(email) {
  try {
    // Get user by email
    const userRecord = await admin.auth().getUserByEmail(email);
    const uid = userRecord.uid;
    
    console.log(`Found user: ${email} (UID: ${uid})`);
    
    // Add to superAdmins collection
    await db.collection('superAdmins').doc(uid).set({
      email: email,
      role: 'superadmin',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      permissions: {
        readAllWorkspaces: true,
        readAllUsers: true,
        manageFeedback: true,
        manageOrganizations: true,
      }
    });
    
    console.log(`✅ Successfully added ${email} as super admin!`);
    console.log(`UID: ${uid}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding super admin:', error.message);
    process.exit(1);
  }
}

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.error('Usage: node add-super-admin.js <email>');
  console.error('Example: node add-super-admin.js work.adityaraizada@gmail.com');
  process.exit(1);
}

addSuperAdmin(email);
