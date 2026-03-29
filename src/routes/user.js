const Router = require('koa-router');
const userController = require('../controllers/userController');
const statsController = require('../controllers/statsController');
const { authMiddleware, adminMiddleware } = require('../middlewares/auth');
const { authRateLimit } = require('../middlewares/rateLimit');

const router = new Router({
    prefix: '/api/v1'
});

router.post('/auth/login', authRateLimit, userController.login);

router.get('/users/me', authMiddleware, userController.getCurrentUser);

router.post('/users', authMiddleware, adminMiddleware, userController.createUser);

router.get('/users', authMiddleware, adminMiddleware, userController.getUserList);

router.patch('/users/:user_id', authMiddleware, adminMiddleware, userController.updateUser);

router.delete('/users/:user_id', authMiddleware, adminMiddleware, userController.deleteUser);

router.post('/users/me/password', authMiddleware, userController.changePassword);

router.get('/stats/storage', authMiddleware, statsController.getStorageStats);

router.get('/stats/system', authMiddleware, adminMiddleware, statsController.getSystemStats);

module.exports = router;
