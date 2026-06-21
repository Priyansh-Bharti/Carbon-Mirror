'use strict';

/**
 * @fileoverview Firebase Cloud Functions entry point.
 */

import { initializeApp } from 'firebase-admin/app';
import { logger } from 'firebase-functions/v2';
import { onQuizCompleteHandler } from './onQuizComplete.js';
import { geminiCoachHandler } from './geminiProxy.js';
import { updateCommunityForestHandler } from './updateCommunityForest.js';

// Initialize the Firebase Admin SDK
initializeApp();

// Ensure critical environment variables exist at startup
if (!process.env.GEMINI_API_KEY && process.env.FUNCTIONS_EMULATOR !== 'true') {
  logger.warn('GEMINI_API_KEY is not set. Gemini Coach calls will fail in production.');
}

// Export secure Cloud Functions
export const onQuizComplete = onQuizCompleteHandler;
export const geminiCoach = geminiCoachHandler;
export const updateCommunityForest = updateCommunityForestHandler;
