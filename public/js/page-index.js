'use strict';

/**
 * @fileoverview Logic module for the Landing Page (index.html).
 */

import { listenToAuthState } from './auth.js';
import { logger } from './utils.js';

/**
 * Smoothly animates a count-up for a statistics DOM element.
 * @param {HTMLElement} el - The element containing the metric.
 * @param {number} target - The final numeric value.
 * @param {number} duration - Animation duration in ms.
 * @param {string} suffix - Suffix to append (e.g. 'T', '%').
 * @returns {void}
 */
function animateValue(el, target, duration, suffix = '') {
  const start = 0;
  const startTime = performance.now();

  const step = (now) => {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Ease-out quad
    const value = start + progress * (2 - progress) * (target - start);
    
    if (target % 1 === 0) {
      el.innerHTML = `${Math.floor(value)}${suffix}`;
    } else {
      el.innerHTML = `${value.toFixed(1)}${suffix}`;
    }

    if (progress < 1) {
      requestAnimationFrame(step);
    }
  };
  requestAnimationFrame(step);
}

/**
 * Sets up Scroll triggers for statistics counters.
 * @returns {void}
 */
export function initLandingStats() {
  const cards = document.querySelectorAll('.glass-card .metric-lg');
  if (cards.length < 3) {return;}

  const targets = [
    { target: 2.2, suffix: 'T <span class="label-caps" style="color: var(--cm-color-accent-teal);">CO₂/Yr</span>' },
    { target: 70, suffix: '% <span class="label-caps" style="color: var(--cm-color-accent-gold);">Reduction</span>' },
    { target: 1.5, suffix: '°C <span class="label-caps" style="color: var(--cm-color-accent-coral);">Target</span>' }
  ];

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        cards.forEach((card, i) => {
          animateValue(card, targets[i].target, 1500, targets[i].suffix);
        });
        observer.disconnect();
      }
    });
  }, { threshold: 0.1 });

  const grid = document.getElementById('statistics-grid');
  if (grid) {observer.observe(grid);}
}

/**
 * Initial checks for landing page. Redirects to dashboard if already authenticated.
 */
export function initLandingPage() {
  logger.info('Initializing Landing Page module.');
  listenToAuthState((user) => {
    if (user) {
      logger.info('User already authenticated. Redirecting to dashboard.');
      window.location.href = 'dashboard';
    }
  });
  initLandingStats();
}
