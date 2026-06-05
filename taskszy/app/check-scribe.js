const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkScribe() {
  const scribeRef = db.doc('workspaces/ws_4F7302SmaBR1pWTTGgBaCXJZcSU2/notes/scribe_1779319065927_x2ix9r5qk');
  const scribeSnap = await scribeRef.get();
  
  if (scribeSnap.exists) {
    const data = scribeSnap.data();
    console.log('Scribe data:', JSON.stringify({
      id: scribeSnap.id,
      title: data.title,
      accessList: data.accessList,
      members: data.members,
      createdBy: data.createdBy
    }, null, 2));
  } else {
    console.log('Scribe not found');
  }
}

checkScribe().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
