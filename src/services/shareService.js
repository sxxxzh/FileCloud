const fs = require('fs');
const path = require('path');
const prisma = require('../config/database');
const { hashPassword, comparePassword, generateShareCode, generateUUID } = require('../utils/crypto');
const { NotFoundError, GoneError, UnauthorizedError, ValidationError, ForbiddenError, ERROR_CODES } = require('../middlewares/errorHandler');
const fileService = require('./fileService');

const createShare = async (userId, shareData) => {
    const { file_id, expire_hours, max_downloads, password } = shareData;
    
    const file = await prisma.file.findFirst({
        where: { id: file_id, isDeleted: 0 }
    });
    
    if (!file) {
        throw new NotFoundError(ERROR_CODES.FILE_NOT_FOUND.message);
    }
    
    if (file.userId !== userId) {
        throw new ForbiddenError('无权分享此文件');
    }
    
    let shareCode;
    let attempts = 0;
    while (attempts < 10) {
        shareCode = generateShareCode();
        const existing = await prisma.share.findUnique({
            where: { shareCode }
        });
        if (!existing) break;
        attempts++;
    }
    
    if (attempts >= 10) {
        throw new ValidationError('生成分享码失败，请重试');
    }
    
    let expireAt = null;
    if (expire_hours && expire_hours > 0) {
        expireAt = new Date(Date.now() + expire_hours * 60 * 60 * 1000);
    }
    
    let accessPassword = null;
    if (password) {
        accessPassword = await hashPassword(password);
    }
    
    const share = await prisma.share.create({
        data: {
            id: generateUUID(),
            fileId: file_id,
            userId,
            shareCode,
            accessPassword,
            expireAt,
            maxDownloads: max_downloads || -1,
            downloadCount: 0
        }
    });
    
    return {
        share_id: share.id,
        share_code: share.shareCode,
        share_url: `/s/${share.shareCode}`,
        expire_at: share.expireAt,
        max_downloads: share.maxDownloads,
        has_password: !!accessPassword
    };
};

const getShareByCode = async (shareCode, password = null) => {
    const share = await prisma.share.findUnique({
        where: { shareCode },
        include: {
            file: {
                select: {
                    id: true,
                    originalName: true,
                    fileSize: true,
                    mimeType: true,
                    filePath: true,
                    isDeleted: true,
                    thumbnail: true
                }
            }
        }
    });
    
    if (!share) {
        throw new NotFoundError(ERROR_CODES.SHARE_NOT_FOUND.message);
    }
    
    if (share.file.isDeleted === 1) {
        throw new GoneError('文件已被删除');
    }
    
    if (share.expireAt && new Date() > share.expireAt) {
        throw new GoneError(ERROR_CODES.SHARE_EXPIRED.message);
    }
    
    if (share.maxDownloads > 0 && share.downloadCount >= share.maxDownloads) {
        throw new GoneError(ERROR_CODES.DOWNLOAD_LIMIT_EXCEEDED.message);
    }
    
    const hasPassword = !!share.accessPassword;
    
    if (hasPassword) {
        if (!password) {
            return {
                requires_password: true,
                share_code: share.shareCode,
                filename: share.file.originalName,
                file_size: Number(share.file.fileSize),
                has_password: true,
                thumbnail: share.file.thumbnail ? `data:image/jpeg;base64,${share.file.thumbnail.toString('base64')}` : null
            };
        }
        
        const isValid = await comparePassword(password, share.accessPassword);
        if (!isValid) {
            throw new UnauthorizedError(ERROR_CODES.INVALID_SHARE_PASSWORD.message);
        }
    }
    
    let filePath = share.file.filePath;
    if (!path.isAbsolute(filePath)) {
        filePath = path.resolve(process.cwd(), filePath);
    }
    
    return {
        share_id: share.id,
        share_code: share.shareCode,
        filename: share.file.originalName,
        file_size: Number(share.file.fileSize),
        mime_type: share.file.mimeType,
        expire_at: share.expireAt,
        max_downloads: share.maxDownloads,
        download_count: share.downloadCount,
        remaining_downloads: share.maxDownloads > 0 ? share.maxDownloads - share.downloadCount : -1,
        has_password: hasPassword,
        created_at: share.createdAt,
        file_path: filePath,
        file_id: share.file.id,
        thumbnail: share.file.thumbnail ? `data:image/jpeg;base64,${share.file.thumbnail.toString('base64')}` : null
    };
};

const downloadShareFile = async (shareCode, password = null, userId = null) => {
    const shareInfo = await getShareByCode(shareCode, password);
    
    if (!fs.existsSync(shareInfo.file_path)) {
        throw new NotFoundError('文件不存在');
    }
    
    await prisma.share.update({
        where: { shareCode },
        data: {
            downloadCount: {
                increment: 1
            }
        }
    });
    
    await prisma.downloadLog.create({
        data: {
            id: generateUUID(),
            fileId: shareInfo.file_id,
            userId,
            shareId: shareInfo.share_id,
            downloadSize: BigInt(shareInfo.file_size)
        }
    });
    
    return {
        file_path: shareInfo.file_path,
        filename: shareInfo.filename,
        file_size: shareInfo.file_size,
        mime_type: shareInfo.mime_type
    };
};

const getShareList = async (userId, page = 1, limit = 20, status = null, isAdmin = false) => {
    const skip = (page - 1) * limit;
    
    const where = {};
    
    if (!isAdmin) {
        where.userId = userId;
    }
    
    if (status === 'active') {
        where.OR = [
            { expireAt: null },
            { expireAt: { gt: new Date() } }
        ];
    } else if (status === 'expired') {
        where.expireAt = { lt: new Date() };
    }
    
    const [shares, total] = await Promise.all([
        prisma.share.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                file: {
                    select: {
                        originalName: true,
                        fileSize: true,
                        isDeleted: true,
                        mimeType: true,
                        thumbnail: true
                    }
                },
                user: {
                    select: {
                        username: true
                    }
                }
            }
        }),
        prisma.share.count({ where })
    ]);
    
    return {
        shares: shares.map(share => ({
            share_id: share.id,
            share_code: share.shareCode,
            share_url: `/s/${share.shareCode}`,
            filename: share.file.originalName,
            file_size: Number(share.file.fileSize),
            mime_type: share.file.mimeType,
            expire_at: share.expireAt,
            max_downloads: share.maxDownloads,
            download_count: share.downloadCount,
            has_password: !!share.accessPassword,
            created_at: share.createdAt,
            is_expired: share.expireAt && new Date() > share.expireAt,
            file_deleted: share.file.isDeleted === 1,
            user_id: share.userId,
            username: share.user?.username,
            file_id: share.fileId,
            thumbnail: share.file.thumbnail ? `data:image/jpeg;base64,${share.file.thumbnail.toString('base64')}` : null
        })),
        pagination: {
            page,
            limit,
            total,
            total_pages: Math.ceil(total / limit)
        }
    };
};

const deleteShare = async (userId, shareId, isAdmin = false) => {
    const share = await prisma.share.findUnique({
        where: { id: shareId }
    });
    
    if (!share) {
        throw new NotFoundError('分享不存在');
    }
    
    if (!isAdmin && share.userId !== userId) {
        throw new ForbiddenError('无权删除此分享');
    }
    
    await prisma.share.delete({
        where: { id: shareId }
    });
    
    return true;
};

module.exports = {
    createShare,
    getShareByCode,
    downloadShareFile,
    getShareList,
    deleteShare
};
