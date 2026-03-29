const redisClient = require('../config/redis');
const config = require('../config');
const { TooManyRequestsError } = require('./errorHandler');

const rateLimitMiddleware = (options = {}) => {
    const {
        windowMs = config.rateLimit.windowMs,
        max = config.rateLimit.maxRequests,
        message = '请求过于频繁，请稍后再试',
        keyGenerator = (ctx) => ctx.ip
    } = options;
    
    return async (ctx, next) => {
        const key = `ratelimit:${keyGenerator(ctx)}`;
        let calledNext = false;
        
        try {
            const current = await redisClient.get(key);
            
            if (current && parseInt(current) >= max) {
                throw new TooManyRequestsError(message);
            }
            
            if (current) {
                await redisClient.incr(key);
            } else {
                await redisClient.setEx(key, Math.floor(windowMs / 1000), '1');
            }
            
            calledNext = true;
            await next();
        } catch (err) {
            if (err instanceof TooManyRequestsError) {
                throw err;
            }
            
            console.error('速率限制检查失败:', err);
            if (!calledNext) {
                await next();
            }
        }
    };
};

const authRateLimit = rateLimitMiddleware({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: '登录尝试次数过多，请15分钟后再试',
    keyGenerator: (ctx) => {
        const body = ctx.request.body || {};
        return `auth:${ctx.ip}:${body.username || ''}`;
    }
});

const uploadRateLimit = rateLimitMiddleware({
    windowMs: 60 * 60 * 1000,
    max: 50,
    message: '上传次数过多，请稍后再试',
    keyGenerator: (ctx) => `upload:${ctx.state.user?.user_id || ctx.ip}`
});

const downloadRateLimit = rateLimitMiddleware({
    windowMs: 60 * 1000,
    max: 30,
    message: '下载次数过多，请稍后再试',
    keyGenerator: (ctx) => `download:${ctx.state.user?.user_id || ctx.ip}`
});

module.exports = {
    rateLimitMiddleware,
    authRateLimit,
    uploadRateLimit,
    downloadRateLimit
};
