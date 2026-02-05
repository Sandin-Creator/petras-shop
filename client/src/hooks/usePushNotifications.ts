import { useState, useEffect } from 'react';

const PUBLIC_KEY_API = '/api/notifications/vapid-public-key';
const SUBSCRIBE_API = '/api/notifications/subscribe';

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export function usePushNotifications() {
    const [subscription, setSubscription] = useState<PushSubscription | null>(null);

    useEffect(() => {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            // Register SW
            navigator.serviceWorker.register('/sw.js').then(registration => {
                console.log('SW Registered');
                registration.pushManager.getSubscription().then(sub => {
                    if (sub) setSubscription(sub);
                });
            });
        }
    }, []);

    const subscribeToPush = async () => {
        if (!('serviceWorker' in navigator)) return;

        try {
            const registration = await navigator.serviceWorker.ready;

            // Get Public Key from Server
            const res = await fetch(PUBLIC_KEY_API);
            const { publicKey } = await res.json();

            const sub = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(publicKey)
            });

            // Send to Server
            await fetch(SUBSCRIBE_API, {
                method: 'POST',
                body: JSON.stringify(sub),
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            setSubscription(sub);
            new Notification('Subscribed!', { body: 'You will now receive order alerts.' });
        } catch (error) {
            console.error('Failed to subscribe', error);
        }
    };

    return { subscription, subscribeToPush };
}
