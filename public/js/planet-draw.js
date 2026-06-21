'use strict';

/**
 * @fileoverview Pure canvas drawing primitives for the PlanetOrb renderer.
 * These are all stateless functions with no side-effects — they only
 * read from their arguments and write to the provided canvas context.
 * Extracted from planet.js to keep both files within the 200-line limit.
 */

import { SCORE_STATES } from './constants.js';

/**
 * Draws the base sphere with a 3D spherical radial gradient.
 * @param {CanvasRenderingContext2D} ctx - The canvas context.
 * @param {number} x - Center X.
 * @param {number} y - Center Y.
 * @param {number} r - Sphere radius.
 * @param {string} state - The planet state.
 */
export function drawSphere(ctx, x, y, r, state) {
  const grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
  if (state === SCORE_STATES.THRIVING) {
    grad.addColorStop(0, '#00E5C3');
    grad.addColorStop(0.6, '#0B2C3A');
    grad.addColorStop(1, '#0A0E1A');
  } else if (state === SCORE_STATES.STRESSED) {
    grad.addColorStop(0, '#C9A84C');
    grad.addColorStop(0.6, '#FF5C35');
    grad.addColorStop(1, '#0A0E1A');
  } else if (state === SCORE_STATES.STRUGGLING) {
    grad.addColorStop(0, '#FF5C35');
    grad.addColorStop(0.7, '#6B4FA0');
    grad.addColorStop(1, '#0A0E1A');
  } else {
    grad.addColorStop(0, '#991B1B');
    grad.addColorStop(0.6, '#1E1B4B');
    grad.addColorStop(1, '#0A0E1A');
  }
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Draws the outer atmosphere glow effect.
 * @param {CanvasRenderingContext2D} ctx - The canvas context.
 * @param {number} x - Center X.
 * @param {number} y - Center Y.
 * @param {number} r - Sphere radius.
 * @param {string} state - The planet state.
 */
export function drawGlow(ctx, x, y, r, state) {
  const glow = ctx.createRadialGradient(x, y, r * 0.8, x, y, r * 1.3);
  if (state === SCORE_STATES.THRIVING) {
    glow.addColorStop(0, 'rgba(0, 229, 195, 0.25)');
  } else if (state === SCORE_STATES.STRESSED) {
    glow.addColorStop(0, 'rgba(255, 92, 53, 0.2)');
  } else if (state === SCORE_STATES.STRUGGLING) {
    glow.addColorStop(0, 'rgba(107, 79, 160, 0.2)');
  } else {
    glow.addColorStop(0, 'rgba(239, 68, 68, 0.25)');
  }
  glow.addColorStop(1, 'rgba(10, 14, 26, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, r * 1.3, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Draws dynamic landmass textures on the planet surface.
 * @param {CanvasRenderingContext2D} ctx - The canvas context.
 * @param {number} x - Center X.
 * @param {number} y - Center Y.
 * @param {number} r - Sphere radius.
 * @param {number} angle - Rotation angle.
 * @param {string} state - The planet state.
 */
export function drawLandmasses(ctx, x, y, r, angle, state) {
  if (state === SCORE_STATES.CRITICAL) return;
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.clip();

  ctx.fillStyle = state === SCORE_STATES.THRIVING ? 'rgba(168, 213, 162, 0.35)' : 'rgba(201, 168, 76, 0.15)';
  const offset = (angle * r * 0.5) % (r * 2);
  
  for (let i = -1; i <= 2; i++) {
    const lx = x - r + offset + i * r * 1.8;
    ctx.beginPath();
    ctx.arc(lx, y - r * 0.2, r * 0.4, 0, Math.PI * 2);
    ctx.arc(lx + r * 0.3, y + r * 0.1, r * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/**
 * Draws cracked surface texture for struggling planets.
 * @param {CanvasRenderingContext2D} ctx - The canvas context.
 * @param {number} x - Center X.
 * @param {number} y - Center Y.
 * @param {number} r - Sphere radius.
 */
export function drawCracks(ctx, x, y, r) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.strokeStyle = 'rgba(255, 92, 53, 0.3)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x - r * 0.5, y - r * 0.5);
  ctx.lineTo(x, y);
  ctx.lineTo(x + r * 0.3, y + r * 0.4);
  ctx.moveTo(x + r * 0.2, y - r * 0.3);
  ctx.lineTo(x - r * 0.1, y + r * 0.2);
  ctx.stroke();
  ctx.restore();
}

/**
 * Draws clouds swirling around the planet atmosphere.
 * @param {CanvasRenderingContext2D} ctx - The canvas context.
 * @param {number} x - Center X.
 * @param {number} y - Center Y.
 * @param {number} r - Sphere radius.
 * @param {number} angle - Rotation angle.
 * @param {string} state - The planet state.
 */
export function drawClouds(ctx, x, y, r, angle, state) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.clip();

  let opacity = 0.2;
  if (state === SCORE_STATES.STRUGGLING) opacity = 0.6;
  if (state === SCORE_STATES.CRITICAL) opacity = 0.85;

  ctx.fillStyle = `rgba(240, 244, 255, ${opacity})`;
  const offset = (angle * r * 0.8) % (r * 2);

  for (let i = -1; i <= 2; i++) {
    const cx = x - r + offset + i * r * 1.5;
    ctx.beginPath();
    ctx.arc(cx, y - r * 0.4, r * 0.25, 0, Math.PI * 2);
    ctx.arc(cx + r * 0.2, y - r * 0.3, r * 0.2, 0, Math.PI * 2);
    ctx.arc(cx - r * 0.1, y + r * 0.3, r * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
