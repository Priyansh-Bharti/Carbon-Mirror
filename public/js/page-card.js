'use strict';

/**
 * @fileoverview Logic module for the Shareable Card Page (card.html).
 */

import { listenToAuthState } from './auth.js';
import { getUserProfile } from './firestore.js';
import { logger, showNotification } from './utils.js';

/**
 * Draws the visual planet sphere on the card canvas.
 * @param {CanvasRenderingContext2D} ctx - The canvas context.
 * @param {number} cx - Center X.
 * @param {number} cy - Center Y.
 * @param {number} r - Radius.
 * @param {number} score - User score.
 * @returns {void}
 */
function drawCardGlobe(ctx, cx, cy, r, score) {
  const grad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
  if (score >= 80) {
    grad.addColorStop(0, '#00E5C3');
    grad.addColorStop(0.7, '#0B2C3A');
    ctx.strokeStyle = 'rgba(0, 229, 195, 0.4)';
  } else if (score >= 50) {
    grad.addColorStop(0, '#C9A84C');
    grad.addColorStop(0.7, '#6B4FA0');
    ctx.strokeStyle = 'rgba(201, 168, 76, 0.4)';
  } else {
    grad.addColorStop(0, '#FF5C35');
    grad.addColorStop(0.7, '#1E1B4B');
    ctx.strokeStyle = 'rgba(255, 92, 53, 0.4)';
  }
  grad.addColorStop(1, '#0A0E1A');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.stroke();
}

/**
 * Draws the textual statistics on the card canvas.
 * @param {CanvasRenderingContext2D} ctx - The canvas context.
 * @param {Object} profile - User profile.
 * @param {number} total - Annual carbon footprint.
 * @returns {void}
 */
function drawCardText(ctx, profile, total) {
  const score = profile.footprint?.planetScore ?? 100;
  
  ctx.fillStyle = '#F0F4FF';
  ctx.font = 'bold 48px Inter';
  ctx.fillText('CARBON MIRROR', 80, 120);

  ctx.font = '36px Inter';
  ctx.fillStyle = '#B9CAC4';
  ctx.fillText(`Planet owner: ${profile.displayName || 'Anonymous'}`, 80, 190);

  ctx.font = 'bold 72px Space Grotesk';
  ctx.fillStyle = '#00E5C3';
  ctx.fillText(`${score}/100`, 80, 900);

  ctx.font = '36px Inter';
  ctx.fillStyle = '#B9CAC4';
  ctx.fillText('Planet Health Score', 80, 960);

  ctx.font = 'bold 44px Space Grotesk';
  ctx.fillStyle = '#FF5C35';
  ctx.fillText(`${(total / 1000.0).toFixed(1)}T CO₂e/Yr`, 600, 900);

  ctx.font = '36px Inter';
  ctx.fillStyle = '#B9CAC4';
  ctx.fillText('Annual Emissions', 600, 960);
}

/**
 * Renders the full high-resolution card canvas.
 * @param {HTMLCanvasElement} canvas - Target canvas.
 * @param {Object} profile - User profile.
 * @returns {void}
 */
function renderCard(canvas, profile) {
  const ctx = canvas.getContext('2d');
  const total = profile.footprint?.totalKgPerYear ?? 2200;

  // Background
  ctx.fillStyle = '#0A0E1A';
  ctx.fillRect(0, 0, 1080, 1080);

  // Border outline
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 16;
  ctx.strokeRect(8, 8, 1064, 1064);

  // Draw globe in center
  drawCardGlobe(ctx, 540, 520, 260, profile.footprint?.planetScore ?? 100);

  // Draw card text
  drawCardText(ctx, profile, total);
}

/**
 * Triggers native PNG download.
 * @param {HTMLCanvasElement} canvas - Source canvas.
 * @param {string} name - Output filename.
 */
function downloadCard(canvas, name) {
  const dataUrl = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = `${name.replace(/\s+/g, '_')}_planet_card.png`;
  a.click();
}

/**
 * Uses Web Share API to share card image blob.
 * @param {HTMLCanvasElement} canvas - Source canvas.
 */
function shareCard(canvas) {
  canvas.toBlob(async (blob) => {
    if (!blob) {return;}
    const file = new File([blob], 'carbon_mirror_card.png', { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: 'My Carbon Mirror Planet',
          text: 'I just generated my digital carbon footprint planet card! Take the quiz and see yours!'
        });
      } catch (shareError) {
        logger.error('Web Share failed.', { message: shareError.message });
      }
    } else {
      await navigator.clipboard.writeText(window.location.origin);
      showNotification('Sharing is not supported in this browser. App URL copied to clipboard instead!');
    }
  });
}

/**
 * Initializes the Shareable Card page module.
 */
export function initCardPage() {
  logger.info('Initializing Card Page module.');
  listenToAuthState(async (user) => {
    if (!user) {
      window.location.href = './';
      return;
    }

    const profile = await getUserProfile(user.uid);
    if (!profile) {return;}

    const canvas = document.getElementById('share-canvas');
    if (canvas instanceof HTMLCanvasElement) {
      renderCard(canvas, profile);

      document.getElementById('card-download-btn')?.addEventListener('click', () => {
        downloadCard(canvas, profile.displayName || 'user');
      });

      document.getElementById('card-share-btn')?.addEventListener('click', () => {
        shareCard(canvas);
      });
    }
  });
}
