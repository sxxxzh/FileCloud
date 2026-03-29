const Router = require('koa-router');
const shareController = require('../controllers/shareController');
const { authMiddleware, optionalAuth } = require('../middlewares/auth');
const { downloadRateLimit } = require('../middlewares/rateLimit');

const router = new Router({
    prefix: '/api/v1/shares'
});

router.post(
    '/',
    authMiddleware,
    shareController.createShare
);

router.get(
    '/:share_code',
    shareController.getShare
);

router.post(
    '/:share_code/verify',
    shareController.verifySharePassword
);

router.get(
    '/:share_code/download',
    optionalAuth,
    downloadRateLimit,
    shareController.downloadShare
);

router.get(
    '/',
    authMiddleware,
    shareController.getShareList
);

router.delete(
    '/:share_id',
    authMiddleware,
    shareController.deleteShare
);

module.exports = router;
