require('dotenv').config();

const DATABASE_URL = `mysql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

process.env.DATABASE_URL = DATABASE_URL;

const Koa = require('koa');
const { koaBody } = require('koa-body');
const serve = require('koa-static');
const path = require('path');
const fs = require('fs');

const config = require('./config');
const { errorHandler } = require('./middlewares/errorHandler');
const { signatureMiddleware } = require('./middlewares/signature');
const { userRoutes, fileRoutes, shareRoutes } = require('./routes');
const prisma = require('./config/database');

const app = new Koa();

app.use(errorHandler);

app.use(signatureMiddleware);

app.use(koaBody({
    multipart: false,
    json: true,
    jsonLimit: '10mb',
    formLimit: '10mb',
    text: true,
    textLimit: '10mb'
}));

app.use(async (ctx, next) => {
    const start = Date.now();
    await next();
    const ms = Date.now() - start;
    console.log(`${ctx.method} ${ctx.url} - ${ctx.status} - ${ms}ms`);
});

app.use(async (ctx, next) => {
    ctx.set('Access-Control-Allow-Origin', '*');
    ctx.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    ctx.set('Access-Control-Allow-Headers', 'Origin, Content-Type, Authorization, Accept');
    ctx.set('Access-Control-Max-Age', '86400');
    
    if (ctx.method === 'OPTIONS') {
        ctx.status = 204;
        return;
    }
    
    await next();
});

app.use(userRoutes.routes()).use(userRoutes.allowedMethods());
app.use(fileRoutes.routes()).use(fileRoutes.allowedMethods());
app.use(shareRoutes.routes()).use(shareRoutes.allowedMethods());

app.use(async (ctx) => {
    ctx.status = 404;
    ctx.body = {
        code: 404,
        message: '接口不存在',
        data: null,
        timestamp: Date.now(),
        signature: {
            copyright: config.copyright.owner,
            version: config.copyright.version,
            powered: config.copyright.powered
        }
    };
});

const uploadDirs = [
    config.storage.path,
    path.join(config.storage.path, 'private'),
    path.join(config.storage.path, 'public'),
    path.join(config.storage.path, 'temp'),
    config.log.path
];

uploadDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`创建目录: ${dir}`);
    }
});

const PORT = config.app.port;

app.listen(PORT, () => {
    console.log('====================================');
    console.log(`${config.copyright.powered} v${config.copyright.version}`);
    console.log(`Copyright © ${config.copyright.owner}`);
    console.log('====================================');
    console.log(`服务已启动: http://localhost:${PORT}`);
    console.log(`环境: ${config.app.env}`);
    console.log('====================================');
});

process.on('SIGINT', async () => {
    console.log('\n正在关闭服务...');
    await prisma.$disconnect();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n正在关闭服务...');
    await prisma.$disconnect();
    process.exit(0);
});

module.exports = app;
