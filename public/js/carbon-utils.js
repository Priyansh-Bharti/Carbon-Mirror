'use strict';

/**
 * @fileoverview Utility functions for carbon footprint display and impact calculations.
 */

import { ACTIONS } from './constants.js';

/**
 * Converts annual emissions to a 0-100 planet score.
 * @param {number} kgPerYear - Annual emissions.
 * @returns {number} Score from 0 to 100.
 * @throws {never}
 */
export function kgToPlanetScore(kgPerYear) {
  if (typeof kgPerYear !== 'number' || isNaN(kgPerYear) || kgPerYear < 0) {
    return 0;
  }
  let score;
  if (kgPerYear <= 2200) {
    score = 100 - (kgPerYear * 50 / 2200);
  } else if (kgPerYear <= 4700) {
    score = 50 - ((kgPerYear - 2200) * 20 / 2500);
  } else {
    score = 30 - ((kgPerYear - 4700) * 30 / 10000);
  }
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Maps the score to a planet state string.
 * @param {number} score - Score between 0 and 100.
 * @returns {'thriving'|'stressed'|'struggling'|'critical'}
 * @throws {never}
 */
export function getPlanetState(score) {
  if (typeof score !== 'number' || isNaN(score)) {
    return 'critical';
  }
  if (score >= 75) {return 'thriving';}
  if (score >= 50) {return 'stressed';}
  if (score >= 30) {return 'struggling';}
  return 'critical';
}

/**
 * Calculates CO2 and financial impact of an action.
 * @param {string} actionId - key from ACTIONS.
 * @param {Object} userProfile - User footprint data.
 * @returns {Object|Error} Impact details or Error.
 * @throws {never}
 */
export function calculateActionImpact(actionId, userProfile) {
  if (typeof actionId !== 'string' || !userProfile || typeof userProfile !== 'object') {
    return new Error('Invalid arguments for calculateActionImpact.');
  }
  const action = ACTIONS[actionId];
  if (!action) {
    return new Error(`Unknown action ID: ${actionId}`);
  }
  const currentEmissions = typeof userProfile.totalKgPerYear === 'number' ? userProfile.totalKgPerYear : 0;
  const annualSavings = action.kgSavedPerMonth * 12.0;
  const newEmissions = Math.max(0, currentEmissions - annualSavings);
  return {
    kgSavedPerMonth: action.kgSavedPerMonth,
    rupeeSavedPerMonth: action.rupeeSavedPerMonth,
    newScore: kgToPlanetScore(newEmissions)
  };
}

/**
 * Formats a kg value into a display string.
 * @param {number} kg - Value in kg.
 * @returns {string} Formatted emissions string.
 * @throws {never}
 */
export function formatCO2(kg) {
  if (typeof kg !== 'number' || isNaN(kg)) {
    return '0 kg';
  }
  if (kg < 1.0) {
    return `${Math.round(kg * 1000.0)} g`;
  }
  if (kg < 1000.0) {
    return `${Number(kg.toFixed(2))} kg`;
  }
  return `${Number((kg / 1000.0).toFixed(2))}T`;
}

/**
 * Aggregates projected savings and computes a simulated planet score based on committed actions.
 * Abstracted from UI to enforce strict Separation of Concerns.
 * @param {Object} baselineFootprint - The user's baseline footprint object.
 * @param {Array<string>} selectedActionIds - Array of selected action keys from ACTIONS.
 * @returns {Object} An object containing totalSavedKgPerYear, totalSavedRupeesPerMonth, and simulatedFootprint.
 */
export function aggregateProjectedSavings(baselineFootprint, selectedActionIds) {
  let totalSavedKgPerYear = 0;
  let totalSavedRupeesPerMonth = 0;
  const simulatedFootprint = { ...baselineFootprint };

  if (Array.isArray(selectedActionIds) && baselineFootprint) {
    selectedActionIds.forEach(actionId => {
      const impact = calculateActionImpact(actionId, simulatedFootprint);
      if (!(impact instanceof Error)) {
        const annualKgSaved = impact.kgSavedPerMonth * 12.0;
        totalSavedKgPerYear += annualKgSaved;
        totalSavedRupeesPerMonth += impact.rupeeSavedPerMonth;
        
        simulatedFootprint.totalKgPerYear = Math.max(0, simulatedFootprint.totalKgPerYear - annualKgSaved);
        simulatedFootprint.planetScore = kgToPlanetScore(simulatedFootprint.totalKgPerYear);
      }
    });
  }

  return { totalSavedKgPerYear, totalSavedRupeesPerMonth, simulatedFootprint };
}
