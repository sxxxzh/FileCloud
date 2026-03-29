const path = require('path');
const fs = require('fs');

const env = process.env.NODE_ENV || 'development';

const validEnvs = ['development', 'test', 'production'];
const currentEnv = validEnvs.includes(env) ? env : 'development';

const envFiles = [
    `.env.${currentEnv}.local`,
    `.env.${currentEnv}`
];

let envFileLoaded = null;
for (const file of envFiles) {
    const filePath = path.resolve(__dirname, '../../', file);
    if (fs.existsSync(filePath)) {
        require('dotenv').config({ path: filePath });
        envFileLoaded = file;
        break;
    }
}

console.log('====================================');
console.log(`环境: ${currentEnv}`);
console.log(`配置文件: ${envFileLoaded || '未找到'}`);
console.log('====================================');

const { DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD } = process.env;

if (DB_HOST && DB_NAME && DB_USER) {
    const port = DB_PORT || 3306;
    process.env.DATABASE_URL = `mysql://${DB_USER}:${encodeURIComponent(DB_PASSWORD || '')}@${DB_HOST}:${port}/${DB_NAME}`;
}

module.exports = {
    app: {
        name: process.env.APP_NAME || 'szhAo Cloud Storage',
        version: process.env.APP_VERSION || '1.0.0',
        env: currentEnv,
        port: parseInt(process.env.PORT) || 3000
    },
    
    copyright: {
        owner: process.env.COPYRIGHT_OWNER || 'szhAo',
        version: process.env.APP_VERSION || '1.0.0',
        powered: 'szhAo Cloud Storage'
    },
    
    database: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 3306,
        name: process.env.DB_NAME || 'cloud_storage',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || ''
    },
    
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD || '',
        db: parseInt(process.env.REDIS_DB) || 0
    },
    
    jwt: {
        secret: process.env.JWT_SECRET || 'default_secret_change_in_production',
        expiresIn: process.env.JWT_EXPIRES_IN || '2h',
        refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d'
    },
    
    storage: {
        path: process.env.STORAGE_PATH || './uploads',
        maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 * 1024,
        chunkSize: parseInt(process.env.CHUNK_SIZE) || 5 * 1024 * 1024
    },
    
    upload: {
        allowedMimeTypes: (process.env.ALLOWED_MIME_TYPES || 'image/*,video/*,audio/*,application/pdf,application/zip').split(','),
        blockedExtensions: (process.env.BLOCKED_EXTENSIONS || '.exe,.bat,.cmd,.sh,.php,.asp,.aspx,.jsp').split(',')
    },
    
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
    },
    
    defaultAdmin: {
        username: process.env.DEFAULT_ADMIN_USERNAME || 'admin',
        password: process.env.DEFAULT_ADMIN_PASSWORD || 'admin123',
        email: process.env.DEFAULT_ADMIN_EMAIL || 'admin@szhao.cloud',
        quota: parseInt(process.env.DEFAULT_ADMIN_QUOTA) || 100 * 1024 * 1024 * 1024
    },
    
    log: {
        level: process.env.LOG_LEVEL || 'info',
        path: process.env.LOG_PATH || './logs'
    }
};
