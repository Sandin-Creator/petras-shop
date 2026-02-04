import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import prisma from '../lib/prisma';

const ROLES = new Set(['ADMIN', 'STAFF']);

const loginSchema = z.object({
    email: z.string().email().toLowerCase(),
    password: z.string().min(1),
});

export async function login(req: Request, res: Response) {
    try {
        const { email, password } = loginSchema.parse(req.body);

        const u = await prisma.user.findUnique({ where: { email } });
        if (!u?.passwordHash) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const ok = await bcrypt.compare(password, u.passwordHash);
        if (!ok) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const role = ROLES.has(u.role) ? u.role : 'STAFF';

        (req.session as any).user = { id: u.id, email: u.email, role };
        (req.session as any).userId = u.id;
        (req.session as any).role = role;

        return res.json({ ok: true, user: { id: u.id, email: u.email, role } });
    } catch (e) {
        if (e instanceof z.ZodError) {
            return res.status(400).json({ error: e.errors[0].message });
        }
        console.error(e);
        return res.status(500).json({ error: 'Login failed' });
    }
}

export async function logout(req: Request, res: Response) {
    req.session.destroy(() => {
        res.clearCookie('connect.sid');
        res.json({ ok: true });
    });
}

export function me(req: Request, res: Response) {
    const u = (req.session as any)?.user || null;
    res.json({
        user: u ? { id: u.id, email: String(u.email || '').toLowerCase(), role: u.role } : null,
    });
}
