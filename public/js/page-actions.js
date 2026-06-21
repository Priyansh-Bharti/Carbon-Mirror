'use strict';

/**
 * @fileoverview Logic module for the Action Lab Page (actions.html).
 */

import { listenToAuthState } from './auth.js';
import { getUserProfile, saveUserProfile } from './firestore.js';
import { aggregateProjectedSavings } from './carbon-utils.js';
import { PlanetOrb } from './planet.js';
import { logger, showNotification } from './utils.js';
import { DEFAULT_BASELINE_FOOTPRINT } from './constants.js';

let currentOrb = null;
let projectedOrb = null;

/**
 * Calculates and renders the projected footprint savings and planet score.
 * Relies on carbon-utils to handle the pure mathematical logic.
 * @param {Object} baselineFootprint - User baseline footprint.
 * @param {Array<string>} selectedActionIds - IDs of selected actions.
 */
function updateProjectedImpact(baselineFootprint, selectedActionIds) {
  const impactResult = aggregateProjectedSavings(baselineFootprint, selectedActionIds);
  const { totalSavedKgPerYear, totalSavedRupeesPerMonth, simulatedFootprint } = impactResult;

  const savedElement = document.getElementById('projected-reduction-total');
  if (savedElement) {
    savedElement.innerHTML = `${(totalSavedKgPerYear / 1000.0).toFixed(2)} <span class="label-caps" style="font-size: 14px;">Tons/Yr Saved</span>`;
  }
  const rupeeElement = document.getElementById('projected-money-total');
  if (rupeeElement) {
    rupeeElement.textContent = `₹${totalSavedRupeesPerMonth}/Month Saved`;
  }

  if (projectedOrb) {
    projectedOrb.setState(selectedActionIds.length > 0 ? simulatedFootprint.planetScore : baselineFootprint.planetScore);
  }
}

/**
 * Saves committed actions array to Firestore.
 * @param {string} userId - Auth user ID.
 * @param {Array<string>} selectedActionIds - Committed actions.
 * @returns {Promise<void>}
 */
async function saveCommitments(userId, selectedActionIds) {
  const saveButton = document.getElementById('save-actions-btn');
  if (saveButton) {saveButton.disabled = true;}
  try {
    await saveUserProfile(userId, { committedActions: selectedActionIds });
    logger.info('Actions committed successfully to Firestore.');
    showNotification('Commitments saved to your planet profile successfully!');
  } catch (saveError) {
    logger.error('Failed to save commitments.', { message: saveError.message });
    showNotification(`Failed to save commitments: ${saveError.message}`);
  } finally {
    if (saveButton) {saveButton.disabled = false;}
  }
}

/**
 * Sets up action checkboxes event listeners.
 * @param {Object} profile - User profile.
 * @param {string} userId - User's authenticated ID.
 * @returns {void}
 */
function setupListeners(profile, userId) {
  const footprint = profile.footprint || { ...DEFAULT_BASELINE_FOOTPRINT };
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
      if (cb) {cb.checked = true;}
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
 * @returns {void}
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
 * @returns {void}
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
        showNotification('Please complete your baseline quiz to unlock the Action Lab!');
        window.location.href = 'quiz';
        return;
      }
      const footprint = profile.footprint || { ...DEFAULT_BASELINE_FOOTPRINT };
      initializeComparisonOrbs(footprint);
      setupListeners(profile, user.uid);
    } catch (err) {
      logger.error('Failed to load actions page.', { message: err.message });
    }
  });
}
