const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1280, height: 800 }
  });

  const baseUrl = 'http://localhost:5000';
  const routes = [
    { path: '/', name: 'index' },
    { path: '/quiz', name: 'quiz' },
    { path: '/dashboard', name: 'dashboard' },
    { path: '/actions', name: 'actions' },
    { path: '/forest', name: 'forest' },
    { path: '/coach', name: 'coach' },
    { path: '/card', name: 'card' }
  ];

  for (const route of routes) {
    try {
      console.log(`Navigating to ${baseUrl}${route.path}...`);
      await page.goto(`${baseUrl}${route.path}`, { waitUntil: 'networkidle' });
      // Add a small delay to ensure canvas and animations render
      await page.waitForTimeout(1500); 
      const screenshotPath = path.join(process.cwd(), `screenshot_${route.name}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`Screenshot saved to ${screenshotPath}`);
    } catch (err) {
      console.error(`Error on ${route.path}:`, err);
    }
  }

  await browser.close();
})();
