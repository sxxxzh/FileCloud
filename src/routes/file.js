const Router = require('koa-router');
const multer = require('@koa/multer');
const path = require('path');
const fs = require('fs');
const fileController = require('../controllers/fileController');
const { authMiddleware, optionalAuth } = require('../middlewares/auth');
const { uploadRateLimit, downloadRateLimit } = require('../middlewares/rateLimit');
const config = require('../config');

const router = new Router({
    prefix: '/api/v1/files'
});

const basePath = path.isAbsolute(config.storage.path) 
    ? config.storage.path 
    : path.resolve(process.cwd(), config.storage.path);
const tmpDir = path.join(basePath, 'tmp');
if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, tmpDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: config.storage.maxFileSize
    }
});

router.post(
    '/upload',
    authMiddleware,
    uploadRateLimit,
    upload.single('file'),
    fileController.upload
);

router.post(
    '/instant-check',
    authMiddleware,
    fileController.instantCheck
);

router.get(
    '/download/:file_id',
    optionalAuth,
    downloadRateLimit,
    fileController.download
);

router.get(
    '/:file_id',
    authMiddleware,
    fileController.getFile
);

router.get(
    '/',
    authMiddleware,
    fileController.getFileList
);

router.patch(
    '/:file_id/visibility',
    authMiddleware,
    fileController.updateVisibility
);

router.delete(
    '/:file_id',
    authMiddleware,
    fileController.deleteFile
);

module.exports = router;
