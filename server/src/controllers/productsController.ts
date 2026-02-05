import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { CATEGORIES } from '../constants';
import { buildListQuery } from '../utils/listQuery';

/* ---------- Helpers ---------- */
const createSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    slug: z.string().min(1, 'Slug is required'),
    price: z.coerce.number().min(0),
    oldPrice: z.union([z.coerce.number(), z.null(), z.literal('')]).optional(),
    category: z.enum(CATEGORIES).optional().nullable(),
    imageUrl: z.string().optional().nullable(),
    stock: z.coerce.number().default(0),
    hidden: z.coerce.boolean().default(false),
    description: z.string().optional().nullable(),
});

const updateSchema = createSchema.partial().extend({
    price: z.coerce.number().min(0).optional(), // Override to be optional
});

const stockSchema = z.object({
    delta: z.coerce.number(),
});

const visibilitySchema = z.object({
    hidden: z.coerce.boolean(),
});

function safeCompareAt(price: number, oldMaybe: number | null | undefined | string): number | null | undefined {
    if (oldMaybe === undefined) return undefined;
    if (oldMaybe === null || oldMaybe === '') return null;
    const old = Number(oldMaybe);
    return Number.isFinite(old) && old > price ? old : null;
}

const handlePrismaError = (res: Response, e: any, next: NextFunction) => {
    if (e?.code === 'P2002') return res.status(400).json({ error: 'Slug already exists' });
    if (e?.code === 'P2025') return res.status(404).json({ error: 'Not found' });
    next(e);
};

/* ---------- Controllers ---------- */

export async function list(req: Request, res: Response, next: NextFunction) {
    try {
        const admin = (req.session as any)?.user?.role === 'ADMIN';
        const { where, orderBy, skip, take, page } = buildListQuery(req.query, admin);

        const [items, total] = await Promise.all([
            prisma.product.findMany({ where, orderBy, skip, take }),
            prisma.product.count({ where }),
        ]);
        res.json({ items, total, page });
    } catch (e) {
        handlePrismaError(res, e, next);
    }
}

export async function getBySlug(req: Request, res: Response, next: NextFunction) {
    try {
        const p = await prisma.product.findUnique({ where: { slug: req.params.slug as string } });
        const admin = (req.session as any)?.user?.role === 'ADMIN';

        if (!p) return res.status(404).json({ error: 'Not found' });
        if (p.hidden && !admin) return res.status(404).json({ error: 'Not found' });

        res.json(p);
    } catch (e) {
        handlePrismaError(res, e, next);
    }
}

export async function create(req: Request, res: Response, next: NextFunction) {
    try {
        const body = createSchema.parse(req.body);
        const oldPrice = safeCompareAt(body.price, body.oldPrice);

        const created = await prisma.product.create({
            data: {
                name: body.name,
                slug: body.slug,
                price: body.price,
                oldPrice: oldPrice || null,
                category: body.category || null,
                imageUrl: body.imageUrl || null,
                stock: body.stock,
                hidden: body.hidden,
                description: body.description || null,
            },
        });
        res.json(created);
    } catch (e) {
        if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors[0].message });
        handlePrismaError(res, e, next);
    }
}

export async function update(req: Request, res: Response, next: NextFunction) {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' });

    try {
        const body = updateSchema.parse(req.body);

        // logic to handle conditional price updates for oldPrice safety
        const current = await prisma.product.findUnique({ where: { id }, select: { price: true } });
        if (!current) return res.status(404).json({ error: 'Not found' });

        const nextPrice = body.price !== undefined ? body.price : current.price;
        const nextOld = safeCompareAt(nextPrice, body.oldPrice);

        const nextOne = await prisma.product.update({
            where: { id },
            data: {
                ...body,
                price: nextPrice, // explicitly set
                oldPrice: nextOld || null,
            },
        });
        res.json(nextOne);
    } catch (e) {
        if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors[0].message });
        handlePrismaError(res, e, next);
    }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' });

    try {
        await prisma.product.delete({ where: { id } });
        res.json({ ok: true });
    } catch (e) {
        handlePrismaError(res, e, next);
    }
}

export async function patchStock(req: Request, res: Response, next: NextFunction) {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' });

    try {
        const { delta } = stockSchema.parse(req.body);
        const nextOne = await prisma.product.update({
            where: { id },
            data: { stock: { increment: delta } },
        });
        res.json(nextOne);
    } catch (e) {
        if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors[0].message });
        handlePrismaError(res, e, next);
    }
}

export async function patchVisibility(req: Request, res: Response, next: NextFunction) {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' });

    try {
        const { hidden } = visibilitySchema.parse(req.body);
        const nextOne = await prisma.product.update({
            where: { id },
            data: { hidden },
        });
        res.json(nextOne);
    } catch (e) {
        if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors[0].message });
        handlePrismaError(res, e, next);
    }
}
