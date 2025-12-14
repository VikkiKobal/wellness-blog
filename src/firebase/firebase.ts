import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.PUBLIC_FIREBASE_API_KEY || 'AIzaSyDJ_qez6hFj2ZGxxCYdjWEUmZsvAa2edNo',
  authDomain: import.meta.env.PUBLIC_FIREBASE_AUTH_DOMAIN || 'wellness-website-b150a.firebaseapp.com',
  projectId: import.meta.env.PUBLIC_FIREBASE_PROJECT_ID || 'wellness-website-b150a',
  storageBucket: import.meta.env.PUBLIC_FIREBASE_STORAGE_BUCKET || 'wellness-website-b150a.firebasestorage.app',
  messagingSenderId: import.meta.env.PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '632210720800',
  appId: import.meta.env.PUBLIC_FIREBASE_APP_ID || '1:632210720800:web:b4b501c9eefe62b3b71445',
  measurementId: import.meta.env.PUBLIC_FIREBASE_MEASUREMENT_ID || 'G-EXWV2H6HX8',
};

const app = initializeApp(firebaseConfig);

if (typeof window !== 'undefined') {
  try {
    getAnalytics(app);
  } catch (error) {
    console.warn('Firebase analytics skipped:', error);
  }
}

const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export async function signInWithGoogle() {
  return signInWithPopup(auth, googleProvider);
}

export async function signInWithEmailPassword(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

export { auth, signOut };