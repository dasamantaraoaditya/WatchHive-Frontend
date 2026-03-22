import React from 'react';
import ReactDOM from 'react-dom/client';
import WatchHiveApp from './watchhive/WatchHiveApp';
import { registerServiceWorker, setupInstallPrompt } from './serviceWorkerRegistration';

// Register Service Worker for PWA support
registerServiceWorker();

// Setup the install prompt for "Add to Home Screen"
setupInstallPrompt();

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <WatchHiveApp />
    </React.StrictMode>
);
