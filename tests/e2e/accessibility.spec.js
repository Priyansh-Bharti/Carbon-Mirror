'use strict';

/**
 * Carbon Mirror — Accessibility End-to-End Tests
 * Tests keyboard navigation, focus management, ARIA live regions,
 * and screen reader compatibility across all 7 application screens.
 * @module tests/e2e/accessibility
 */

import { test, expect } from '@playwright/test';

test.describe('Landing page accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('has correct lang attribute on html element', async ({ page }) => {
    const lang = await page.getAttribute('html', 'lang');
    expect(lang).toBe('en');
  });

  test('has descriptive page title', async ({ page }) => {
    await expect(page).toHaveTitle(/Carbon Mirror/);
  });

  test('skip navigation link is first focusable element', async ({ page }) => {
    await page.keyboard.press('Tab');
    const focusedClass = await page.evaluate(() => document.activeElement?.className ?? '');
    expect(focusedClass).toContain('skip-link');
  });

  test('skip link navigates to main content', async ({ page }) => {
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    const focusedId = await page.evaluate(() => document.activeElement?.id ?? '');
    expect(focusedId).toBe('main-content');
  });

  test('planet orb canvas has role=img and aria-label', async ({ page }) => {
    const canvas = page.locator('canvas').first();
    const role = await canvas.getAttribute('role');
    expect(role).toBe('img');
    const ariaLabel = await canvas.getAttribute('aria-label');
    expect(ariaLabel).toBeTruthy();
    expect(ariaLabel.length).toBeGreaterThan(10);
  });

  test('CTA button is keyboard accessible', async ({ page }) => {
    const cta = page
      .locator('a[href="quiz"], a[href="quiz.html"], button')
      .filter({ hasText: /see my planet|get started|begin/i })
      .first();
    await cta.focus();
    await expect(cta).toBeFocused();
  });

  test('no color-only state indicators exist', async ({ page }) => {
    const colorOnlyEls = await page.$$eval(
      '[style*="color: red"], [style*="color:red"]',
      els => els.filter(el => !el.getAttribute('aria-label') && !el.textContent.trim())
    );
    expect(colorOnlyEls.length).toBe(0);
  });

  test('passes axe-core accessibility audit', async ({ page }) => {
    await page.addScriptTag({
      url: 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.7.2/axe.min.js',
    });
    const violations = await page.evaluate(async () => {
      const results = await window.axe.run(document, {
        rules: {
          'color-contrast': { enabled: true },
        },
      });
      return results.violations.filter(
        v => v.impact === 'critical' || v.impact === 'serious'
      );
    });
    if (violations.length > 0) {
      throw new Error('Axe violations: ' + JSON.stringify(
        violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.html) }))
      ));
    }
    expect(violations.length).toBe(0);
  });
});

test.describe('Quiz page accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/quiz.html');
  });

  test('has descriptive page title', async ({ page }) => {
    await expect(page).toHaveTitle(/Carbon Mirror/);
  });

  test('progress bar is accessible', async ({ page }) => {
    const progress = page.locator('progress, [role="progressbar"]').first();
    await expect(progress).toBeVisible();
  });

  test('form inputs have associated labels', async ({ page }) => {
    const unlabelled = await page.$$eval(
      'input:not([aria-label]):not([aria-labelledby])',
      inputs =>
        inputs
          .filter(input => {
            const id = input.id;
            return !id || !document.querySelector(`label[for="${id}"]`);
          })
          .map(input => input.outerHTML)
    );
    expect(unlabelled.length).toBe(0);
  });
});

test.describe('Dashboard accessibility', () => {
  test.beforeEach(async ({ page }) => {
    // Block app.js to prevent auth redirect so we can test static HTML accessibility
    await page.route('**/js/app.js', route => route.abort());
    await page.goto('/dashboard.html');
  });

  test('planet canvas has aria-label', async ({ page }) => {
    const canvas = page.locator('canvas').first();
    const ariaLabel = await canvas.getAttribute('aria-label');
    expect(ariaLabel).toBeTruthy();
  });

  test('live region exists for score updates', async ({ page }) => {
    const liveRegion = page.locator('[aria-live]').first();
    await expect(liveRegion).toBeAttached();
    const politeness = await liveRegion.getAttribute('aria-live');
    expect(['polite', 'assertive']).toContain(politeness);
  });
});

test.describe('AI Coach accessibility', () => {
  test.beforeEach(async ({ page }) => {
    // Block app.js to prevent auth redirect so we can test static HTML accessibility
    await page.route('**/js/app.js', route => route.abort());
    await page.goto('/coach.html');
  });

  test('conversation has role=log', async ({ page }) => {
    const log = page.locator('[role="log"]').first();
    await expect(log).toBeAttached();
  });

  test('message input is focusable and labelled', async ({ page }) => {
    const input = page.locator('textarea, input[type="text"]').first();
    await input.focus();
    await expect(input).toBeFocused();
    const ariaLabel = await input.getAttribute('aria-label');
    const placeholder = await input.getAttribute('placeholder');
    expect(ariaLabel || placeholder).toBeTruthy();
  });
});

test.describe('Responsive layout', () => {
  const viewports = [
    { name: 'mobile-sm', width: 375, height: 812 },
    { name: 'mobile-lg', width: 390, height: 844 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1440, height: 900 },
  ];

  for (const vp of viewports) {
    test(`landing page has no horizontal overflow at ${vp.name} (${vp.width}px)`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');
      const overflow = await page.evaluate(
        () => document.body.scrollWidth > document.body.clientWidth
      );
      expect(overflow).toBe(false);
    });
  }
});
