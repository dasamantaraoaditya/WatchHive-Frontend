import { useState, useEffect } from 'react';
import { showInstallPrompt, isInstallPromptReady } from '../../../serviceWorkerRegistration';

export const InstallPromptButton = () => {
  const [isInstallReady, setIsInstallReady] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if install prompt is ready
    const checkPromptReady = () => {
      setIsInstallReady(isInstallPromptReady());
    };

    // Check initial state
    checkPromptReady();

    // Listen for beforeinstallprompt event changes
    window.addEventListener('beforeinstallprompt', checkPromptReady);

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setIsInstallReady(false);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', checkPromptReady);
      window.removeEventListener('appinstalled', () => {});
    };
  }, []);

  // Check if running locally or in developer mode
  const isRunningAsApp = (window.navigator as any).standalone === true;

  if (isInstalled || isRunningAsApp || !isInstallReady) {
    return null;
  }

  return (
    <button
      onClick={showInstallPrompt}
      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary hover:bg-yellow-600 text-black font-semibold transition-colors duration-200"
      title="Install WatchHive on your device"
    >
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
        />
      </svg>
      <span className="hidden sm:inline">Install App</span>
    </button>
  );
};
