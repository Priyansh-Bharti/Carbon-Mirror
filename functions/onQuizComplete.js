'use strict';

/**
 * @fileoverview Cloud Function trigger for quiz completion calculations.
 */

import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { calculateTotalFootprint } from '../public/js/carbon.js';

/**
 * Triggered on user profile creation. Computes user emissions and aggregates city data.
 */
export const onQuizCompleteHandler = onDocumentCreated('users/{userId}', async (event) => {
  const snap = event.data;
  if (!snap) return;

  const userData = snap.data();
  const quizAnswers = userData.quizAnswers;
  if (!quizAnswers) return;

  const footprint = calculateTotalFootprint(quizAnswers);
  if (footprint instanceof Error) {
    // eslint-disable-next-line no-console
    console.error('Carbon footprint calculation failed:', footprint.message);
    return;
  }

  const savedCarbon = Math.max(0.0, 4.7 - (footprint.totalKgPerYear / 1000.0));
  const treesPlanted = Math.floor(savedCarbon * 10);
  const db = getFirestore();

  await snap.ref.update({
    footprint: {
      ...footprint,
      calculatedAt: FieldValue.serverTimestamp()
    }
  });

  const city = quizAnswers.city || 'Delhi';
  const name = userData.displayName || 'Anonymous User';
  await updateCityAggregation(db, city, name, footprint.planetScore, treesPlanted);
});

/**
 * Helper to update city metrics and leaderboard in a safe database transaction.
 * @param {Object} db - Firestore database instance.
 * @param {string} city - Target city name.
 * @param {string} name - User's display name.
 * @param {number} score - User's planet score.
 * @param {number} treeCount - Calculated trees planted.
 * @returns {Promise<void>}
 */
async function updateCityAggregation(db, city, name, score, treeCount) {
  const cityRef = db.doc(`community/${city}`);
  await db.runTransaction(async (transaction) => {
    const citySnap = await transaction.get(cityRef);
    let totalUsers = 1;
    let totalTrees = treeCount;
    let scoreSum = score;
    const leaderboard = citySnap.exists() ? (citySnap.data().weeklyLeaderboard || []) : [];

    if (citySnap.exists()) {
      const cityData = citySnap.data();
      totalUsers = (cityData.totalUsers || 0) + 1;
      totalTrees = (cityData.totalTreesPlanted || 0) + treeCount;
      const prevSum = cityData.totalScoreSum || ((cityData.avgPlanetScore || 0) * (cityData.totalUsers || 0));
      scoreSum = prevSum + score;
    }

    leaderboard.push({ name, score, treeCount });
    leaderboard.sort((a, b) => b.score - a.score || b.treeCount - a.treeCount);
    const weeklyLeaderboard = leaderboard.slice(0, 10);

    transaction.set(cityRef, {
      cityName: city,
      totalUsers,
      totalTreesPlanted: totalTrees,
      totalScoreSum: scoreSum,
      avgPlanetScore: Math.round(scoreSum / totalUsers),
      weeklyLeaderboard,
      lastUpdated: FieldValue.serverTimestamp()
    }, { merge: true });
  });
}
