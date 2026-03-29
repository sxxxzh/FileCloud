const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');
const { promisify } = require('util');
const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);
const prisma = require('../config/database');
const config = require('../config');
const { calculateFileHash, generateUUID } = require('../utils/crypto');
const { ValidationError, NotFoundError, ForbiddenError, FileTooLargeError, ERROR_CODES } = require('../middlewares/errorHandler');

const compressThumbnail = async (buffer) => {
    try {
        let thumbnailBuffer = await sharp(buffer)
            .resize(200, 200, {
                fit: 'inside',
                withoutEnlargement: true
            })
            .jpeg({ quality: 60 })
            .toBuffer();
        
        let quality = 60;
        while (thumbnailBuffer.length > 5120 && quality > 10) {
            quality -= 10;
            thumbnailBuffer = await sharp(buffer)
                .resize(200, 200, {
                    fit: 'inside',
                    withoutEnlargement: true
                })
                .jpeg({ quality })
                .toBuffer();
        }
        
        if (thumbnailBuffer.length > 5120) {
            thumbnailBuffer = await sharp(buffer)
                .resize(100, 100, {
                    fit: 'inside',
                    withoutEnlargement: true
                })
                .jpeg({ quality: 30 })
                .toBuffer();
        }
        
        return thumbnailBuffer.length <= 5120 ? thumbnailBuffer : null;
    } catch (error) {
        console.error('压缩缩略图失败:', error.message);
        return null;
    }
};

const generateThumbnail = async (filePath, mimeType) => {
    const imageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/tiff'];
    const videoTypes = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/x-ms-wmv', 'video/webm', 'video/x-matroska', 'video/3gpp', 'video/x-flv'];
    
    if (imageTypes.includes(mimeType)) {
        try {
            const buffer = fs.readFileSync(filePath);
            return await compressThumbnail(buffer);
        } catch (error) {
            console.error('生成图片缩略图失败:', error.message);
            return null;
        }
    }
    
    if (videoTypes.includes(mimeType)) {
        return new Promise((resolve) => {
            const tempPath = path.join(config.storage.path || './uploads', `temp_frame_${Date.now()}.jpg`);
            
            ffmpeg(filePath)
                .screenshots({
                    timestamps: ['0.2'],
                    filename: path.basename(tempPath),
                    folder: path.dirname(tempPath),
                    size: '200x200'
                })
                .on('end', async () => {
                    try {
                        if (fs.existsSync(tempPath)) {
                            const buffer = fs.readFileSync(tempPath);
                            await unlink(tempPath);
                            const compressed = await compressThumbnail(buffer);
                            resolve(compressed);
                        } else {
                            resolve(null);
                        }
                    } catch (error) {
                        console.error('处理视频缩略图失败:', error.message);
                        if (fs.existsSync(tempPath)) {
                            try { await unlink(tempPath); } catch (e) {}
                        }
                        resolve(null);
                    }
                })
                .on('error', (err) => {
                    console.error('提取视频帧失败:', err.message);
                    if (fs.existsSync(tempPath)) {
                        try { fs.unlinkSync(tempPath); } catch (e) {}
                    }
                    resolve(null);
                });
        });
    }
    
    return null;
};

const getStoragePath = (userId, visibility) => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    const visibilityPath = visibility === 1 ? 'public' : 'private';
    const basePath = path.isAbsolute(config.storage.path) 
        ? config.storage.path 
        : path.resolve(process.cwd(), config.storage.path);
    const storagePath = path.join(
        basePath,
        visibilityPath,
        userId,
        String(year),
        month,
        day
    );
    
    if (!fs.existsSync(storagePath)) {
        fs.mkdirSync(storagePath, { recursive: true });
    }
    
    return storagePath;
};

const checkStorageQuota = async (userId, fileSize) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { storageQuota: true, storageUsed: true }
    });
    
    if (!user) {
        throw new NotFoundError(ERROR_CODES.USER_NOT_FOUND.message);
    }
    
    const availableSpace = BigInt(user.storageQuota) - BigInt(user.storageUsed);
    
    if (BigInt(fileSize) > availableSpace) {
        throw new ValidationError(ERROR_CODES.STORAGE_FULL.message);
    }
    
    return true;
};

const updateStorageUsed = async (userId, fileSize) => {
    await prisma.user.update({
        where: { id: userId },
        data: {
            storageUsed: {
                increment: BigInt(fileSize)
            }
        }
    });
};

const validateFileType = (filename, mimeType) => {
    const ext = path.extname(filename).toLowerCase();
    
    if (config.upload.blockedExtensions.includes(ext)) {
        throw new ValidationError(ERROR_CODES.FILE_TYPE_NOT_ALLOWED.message);
    }
    
    return true;
};

const uploadFile = async (userId, file, visibility = 0) => {
    if (file.size > config.storage.maxFileSize) {
        throw new FileTooLargeError(ERROR_CODES.FILE_TOO_LARGE.message);
    }
    
    await checkStorageQuota(userId, file.size);
    
    let originalName = file.originalname;
    try {
        if (originalName) {
            originalName = Buffer.from(originalName, 'latin1').toString('utf8');
        }
    } catch (e) {
        console.log('文件名编码转换失败，使用原始名称');
    }
    
    validateFileType(originalName, file.mimetype);
    
    const fileBuffer = fs.readFileSync(file.path);
    const fileHash = calculateFileHash(fileBuffer);
    
    const existingFile = await prisma.file.findFirst({
        where: { fileHash, isDeleted: 0 }
    });
    
    if (existingFile) {
        fs.unlinkSync(file.path);
        
        let thumbnail = existingFile.thumbnail;
        if (!thumbnail) {
            thumbnail = await generateThumbnail(existingFile.filePath, file.mimetype);
        }
        
        const newFile = await prisma.file.create({
            data: {
                id: generateUUID(),
                userId,
                filename: existingFile.filename,
                originalName,
                filePath: existingFile.filePath,
                fileSize: BigInt(file.size),
                mimeType: file.mimetype,
                fileHash,
                thumbnail,
                visibility,
                downloadCount: 0,
                isDeleted: 0
            }
        });
        
        return {
            file_id: newFile.id,
            filename: newFile.originalName,
            original_name: newFile.originalName,
            file_size: Number(newFile.fileSize),
            mime_type: newFile.mimeType,
            visibility: newFile.visibility,
            file_hash: newFile.fileHash,
            upload_time: newFile.createdAt,
            is_instant: true
        };
    }
    
    const storagePath = getStoragePath(userId, visibility);
    const storedFilename = `${fileHash}.dat`;
    const filePath = path.join(storagePath, storedFilename);
    
    fs.copyFileSync(file.path, filePath);
    
    const thumbnail = await generateThumbnail(file.path, file.mimetype);
    
    fs.unlinkSync(file.path);
    
    const newFile = await prisma.file.create({
        data: {
            id: generateUUID(),
            userId,
            filename: storedFilename,
            originalName,
            filePath,
            fileSize: BigInt(file.size),
            mimeType: file.mimetype,
            fileHash,
            thumbnail,
            visibility,
            downloadCount: 0,
            isDeleted: 0
        }
    });
    
    await updateStorageUsed(userId, file.size);
    
    return {
        file_id: newFile.id,
        filename: newFile.originalName,
        original_name: newFile.originalName,
        file_size: Number(newFile.fileSize),
        mime_type: newFile.mimeType,
        visibility: newFile.visibility,
        file_hash: newFile.fileHash,
        upload_time: newFile.createdAt,
        is_instant: false
    };
};

const getFileById = async (fileId, userId) => {
    const file = await prisma.file.findFirst({
        where: { id: fileId, isDeleted: 0 }
    });
    
    if (!file) {
        throw new NotFoundError(ERROR_CODES.FILE_NOT_FOUND.message);
    }
    
    if (file.visibility !== 1 && file.userId !== userId) {
        throw new ForbiddenError('无权访问此文件');
    }
    
    let filePath = file.filePath;
    if (!path.isAbsolute(filePath)) {
        filePath = path.resolve(process.cwd(), filePath);
    }
    
    return {
        file_id: file.id,
        filename: file.originalName,
        original_name: file.originalName,
        file_size: Number(file.fileSize),
        mime_type: file.mimeType,
        file_hash: file.fileHash,
        visibility: file.visibility,
        download_count: file.downloadCount,
        created_at: file.createdAt,
        file_path: filePath
    };
};

const getFileList = async (userId, page = 1, limit = 20, filters = {}, isAdmin = false) => {
    const skip = (page - 1) * limit;
    
    const where = {
        isDeleted: 0
    };
    
    if (!isAdmin) {
        where.userId = userId;
    }
    
    if (filters.visibility !== undefined && filters.visibility !== '') {
        where.visibility = parseInt(filters.visibility);
    }
    
    if (filters.keyword) {
        where.originalName = {
            contains: filters.keyword
        };
    }
    
    if (filters.user_id && isAdmin) {
        where.userId = filters.user_id;
    }
    
    if (filters.file_type) {
        const mimeTypeMap = {
            'image': ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/svg+xml', 'image/tiff'],
            'video': ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/x-ms-wmv', 'video/webm'],
            'audio': ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/flac', 'audio/x-m4a'],
            'document': ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'text/plain', 'text/rtf'],
            'archive': ['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed', 'application/x-tar', 'application/gzip'],
            'code': ['text/javascript', 'text/html', 'text/css', 'application/json', 'application/xml', 'text/x-python', 'text/x-java-source', 'text/x-c', 'text/x-c++']
        };
        
        const mimeTypes = mimeTypeMap[filters.file_type];
        if (mimeTypes) {
            where.mimeType = { in: mimeTypes };
        }
    }
    
    let orderBy = { createdAt: 'desc' };
    if (filters.sort_by) {
        const sortMap = {
            'time_desc': { createdAt: 'desc' },
            'time_asc': { createdAt: 'asc' },
            'size_desc': { fileSize: 'desc' },
            'size_asc': { fileSize: 'asc' },
            'name_asc': { originalName: 'asc' },
            'name_desc': { originalName: 'desc' },
            'downloads_desc': { downloadCount: 'desc' },
            'downloads_asc': { downloadCount: 'asc' }
        };
        orderBy = sortMap[filters.sort_by] || orderBy;
    }
    
    const [files, total] = await Promise.all([
        prisma.file.findMany({
            where,
            skip,
            take: limit,
            orderBy,
            select: {
                id: true,
                originalName: true,
                fileSize: true,
                mimeType: true,
                visibility: true,
                downloadCount: true,
                createdAt: true,
                userId: true,
                thumbnail: true,
                user: {
                    select: {
                        username: true
                    }
                }
            }
        }),
        prisma.file.count({ where })
    ]);
    
    return {
        files: files.map(file => ({
            file_id: file.id,
            filename: file.originalName,
            original_name: file.originalName,
            file_size: Number(file.fileSize),
            mime_type: file.mimeType,
            visibility: file.visibility,
            download_count: file.downloadCount,
            created_at: file.createdAt,
            user_id: file.userId,
            username: file.user?.username,
            thumbnail: file.thumbnail ? `data:image/jpeg;base64,${file.thumbnail.toString('base64')}` : null
        })),
        pagination: {
            page,
            limit,
            total,
            total_pages: Math.ceil(total / limit)
        }
    };
};

const updateFileVisibility = async (fileId, userId, visibility, isAdmin = false) => {
    const file = await prisma.file.findFirst({
        where: { id: fileId, isDeleted: 0 }
    });
    
    if (!file) {
        throw new NotFoundError(ERROR_CODES.FILE_NOT_FOUND.message);
    }
    
    if (!isAdmin && file.userId !== userId) {
        throw new ForbiddenError('无权修改此文件');
    }
    
    const updatedFile = await prisma.file.update({
        where: { id: fileId },
        data: { visibility }
    });
    
    return {
        file_id: updatedFile.id,
        visibility: updatedFile.visibility
    };
};

const deleteFile = async (fileId, userId, isAdmin = false) => {
    const file = await prisma.file.findFirst({
        where: { id: fileId, isDeleted: 0 }
    });
    
    if (!file) {
        throw new NotFoundError(ERROR_CODES.FILE_NOT_FOUND.message);
    }
    
    if (!isAdmin && file.userId !== userId) {
        throw new ForbiddenError('无权删除此文件');
    }
    
    const sameHashFiles = await prisma.file.count({
        where: {
            fileHash: file.fileHash,
            isDeleted: 0,
            id: { not: fileId }
        }
    });
    
    if (sameHashFiles === 0 && fs.existsSync(file.filePath)) {
        fs.unlinkSync(file.filePath);
    }
    
    await prisma.file.update({
        where: { id: fileId },
        data: {
            isDeleted: 1,
            deletedAt: new Date()
        }
    });
    
    await prisma.user.update({
        where: { id: file.userId },
        data: {
            storageUsed: {
                decrement: file.fileSize
            }
        }
    });
    
    return true;
};

const incrementDownloadCount = async (fileId) => {
    await prisma.file.update({
        where: { id: fileId },
        data: {
            downloadCount: {
                increment: 1
            }
        }
    });
};

const findFileByHash = async (fileHash) => {
    const file = await prisma.file.findFirst({
        where: { fileHash, isDeleted: 0 }
    });
    
    return file;
};

module.exports = {
    uploadFile,
    getFileById,
    getFileList,
    updateFileVisibility,
    deleteFile,
    incrementDownloadCount,
    checkStorageQuota,
    validateFileType,
    findFileByHash
};
