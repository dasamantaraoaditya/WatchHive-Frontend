// Service Worker for WatchHive PWA & Web Push Notifications

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

// Handle Push Event from Web Push Server
self.addEventListener('push', (event) => {
    if (!event.data) return;

    try {
        const data = event.data.json();

        const title = data.title || '🐝 WatchHive';
        const options = {
            body: data.body || 'You have a new notification on WatchHive.',
            icon: data.icon || '/icons/icon-192x192.png',
            badge: data.badge || '/icons/icon-96x96.png',
            data: {
                url: data.url || '/watch-hive/notifications',
            },
            tag: data.tag || 'watchhive-notification',
            renotify: true,
            vibrate: [100, 50, 100],
        };

        event.waitUntil(
            self.registration.showNotification(title, options)
        );
    } catch (err) {
        console.error('[SW] Error parsing push data:', err);
    }
});

// Handle Click on Push Notification
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const targetUrl = event.notification.data?.url || '/watch-hive/notifications';

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // Check if there is already a window open with WatchHive
            for (const client of clientList) {
                if (client.url.includes('/watch-hive') && 'focus' in client) {
                    client.navigate(targetUrl);
                    return client.focus();
                }
            }
            // If no window is open, open a new tab/window
            if (self.clients.openWindow) {
                return self.clients.openWindow(targetUrl);
            }
        })
    );
});
