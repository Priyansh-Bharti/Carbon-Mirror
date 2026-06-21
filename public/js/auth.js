'use strict';

/**
 * @fileoverview Firebase Authentication wrapper module.
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { 
  initializeAppCheck, 
  ReCaptchaV3Provider 
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app-check.js';
import { logger } from './utils.js';

let app;
let auth;

/**
 * Initialize the Firebase application and authentication services.
 * @param {Object} firebaseConfig - The client configuration object.
 * @throws {Error} If config is missing or invalid.
 */
export function initAuth(firebaseConfig) {
  if (!firebaseConfig || !firebaseConfig.apiKey) {
    throw new Error('Invalid Firebase Configuration parameters provided.');
  }
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  
  // Enable debug token for local testing in emulator environment
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  }
  
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider('6Lc5F2AqAAAAAOfy8v8F-R_3pS_y0B14cZ24cZ24'),
      isTokenAutoRefreshEnabled: true
    });
    logger.info('Firebase App Check initialized.');
  } else {
    logger.info('Firebase App Check skipped on local environment.');
  }

  logger.info('Firebase Auth modules initialized successfully.');
}

/**
 * Initiates the Google Sign-In popup flow.
 * @returns {Promise<Object>} The authenticated user object.
 * @throws {Error} If sign-in fails or popup is blocked.
 */
export async function signInWithGoogle() {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    logger.info('User successfully authenticated via Google Sign-In.', { uid: result.user.uid });
    return result.user;
  } catch (error) {
    logger.error('Google Sign-In failed.', { code: error.code, message: error.message });
    throw new Error(`Authentication Error: ${error.message}`, { cause: error });
  }
}

/**
 * Signs out the currently authenticated user.
 * @returns {Promise<void>}
 * @throws {Error} If sign-out fails.
 */
export async function signOutUser() {
  try {
    await signOut(auth);
    logger.info('User signed out successfully.');
  } catch (error) {
    logger.error('Sign-out operation failed.', { code: error.code, message: error.message });
    throw new Error(`Sign-out Error: ${error.message}`, { cause: error });
  }
}

/**
 * Register a listener to respond to changes in auth state.
 * @param {function(Object|null): void} callback - Triggered when auth state updates.
 */
export function listenToAuthState(callback) {
  if (!auth) {
    throw new Error('Auth service must be initialized before registering state listeners.');
  }
  onAuthStateChanged(auth, callback);
}
