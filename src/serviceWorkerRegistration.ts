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
let deferredPrompt: any;

export const setupInstallPrompt = () => {
  window.addEventListener('beforeinstallprompt', (e: any) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event for later use
    deferredPrompt = e;
    console.log('PWA install prompt is ready');
  });
};

export const showInstallPrompt = async () => {
  if (deferredPrompt) {
    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    // Clear the saved prompt since it can't be used again
    deferredPrompt = null;
  }
};

export const isInstallPromptReady = () => {
  return deferredPrompt !== null;
};
