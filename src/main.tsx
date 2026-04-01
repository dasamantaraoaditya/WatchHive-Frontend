import React from 'react';
import ReactDOM from 'react-dom/client';
import WatchHiveApp from './watchhive/WatchHiveApp';
import { setupInstallPrompt } from './serviceWorkerRegistration';

// Setup the install prompt for "Add to Home Screen"
setupInstallPrompt();

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <WatchHiveApp />
    </React.StrictMode>
);
