'use strict';

/**
 * Runtime configuration loader.
 * Values are injected at deploy time via CI/CD environment substitution.
 * NEVER hardcode values here. NEVER commit actual values.
 * @module config
 */
export const firebaseConfig = {
  apiKey:            "AIzaSyDqi7D29wUt_jMGOxzR3WoKK4oD_8Fv-qw",
  authDomain:        "p2-o-fcb5d.firebaseapp.com",
  projectId:         "p2-o-fcb5d",
  storageBucket:     "p2-o-fcb5d.firebasestorage.app",
  messagingSenderId: "93244820981",
  appId:             "1:93244820981:web:9c7d7acaef98aaaa8ca4bc",
  measurementId:     "G-HX2WQW0JW9"
};

export const mapsApiKey = "AIzaSyBbiIWtuKaXVMP8_53UN2DeCaRSgFlnGDU";

