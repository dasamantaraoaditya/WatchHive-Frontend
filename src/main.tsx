import React from 'react';
import ReactDOM from 'react-dom/client';
import WatchHiveApp from './watchhive/WatchHiveApp';
import { setupInstallPrompt, registerServiceWorker } from './serviceWorkerRegistration';

// Register service worker & setup PWA install prompt
registerServiceWorker();
setupInstallPrompt();

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <WatchHiveApp />
    </React.StrictMode>
);
