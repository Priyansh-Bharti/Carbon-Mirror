'use strict';

/**
 * @fileoverview Client wrapper for interacting with the secure server-side Gemini AI Coach.
 */

import { getApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getFunctions, httpsCallable } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-functions.js';
import { logger } from './utils.js';

let functionsInstance = null;

/**
 * Gets the Functions instance.
 * @returns {Object} The Firebase Functions instance.
 */
function getFunctionsInstance() {
  if (!functionsInstance) {
    const app = getApp();
    functionsInstance = getFunctions(app);
  }
  return functionsInstance;
}

/**
 * Calls the geminiCoach Cloud Function (never Gemini API directly).
 * @param {string} message - User's message.
 * @param {Object} userContext - { planetScore, topEmission, city, committedActions }.
 * @param {Array} conversationHistory - Last 5 turns.
 * @returns {Promise<{reply: string, suggestedActions: string[]}>} Response object.
 */
export async function askCoach(message, userContext, conversationHistory) {

  try {
    logger.info('Calling geminiCoach Cloud Function...');
    const functions = getFunctionsInstance();
    const geminiCoach = httpsCallable(functions, 'geminiCoach');
    
    const result = await geminiCoach({
      message,
      userContext,
      history: conversationHistory.slice(-5)
    });

    logger.info('Received response from geminiCoach.');
    if (result.data && result.data.error === 'RATE_LIMIT') {
      return {
        reply: result.data.message,
        suggestedActions: []
      };
    }
    return {
      reply: result.data?.reply || 'No response from the coach.',
      suggestedActions: result.data?.suggestedActions || []
    };
  } catch (error) {
    logger.error('Error calling geminiCoach Cloud Function.', { message: error.message });
    throw error;
  }
}
