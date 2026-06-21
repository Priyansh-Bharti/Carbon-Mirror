'use strict';

/**
 * @fileoverview Integration tests for Firestore security rules.
 * Runs using @firebase/rules-unit-testing in local Firebase emulator environment.
 */

import { describe, test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc } from 'firebase/firestore';

/** @type {import('@firebase/rules-unit-testing').RulesTestEnvironment|null} */
let testEnv = null;

before(async () => {
  try {
    // Quick check if the emulator is listening on port 8080
    const res = await fetch('http://127.0.0.1:8080');
    if (res.ok || res.status === 404 || res.status === 400) {
      testEnv = await initializeTestEnvironment({
        projectId: 'carbon-mirror',
        firestore: {
          host: '127.0.0.1',
          port: 8080,
          rules: fs.readFileSync('firestore.rules', 'utf8')
        }
      });
    }
  } catch (error) {
    // Emulator is not running, testEnv remains null
  }
});

after(async () => {
  if (testEnv) {
    await testEnv.cleanup();
  }
});

beforeEach(async () => {
  if (testEnv) {
    await testEnv.clearFirestore();
  }
});

/**
 * Returns a Firestore instance for an authenticated user.
 * @param {string} userId - The user ID.
 * @returns {import('firebase/firestore').Firestore} The authenticated Firestore instance.
 */
function getAuthDb(userId) {
  return testEnv.authenticatedContext(userId).firestore();
}

/**
 * Returns a Firestore instance for an unauthenticated client.
 * @returns {import('firebase/firestore').Firestore} The unauthenticated Firestore instance.
 */
function getUnauthDb() {
  return testEnv.unauthenticatedContext().firestore();
}

/**
 * Returns a Firestore instance for an admin user.
 * @param {string} userId - The user ID.
 * @returns {import('firebase/firestore').Firestore} The admin Firestore instance.
 */
function getAdminDb(userId) {
  return testEnv.authenticatedContext(userId, { admin: true }).firestore();
}

describe('Firestore Security Rules Integration tests', () => {
  
  test('unauthenticated users cannot read user profiles', async (t) => {
    if (!testEnv) return t.skip('Firestore emulator not running');
    const db = getUnauthDb();
    await assertFails(getDoc(doc(db, 'users/alice')));
  });

  test('authenticated owners can read and write their own documents', async (t) => {
    if (!testEnv) return t.skip('Firestore emulator not running');
    const db = getAuthDb('alice');
    await assertSucceeds(setDoc(doc(db, 'users/alice'), {
      displayName: 'Alice',
      email: 'alice@example.com',
      quizAnswers: {
        transport: { mode: 'motorcycle', distanceKm: 15.0 },
        home: { cookingFuel: 'lpg', electricityKwhPerMonth: 120.0, acHoursPerDay: 4.0, householdSize: 3 },
        food: { dietType: 'vegetarian' }
      }
    }));
    await assertSucceeds(getDoc(doc(db, 'users/alice')));
  });

  test('non-owners cannot read or write user profiles', async (t) => {
    if (!testEnv) return t.skip('Firestore emulator not running');
    const db = getAuthDb('bob');
    await assertFails(getDoc(doc(db, 'users/alice')));
    await assertFails(setDoc(doc(db, 'users/alice'), { displayName: 'Hacked' }));
  });

  test('user cannot update the footprint field directly', async (t) => {
    if (!testEnv) return t.skip('Firestore emulator not running');
    const db = getAuthDb('alice');
    await assertFails(setDoc(doc(db, 'users/alice'), {
      footprint: { totalKgPerDay: 5.0 }
    }, { merge: true }));
  });

  test('user cannot update quizAnswers with invalid input', async (t) => {
    if (!testEnv) return t.skip('Firestore emulator not running');
    const db = getAuthDb('alice');
    await assertFails(setDoc(doc(db, 'users/alice'), {
      quizAnswers: {
        transport: { mode: 'motorcycle', distanceKm: -1.0 },
        home: { cookingFuel: 'coal', electricityKwhPerMonth: 120.0, acHoursPerDay: 4.0, householdSize: 3 },
        food: { dietType: 'vegetarian' }
      }
    }));
  });

  test('user can read and write their own daily logs', async (t) => {
    if (!testEnv) return t.skip('Firestore emulator not running');
    const db = getAuthDb('alice');
    const today = new Date().toISOString().split('T')[0];
    await assertSucceeds(setDoc(doc(db, `users/alice/logs/${today}`), {
      transportKg: 2.5,
      homeKg: 3.0,
      foodKg: 1.5,
      totalKg: 7.0,
      notes: 'Clean commute today'
    }));
    await assertSucceeds(getDoc(doc(db, `users/alice/logs/${today}`)));
  });

  test('user cannot write logs with invalid date format', async (t) => {
    if (!testEnv) return t.skip('Firestore emulator not running');
    const db = getAuthDb('alice');
    await assertFails(setDoc(doc(db, 'users/alice/logs/2026-6-19'), {
      transportKg: 2.5,
      homeKg: 3.0,
      foodKg: 1.5,
      totalKg: 7.0
    }));
  });

  test('user cannot write logs with out-of-range emissions', async (t) => {
    if (!testEnv) return t.skip('Firestore emulator not running');
    const db = getAuthDb('alice');
    const today = new Date().toISOString().split('T')[0];
    await assertFails(setDoc(doc(db, `users/alice/logs/${today}`), {
      transportKg: 105.0,
      homeKg: 3.0,
      foodKg: 1.5,
      totalKg: 7.0
    }));
  });

  test('user cannot write logs with backdated dates', async (t) => {
    if (!testEnv) return t.skip('Firestore emulator not running');
    const db = getAuthDb('alice');
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    await assertFails(setDoc(doc(db, `users/alice/logs/${twoDaysAgo}`), {
      transportKg: 2.5,
      homeKg: 3.0,
      foodKg: 1.5,
      totalKg: 7.0
    }));
  });

  test('anyone can read the community forest data', async (t) => {
    if (!testEnv) return t.skip('Firestore emulator not running');
    const db = getUnauthDb();
    await assertSucceeds(getDoc(doc(db, 'community/Delhi')));
  });

  test('only admin can write to community forest data', async (t) => {
    if (!testEnv) return t.skip('Firestore emulator not running');
    const userDb = getAuthDb('alice');
    const adminDb = getAdminDb('admin');
    await assertFails(setDoc(doc(userDb, 'community/Delhi'), { avgPlanetScore: 80 }));
    await assertSucceeds(setDoc(doc(adminDb, 'community/Delhi'), { avgPlanetScore: 85 }));
  });
});
