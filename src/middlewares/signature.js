const config = require('../config');

const signatureMiddleware = async (ctx, next) => {
    await next();
};

const successResponse = (ctx, data, message = 'success', code = 200) => {
    ctx.status = code;
    ctx.body = {
        code,
        message,
        data,
        timestamp: Date.now(),
        signature: {
            copyright: config.copyright.owner,
            version: config.copyright.version,
            powered: config.copyright.powered
        }
    };
};

const errorResponse = (ctx, message, code = 400, statusCode = 400) => {
    ctx.status = statusCode;
    ctx.body = {
        code,
        message,
        data: null,
        timestamp: Date.now(),
        signature: {
            copyright: config.copyright.owner,
            version: config.copyright.version,
            powered: config.copyright.powered
        }
    };
};

module.exports = {
    signatureMiddleware,
    successResponse,
    errorResponse
};
