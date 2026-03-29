const fs = require('fs');
const shareService = require('../services/shareService');
const { successResponse } = require('../middlewares/signature');
const { ValidationError, ERROR_CODES } = require('../middlewares/errorHandler');

const createShare = async (ctx) => {
    const userId = ctx.state.user.user_id;
    const { file_id, expire_hours, max_downloads, password } = ctx.request.body;
    
    if (!file_id) {
        throw new ValidationError('文件ID不能为空');
    }
    
    const result = await shareService.createShare(userId, {
        file_id,
        expire_hours,
        max_downloads,
        password
    });
    
    successResponse(ctx, result, '分享创建成功');
};

const getShare = async (ctx) => {
    const { share_code } = ctx.params;
    const { password } = ctx.query;
    
    const result = await shareService.getShareByCode(share_code, password);
    
    if (result.requires_password) {
        successResponse(ctx, result, '需要访问密码');
    } else {
        delete result.file_path;
        delete result.file_id;
        successResponse(ctx, result);
    }
};

const verifySharePassword = async (ctx) => {
    const { share_code } = ctx.params;
    const { password } = ctx.request.body;
    
    if (!password) {
        throw new ValidationError('密码不能为空');
    }
    
    const result = await shareService.getShareByCode(share_code, password);
    
    successResponse(ctx, {
        valid: true,
        token: null
    }, '密码验证成功');
};

const downloadShare = async (ctx) => {
    const { share_code } = ctx.params;
    const { password } = ctx.query;
    const userId = ctx.state.user?.user_id;
    
    const fileInfo = await shareService.downloadShareFile(share_code, password, userId);
    
    const stat = fs.statSync(fileInfo.file_path);
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
            'Content-Type': fileInfo.mime_type || 'application/octet-stream',
            'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(fileInfo.filename)}`
        });
        
        ctx.body = fs.createReadStream(fileInfo.file_path, { start, end });
    } else {
        ctx.set({
            'Content-Length': fileSize,
            'Content-Type': fileInfo.mime_type || 'application/octet-stream',
            'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(fileInfo.filename)}`,
            'Accept-Ranges': 'bytes'
        });
        
        ctx.body = fs.createReadStream(fileInfo.file_path);
    }
};

const getShareList = async (ctx) => {
    const userId = ctx.state.user.user_id;
    const isAdmin = ctx.state.user.role === 1;
    const { page = 1, limit = 20, status } = ctx.query;
    
    const result = await shareService.getShareList(userId, parseInt(page), parseInt(limit), status, isAdmin);
    
    successResponse(ctx, result);
};

const deleteShare = async (ctx) => {
    const userId = ctx.state.user.user_id;
    const isAdmin = ctx.state.user.role === 1;
    const { share_id } = ctx.params;
    
    await shareService.deleteShare(userId, share_id, isAdmin);
    
    successResponse(ctx, null, '分享已取消');
};

module.exports = {
    createShare,
    getShare,
    verifySharePassword,
    downloadShare,
    getShareList,
    deleteShare
};
