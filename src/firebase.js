import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithRedirect, getRedirectResult, signOut } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDoc, doc } from 'firebase/firestore';

// Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const db = getFirestore(app);

// Add YouTube scope for YouTube access
googleProvider.addScope('https://www.googleapis.com/auth/youtube.readonly');

// Sign in with Google using redirect (more reliable than popup)
export const signInWithGoogle = async () => {
  try {
    await signInWithRedirect(auth, googleProvider);
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
};

// Handle redirect result
export const handleRedirectResult = async () => {
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      return result.user;
    }
    return null;
  } catch (error) {
    console.error('Error handling redirect:', error);
    throw error;
  }
};

// Sign out
export const signOutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

// Save overlay data and return short ID
export const saveOverlayData = async (videoUrl, overlays) => {
  try {
    const docRef = await addDoc(collection(db, 'overlays'), {
      videoUrl,
      overlays,
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error saving overlay data:', error);
    throw error;
  }
};

// Load overlay data by ID
export const loadOverlayData = async (id) => {
  try {
    const docRef = doc(db, 'overlays', id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      throw new Error('Overlay data not found');
    }
  } catch (error) {
    console.error('Error loading overlay data:', error);
    throw error;
  }
};

export { auth, db };
