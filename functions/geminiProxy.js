'use strict';

/**
 * @fileoverview Secure HTTPS Callable function for Gemini AI Carbon Coach.
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { COACH_SYSTEM_PROMPT, FALLBACK_RESPONSES } from './coachPrompt.js';

/**
 * Sanitizes input prompt to block XSS and prompt injection.
 * @param {string} msg - User input.
 * @returns {string} Sanitized string.
 * @throws {HttpsError} If prompt injection is detected.
 */
function sanitizeInput(msg) {
  if (typeof msg !== 'string' || msg.length > 500) {
    throw new HttpsError('invalid-argument', 'Input must be a string under 500 characters.');
  }
  const clean = msg
    .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const injectionRegex = /(ignore previous|system:|act as)/i;
  if (injectionRegex.test(clean)) {
    throw new HttpsError('invalid-argument', 'Instruction injection attempt blocked.');
  }
  return clean;
}

/**
 * Transactionally enforces rate limits.
 * @param {Object} db - Firestore database instance.
 * @param {string} userId - User authenticated ID.
 * @returns {Promise<boolean>} True if call allowed, false if limit hit.
 */
async function checkRateLimit(db, userId) {
  const today = new Date().toISOString().split('T')[0];
  const ref = db.doc(`users/${userId}/rateLimits/coach_${today}`);
  return db.runTransaction(async transaction => {
    const snap = await transaction.get(ref);
    const count = snap.exists() ? (snap.data().count || 0) : 0;
    if (count >= 20) {return false;}
    transaction.set(ref, { count: count + 1, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    return true;
  });
}

/**
 * Extracts action IDs if keywords are present in response.
 * @param {string} text - Cleaned response text.
 * @returns {Array<string>} Matching action IDs.
 */
function extractActions(text) {
  const actions = [];
  const lower = text.toLowerCase();
  if (lower.includes('metro')) {actions.push('metro_commute');}
  if (lower.includes('dry') || lower.includes('clothes')) {actions.push('air_dry_clothes');}
  if (lower.includes('meatless') || lower.includes('vegetarian')) {actions.push('meatless_mondays');}
  if (lower.includes('unplug') || lower.includes('standby')) {actions.push('unplug_devices');}
  return actions;
}

/**
 * Strips URLs, markdown, and ensures prompt text doesn't leak.
 * @param {string} text - Raw Gemini output.
 * @returns {string} Sanitized output.
 */
function postProcessResponse(text) {
  if (!text) {return '';}
  let clean = text.replace(/https?:\/\/[^\s]+/gi, '[Link Removed]');
  clean = clean.replace(/[*#`_~]/g, '');
  if (clean.includes('Carbon Mirror AI Coach') && clean.length > 500) {
    return 'Try switching to local public transport (Metro/Bus) and adopting energy-saving habits.';
  }
  return clean;
}

/**
 * Calls Gemini API with a timeout wrapper.
 * @param {Array} history - Pre-formatted history list.
 * @param {string} contextStr - Active user context.
 * @returns {Promise<string>} Model reply.
 */
async function callGemini(history, contextStr) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {throw new Error('Gemini API Key is missing.');}

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-pro',
    systemInstruction: COACH_SYSTEM_PROMPT
  });

  const formattedHistory = history.slice(-5).map(m => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.text }]
  }));

  const chat = model.startChat({
    history: formattedHistory,
    generationConfig: { temperature: 0.7, maxOutputTokens: 300 }
  });

  const callPromise = chat.sendMessage(contextStr);
  const timeoutPromise = new Promise((_resolve, reject) => { setTimeout(() => reject(new Error('TIMEOUT')), 10000); });
  const result = await Promise.race([callPromise, timeoutPromise]);
  return result.response.text();
}

/**
 * Validates the incoming functions request.
 * @param {Object} request - The callable request.
 * @returns {string} The authenticated user ID.
 * @throws {HttpsError} If validation fails.
 */
function validateRequest(request) {
  if (!request.app) {
    const origin = request.rawRequest?.headers?.origin || '';
    const isLocal = origin.includes('localhost') || origin.includes('127.0.0.1') || process.env.FUNCTIONS_EMULATOR === 'true';
    if (!isLocal) {
      throw new HttpsError('failed-precondition', 'App Check verification failed.');
    }
  }
  const userId = request.auth?.uid;
  if (!userId) {
    throw new HttpsError('unauthenticated', 'User must be signed in.');
  }
  return userId;
}

/**
 * HTTPS Callable endpoint orchestrator for the AI Coach.
 */
export const geminiCoachHandler = onCall({
  cors: [/carbon-mirror\.web\.app$/, /carbon-mirror\.firebaseapp\.com$/, /localhost:\d+$/, /127\.0\.0\.1:\d+$/]
}, async (request) => {
  const userId = validateRequest(request);
  const { message, userContext, history = [] } = request.data;
  const cleanMsg = sanitizeInput(message);
  let rateLimitPassed = true;
  try {
    const db = getFirestore();
    rateLimitPassed = await checkRateLimit(db, userId);
  } catch (error) {
    logger.warn('Firestore rate limit check failed, bypassing.', { message: error.message });
  }
  if (!rateLimitPassed) {
    return { error: 'RATE_LIMIT', message: 'You have used all 20 coach messages today.' };
  }
  if (!userContext || typeof userContext !== 'object') {
    throw new HttpsError('invalid-argument', 'userContext is required and must be an object.');
  }
  const contextStr = `${cleanMsg}\n\n[USER CONTEXT: Planet score: ${userContext.planetScore || 0}/100. Top emission source: ${userContext.topEmission || 'unknown'}. Committed actions: ${userContext.committedActions || 'none'}. City: ${userContext.city || 'Delhi'}.]`;
  try {
    const rawReply = await callGemini(history, contextStr);
    const cleanReply = postProcessResponse(rawReply);
    return { reply: cleanReply, suggestedActions: extractActions(cleanReply) };
  } catch (error) {
    logger.warn('Gemini call failed. Serving fallback.', { message: error.message });
    const fallback = FALLBACK_RESPONSES[userContext.topEmission] || FALLBACK_RESPONSES.default;
    return { reply: fallback, suggestedActions: extractActions(fallback) };
  }
});
