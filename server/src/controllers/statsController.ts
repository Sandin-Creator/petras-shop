import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export async function getStats(req: Request, res: Response) {
    try {
        const [ordersCount, productsCount] = await Promise.all([
            prisma.order.count(),
            prisma.product.count({ where: { hidden: false } })
        ]);

        res.json({
            orders: ordersCount,
            products: productsCount
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
}
