import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import FileStoreFactory from 'session-file-store';
import path from 'path';
import fs from 'fs';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

import { config } from './config/env';
import requireAdmin from './middleware/requireAdmin';
import uploadRouter from './routes/upload';
import authRouter from './routes/auth';
import productsRouter from './routes/products';

const app = express();

// Trust proxy
app.set('trust proxy', 1);

// Security Middleware
app.use(helmet({
    contentSecurityPolicy: false, // Disable for now to avoid breaking inline scripts/styles if not fully ready
}));
app.use(cors());
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sessions
const FileStore = FileStoreFactory(session);
// Silence harmless ENOENT from file store
const originalEmit = FileStore.prototype.emit;
FileStore.prototype.emit = function (this: any, event: string, err: any, ...args: any[]) {
    if (event === 'error' && err?.code === 'ENOENT' && err?.syscall === 'open') return;
    return originalEmit.call(this, event, err, ...args);
} as any;

const useMemory = config.SESSION_STORE === 'memory';
const sessPath = path.join(__dirname, '..', '.sessions'); // src/.. -> root
if (!useMemory) fs.mkdirSync(sessPath, { recursive: true });

const store = useMemory
    ? new session.MemoryStore()
    : new FileStore({ path: sessPath, reapInterval: 60, retries: 1 });

app.use(
    session({
        store,
        secret: config.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            sameSite: 'lax',
            secure: config.NODE_ENV === 'production',
            maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
        },
    })
);

// Paths
const publicDir = path.join(__dirname, '..', 'public');
const adminDir = path.join(publicDir, 'admin');

// Routes
// Login Page
app.get('/login', (req: Request, res: Response) => {
    res.set('X-Robots-Tag', 'noindex, nofollow');
    // Simple login page serving
    res.sendFile(path.join(publicDir, 'login.html'));
});

// Admin Static (Protected)
app.use('/admin', (req: Request, res: Response, next: NextFunction) => {
    res.set('X-Robots-Tag', 'noindex, nofollow');
    next();
});
app.use('/admin', requireAdmin, express.static(adminDir));
app.get('/admin', requireAdmin, (_req: Request, res: Response) => {
    res.sendFile(path.join(adminDir, 'index.html'));
});

import ordersRouter from './routes/orders';
import statsRouter from './routes/stats';

// API Routes
app.use('/api/upload', uploadRouter);
app.use('/api/auth', authRouter);
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/stats', statsRouter);

// Uploads Directory
const preferredUploads = process.env.UPLOAD_DIR || path.join(__dirname, '..', 'public', 'uploads');
const fallbackUploads = path.join(process.cwd(), 'uploads');

function ensureWritableDir(preferred: string, fallback: string): string {
    try {
        fs.mkdirSync(preferred, { recursive: true });
        fs.accessSync(preferred, fs.constants.W_OK);
        return preferred;
    } catch {
        fs.mkdirSync(fallback, { recursive: true });
        return fallback;
    }
}
const UPLOAD_DIR = ensureWritableDir(preferredUploads, fallbackUploads);
app.use('/uploads', express.static(UPLOAD_DIR));

// Public Static
app.use(express.static(publicDir, { extensions: ['html'] }));

// Root
app.get('/', (_req: Request, res: Response) => {
    res.sendFile(path.join(publicDir, 'index.html'));
});

// Error Handling
app.use((_req: Request, res: Response) => { res.status(404).json({ error: 'Not found' }) });
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
});

export default app;
