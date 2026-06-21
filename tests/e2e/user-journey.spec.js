'use strict';

/**
 * Carbon Mirror — Critical User Journey Tests
 * Validates the complete user flow from landing to dashboard.
 * @module tests/e2e/user-journey
 */

import { test, expect } from '@playwright/test';

test.describe('Core user journey', () => {
  test.beforeEach(async ({ page }) => {
    // Block app.js so we don't get unauthenticated redirects during structural tests
    await page.route('**/js/app.js', route => route.abort());
  });

  test('landing page loads and CTA is visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1, [class*="headline"]').first()).toBeVisible();
    const cta = page.locator('#landing-cta-btn').first();
    await expect(cta).toBeVisible();
  });

  test('quiz page loads with first question', async ({ page }) => {
    await page.goto('/quiz.html');
    const question = page.locator('legend, h1').first();
    await expect(question).toBeVisible();
  });

  test('dashboard page loads with planet canvas', async ({ page }) => {
    await page.goto('/dashboard.html');
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeAttached();
  });

  test('actions page loads with at least one action card', async ({ page }) => {
    await page.goto('/actions.html');
    const cards = page.locator('[class*="action-card"], [class*="card"]');
    await expect(cards.first()).toBeVisible();
  });

  test('coach page loads with conversation container', async ({ page }) => {
    await page.goto('/coach.html');
    const convo = page.locator('[role="log"], #conversation, [class*="conversation"]').first();
    await expect(convo).toBeVisible();
  });

  test('all pages have valid meta description', async ({ page }) => {
    const pages = [
      '/',
      '/quiz.html',
      '/dashboard.html',
      '/actions.html',
      '/forest.html',
      '/coach.html',
    ];
    for (const path of pages) {
      await page.goto(path);
      const metaDesc = await page
        .$eval('meta[name="description"]', el => el.getAttribute('content'))
        .catch(() => null);
      expect(metaDesc, `Missing meta description on ${path}`).toBeTruthy();
      expect(metaDesc.length, `Short meta description on ${path}`).toBeGreaterThan(20);
    }
  });

  test('all pages have skip-to-main link', async ({ page }) => {
    const pages = ['/', '/quiz.html', '/dashboard.html', '/actions.html', '/coach.html'];
    for (const path of pages) {
      await page.goto(path);
      const skipLink = page.locator('a.skip-link, a[href="#main-content"]').first();
      await expect(skipLink, `Missing skip link on ${path}`).toBeAttached();
    }
  });
});
