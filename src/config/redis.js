require('dotenv').config();
const { createClient } = require('redis');
const config = require('./index');

const redisClient = createClient({
    socket: {
        host: config.redis.host,
        port: config.redis.port
    },
    password: config.redis.password || undefined,
    database: config.redis.db
});

redisClient.on('connect', () => {
    console.log('Redis连接成功');
});

redisClient.on('error', (err) => {
    console.error('Redis连接错误:', err);
});

const connectRedis = async () => {
    try {
        await redisClient.connect();
    } catch (err) {
        console.error('Redis连接失败:', err);
        if (config.app.env !== 'production') {
            console.log('开发环境下继续运行，缓存功能将不可用');
        } else {
            process.exit(1);
        }
    }
};

connectRedis();

module.exports = redisClient;
