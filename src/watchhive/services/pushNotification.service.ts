import api from './api';

// Helper to convert base64 VAPID key to Uint8Array required by pushManager.subscribe()
function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export const pushNotificationService = {
    /**
     * Check if Web Push is supported by the browser
     */
    isSupported: (): boolean => {
        return (
            'serviceWorker' in navigator &&
            'PushManager' in window &&
            'Notification' in window
        );
    },

    /**
     * Get current browser notification permission state
     */
    getPermissionState: (): NotificationPermission => {
        if (!('Notification' in window)) return 'denied';
        return Notification.permission;
    },

    /**
     * Fetch VAPID public key from backend
     */
    getVapidPublicKey: async (): Promise<string | null> => {
        try {
            const data = await api.get<{ publicKey: string }>('/push/vapid-public-key');
            return data.publicKey;
        } catch (err) {
            console.error('[Push] Failed to fetch VAPID key:', err);
            return null;
        }
    },

    /**
     * Subscribe current device/browser to Push Notifications
     */
    subscribe: async (): Promise<boolean> => {
        if (!pushNotificationService.isSupported()) {
            console.warn('[Push] Push notifications not supported in this browser.');
            return false;
        }

        try {
            // 1. Request Notification Permission
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                console.log('[Push] Notification permission denied or dismissed.');
                return false;
            }

            // 2. Fetch VAPID Key
            const publicKey = await pushNotificationService.getVapidPublicKey();
            if (!publicKey) {
                console.error('[Push] Missing VAPID public key.');
                return false;
            }

            // 3. Get Service Worker registration
            const registration = await navigator.serviceWorker.ready;

            // 4. Subscribe with PushManager
            const applicationServerKey = urlBase64ToUint8Array(publicKey) as unknown as BufferSource;
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey,
            });

            // 5. Send subscription to backend
            const subJson = subscription.toJSON();
            await api.post('/push/subscribe', { subscription: subJson });

            console.log('[Push] Successfully subscribed to Push Notifications!');
            return true;
        } catch (err) {
            console.error('[Push] Error subscribing to push notifications:', err);
            return false;
        }
    },

    /**
     * Unsubscribe current device/browser from Push Notifications
     */
    unsubscribe: async (): Promise<boolean> => {
        if (!pushNotificationService.isSupported()) return false;

        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();

            if (subscription) {
                const subJson = subscription.toJSON();
                // Inform backend
                await api.delete('/push/unsubscribe', { data: { endpoint: subJson.endpoint } });
                // Unsubscribe locally
                await subscription.unsubscribe();
            }

            console.log('[Push] Successfully unsubscribed from Push Notifications.');
            return true;
        } catch (err) {
            console.error('[Push] Error unsubscribing from push notifications:', err);
            return false;
        }
    },

    /**
     * Send a test push notification to current user
     */
    sendTestNotification: async (): Promise<boolean> => {
        try {
            await api.post('/push/test');
            return true;
        } catch (err) {
            console.error('[Push] Error sending test notification:', err);
            return false;
        }
    }
};

export default pushNotificationService;
