const config = require('../config');

const formatResponse = (data = null, message = 'success', code = 200) => {
    return {
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

const formatPagination = (items, page, limit, total) => {
    return {
        items,
        pagination: {
            page,
            limit,
            total,
            total_pages: Math.ceil(total / limit)
        }
    };
};

const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDuration = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}天`;
    if (hours > 0) return `${hours}小时`;
    if (minutes > 0) return `${minutes}分钟`;
    return `${seconds}秒`;
};

module.exports = {
    formatResponse,
    formatPagination,
    formatFileSize,
    formatDuration
};
