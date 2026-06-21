'use strict';

/**
 * @fileoverview Service Worker for Carbon Mirror PWA.
 *
 * Caching strategy:
 * - Static assets (HTML, CSS, JS, fonts, images): Cache-First with network fallback.
 * - Firestore / Firebase API calls: Network-Only (stale carbon data must never mislead users).
 * - Gemini AI proxy calls: Network-Only (responses must be fresh and personalised).
 *
 * This intentional separation ensures the UI loads fast offline while
 * never serving stale emissions data or cached AI responses.
 */

const CACHE_NAME = 'carbon-mirror-static-v1';

/** Static assets that should be pre-cached on install. */
const PRECACHE_ASSETS = [
  '/',
  '/quiz',
  '/dashboard',
  '/actions',
  '/forest',
  '/coach',
  '/card',
  '/manifest.json',
  '/css/tokens.css',
  '/css/reset.css',
  '/css/layout.css',
  '/css/components.css',
  '/css/planet.css',
  '/css/animations.css',
  '/js/app.js',
  '/js/auth.js',
  '/js/carbon.js',
  '/js/constants.js',
  '/js/firestore.js',
  '/js/gemini.js',
  '/js/maps.js',
  '/js/planet.js',
  '/js/utils.js',
  '/js/planet-draw.js',
  '/js/carbon-utils.js',
  '/js/page-index.js',
  '/js/page-quiz.js',
  '/js/page-dashboard.js',
  '/js/page-actions.js',
  '/js/page-forest.js',
  '/js/page-coach.js',
  '/js/page-card.js'
];

/** URL prefixes that must never be served from cache. */
const NETWORK_ONLY_PREFIXES = [
  'firestore.googleapis.com',
  'firebase.googleapis.com',
  'identitytoolkit.googleapis.com',
  'cloudfunctions.net',
  'googleapis.com/v1beta'
];

/**
 * Returns true if the request URL targets a live Firebase/Google API.
 * @param {Request} request - The incoming fetch request.
 * @returns {boolean}
 * @throws {never}
 */
function isNetworkOnly(request) {
  return NETWORK_ONLY_PREFIXES.some(prefix => request.url.includes(prefix));
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (isNetworkOnly(event.request)) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }
        const cloned = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, cloned));
        return response;
      });
    })
  );
});
