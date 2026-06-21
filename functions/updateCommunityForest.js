'use strict';

/**
 * @fileoverview Scheduled Cloud Function to aggregate regional community forest statistics.
 */

import { onSchedule } from 'firebase-functions/v2/scheduler';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

/**
 * Hourly scheduled function to aggregate users statistics across major metro cities in India.
 */
export const updateCommunityForestHandler = onSchedule('every 1 hour', async (_event) => {
  const db = getFirestore();
  const cities = ['Delhi', 'Mumbai', 'Bengaluru', 'Chennai', 'Hyderabad'];
  const batch = db.batch();

  for (const city of cities) {
    await aggregateCityStats(db, city, batch);
  }

  await batch.commit();
  // eslint-disable-next-line no-console
  console.log('Hourly community forest aggregates updated.');
});

/**
 * Helper to query users and add aggregated city data to a write batch.
 * @param {Object} db - Firestore database instance.
 * @param {string} city - Target city name.
 * @param {Object} batch - Firestore write batch instance.
 * @returns {Promise<void>}
 */
async function aggregateCityStats(db, city, batch) {
  const usersSnap = await db.collection('users')
    .where('quizAnswers.city', '==', city)
    .get();

  let totalUsers = 0;
  let totalTrees = 0;
  let scoreSum = 0;
  const leaderboard = [];

  usersSnap.forEach((doc) => {
    const userData = doc.data();
    const footprint = userData.footprint;
    if (!footprint) {return;}

    totalUsers += 1;
    scoreSum += footprint.planetScore || 0;
    const saved = Math.max(0.0, 4.7 - ((footprint.totalKgPerYear || 0) / 1000.0));
    const trees = Math.floor(saved * 10);
    totalTrees += trees;

    leaderboard.push({
      name: userData.displayName || 'Anonymous User',
      score: footprint.planetScore || 0,
      treeCount: trees
    });
  });

  leaderboard.sort((a, b) => b.score - a.score || b.treeCount - a.treeCount);
  const weeklyLeaderboard = leaderboard.slice(0, 10);
  const cityRef = db.doc(`community/${city}`);

  batch.set(cityRef, {
    cityName: city,
    totalUsers,
    totalTreesPlanted: totalTrees,
    totalScoreSum: scoreSum,
    avgPlanetScore: totalUsers > 0 ? Math.round(scoreSum / totalUsers) : 0,
    weeklyLeaderboard,
    lastUpdated: FieldValue.serverTimestamp()
  }, { merge: true });
}
