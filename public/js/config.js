'use strict';

/**
 * Runtime configuration loader.
 * Values are injected at deploy time via CI/CD environment substitution.
 * NEVER hardcode values here. NEVER commit actual values.
 * @module config
 */
export const firebaseConfig = {
  apiKey:            "__FIREBASE_API_KEY__",
  authDomain:        "__FIREBASE_AUTH_DOMAIN__",
  projectId:         "__FIREBASE_PROJECT_ID__",
  storageBucket:     "__FIREBASE_STORAGE_BUCKET__",
  messagingSenderId: "__FIREBASE_MESSAGING_SENDER_ID__",
  appId:             "__FIREBASE_APP_ID__",
  measurementId:     "__FIREBASE_MEASUREMENT_ID__"
};

export const mapsApiKey = "__GOOGLE_MAPS_API_KEY__";

