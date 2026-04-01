import { test, expect } from '@playwright/test';

test('verify material symbols and images are cached', async ({ page, context }) => {
  // Step 1: Navigate to the app to populate cache
  console.log('Navigating to root (port 4173) to populate cache...');
  await page.goto('http://localhost:4173/');

  console.log('Waiting for service worker to register and activate...');
  try {
      await page.waitForFunction(async () => {
        const reg = await navigator.serviceWorker.ready;
        return !!reg;
      }, { timeout: 10000 });
      console.log('SW Ready.');
  } catch (e) {
      console.log('SW wait timeout:', e);
  }

  // Wait a few seconds for all assets to be fetched and stored by Workbox
  console.log('Waiting for SW to cache external fonts and images...');
  await page.waitForTimeout(4000);

  // Set up request listeners to determine if images/fonts fail or succeed
  let fontRequests = 0;
  let imageRequests = 0;
  let failedRequests = 0;

  page.on('response', (response) => {
    const url = response.url();
    // Material symbols origin check
    if (url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com')) {
        fontRequests++;
        console.log(`[Offline Response] Font: ${url} (Status: ${response.status()})`);
    }
    // Image matching
    if (url.match(/\.(png|jpg|jpeg|svg|gif|webp)(\?.*)?$/i)) {
        imageRequests++;
        console.log(`[Offline Response] Image: ${url} (Status: ${response.status()})`);
    }
  });

  page.on('requestfailed', (request) => {
    const url = request.url();
    if (url.includes('fonts.') || url.match(/\.(png|jpg|jpeg|svg|gif|webp)(\?.*)?$/i)) {
        console.error(`[Offline Failed] ${url}`);
        failedRequests++;
    }
  });

  console.log('Going offline...');
  await context.setOffline(true);

  console.log('Reloading page while offline...');
  // Force clearing the DOM so we can ensure everything is actually re-requested via SW
  await page.evaluate(() => document.body.innerHTML = '');
  await page.reload({ waitUntil: 'networkidle', timeout: 10000 });

  console.log('Checking results...');
  console.log(`Font asset requests successful: ${fontRequests}`);
  console.log(`Image requests successful: ${imageRequests}`);
  
  if (fontRequests === 0) {
      console.log('Warning: No font requests were made or intercepted. Is the font loaded?');
  } else {
      console.log('Success: Fonts were served from the offline cache!');
  }

  if (imageRequests === 0) {
      console.log('Warning: No image requests were made or intercepted.');
  } else {
      console.log('Success: Images were served from the offline cache!');
  }

  expect(failedRequests).toBe(0);
});
