'use strict';

/**
 * @fileoverview Logic module for the Dashboard Page (dashboard.html).
 */

import { listenToAuthState } from './auth.js';
import { getFirestore, collection, getDocs, query, orderBy, limit } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { getUserProfile } from './firestore.js';
import { formatCO2 } from './carbon-utils.js';
import { logger, announceToScreenReader, debounce, sanitizeHTML } from './utils.js';
import { calculateTotalFootprint } from './carbon.js';

/** Debounced Firestore read — prevents duplicate fetches on rapid auth state changes. */
const debouncedLoadLogs = debounce(loadAndRenderLogs, 300);

/**
 * Animates a circle progress ring.
 * @param {string} ringId - ID of the SVG circle element.
 * @param {number} percent - Percentage value (0-100).
 */
function setRingPercent(ringId, percent) {
  const ring = document.getElementById(ringId);
  if (!ring) {return;}
  const radius = ring.r.baseVal.value;
  const circumference = 2 * Math.PI * radius;
  ring.style.strokeDasharray = `${circumference} ${circumference}`;
  ring.style.strokeDashoffset = circumference - (percent / 100) * circumference;
}

/**
 * Renders the three categories' progress rings.
 * @param {Object} breakdown - Category breakdown in kg/yr.
 * @param {number} total - Total annual emissions.
 */
function renderEmissionsRings(breakdown, total) {
  if (!breakdown || total <= 0) {return;}
  const transportPct = Math.round((breakdown.transport / total) * 100);
  const homePct = Math.round((breakdown.home / total) * 100);
  const foodPct = Math.round((breakdown.food / total) * 100);

  setRingPercent('ring-transport', transportPct);
  setRingPercent('ring-home', homePct);
  setRingPercent('ring-food', foodPct);

  const tVal = document.getElementById('ring-val-transport');
  if (tVal) {tVal.textContent = `${transportPct}%`;}
  const hVal = document.getElementById('ring-val-home');
  if (hVal) {hVal.textContent = `${homePct}%`;}
  const fVal = document.getElementById('ring-val-food');
  if (fVal) {fVal.textContent = `${foodPct}%`;}
}

/**
 * Renders the comparison bar.
 * @param {number} userVal - User footprint in kg/yr.
 * @param {number} avgVal - Region average footprint in kg/yr.
 */
function renderComparisonBar(userVal, avgVal) {
  const userBar = document.getElementById('comparison-bar-user');
  const avgBar = document.getElementById('comparison-bar-avg');
  if (!userBar || !avgBar) {return;}

  const maxVal = Math.max(userVal, avgVal, 1);
  userBar.style.width = `${(userVal / maxVal) * 100}%`;
  avgBar.style.width = `${(avgVal / maxVal) * 100}%`;

  const userLabel = document.getElementById('comparison-label-user');
  if (userLabel) {userLabel.textContent = `You: ${formatCO2(userVal / 365.0)}/day`;}
}

/**
 * Populates the daily logs carbon story timeline.
 * @param {Array<Object>} logs - List of log data.
 */
function renderTimeline(logs) {
  const container = document.getElementById('dashboard-timeline');
  if (!container) {return;}

  if (logs.length === 0) {
    container.innerHTML = '<p class="body-md" style="color: var(--cm-color-text-muted);">No daily activity logs recorded yet.</p>';
    return;
  }

  container.innerHTML = logs.map(log => `
    <li class="flex flex-col gap-sm pb-md mb-md" style="border-left: 2px solid var(--cm-color-outline); padding-left: var(--cm-spacing-gutter); position: relative;">
      <div style="position: absolute; left: -7px; top: 4px; width: 12px; height: 12px; border-radius: 50%; background: var(--cm-color-accent-teal);"></div>
      <div class="flex justify-between align-center">
        <span class="body-md-bold">${sanitizeHTML(String(log.id))}</span>
        <span class="metric-sm" style="color: var(--cm-color-accent-coral); font-weight: 700;">${formatCO2(log.totalKg)}</span>
      </div>
      <p class="body-md" style="color: var(--cm-color-text-muted); margin: 0;">${sanitizeHTML(log.notes || 'Logged emissions activity.')}</p>
    </li>
  `).join('');
}

/**
 * Loads carbon story timeline logs from Firestore.
 * Extracted from loadDashboardData to allow debouncing.
 * @param {string} userId - Auth user ID.
 */
async function loadAndRenderLogs(userId) {
  try {
    const db = getFirestore();
    const logsRef = collection(db, 'users', userId, 'logs');
    const q = query(logsRef, orderBy('__name__', 'desc'), limit(5));
    const logsSnap = await getDocs(q);
    const logs = logsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderTimeline(logs);
  } catch (err) {
    logger.error('Failed to load user logs.', { message: err.message });
  }
}

/**
 * Loads dashboard data from Firestore and updates the DOM.
 * @param {string} userId - Auth user ID.
 */
async function loadDashboardData(userId) {
  const profile = await getUserProfile(userId);
  if (!profile || !profile.quizAnswers) {
    logger.info('No quiz answers found. Redirecting user to quiz onboarding.');
    alert('Please complete your baseline quiz to view your Dashboard!');
    window.location.href = 'quiz';
    return;
  }
  let footprint = profile.footprint;
  if (!footprint && profile.quizAnswers) {
    const calc = calculateTotalFootprint(profile.quizAnswers);
    if (!(calc instanceof Error)) {footprint = calc;}
  }
  if (!footprint) {
    footprint = { totalKgPerYear: 2200, breakdown: { transport: 800, home: 800, food: 600 }, planetScore: 50, planetState: 'stressed' };
  }
  const total = footprint.totalKgPerYear;
  const score = footprint.planetScore ?? 50;
  const state = footprint.planetState ?? 'stressed';
  const scoreEl = document.getElementById('dashboard-total-score');
  if (scoreEl) {
    scoreEl.innerHTML = `${(total / 1000.0).toFixed(1)} <span class="label-caps" style="font-size: 20px;">Tons CO₂e/Yr</span>`;
  }
  announceToScreenReader(`Your planet score is ${score} out of 100, status: ${state}. Annual footprint: ${(total / 1000).toFixed(1)} tons CO2.`);
  const canvas = document.getElementById('planet-dashboard');
  if (canvas) {
    canvas.setAttribute('aria-label', `Planet health score: ${score} out of 100 — ${state}`);
  }
  renderEmissionsRings(footprint.breakdown, total);
  renderComparisonBar(total, 2200);
  debouncedLoadLogs(userId);
}

/**
 * Initializes the Dashboard page module.
 */
export function initDashboardPage() {
  logger.info('Initializing Dashboard Page module.');
  listenToAuthState(async (user) => {
    if (!user) {
      window.location.href = './';
      return;
    }
    const skeleton = document.getElementById('dashboard-skeleton');
    const content = document.getElementById('dashboard-content');
    try {
      await loadDashboardData(user.uid);
      if (skeleton) {skeleton.style.display = 'none';}
      if (content) {content.style.display = 'block';}
    } catch (err) {
      logger.error('Failed to load dashboard data.', { message: err.message });
    }
  });
}
