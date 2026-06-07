import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBynMmBa93wAY_lm2d0m5RvbnjO2WybEfM",
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "taskzy-9c2e5.firebaseapp.com",
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID || "taskzy-9c2e5",
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "taskzy-9c2e5.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "878061170973",
  appId:             import.meta.env.VITE_FIREBASE_APP_ID || "1:878061170973:web:80fcd2dc98203fa3c071f4",
  measurementId:     import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-7LKHNM81DS",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth     = getAuth(app);
export const db       = getFirestore(app);
export const storage  = getStorage(app);
export const functions = getFunctions(app);
export default app;
