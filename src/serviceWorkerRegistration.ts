// Service Worker Registration for PWA support
// Handles the registration of the service worker to enable PWA features

export const registerServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered successfully:', registration);
        })
        .catch((error) => {
          console.log('Service Worker registration failed:', error);
        });
    });
  }
};

// Function to manually trigger "Add to Home Screen" prompt
let deferredPrompt: any = null;

export const setupInstallPrompt = () => {
  window.addEventListener('beforeinstallprompt', (e: any) => {
    // Prevent the default mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event for later use
    deferredPrompt = e;
    console.log('PWA install prompt is ready');
    window.dispatchEvent(new CustomEvent('watchhive:install-prompt-ready'));
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    console.log('PWA installed successfully');
    window.dispatchEvent(new CustomEvent('watchhive:app-installed'));
  });
};

export const showInstallPrompt = async (): Promise<string | null> => {
  if (deferredPrompt) {
    try {
      // Show the install prompt
      deferredPrompt.prompt();
      // Wait for the user to respond to the prompt
      const choiceResult = await deferredPrompt.userChoice;
      console.log(`User response to install prompt: ${choiceResult?.outcome}`);
      deferredPrompt = null;
      window.dispatchEvent(new CustomEvent('watchhive:install-prompt-consumed'));
      return choiceResult?.outcome || null;
    } catch (err) {
      console.error('Error showing install prompt:', err);
      return null;
    }
  }
  return null;
};

export const isInstallPromptReady = (): boolean => {
  return Boolean(deferredPrompt);
};
