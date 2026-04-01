import { test, expect } from '@playwright/test';

test('offline production service worker test', async ({ page, context }) => {
  const logs: string[] = [];
  page.on('console', msg => {
    logs.push(msg.text());
    console.log(`[Browser] ${msg.text()}`);
  });

  console.log('Navigating to root (preview port 4173)...');
  await page.goto('http://localhost:4173/');
  
  console.log('Waiting for service worker to register and activate...');
  try {
      await page.waitForFunction(async () => {
        const reg = await navigator.serviceWorker.ready;
        return !!reg;
      }, { timeout: 10000 });
      console.log('SW Ready detected in the page.');
  } catch (e) {
      console.log('SW wait timeout or failed:', e);
  }

  console.log('Waiting 3s for SW caching logic...');
  await page.waitForTimeout(3000);

  console.log('Setting offline mode...');
  await context.setOffline(true);

  console.log('Navigating to /watch-hive/entries...');
  let errorCaught: string | null = null;
  try {
    const response = await page.goto('http://localhost:4173/watch-hive/entries', { waitUntil: 'domcontentloaded', timeout: 5000 });
    console.log(`HTTP Status: ${response?.status()}`);
    console.log('Successfully navigated while offline!');
  } catch (e: any) {
    console.error('Navigation to /watch-hive/entries failed:', e.message);
    errorCaught = e.message;
  }
  
  const hasAllowlistError = logs.some(l => l.includes('doesn\'t match the allowlist'));
  console.log('Has allowlist error?:', hasAllowlistError);

  if (hasAllowlistError) {
      console.log('ISSUE REPRODUCED: The allowlist error is printed in offline mode.');
  } else if (!errorCaught) {
      console.log('TEST PASSED: Service Worker successfully intercepted the test and loaded fallback index.html without errors.');
  } else {
      console.log('TEST FAILED due to other reason:', errorCaught);
  }
});
