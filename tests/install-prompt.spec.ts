import { test, expect } from '@playwright/test';

test.describe('PWA Install Prompt Banner', () => {
    test('should appear when beforeinstallprompt is fired and disappear when dismissed', async ({ page }) => {
        // Go to the app running locally (preview or dev server)
        await page.goto('http://localhost:4173/');
        // We ensure that the install prompt doesn't show initially because beforeinstallprompt hasn't fired yet
        await expect(page.locator('text=Install WatchHive App')).not.toBeVisible();

        // Dispatch the custom beforeinstallprompt event inside the browser context
        await page.evaluate(() => {
            // Create a mock of the beforeinstallprompt event
            const promptEvent = new Event('beforeinstallprompt') as any;
            promptEvent.prompt = async () => {};
            promptEvent.userChoice = Promise.resolve({ outcome: 'accepted' });
            promptEvent.preventDefault = () => {};
            
            window.dispatchEvent(promptEvent);
        });

        // The banner should now be visible
        const installBanner = page.locator('text=Install WatchHive App');
        await expect(installBanner).toBeVisible();

        // The banner should contain the install button
        const installButton = page.locator('button:has-text("Install Now")');
        await expect(installButton).toBeVisible();

        // Click the dismiss button (the "X")
        const dismissButton = page.locator('button[title="Dismiss"]');
        await expect(dismissButton).toBeVisible();
        await dismissButton.click();

        // The banner should be removed after dismissing
        await expect(installBanner).not.toBeVisible();

        // Reload the page and mock the event again to verify it stays dismissed (saved in localStorage)
        await page.reload();
        await page.evaluate(() => {
            const promptEvent = new Event('beforeinstallprompt') as any;
            promptEvent.prompt = async () => {};
            promptEvent.preventDefault = () => {};
            window.dispatchEvent(promptEvent);
        });

        // The banner should NOT show up because it was dismissed and stored in localStorage
        await expect(installBanner).not.toBeVisible();
    });
});
