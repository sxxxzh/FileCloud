const jwt = require('jsonwebtoken');
const config = require('../config');
const { UnauthorizedError, ForbiddenError, ERROR_CODES } = require('./errorHandler');

const authMiddleware = async (ctx, next) => {
    const authorization = ctx.headers.authorization;
    
    if (!authorization) {
        throw new UnauthorizedError(ERROR_CODES.INVALID_TOKEN.message);
    }
    
    const parts = authorization.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        throw new UnauthorizedError(ERROR_CODES.INVALID_TOKEN.message);
    }
    
    const token = parts[1];
    
    try {
        const decoded = jwt.verify(token, config.jwt.secret);
        ctx.state.user = decoded;
        await next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            throw new UnauthorizedError('Token已过期');
        } else if (err.name === 'JsonWebTokenError') {
            throw new UnauthorizedError(ERROR_CODES.INVALID_TOKEN.message);
        } else {
            throw new UnauthorizedError(ERROR_CODES.INVALID_TOKEN.message);
        }
    }
};

const adminMiddleware = async (ctx, next) => {
    const user = ctx.state.user;
    
    if (!user || user.role !== 1) {
        throw new ForbiddenError(ERROR_CODES.ADMIN_REQUIRED.message);
    }
    
    await next();
};

const optionalAuth = async (ctx, next) => {
    let token = null;
    
    const authorization = ctx.headers.authorization;
    if (authorization) {
        const parts = authorization.split(' ');
        if (parts.length === 2 && parts[0] === 'Bearer') {
            token = parts[1];
        }
    }
    
    if (!token && ctx.query.token) {
        token = ctx.query.token;
    }
    
    if (token) {
        try {
            const decoded = jwt.verify(token, config.jwt.secret);
            ctx.state.user = decoded;
        } catch (err) {
            // Token无效，但不阻止请求
        }
    }
    
    await next();
};

const generateToken = (user) => {
    const payload = {
        user_id: user.id,
        username: user.username,
        role: user.role
    };
    
    return jwt.sign(payload, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn
    });
};

const generateRefreshToken = (user) => {
    const payload = {
        user_id: user.id,
        username: user.username,
        type: 'refresh'
    };
    
    return jwt.sign(payload, config.jwt.secret, {
        expiresIn: config.jwt.refreshExpiresIn
    });
};

module.exports = {
    authMiddleware,
    adminMiddleware,
    optionalAuth,
    generateToken,
    generateRefreshToken
};
