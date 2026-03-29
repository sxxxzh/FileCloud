require('dotenv').config();

const DATABASE_URL = `mysql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

process.env.DATABASE_URL = DATABASE_URL;

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

prisma.$connect()
    .then(() => console.log('数据库连接成功'))
    .catch((err) => {
        console.error('数据库连接失败:', err);
        process.exit(1);
    });

process.on('beforeExit', async () => {
    await prisma.$disconnect();
});

module.exports = prisma;
