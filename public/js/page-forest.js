'use strict';

/**
 * @fileoverview Logic module for the Community Forest Page (forest.html).
 */

import { listenToAuthState } from './auth.js';
import { getFirestore, doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { getUserProfile } from './firestore.js';
import { logger, sanitizeHTML } from './utils.js';

const CITIES = ['Delhi', 'Mumbai', 'Bengaluru', 'Chennai', 'Hyderabad'];
let activeCity = 'Delhi';

/**
 * Generates and appends programmatically positioned SVG trees to the container.
 * @param {number} totalTrees - Total community trees.
 * @param {number} userTrees - Trees contributed by active user.
 * @returns {void}
 */
function renderForestSVG(totalTrees, userTrees) {
  const svg = document.getElementById('forest-svg');
  if (!svg) {return;}
  svg.innerHTML = '';

  const width = svg.clientWidth || 800;
  const height = svg.clientHeight || 350;
  const maxRenderTrees = Math.min(totalTrees, 120);

  // Define SVG patterns or filters if needed
  let content = '';

  for (let i = 0; i < maxRenderTrees; i++) {
    const isUserTree = i < userTrees;
    const x = Math.floor(Math.random() * (width - 40)) + 20;
    const y = Math.floor(Math.random() * (height - 80)) + 50;
    
    const scale = isUserTree ? '1.2' : (0.7 + Math.random() * 0.4).toFixed(2);
    const treeClass = isUserTree ? 'tree-grow my-tree' : 'tree-grow';
    const color = isUserTree ? 'var(--cm-color-accent-teal)' : 'var(--cm-color-accent-sage)';

    // SVG pine tree path shape
    content += `
      <g class="${treeClass}" transform="translate(${x}, ${y}) scale(${scale})" style="animation-delay: ${i * 30}ms;">
        <path d="M 0 -30 L 15 0 L -15 0 Z" fill="${color}" opacity="0.85"/>
        <path d="M 0 -45 L 12 -15 L -12 -15 Z" fill="${color}" opacity="0.95"/>
        <rect x="-3" y="0" width="6" height="12" fill="#78350F"/>
      </g>
    `;
  }
  svg.innerHTML = content;
}

/**
 * Renders the top 10 city leaderboard.
 * @param {Array<Object>} list - Weekly leaderboard entries.
 * @returns {void}
 */
function renderLeaderboard(list) {
  const container = document.getElementById('leaderboard-list');
  if (!container) {return;}

  if (!list || list.length === 0) {
    container.innerHTML = '<p class="body-md p-sm" style="color: var(--cm-color-text-muted);">No entries yet.</p>';
    return;
  }

  container.innerHTML = list.map((user, index) => `
    <div class="flex justify-between align-center p-sm" style="border-bottom: 1px solid var(--cm-color-outline);">
      <div class="flex align-center gap-sm">
        <span class="body-md-bold" style="color: var(--cm-color-accent-gold); width: 24px;">#${index + 1}</span>
        <span class="body-md">${sanitizeHTML(user.name || 'Anonymous')}</span>
      </div>
      <div class="flex align-center gap-md">
        <span class="label-caps" style="color: var(--cm-color-accent-teal);">${user.score}/100</span>
        <span class="metric-sm" style="color: var(--cm-color-text-muted);">${user.treeCount} 🌳</span>
      </div>
    </div>
  `).join('');
}

/**
 * Loads city aggregations and triggers rendering.
 * @param {string} city - Target city name.
 * @param {string|null} userId - Current signed in user ID.
 * @returns {Promise<void>}
 */
async function loadCityData(city, userId) {
  const db = getFirestore();
  const cacheKey = `cm_cached_forest_${city}`;
  let data = null;

  try {
    const snap = await getDoc(doc(db, 'community', city));
    if (snap.exists()) {
      data = snap.data();
      localStorage.setItem(cacheKey, JSON.stringify(data));
    }
  } catch (_err) {
    logger.warn('Firestore offline. Loading forest from cache.', { city });
    const cached = localStorage.getItem(cacheKey);
    if (cached) {data = JSON.parse(cached);}
  }

  const uProfile = userId ? await getUserProfile(userId) : null;
  const userTrees = uProfile && uProfile.quizAnswers && uProfile.quizAnswers.city === city
    ? Math.max(0, Math.floor((4.7 - ((uProfile.footprint?.totalKgPerYear || 2200) / 1000.0)) * 10))
    : 0;

  if (!data) {
    logger.info('Using local simulated community forest metrics.');
    data = {
      cityName: city,
      totalUsers: 142,
      totalTreesPlanted: 580,
      avgPlanetScore: 74,
      weeklyLeaderboard: [
        { name: 'Aarav Sharma', score: 88, treeCount: 14 },
        { name: 'Priya Patel', score: 85, treeCount: 12 },
        { name: 'Amit Singh', score: 82, treeCount: 10 },
        { name: 'Neha Gupta', score: 79, treeCount: 8 },
        { name: 'Rohan Mehta', score: 76, treeCount: 6 },
        { name: 'Karan Malhotra', score: 73, treeCount: 5 },
        { name: 'Ananya Sen', score: 70, treeCount: 4 },
        { name: 'Vikram Joshi', score: 68, treeCount: 3 },
        { name: 'Siddharth Rao', score: 65, treeCount: 2 },
        { name: 'Riya Sharma', score: 60, treeCount: 1 }
      ]
    };
  }

  document.getElementById('forest-total-users').textContent = data.totalUsers || 0;
  document.getElementById('forest-total-trees').textContent = data.totalTreesPlanted || 0;
  document.getElementById('forest-avg-score').textContent = `${data.avgPlanetScore || 0}/100`;
  renderForestSVG(data.totalTreesPlanted || 0, userTrees);
  renderLeaderboard(data.weeklyLeaderboard || []);
}

/**
 * Setup interactive elements and load page.
 * @returns {void}
 */
export function initForestPage() {
  logger.info('Initializing Community Forest Page module.');
  listenToAuthState((user) => {
    const uid = user ? user.uid : null;

    CITIES.forEach(city => {
      const btn = document.getElementById(`pill-${city}`);
      if (btn) {
        btn.addEventListener('click', () => {
          CITIES.forEach(c => document.getElementById(`pill-${c}`)?.classList.remove('active-pill'));
          btn.classList.add('active-pill');
          activeCity = city;
          loadCityData(city, uid);
        });
      }
    });

    // Default load
    loadCityData(activeCity, uid);
  });
}
