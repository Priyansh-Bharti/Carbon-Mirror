'use strict';

/**
 * @fileoverview Logic module for the Action Lab Page (actions.html).
 */

import { listenToAuthState } from './auth.js';
import { getUserProfile, saveUserProfile } from './firestore.js';
import { calculateActionImpact } from './carbon-utils.js';
import { PlanetOrb } from './planet.js';
import { logger } from './utils.js';

let currentOrb = null;
let projectedOrb = null;

/**
 * Calculates and renders the projected footprint savings and planet score.
 * @param {Object} footprint - User baseline footprint.
 * @param {Array<string>} selected - IDs of selected actions.
 */
function updateProjectedImpact(footprint, selected) {
  let totalSavedKg = 0;
  let totalSavedRupees = 0;
  const tempProfile = { ...footprint };

  selected.forEach(actionId => {
    const impact = calculateActionImpact(actionId, tempProfile);
    if (!(impact instanceof Error)) {
      totalSavedKg += impact.kgSavedPerMonth * 12.0;
      totalSavedRupees += impact.rupeeSavedPerMonth;
      tempProfile.totalKgPerYear = Math.max(0, tempProfile.totalKgPerYear - (impact.kgSavedPerMonth * 12.0));
    }
  });

  const savedEl = document.getElementById('projected-reduction-total');
  if (savedEl) {
    savedEl.innerHTML = `${(totalSavedKg / 1000.0).toFixed(2)} <span class="label-caps" style="font-size: 14px;">Tons/Yr Saved</span>`;
  }
  const rupeeEl = document.getElementById('projected-money-total');
  if (rupeeEl) {
    rupeeEl.textContent = `₹${totalSavedRupees}/Month Saved`;
  }

  if (projectedOrb) {
    projectedOrb.setState(selected.length > 0 ? tempProfile.planetScore : footprint.planetScore);
  }
}

/**
 * Saves committed actions array to Firestore.
 * @param {string} userId - Auth user ID.
 * @param {Array<string>} selected - Committed actions.
 */
async function saveCommitments(userId, selected) {
  const saveBtn = document.getElementById('save-actions-btn');
  if (saveBtn) saveBtn.disabled = true;
  try {
    await saveUserProfile(userId, { committedActions: selected });
    logger.info('Actions committed successfully to Firestore.');
    alert('Commitments saved to your planet profile successfully!');
  } catch (error) {
    logger.error('Failed to save commitments.', { message: error.message });
    alert('Failed to save commitments: ' + error.message);
  } finally {
    if (saveBtn) saveBtn.disabled = false;
  }
}

/**
 * Sets up action checkboxes event listeners.
 * @param {Object} profile - User profile.
 * @param {string} userId - User's authenticated ID.
 */
function setupListeners(profile, userId) {
  const footprint = profile.footprint || { totalKgPerYear: 2200, planetScore: 50 };
  const checkboxes = document.querySelectorAll('#actions-checklist-section input[type="checkbox"]');
  
  const getSelected = () => Array.from(checkboxes)
    .filter(cb => cb.checked)
    .map(cb => cb.id.replace('action-', ''));

  checkboxes.forEach(cb => {
    cb.addEventListener('change', () => {
      updateProjectedImpact(footprint, getSelected());
    });
  });

  // Pre-check existing committed actions
  if (profile.committedActions) {
    profile.committedActions.forEach(id => {
      const cb = document.getElementById(`action-${id}`);
      if (cb) cb.checked = true;
    });
    updateProjectedImpact(footprint, getSelected());
  }

  const saveBtn = document.getElementById('save-actions-btn');
  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      if (userId) {
        await saveCommitments(userId, getSelected());
      }
    });
  }
}

/**
 * Initializes visual canvas orbs for comparison.
 * @param {Object} footprint - User baseline footprint.
 */
function initializeComparisonOrbs(footprint) {
  const curCanvas = document.getElementById('planet-current');
  const projCanvas = document.getElementById('planet-projected');

  if (curCanvas instanceof HTMLCanvasElement && projCanvas instanceof HTMLCanvasElement) {
    const score = footprint.planetScore || 50;

    currentOrb = new PlanetOrb(curCanvas, { size: 300 });
    currentOrb.setState(score);
    currentOrb.startAnimation();

    projectedOrb = new PlanetOrb(projCanvas, { size: 300 });
    projectedOrb.setState(score);
    projectedOrb.startAnimation();
  }
}

/**
 * Initializes the Action Lab page module.
 */
export function initActionsPage() {
  logger.info('Initializing Actions Page module.');
  listenToAuthState(async (user) => {
    if (!user) {
      window.location.href = './';
      return;
    }
    try {
      const profile = await getUserProfile(user.uid);
      if (!profile || !profile.quizAnswers) {
        alert('Please complete your baseline quiz to unlock the Action Lab!');
        window.location.href = 'quiz';
        return;
      }
      const footprint = profile.footprint || { totalKgPerYear: 2200, planetScore: 50 };
      initializeComparisonOrbs(footprint);
      setupListeners(profile, user.uid);
    } catch (err) {
      logger.error('Failed to load actions page.', { message: err.message });
    }
  });
}
