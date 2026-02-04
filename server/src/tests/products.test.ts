import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

// Mock Prisma Client via Global
const prismaMock: any = {
    product: {
        findMany: vi.fn(),
        count: vi.fn(),
    },
};
(global as any).prisma = prismaMock;

let app: any;

describe('Products Endpoints', () => {
    beforeEach(async () => {
        vi.clearAllMocks();
        if (!app) {
            const mod = await import('../app');
            app = mod.default || mod;
        }
    });

    it('GET /api/products - returns empty list', async () => {
        prismaMock.product.findMany.mockResolvedValue([]);
        prismaMock.product.count.mockResolvedValue(0);

        const res = await request(app).get('/api/products');

        expect(res.status).toBe(200);
        expect(res.body.items).toEqual([]);
        expect(res.body.total).toBe(0);
    });

    it('GET /api/products - returns products', async () => {
        const mockProducts = [
            { id: 1, name: 'Test Product', price: 1000 }
        ];
        prismaMock.product.findMany.mockResolvedValue(mockProducts);
        prismaMock.product.count.mockResolvedValue(1);

        const res = await request(app).get('/api/products');

        expect(res.status).toBe(200);
        expect(res.body.items).toHaveLength(1);
        expect(res.body.items[0].name).toBe('Test Product');
    });
});
