require('dotenv').config();

const DATABASE_URL = `mysql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

process.env.DATABASE_URL = DATABASE_URL;

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const config = require('../config');

const prisma = new PrismaClient();

async function initAdmin() {
    const { defaultAdmin } = config;
    
    console.log('检查管理员账号...');
    
    const existingAdmin = await prisma.user.findUnique({
        where: { username: defaultAdmin.username }
    });
    
    if (existingAdmin) {
        console.log('管理员账号已存在，跳过初始化');
        console.log(`用户名: ${existingAdmin.username}`);
        console.log(`角色: ${existingAdmin.role === 1 ? '管理员' : '普通用户'}`);
        return;
    }
    
    console.log('创建默认管理员账号...');
    
    const passwordHash = await bcrypt.hash(defaultAdmin.password, 10);
    
    const admin = await prisma.user.create({
        data: {
            username: defaultAdmin.username,
            passwordHash,
            email: defaultAdmin.email,
            role: 1,
            storageQuota: BigInt(defaultAdmin.quota),
            storageUsed: BigInt(0),
            status: 1
        }
    });
    
    console.log('====================================');
    console.log('默认管理员账号创建成功！');
    console.log('====================================');
    console.log(`用户名: ${admin.username}`);
    console.log(`密码: ${defaultAdmin.password}`);
    console.log(`邮箱: ${admin.email}`);
    console.log(`存储配额: ${Number(admin.storageQuota) / (1024 * 1024 * 1024)} GB`);
    console.log('====================================');
    console.log('⚠️  请立即修改默认密码！');
    console.log('====================================');
}

initAdmin()
    .catch((err) => {
        console.error('初始化管理员账号失败:', err);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
