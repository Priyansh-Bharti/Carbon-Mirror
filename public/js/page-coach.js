'use strict';

/**
 * @fileoverview Logic module for the AI Coach Page (coach.html).
 */

import { listenToAuthState } from './auth.js';
import { getUserProfile } from './firestore.js';
import { askCoach } from './gemini.js';
import { logger, sanitizeHTML } from './utils.js';
import { DEFAULT_BASELINE_FOOTPRINT } from './constants.js';

let chatHistory = [];
let messageCount = Number(sessionStorage.getItem('cm_coach_message_count') || 0);

/**
 * Updates the rate limit counter in the UI.
 * @returns {void}
 */
function updateRateLimitUI() {
  const badge = document.getElementById('coach-rate-limit-badge');
  if (badge) {
    badge.textContent = `Messages: ${messageCount}/20 today`;
  }
}

/**
 * Appends a message to the conversation log and saves history.
 * @param {string} role - 'user' or 'coach'.
 * @param {string} text - Message text.
 * @returns {void}
 */
function appendMessage(role, text) {
  const container = document.getElementById('chat-log');
  if (!container) {return;}

  const msgDiv = document.createElement('div');
  msgDiv.className = `chat-message ${role === 'user' ? 'msg-user' : 'msg-coach'} fade-rise`;
  msgDiv.innerHTML = `<p class="body-md" style="margin: 0;">${sanitizeHTML(text)}</p>`;
  container.appendChild(msgDiv);
  container.scrollTop = container.scrollHeight;

  chatHistory.push({ role, text });
  sessionStorage.setItem('cm_chat_history', JSON.stringify(chatHistory));
}

/**
 * Shows or hides the three-dot typing indicator.
 * @param {boolean} show - Whether to display the indicator.
 * @returns {void}
 */
function showTypingIndicator(show) {
  const indicator = document.getElementById('typing-indicator');
  if (indicator) {
    indicator.style.display = show ? 'flex' : 'none';
    const log = document.getElementById('chat-log');
    if (log && show) {log.scrollTop = log.scrollHeight;}
  }
}

/**
 * Sends user prompt to the coach.
 * @param {string} text - User message text.
 * @param {Object} profile - User's profile data.
 * @returns {Promise<void>}
 */
async function sendMessageToCoach(text, profile) {
  appendMessage('user', text);
  showTypingIndicator(true);

  messageCount++;
  sessionStorage.setItem('cm_coach_message_count', messageCount.toString());
  updateRateLimitUI();

  const inputElement = document.getElementById('coach-textarea');
  const sendButton = document.getElementById('coach-send-btn');
  if (inputElement) {inputElement.disabled = true;}
  if (sendButton) {sendButton.disabled = true;}

  const footprint = profile?.footprint || { ...DEFAULT_BASELINE_FOOTPRINT };
  const breakdown = footprint.breakdown || { transport: 0, home: 0, food: 0 };
  const topEmission = Object.keys(breakdown).reduce((highestKey, currentKey) => breakdown[highestKey] > breakdown[currentKey] ? highestKey : currentKey, 'transport');

  const userContext = {
    planetScore: footprint.planetScore ?? 50,
    topEmission,
    city: profile?.quizAnswers?.city || 'Delhi',
    committedActions: profile?.committedActions ? profile.committedActions.join(', ') : 'none'
  };

  try {
    const history = chatHistory.slice(0, -1);
    const response = await askCoach(text, userContext, history);
    showTypingIndicator(false);
    appendMessage('coach', response.reply);
  } catch (connectionError) {
    showTypingIndicator(false);
    appendMessage('coach', 'Sorry, I failed to connect. Please try again.');
    logger.error('AI Coach communication failed.', { message: connectionError.message });
  } finally {
    if (inputElement) {
      inputElement.disabled = false;
      inputElement.value = '';
      inputElement.focus();
    }
    if (sendButton) {sendButton.disabled = false;}
  }
}

/**
 * Reloads conversation logs from sessionStorage on page load.
 * @returns {void}
 */
function loadSessionHistory() {
  const saved = sessionStorage.getItem('cm_chat_history');
  if (saved) {
    chatHistory = JSON.parse(saved);
    chatHistory.forEach(msg => {
      const container = document.getElementById('chat-log');
      if (container) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `chat-message ${msg.role === 'user' ? 'msg-user' : 'msg-coach'}`;
        msgDiv.innerHTML = `<p class="body-md" style="margin: 0;">${sanitizeHTML(msg.text)}</p>`;
        container.appendChild(msgDiv);
      }
    });
    const log = document.getElementById('chat-log');
    if (log) {log.scrollTop = log.scrollHeight;}
  }
}

/**
 * Initializes the AI Coach page module.
 * @returns {void}
 */
export function initCoachPage() {
  logger.info('Initializing AI Coach Page module.');
  listenToAuthState(async (user) => {
    if (!user) {
      window.location.href = './';
      return;
    }

    const profile = await getUserProfile(user.uid);

    loadSessionHistory();
    updateRateLimitUI();

    // Bind chip buttons
    const chips = document.querySelectorAll('.prompt-chip');
    const textarea = document.getElementById('coach-textarea');
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        if (textarea) {
          textarea.value = chip.dataset.prompt || chip.textContent;
          textarea.focus();
        }
      });
    });

    const form = document.getElementById('coach-chat-form');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = textarea?.value?.trim();
        if (text) {
          await sendMessageToCoach(text, profile);
        }
      });
    }
  });
}
