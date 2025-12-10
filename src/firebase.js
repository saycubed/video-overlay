import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithRedirect, getRedirectResult, signOut } from 'firebase/auth';

// Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA5X65oldXiPgxxJO9bMttiV2S02mL-RKU",
  authDomain: "video-overlay-9f8b5.firebaseapp.com",
  projectId: "video-overlay-9f8b5",
  storageBucket: "video-overlay-9f8b5.firebasestorage.app",
  messagingSenderId: "457876418012",
  appId: "1:457876418012:web:7e8a445d3dbcbe70c53319",
  measurementId: "G-7V1K763NXF"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

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

export { auth };
