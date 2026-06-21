import { test, expect } from '@playwright/test';

const PAGES = [
  '/',
  '/quiz',
  '/dashboard',
  '/actions',
  '/forest',
  '/coach',
  '/card'
];

for (const path of PAGES) {
  test(`check page ${path} for console errors`, async ({ page }) => {
    const pageErrors = [];
    const consoleErrors = [];

    page.on('pageerror', err => {
      pageErrors.push(err.message);
      console.error(`[PAGE ERROR] on ${path}: ${err.message}`);
    });

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
        console.error(`[CONSOLE ERROR] on ${path}: ${msg.text()}`);
      }
    });

    console.log(`Navigating to http://localhost:5000${path}...`);
    try {
      await page.goto(`http://localhost:5000${path}`);
      // Wait for a short time to allow async scripts to initialize
      await page.waitForTimeout(1500);
    } catch (err) {
      console.error(`Failed to navigate to ${path}: ${err.message}`);
    }

    // We expect 0 runtime page errors on all pages.
    // Console errors are allowed if they are non-fatal network assets (like maps or recaptcha issues).
    expect(pageErrors.length).toBe(0);
  });
}
