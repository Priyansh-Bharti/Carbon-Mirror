'use strict';

/**
 * @fileoverview Main entry point and orchestrator for Carbon Mirror client-side.
 */

import { initAuth, listenToAuthState, signInWithGoogle, signOutUser } from './auth.js';
import { initFirestore, getUserProfile } from './firestore.js';
import { PlanetOrb } from './planet.js';
import { logger } from './utils.js';

// Page-specific modules
import { initLandingPage } from './page-index.js';
import { initQuizPage } from './page-quiz.js';
import { initDashboardPage } from './page-dashboard.js';
import { initActionsPage } from './page-actions.js';
import { initForestPage } from './page-forest.js';
import { initCoachPage } from './page-coach.js';
import { initCardPage } from './page-card.js';

import { firebaseConfig } from './config.js';

let currentUser = null;
let planetRenderer = null;

/**
 * Main application initialization.
 */
async function initApp() {
  try {
    logger.info('Initializing application...');
    const app = initAuth(firebaseConfig);
    initFirestore(app);
    
    listenToAuthState(handleAuthStateChange);
    setupEventListeners();
    initializeVisuals();
    initializePages();
  } catch (error) {
    logger.error('Failed to initialize application.', { message: error.message });
  }
}

/**
 * Executes page-specific logic based on DOM indicators.
 */
function initializePages() {
  if (document.getElementById('statistics-grid')) {initLandingPage();}
  if (document.getElementById('quiz-form')) {initQuizPage();}
  if (document.getElementById('dashboard-content') || document.getElementById('dashboard-skeleton')) {
    initDashboardPage();
  }
  if (document.getElementById('actions-checklist-section')) {initActionsPage();}
  if (document.getElementById('forest-svg')) {initForestPage();}
  if (document.getElementById('coach-chat-form')) {initCoachPage();}
  if (document.getElementById('share-canvas')) {initCardPage();}
}

/**
 * Handle Auth State updates.
 * @param {Object|null} user - The authenticated Firebase user or null.
 */
async function handleAuthStateChange(user) {
  currentUser = user;
  if (user) {
    logger.info('User is authenticated.', { uid: user.uid });
    updateUIForSignedInUser(user);
    const profile = await getUserProfile(user.uid);
    if (profile && planetRenderer) {
      const score = (profile.footprint && typeof profile.footprint.planetScore === 'number') 
        ? profile.footprint.planetScore 
        : 100;
      planetRenderer.setState(score);
    }
  } else {
    logger.info('User is unauthenticated.');
    updateUIForSignedOutUser();
  }
}

/**
 * Set up application wide DOM event listeners.
 * @returns {void}
 * @throws {never}
 */
function setupEventListeners() {
  const signInBtn = document.getElementById('auth-sign-in-btn');
  if (signInBtn) {
    signInBtn.addEventListener('click', async () => {
      try {
        if (currentUser) {
          await signOutUser();
        } else {
          await signInWithGoogle();
        }
      } catch (err) {
        logger.error('Auth button action failed.', { message: err.message });
      }
    });
  }

  const signOutBtn = document.getElementById('auth-sign-out-btn');
  if (signOutBtn) {
    signOutBtn.addEventListener('click', async () => {
      try {
        if (currentUser) {
          await signOutUser();
        } else {
          await signInWithGoogle();
        }
      } catch (err) {
        logger.error('Sign-out button action failed.', { message: err.message });
      }
    });
  }
}

/**
 * Initialize Canvas rendering for the Planet Orb if present on page.
 */
function initializeVisuals() {
  const canvas = document.getElementById('planet-hero') || 
                 document.getElementById('planet-dashboard') ||
                 document.getElementById('share-planet-orb') ||
                 document.getElementById('interactive-planet-orb') || 
                 document.getElementById('dashboard-planet-orb');
  
  if (canvas && canvas instanceof HTMLCanvasElement) {
    const isHero = canvas.id === 'planet-hero' || canvas.id === 'interactive-planet-orb';
    planetRenderer = new PlanetOrb(canvas, { size: isHero ? 480 : 320 });
    planetRenderer.startAnimation();
    logger.info('Visual planet orb rendering started.');
  }
}

/**
 * Update DOM elements for a logged-in user.
 * @param {Object} user - The user object.
 * @returns {void}
 * @throws {never}
 */
function updateUIForSignedInUser(_user) {
  const authBtn = document.getElementById('auth-sign-in-btn');
  if (authBtn) {
    authBtn.textContent = 'Sign Out';
  }
  const signOutBtn = document.getElementById('auth-sign-out-btn');
  if (signOutBtn) {
    signOutBtn.textContent = 'Sign Out';
  }
  
  // Show protected links
  ['nav-link-dashboard', 'nav-link-actions', 'nav-link-coach', 'nav-link-share'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {el.style.display = 'inline-block';}
  });
}

/**
 * Reset DOM elements for logged-out state.
 * @returns {void}
 * @throws {never}
 */
function updateUIForSignedOutUser() {
  const authBtn = document.getElementById('auth-sign-in-btn');
  if (authBtn) {
    authBtn.textContent = 'Sign In';
  }
  const signOutBtn = document.getElementById('auth-sign-out-btn');
  if (signOutBtn) {
    signOutBtn.textContent = 'Sign In';
  }

  // Hide protected links
  ['nav-link-dashboard', 'nav-link-actions', 'nav-link-coach', 'nav-link-share'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {el.style.display = 'none';}
  });
}

// Self-run on page load
document.addEventListener('DOMContentLoaded', initApp);

/**
 * Registers the service worker for offline static asset caching.
 * Only runs in production (not localhost dev server).
 */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(err => {
      logger.warn('Service worker registration failed.', { message: err.message });
    });
  });
}

