'use strict';

/**
 * @fileoverview PlanetOrb — interactive Canvas-based visual rendering class.
 * Drawing primitives are in ./planet-draw.js to keep this file under 200 lines.
 */

import { SCORE_STATES } from './constants.js';
import { drawGlow, drawSphere, drawLandmasses, drawCracks, drawClouds } from './planet-draw.js';

/**
 * Signature interactive Canvas-based visual rendering class.
 * Represents the user's planet health as a 3D animated orb.
 */
export class PlanetOrb {
  /**
   * Create a PlanetOrb visual instance.
   * @param {HTMLCanvasElement} canvasElement - The target canvas element.
   * @param {Object} [options={}] - Optional configuration overrides.
   * @param {number} [options.size] - Canvas width/height in px (default: min dimension).
   */
  constructor(canvasElement, options = {}) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    this.size = options.size || Math.min(canvasElement.width, canvasElement.height);
    this.canvas.width = this.size;
    this.canvas.height = this.size;

    this.score = 100;
    this.state = SCORE_STATES.THRIVING;
    this.angle = 0;
    this.animationFrameId = null;
    this.lastTime = 0;
  }

  /**
   * Sets the planet's visual state based on a health score.
   * Thresholds match getPlanetState() in carbon.js.
   * @param {number} score - 0 to 100 planet health score.
   */
  setState(score) {
    this.score = score;
    if (score >= 80) {
      this.state = SCORE_STATES.THRIVING;
    } else if (score >= 50) {
      this.state = SCORE_STATES.STRESSED;
    } else if (score >= 25) {
      this.state = SCORE_STATES.STRUGGLING;
    } else {
      this.state = SCORE_STATES.CRITICAL;
    }
    this._syncAriaLabel();
  }

  /**
   * Syncs the canvas aria-label with the current score and state.
   * Called after every setState() invocation.
   * @private
   */
  _syncAriaLabel() {
    if (!this.canvas) { return; }
    const stateDescriptions = {
      [SCORE_STATES.THRIVING]: 'Your planet is healthy and thriving. Keep it up!',
      [SCORE_STATES.STRESSED]: 'Your planet is under stress. Small actions can help.',
      [SCORE_STATES.STRUGGLING]: 'Your planet is struggling. Consider the Action Lab.',
      [SCORE_STATES.CRITICAL]: 'Your planet is in critical condition. Urgent action needed.',
    };
    const desc = stateDescriptions[this.state] ?? '';
    this.canvas.setAttribute(
      'aria-label',
      `Your planet health score: ${this.score} out of 100. Planet state: ${this.state}. ${desc}`
    );
  }

  /**
   * Starts the slow rotation animation loop.
   * Respects prefers-reduced-motion for accessibility.
   */
  startAnimation() {
    if (this.animationFrameId) {return;}
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const loop = (timestamp) => {
      if (!this.lastTime) {this.lastTime = timestamp;}
      const delta = timestamp - this.lastTime;
      this.lastTime = timestamp;
      this.render(timestamp, reducedMotion ? 0 : delta);
      this.animationFrameId = requestAnimationFrame(loop);
    };
    this.animationFrameId = requestAnimationFrame(loop);
  }

  /**
   * Renders a single frame of the planet orb.
   * @param {number} timestamp - The current requestAnimationFrame timestamp.
   * @param {number} [delta=0] - Milliseconds since last frame.
   */
  render(timestamp, delta = 0) {
    const ctx = this.ctx;
    const w = this.size;
    const h = this.size;
    ctx.clearRect(0, 0, w, h);

    const x = w / 2;
    const y = h / 2;
    const r = w * 0.38;

    this.angle += delta * 0.0001;

    drawGlow(ctx, x, y, r, this.state);
    drawSphere(ctx, x, y, r, this.state);
    drawLandmasses(ctx, x, y, r, this.angle, this.state);
    if (this.state === SCORE_STATES.STRUGGLING) {
      drawCracks(ctx, x, y, r);
    }
    drawClouds(ctx, x, y, r, this.angle, this.state);
  }

  /**
   * Stops the animation loop and cleans up the animation frame reference.
   */
  destroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
}
