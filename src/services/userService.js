const prisma = require('../config/database');
const { hashPassword, comparePassword } = require('../utils/crypto');
const { generateToken, generateRefreshToken } = require('../middlewares/auth');
const { ValidationError, UnauthorizedError, ForbiddenError, NotFoundError, ERROR_CODES } = require('../middlewares/errorHandler');

const login = async (username, password) => {
    const user = await prisma.user.findUnique({
        where: { username }
    });
    
    if (!user) {
        throw new UnauthorizedError(ERROR_CODES.INVALID_CREDENTIALS.message);
    }
    
    if (user.status !== 1) {
        throw new ForbiddenError('账号已被禁用');
    }
    
    const isValid = await comparePassword(password, user.passwordHash);
    
    if (!isValid) {
        throw new UnauthorizedError(ERROR_CODES.INVALID_CREDENTIALS.message);
    }
    
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);
    
    return {
        token,
        refreshToken,
        expiresIn: 7200,
        user: {
            user_id: user.id,
            username: user.username,
            role: user.role,
            email: user.email
        }
    };
};

const getUserById = async (userId) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            username: true,
            email: true,
            role: true,
            storageQuota: true,
            storageUsed: true,
            status: true,
            createdAt: true
        }
    });
    
    if (!user) {
        throw new NotFoundError(ERROR_CODES.USER_NOT_FOUND.message);
    }
    
    return {
        user_id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        storage_quota: Number(user.storageQuota),
        storage_used: Number(user.storageUsed),
        used_percent: Number((BigInt(user.storageUsed) * BigInt(100) / user.storageQuota)),
        status: user.status,
        created_at: user.createdAt
    };
};

const createUser = async (userData, adminId) => {
    const { username, password, email, storage_quota } = userData;
    
    const existingUser = await prisma.user.findUnique({
        where: { username }
    });
    
    if (existingUser) {
        throw new ValidationError(ERROR_CODES.USERNAME_EXISTS.message);
    }
    
    if (email) {
        const existingEmail = await prisma.user.findUnique({
            where: { email }
        });
        
        if (existingEmail) {
            throw new ValidationError('邮箱已被使用');
        }
    }
    
    const passwordHash = await hashPassword(password);
    
    const user = await prisma.user.create({
        data: {
            username,
            passwordHash,
            email: email || null,
            role: 0,
            storageQuota: BigInt(storage_quota || 10737418240),
            storageUsed: BigInt(0),
            status: 1
        }
    });
    
    return {
        user_id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        storage_quota: Number(user.storageQuota),
        storage_used: 0
    };
};

const updateUser = async (userId, updateData) => {
    const user = await prisma.user.findUnique({
        where: { id: userId }
    });
    
    if (!user) {
        throw new NotFoundError(ERROR_CODES.USER_NOT_FOUND.message);
    }
    
    const data = {};
    
    if (updateData.password) {
        data.passwordHash = await hashPassword(updateData.password);
    }
    
    if (updateData.email !== undefined) {
        if (updateData.email && updateData.email !== user.email) {
            const existingEmail = await prisma.user.findUnique({
                where: { email: updateData.email }
            });
            
            if (existingEmail) {
                throw new ValidationError('邮箱已被使用');
            }
        }
        data.email = updateData.email || null;
    }
    
    if (updateData.storage_quota !== undefined) {
        data.storageQuota = BigInt(updateData.storage_quota);
    }
    
    if (updateData.status !== undefined) {
        data.status = updateData.status;
    }
    
    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data
    });
    
    return {
        user_id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        storage_quota: Number(updatedUser.storageQuota),
        status: updatedUser.status
    };
};

const deleteUser = async (userId) => {
    const user = await prisma.user.findUnique({
        where: { id: userId }
    });
    
    if (!user) {
        throw new NotFoundError(ERROR_CODES.USER_NOT_FOUND.message);
    }
    
    if (user.role === 1) {
        throw new ForbiddenError(ERROR_CODES.CANNOT_DELETE_ADMIN.message);
    }
    
    await prisma.user.delete({
        where: { id: userId }
    });
    
    return true;
};

const getUserList = async (page = 1, limit = 20, role = null, keyword = null) => {
    const skip = (page - 1) * limit;
    
    const where = {};
    if (role !== null && role !== '' && role !== undefined) {
        const roleInt = parseInt(role);
        if (!isNaN(roleInt)) {
            where.role = roleInt;
        }
    }
    if (keyword) {
        where.OR = [
            { username: { contains: keyword } },
            { email: { contains: keyword } }
        ];
    }
    
    const [users, total] = await Promise.all([
        prisma.user.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
                storageQuota: true,
                storageUsed: true,
                status: true,
                createdAt: true
            }
        }),
        prisma.user.count({ where })
    ]);
    
    return {
        users: users.map(user => ({
            user_id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            storage_quota: Number(user.storageQuota),
            storage_used: Number(user.storageUsed),
            status: user.status,
            created_at: user.createdAt
        })),
        pagination: {
            page,
            limit,
            total,
            total_pages: Math.ceil(total / limit)
        }
    };
};

const changePassword = async (userId, oldPassword, newPassword) => {
    const user = await prisma.user.findUnique({
        where: { id: userId }
    });
    
    if (!user) {
        throw new NotFoundError(ERROR_CODES.USER_NOT_FOUND.message);
    }
    
    const isValid = await comparePassword(oldPassword, user.passwordHash);
    
    if (!isValid) {
        throw new ValidationError('原密码错误');
    }
    
    const passwordHash = await hashPassword(newPassword);
    
    await prisma.user.update({
        where: { id: userId },
        data: { passwordHash }
    });
    
    return true;
};

module.exports = {
    login,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    getUserList,
    changePassword
};
