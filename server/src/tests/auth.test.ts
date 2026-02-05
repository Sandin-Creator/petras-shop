import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';

// Mock Prisma Client via Global
// We need to match the recursive structure if we want deep typing, but `any` is easier for mocks
const prismaMock: any = {
    user: {
        findUnique: vi.fn(),
    },
};
(global as any).prisma = prismaMock;

let app: any;

describe('Auth Endpoints', () => {
    beforeEach(async () => {
        vi.clearAllMocks();
        // Reset modules if needed, but for now just ensure we have the app
        if (!app) {
            const mod = await import('../app');
            app = mod.default || mod;
        }
    });

    it('POST /api/auth/login - fails with invalid credentials', async () => {
        prismaMock.user.findUnique.mockResolvedValue(null);

        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'wrong@example.com', password: 'bad' });

        expect(res.status).toBe(401);
        expect(res.body.error).toBe('Invalid credentials');
    });

    it('POST /api/auth/login - succeeds with correct credentials', async () => {
        const hash = await bcrypt.hash('password123', 10);
        prismaMock.user.findUnique.mockResolvedValue({
            id: 1,
            email: 'test@example.com',
            passwordHash: hash,
            role: 'STAFF',
        });

        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'test@example.com', password: 'password123' });

        expect(res.status).toBe(200);
        expect(res.body.ok).toBe(true);
        expect(res.body.user).toMatchObject({
            email: 'test@example.com',
            role: 'STAFF'
        });
    });

    it('GET /api/auth/me - returns null when not logged in', async () => {
        const res = await request(app).get('/api/auth/me');
        expect(res.status).toBe(200);
        expect(res.body.user).toBeNull();
    });
});
