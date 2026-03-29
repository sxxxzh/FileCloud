const statsService = require('../services/statsService');
const { successResponse } = require('../middlewares/signature');

const getStorageStats = async (ctx) => {
    const userId = ctx.state.user.user_id;
    
    const stats = await statsService.getStorageStats(userId);
    
    successResponse(ctx, stats);
};

const getSystemStats = async (ctx) => {
    const stats = await statsService.getSystemStats();
    
    successResponse(ctx, stats);
};

module.exports = {
    getStorageStats,
    getSystemStats
};
