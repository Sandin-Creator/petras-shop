import dotenv from 'dotenv';
dotenv.config();

export const config = {
    PORT: process.env.PORT || 3002,
    DATABASE_URL: process.env.DATABASE_URL,
    SESSION_SECRET: process.env.SESSION_SECRET || 'dev-secret-change-me',
    SESSION_STORE: process.env.SESSION_STORE || 'memory',
    NODE_ENV: process.env.NODE_ENV || 'development',
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
};
