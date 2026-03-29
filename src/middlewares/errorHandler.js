const config = require('../config');

class AppError extends Error {
    constructor(message, code, statusCode = 400) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

class ValidationError extends AppError {
    constructor(message) {
        super(message, 400, 400);
    }
}

class UnauthorizedError extends AppError {
    constructor(message = '未授权') {
        super(message, 401, 401);
    }
}

class ForbiddenError extends AppError {
    constructor(message = '禁止访问') {
        super(message, 403, 403);
    }
}

class NotFoundError extends AppError {
    constructor(message = '资源不存在') {
        super(message, 404, 404);
    }
}

class GoneError extends AppError {
    constructor(message = '资源已过期') {
        super(message, 410, 410);
    }
}

class FileTooLargeError extends AppError {
    constructor(message = '文件过大') {
        super(message, 413, 413);
    }
}

class TooManyRequestsError extends AppError {
    constructor(message = '请求过于频繁') {
        super(message, 429, 429);
    }
}

const ERROR_CODES = {
    USERNAME_EXISTS: { code: 10001, message: '用户名已存在' },
    INVALID_CREDENTIALS: { code: 10002, message: '用户名或密码错误' },
    INVALID_TOKEN: { code: 10003, message: 'Token无效或已过期' },
    ADMIN_REQUIRED: { code: 10004, message: '需要管理员权限' },
    USER_NOT_FOUND: { code: 10005, message: '用户不存在' },
    CANNOT_DELETE_ADMIN: { code: 10006, message: '无法删除管理员账号' },
    FILE_NOT_FOUND: { code: 20001, message: '文件不存在' },
    FILE_TOO_LARGE: { code: 20002, message: '文件大小超过限制' },
    FILE_TYPE_NOT_ALLOWED: { code: 20003, message: '文件类型不被允许' },
    STORAGE_FULL: { code: 20004, message: '存储空间不足' },
    SHARE_NOT_FOUND: { code: 30001, message: '分享链接不存在' },
    SHARE_EXPIRED: { code: 30002, message: '分享链接已过期' },
    DOWNLOAD_LIMIT_EXCEEDED: { code: 30003, message: '下载次数已用尽' },
    INVALID_SHARE_PASSWORD: { code: 30004, message: '访问密码错误' }
};

const errorHandler = async (ctx, next) => {
    try {
        await next();
    } catch (err) {
        let statusCode = err.statusCode || 500;
        let code = err.code || 500;
        let message = err.message || '服务器内部错误';

        if (err.isOperational) {
            statusCode = err.statusCode;
            code = err.code;
        } else {
            console.error('非预期错误:', err);
            statusCode = 500;
            code = 500;
            message = '服务器内部错误';
        }

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
    }
};

module.exports = {
    AppError,
    ValidationError,
    UnauthorizedError,
    ForbiddenError,
    NotFoundError,
    GoneError,
    FileTooLargeError,
    TooManyRequestsError,
    ERROR_CODES,
    errorHandler
};
