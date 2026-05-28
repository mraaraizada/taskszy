import { initializeApp, getApps } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId:     import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);

// Explicitly set auth persistence to LOCAL (survives page reloads and browser restarts)
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error('Failed to set auth persistence:', error);
});

// Initialize Firestore with modern cache settings (replaces deprecated enableMultiTabIndexedDbPersistence)
// Handle both initial load and hot module reload (HMR) in development
let db;
try {
  // Try to initialize with new cache settings
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    })
  });
  console.log('✅ Firestore initialized with persistent multi-tab cache');
} catch (error) {
  // If already initialized (e.g., during HMR), just get the existing instance
  if (error.code === 'failed-precondition' || error.message?.includes('already been called')) {
    db = getFirestore(app);
    console.log('✅ Firestore instance reused (already initialized)');
  } else {
    throw error;
  }
}

export { db };
export const storage = getStorage(app);
export const functions = getFunctions(app);
export { app };
export default app;
