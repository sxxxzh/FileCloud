const userService = require('../services/userService');
const { successResponse } = require('../middlewares/signature');
const { ValidationError, ERROR_CODES } = require('../middlewares/errorHandler');

const login = async (ctx) => {
    const { username, password } = ctx.request.body;
    
    if (!username || !password) {
        throw new ValidationError('用户名和密码不能为空');
    }
    
    const result = await userService.login(username, password);
    
    successResponse(ctx, result, '登录成功');
};

const getCurrentUser = async (ctx) => {
    const userId = ctx.state.user.user_id;
    
    const user = await userService.getUserById(userId);
    
    successResponse(ctx, user);
};

const createUser = async (ctx) => {
    const { username, password, email, storage_quota } = ctx.request.body;
    
    if (!username || !password) {
        throw new ValidationError('用户名和密码不能为空');
    }
    
    if (password.length < 6) {
        throw new ValidationError('密码长度至少6位');
    }
    
    const user = await userService.createUser({
        username,
        password,
        email,
        storage_quota
    }, ctx.state.user.user_id);
    
    successResponse(ctx, user, '用户创建成功', 201);
};

const getUserList = async (ctx) => {
    const { page = 1, limit = 20, role, keyword } = ctx.query;
    
    const result = await userService.getUserList(
        parseInt(page),
        parseInt(limit),
        role,
        keyword
    );
    
    successResponse(ctx, result);
};

const updateUser = async (ctx) => {
    const { user_id } = ctx.params;
    const updateData = ctx.request.body;
    
    const user = await userService.updateUser(user_id, updateData);
    
    successResponse(ctx, user, '用户信息已更新');
};

const deleteUser = async (ctx) => {
    const { user_id } = ctx.params;
    
    await userService.deleteUser(user_id);
    
    successResponse(ctx, null, '用户已删除');
};

const changePassword = async (ctx) => {
    const userId = ctx.state.user.user_id;
    const { old_password, new_password } = ctx.request.body;
    
    if (!old_password || !new_password) {
        throw new ValidationError('原密码和新密码不能为空');
    }
    
    if (new_password.length < 6) {
        throw new ValidationError('新密码长度至少6位');
    }
    
    await userService.changePassword(userId, old_password, new_password);
    
    successResponse(ctx, null, '密码修改成功');
};

module.exports = {
    login,
    getCurrentUser,
    createUser,
    getUserList,
    updateUser,
    deleteUser,
    changePassword
};
