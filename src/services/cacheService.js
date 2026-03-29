const redisClient = require('../config/redis');

const get = async (key) => {
    try {
        const data = await redisClient.get(key);
        if (data) {
            return JSON.parse(data);
        }
        return null;
    } catch (err) {
        console.error('Redis get error:', err);
        return null;
    }
};

const set = async (key, value, ttl = 3600) => {
    try {
        await redisClient.setEx(key, ttl, JSON.stringify(value));
        return true;
    } catch (err) {
        console.error('Redis set error:', err);
        return false;
    }
};

const del = async (key) => {
    try {
        await redisClient.del(key);
        return true;
    } catch (err) {
        console.error('Redis del error:', err);
        return false;
    }
};

const getFileMeta = async (fileId) => {
    return get(`file:meta:${fileId}`);
};

const setFileMeta = async (fileId, data, ttl = 3600) => {
    return set(`file:meta:${fileId}`, data, ttl);
};

const getShareInfo = async (shareCode) => {
    return get(`share:${shareCode}`);
};

const setShareInfo = async (shareCode, data, ttl = 300) => {
    return set(`share:${shareCode}`, data, ttl);
};

const getUserQuota = async (userId) => {
    return get(`user:quota:${userId}`);
};

const setUserQuota = async (userId, data, ttl = 60) => {
    return set(`user:quota:${userId}`, data, ttl);
};

const invalidateFileMeta = async (fileId) => {
    return del(`file:meta:${fileId}`);
};

const invalidateShareInfo = async (shareCode) => {
    return del(`share:${shareCode}`);
};

const invalidateUserQuota = async (userId) => {
    return del(`user:quota:${userId}`);
};

module.exports = {
    get,
    set,
    del,
    getFileMeta,
    setFileMeta,
    getShareInfo,
    setShareInfo,
    getUserQuota,
    setUserQuota,
    invalidateFileMeta,
    invalidateShareInfo,
    invalidateUserQuota
};
