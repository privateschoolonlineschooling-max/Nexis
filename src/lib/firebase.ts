import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  updateProfile as firebaseUpdateProfile,
  onAuthStateChanged,
  User as FirebaseUser,
  Auth
} from 'firebase/auth';
import { 
  getFirestore, 
  Firestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
const env = ((import.meta as any)?.env || {}) as Record<string, string | undefined>;

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || "AIzaSyCMm3y60ZWSGIK8sGy5g5uwHSWX2GHDN8k",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "hale-line-n7dgj.firebaseapp.com",
  projectId: env.VITE_FIREBASE_PROJECT_ID || "hale-line-n7dgj",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "hale-line-n7dgj.firebasestorage.app",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "95288304007",
  appId: env.VITE_FIREBASE_APP_ID || "1:95288304007:web:3c451deed3d6b16f69f322",
};

// Initialize Firebase App
export const app: FirebaseApp = !getApps().length 
  ? initializeApp(firebaseConfig) 
  : getApp();

// Initialize Auth
export const auth: Auth = getAuth(app);

// Initialize Firestore (pointing to custom firestoreDatabaseId if configured)
const targetDatabaseId = env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || "ai-studio-nexissocialmarke-c0983569-ff4b-499d-a27f-6d4cca7474da";
export const db: Firestore = getFirestore(
  app, 
  targetDatabaseId
);

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  firebaseSignOut,
  firebaseUpdateProfile,
  onAuthStateChanged,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp
};

export type { FirebaseUser };
