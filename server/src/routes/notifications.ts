import { Router } from 'express';
import { webpush, publicVapidKey } from '../config/webPush';
import prisma from '../lib/prisma';
import requireAdmin from '../middleware/requireAdmin';

const router = Router();

// Get Public Key
router.get('/vapid-public-key', (req, res) => {
    res.json({ publicKey: publicVapidKey });
});

// Subscribe
router.post('/subscribe', requireAdmin, async (req, res) => {
    const subscription = req.body;

    try {
        await prisma.pushSubscription.upsert({
            where: { endpoint: subscription.endpoint },
            update: {
                p256dh: subscription.keys.p256dh,
                auth: subscription.keys.auth,
            },
            create: {
                endpoint: subscription.endpoint,
                p256dh: subscription.keys.p256dh,
                auth: subscription.keys.auth,
            },
        });
        res.status(201).json({});
    } catch (error) {
        console.error('Subscription error', error);
        res.status(500).json({ error: 'Failed to subscribe' });
    }
});

// Test Notification
router.post('/test', requireAdmin, async (req, res) => {
    const payload = JSON.stringify({ title: 'Test Push', body: 'This is a test notification!' });

    try {
        const subscriptions = await prisma.pushSubscription.findMany();
        for (const sub of subscriptions) {
            try {
                await webpush.sendNotification({
                    endpoint: sub.endpoint,
                    keys: { p256dh: sub.p256dh, auth: sub.auth },
                }, payload);
            } catch (err: any) {
                if (err.statusCode === 410 || err.statusCode === 404) {
                    // Expired subscription, delete it
                    await prisma.pushSubscription.delete({ where: { id: sub.id } });
                }
            }
        }
        res.json({ success: true });
    } catch (error) {
        console.error('Push error', error);
        res.status(500).json({ error: 'Failed to send test push' });
    }
});

export default router;
