import webpush from 'web-push';
import dotenv from 'dotenv';

dotenv.config();

// Generated VAPID Keys (Hardcoded for simplicity in this project, ideally in .env)
const publicVapidKey = process.env.VAPID_PUBLIC_KEY || 'BOBV5gw8h2XhqxTzfm33yV2b0xJWGcW-glvgV24nWu1H_eaFcIFbnvOh8qb9Qnhcmwv2N3VI5ogI859fsdhER8M';
const privateVapidKey = process.env.VAPID_PRIVATE_KEY || 'BEuOMeHYEa1knAgeEcsLriC181GRTHA_KvuPGs7C6fU';

webpush.setVapidDetails(
    'mailto:admin@petrassinikulma.com',
    publicVapidKey,
    privateVapidKey
);

export { webpush, publicVapidKey };

import prisma from '../lib/prisma';

export async function sendPushNotification(title: string, body: string, url: string = '/') {
    try {
        const payload = JSON.stringify({ title, body, url });
        const subscriptions = await prisma.pushSubscription.findMany();

        for (const sub of subscriptions) {
            try {
                await webpush.sendNotification({
                    endpoint: sub.endpoint,
                    keys: { p256dh: sub.p256dh, auth: sub.auth },
                }, payload);
            } catch (err: any) {
                if (err.statusCode === 410 || err.statusCode === 404) {
                    await prisma.pushSubscription.delete({ where: { id: sub.id } });
                } else {
                    console.error('Push send error', err);
                }
            }
        }
    } catch (e) {
        console.error('Failed to send push notifications', e);
    }
}
