const fs = require('fs');
const path = require('path');
const fileService = require('../services/fileService');
const { successResponse } = require('../middlewares/signature');
const { ValidationError, NotFoundError, ForbiddenError, ERROR_CODES } = require('../middlewares/errorHandler');
const config = require('../config');

const upload = async (ctx) => {
    const userId = ctx.state.user.user_id;
    const file = ctx.file;
    const visibility = parseInt(ctx.request.body.visibility) || 0;
    
    if (!file) {
        throw new ValidationError('请选择要上传的文件');
    }
    
    const result = await fileService.uploadFile(userId, file, visibility);
    
    successResponse(ctx, result, '上传成功');
};

const download = async (ctx) => {
    const { file_id } = ctx.params;
    const userId = ctx.state.user?.user_id;
    
    const file = await fileService.getFileById(file_id, userId);
    
    if (!fs.existsSync(file.file_path)) {
        throw new NotFoundError('文件不存在');
    }
    
    const stat = fs.statSync(file.file_path);
    const fileSize = stat.size;
    const range = ctx.headers.range;
    
    if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunkSize = end - start + 1;
        
        ctx.status = 206;
        ctx.set({
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunkSize,
            'Content-Type': file.mime_type || 'application/octet-stream',
            'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(file.original_name)}`
        });
        
        ctx.body = fs.createReadStream(file.file_path, { start, end });
    } else {
        ctx.set({
            'Content-Length': fileSize,
            'Content-Type': file.mime_type || 'application/octet-stream',
            'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(file.original_name)}`,
            'Accept-Ranges': 'bytes'
        });
        
        ctx.body = fs.createReadStream(file.file_path);
    }
    
    await fileService.incrementDownloadCount(file_id);
};

const getFile = async (ctx) => {
    const { file_id } = ctx.params;
    const userId = ctx.state.user.user_id;
    
    const file = await fileService.getFileById(file_id, userId);
    
    delete file.file_path;
    
    successResponse(ctx, file);
};

const getFileList = async (ctx) => {
    const userId = ctx.state.user.user_id;
    const isAdmin = ctx.state.user.role === 1;
    const { page = 1, limit = 20, visibility, keyword, user_id, file_type, sort_by } = ctx.query;
    
    const result = await fileService.getFileList(userId, parseInt(page), parseInt(limit), {
        visibility,
        keyword,
        user_id,
        file_type,
        sort_by
    }, isAdmin);
    
    successResponse(ctx, result);
};

const updateVisibility = async (ctx) => {
    const { file_id } = ctx.params;
    const userId = ctx.state.user.user_id;
    const isAdmin = ctx.state.user.role === 1;
    const { visibility } = ctx.request.body;
    
    if (visibility !== 0 && visibility !== 1) {
        throw new ValidationError('可见性值无效');
    }
    
    const result = await fileService.updateFileVisibility(file_id, userId, visibility, isAdmin);
    
    successResponse(ctx, result, '可见性已更新');
};

const deleteFile = async (ctx) => {
    const { file_id } = ctx.params;
    const userId = ctx.state.user.user_id;
    const isAdmin = ctx.state.user.role === 1;
    
    await fileService.deleteFile(file_id, userId, isAdmin);
    
    successResponse(ctx, null, '文件已删除');
};

const instantCheck = async (ctx) => {
    const { filename, file_size, file_hash } = ctx.request.body;
    
    if (!file_hash) {
        throw new ValidationError('文件哈希不能为空');
    }
    
    const existingFile = await fileService.findFileByHash(file_hash);
    
    if (existingFile) {
        successResponse(ctx, {
            exists: true,
            file_id: existingFile.id,
            filename: existingFile.originalName
        }, '文件已存在，可秒传');
    } else {
        successResponse(ctx, {
            exists: false
        }, '文件不存在，需上传');
    }
};

module.exports = {
    upload,
    download,
    getFile,
    getFileList,
    updateVisibility,
    deleteFile,
    instantCheck
};
