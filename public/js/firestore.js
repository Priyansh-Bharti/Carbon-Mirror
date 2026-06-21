'use strict';

/**
 * @fileoverview Firestore database reading and writing module.
 * Serves as the single source of truth for database interactions.
 */

import { 
  getFirestore, doc, setDoc, getDoc, collection, addDoc, getDocs, query, orderBy, limit
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { DB_COLLECTIONS } from './constants.js';
import { logger } from './utils.js';

let db;

/**
 * Initializes the Firestore instance.
 * @param {Object} app - The initialized Firebase application instance.
 */
export function initFirestore(app) {
  db = getFirestore(app);
  logger.info('Firestore database module initialized successfully.');
}

/**
 * Persists a user's profile metadata.
 * @param {string} userId - The authenticated user ID.
 * @param {Object} profileData - The user profile fields.
 * @returns {Promise<void>}
 */
export async function saveUserProfile(userId, profileData) {
  // Optimistically save to local cache so data survives page navigations
  // even if the Firebase write hangs on a slow network connection.
  const cached = localStorage.getItem(`cm_profile_${userId}`);
  const existing = cached ? JSON.parse(cached) : {};
  const updated = { ...existing, ...profileData };
  localStorage.setItem(`cm_profile_${userId}`, JSON.stringify(updated));
  
  if (profileData.quizAnswers) {
    import('./carbon.js').then((carbon) => {
      const footprint = carbon.calculateTotalFootprint(profileData.quizAnswers);
      if (!(footprint instanceof Error)) {
        updated.footprint = footprint;
        localStorage.setItem(`cm_profile_${userId}`, JSON.stringify(updated));
      }
    });
  }

  try {
    const docRef = doc(db, DB_COLLECTIONS.USERS, userId);
    await setDoc(docRef, profileData, { merge: true });
    logger.info('User profile saved successfully.', { userId });
  } catch (error) {
    logger.warn('Firebase write failed. Local cache already updated.', { userId, error: error.message });
  }
}

/**
 * Retrieves a user's profile.
 * @param {string} userId - The authenticated user ID.
 * @returns {Promise<Object|null>} The profile object or null.
 */
export async function getUserProfile(userId) {
  try {
    const docRef = doc(db, DB_COLLECTIONS.USERS, userId);
    const snap = await getDoc(docRef);
    if (snap.exists()) return snap.data();
  } catch (error) {
    logger.warn('Firebase read failed. Loading from offline localStorage cache.', { userId });
  }
  
  try {
    const cached = localStorage.getItem(`cm_profile_${userId}`);
    if (cached) return JSON.parse(cached);
  } catch (_e) {
    logger.warn('Failed to parse localStorage cache, returning null.', { userId });
  }

  return null;
}

/**
 * Log a new carbon calculation entry under the user's history.
 * @param {string} userId - The user ID.
 * @param {Object} data - Carbon calculation inputs and output score.
 * @returns {Promise<string>} The generated log ID.
 */
export async function logFootprint(userId, data) {
  try {
    const colRef = collection(db, DB_COLLECTIONS.USERS, userId, DB_COLLECTIONS.FOOTPRINTS);
    const res = await addDoc(colRef, { ...data, timestamp: new Date() });
    logger.info('Carbon footprint log recorded.', { userId, logId: res.id });
    return res.id;
  } catch (error) {
    logger.error('Failed to log carbon footprint.', { userId, message: error.message });
    throw error;
  }
}

/**
 * Fetch the latest footprint logs for a user.
 * @param {string} userId - The user ID.
 * @param {number} maxResults - Max logs to fetch.
 * @returns {Promise<Array<Object>>}
 */
export async function getFootprintHistory(userId, maxResults = 10) {
  try {
    const colRef = collection(db, DB_COLLECTIONS.USERS, userId, DB_COLLECTIONS.FOOTPRINTS);
    const q = query(colRef, orderBy('timestamp', 'desc'), limit(maxResults));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    logger.error('Failed to retrieve footprint history.', { userId, message: error.message });
    throw error;
  }
}
