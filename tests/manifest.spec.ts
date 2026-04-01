import { test, expect } from '@playwright/test';

test('verify PWA manifest, splash screen settings, and take screenshot', async ({ page }) => {
  // Navigate to root
  await page.goto('http://localhost:4173/');

  // 1. Verify Manifest is linked correctly
  const manifestLink = await page.locator('link[rel="manifest"]').getAttribute('href');
  expect(manifestLink).toBeTruthy();

  // 2. Fetch and parse manifest.json
  const manifestUrl = new URL(manifestLink!, 'http://localhost:4173/').href;
  const manifestResponse = await page.request.get(manifestUrl);
  expect(manifestResponse.ok()).toBeTruthy();
  const manifest = await manifestResponse.json();

  // 3. Verify Splash Screen and Name properties
  expect(manifest.name).toBe('WatchHive');
  expect(manifest.short_name).toBe('watchhive');
  expect(manifest.background_color).toBe('#ffb700');
  expect(manifest.theme_color).toBe('#ffb700');
  expect(manifest.display).toBe('standalone');

  // 4. Verify Icons existence
  expect(manifest.icons.length).toBeGreaterThan(0);

  // Verify the 512x512 icon is accessible (often used for splash screen logo on Android)
  const splashScreenIcon = manifest.icons.find((icon: any) => icon.sizes === '512x512');
  expect(splashScreenIcon).toBeDefined();

  const iconResponse = await page.request.get(new URL(splashScreenIcon.src, 'http://localhost:4173/').href);
  expect(iconResponse.ok()).toBeTruthy();

  // 5. Verify Apple mobile web app tags (iOS Splash/Icon equivalent)
  const themeColorTag = await page.locator('meta[name="theme-color"]').getAttribute('content');
  expect(themeColorTag).toBe('#ffb700'); // Validates it matches the manifest

  const appleTitleTag = await page.locator('meta[name="apple-mobile-web-app-title"]').getAttribute('content');
  expect(appleTitleTag).toBe('WatchHive');

  const appleIconTag = await page.locator('link[rel="apple-touch-icon"]').getAttribute('href');
  expect(appleIconTag).toBeTruthy();

  // 6. Output to console that verification passed
  console.log('Manifest and PWA Splash Screen settings are properly configured and all files resolved correctly!');
});
