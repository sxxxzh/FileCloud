const prisma = require('../config/database');

const getStorageStats = async (userId) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            storageQuota: true,
            storageUsed: true
        }
    });
    
    if (!user) {
        return null;
    }
    
    const files = await prisma.file.findMany({
        where: {
            userId,
            isDeleted: 0
        },
        select: {
            fileSize: true,
            mimeType: true
        }
    });
    
    const totalFiles = files.length;
    const totalSize = files.reduce((sum, file) => sum + Number(file.fileSize), 0);
    
    const byType = {};
    files.forEach(file => {
        let type = 'other';
        if (file.mimeType) {
            if (file.mimeType.startsWith('image/')) type = 'image';
            else if (file.mimeType.startsWith('video/')) type = 'video';
            else if (file.mimeType.startsWith('audio/')) type = 'audio';
            else if (file.mimeType.includes('pdf')) type = 'document';
            else if (file.mimeType.includes('zip') || file.mimeType.includes('rar')) type = 'archive';
            else if (file.mimeType.startsWith('text/')) type = 'text';
        }
        
        if (!byType[type]) {
            byType[type] = { count: 0, size: 0 };
        }
        byType[type].count++;
        byType[type].size += Number(file.fileSize);
    });
    
    return {
        total_files: totalFiles,
        total_size: totalSize,
        quota: Number(user.storageQuota),
        used: Number(user.storageUsed),
        available: Number(user.storageQuota) - Number(user.storageUsed),
        used_percent: Number(user.storageQuota) > 0 
            ? (Number(user.storageUsed) * 100 / Number(user.storageQuota)).toFixed(2)
            : 0,
        by_type: byType
    };
};

const getSystemStats = async () => {
    const [totalUsers, adminCount, totalStorage, totalFiles] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { role: 1 } }),
        prisma.user.aggregate({
            _sum: { storageUsed: true }
        }),
        prisma.file.count({ where: { isDeleted: 0 } })
    ]);
    
    return {
        total_users: totalUsers,
        admin_count: adminCount,
        total_storage: Number(totalStorage._sum.storageUsed || 0),
        total_files: totalFiles
    };
};

module.exports = {
    getStorageStats,
    getSystemStats
};
