import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { sendPushNotification } from '../config/webPush';

const orderSchema = z.object({
    customerName: z.string().min(1, "Name is required"),
    customerEmail: z.string().email("Invalid email address").optional().or(z.literal('')),
    customerPhone: z.string().min(1, "Phone number is required"),
    items: z.array(z.object({
        id: z.number(),
        quantity: z.number().min(1)
    })).min(1, "Order must contain at least one item")
});

export async function createOrder(req: Request, res: Response) {
    try {
        const data = orderSchema.parse(req.body);

        // Verify stock and calculate total
        let total = 0;
        const orderItemsData: { productId: number; quantity: number; price: number }[] = [];

        for (const item of data.items) {
            const product = await prisma.product.findUnique({ where: { id: item.id } });
            if (!product) {
                return res.status(404).json({ error: `Product ID ${item.id} not found` });
            }
            if (product.stock < item.quantity) {
                return res.status(400).json({ error: `Not enough stock for ${product.name}` });
            }

            total += product.price * item.quantity;
            orderItemsData.push({
                productId: product.id,
                quantity: item.quantity,
                price: product.price
            });
        }

        // Transaction: Create Order, Items, and Update Stock
        const order = await prisma.$transaction(async (tx) => {
            // 1. Create Order
            const newOrder = await tx.order.create({
                data: {
                    customerName: data.customerName,
                    customerEmail: data.customerEmail || null,
                    customerPhone: data.customerPhone || null,
                    total,
                    items: {
                        create: orderItemsData
                    }
                },
                include: { items: true }
            });

            // 2. Decrement Stock
            for (const item of orderItemsData) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: { stock: { decrement: item.quantity } }
                });
            }

            return newOrder;
        });



        // Trigger Push Notification (Fire and forget)
        const totalFormatted = (Number(order.total) / 100).toFixed(2);
        sendPushNotification(
            'New Order!',
            `Order #${order.id} from ${order.customerName}. Total: €${totalFormatted}`,
            '/admin/orders'
        ).catch(err => console.error('Push trigger error', err));

        return res.status(201).json(order);

    } catch (e: any) {
        if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors[0].message });
        console.error(e);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

export async function list(req: Request, res: Response) {
    try {
        const since = req.query.since ? new Date(req.query.since as string) : undefined;

        const where = since ? {
            createdAt: { gt: since }
        } : {};

        const orders = await prisma.order.findMany({
            where,
            include: { items: { include: { product: true } } },
            orderBy: { createdAt: 'desc' },
            take: 100 // Limit for now
        });
        res.json(orders);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Server error' });
    }
}

export async function updateStatus(req: Request, res: Response) {
    try {
        const id = Number(req.params.id);
        const { status } = req.body;

        if (!['PENDING', 'READY', 'COMPLETED', 'CANCELLED'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const order = await prisma.order.update({
            where: { id },
            data: { status }
        });
        res.json(order);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Update failed' });
    }
}
