const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const env = process.env.NODE_ENV || 'development';

const validEnvs = ['development', 'test', 'production'];
const currentEnv = validEnvs.includes(env) ? env : 'development';

const envFile = path.resolve(__dirname, '..', `.env.${currentEnv}`);

console.log('====================================');
console.log(`环境: ${currentEnv}`);
console.log(`配置文件: ${envFile}`);
console.log('====================================');

if (!fs.existsSync(envFile)) {
    console.error(`错误: 环境配置文件不存在: ${envFile}`);
    process.exit(1);
}

require('dotenv').config({ path: envFile });

const { DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD } = process.env;

if (!DB_HOST || !DB_NAME || !DB_USER) {
    console.error('错误: 数据库配置不完整');
    console.error(`DB_HOST: ${DB_HOST || '未设置'}`);
    console.error(`DB_NAME: ${DB_NAME || '未设置'}`);
    console.error(`DB_USER: ${DB_USER || '未设置'}`);
    process.exit(1);
}

const port = DB_PORT || 3306;
process.env.DATABASE_URL = `mysql://${DB_USER}:${encodeURIComponent(DB_PASSWORD || '')}@${DB_HOST}:${port}/${DB_NAME}`;

console.log(`数据库连接: ${DB_HOST}:${port}/${DB_NAME}`);

const args = process.argv.slice(2);

if (args.length === 0) {
    console.error('错误: 请提供 Prisma 命令');
    console.error('示例: node scripts/prisma.js db push');
    process.exit(1);
}

const command = `npx prisma ${args.join(' ')}`;

try {
    execSync(command, {
        stdio: 'inherit',
        env: { ...process.env }
    });
} catch (error) {
    process.exit(1);
}
