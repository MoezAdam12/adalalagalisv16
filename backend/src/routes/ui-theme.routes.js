const express = require('express');
const router = express.Router();
const uiThemeController = require('../controllers/ui-theme.controller');
const authMiddleware = require('../middleware/auth.middleware');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/themes/');
  },
  filename: function (req, file, cb) {
    const fileExt = path.extname(file.originalname);
    const fileName = `${uuidv4()}${fileExt}`;
    cb(null, fileName);
  }
});

const fileFilter = (req, file, cb) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 5 // 5MB max file size
  },
  fileFilter: fileFilter
});

// Apply authentication middleware to all routes
router.use(authMiddleware.verifyToken);

// UI Theme routes
router.get('/', authMiddleware.hasPermission('settings:read'), uiThemeController.getUIThemes);
router.get('/active', uiThemeController.getActiveUITheme);
router.get('/:id', authMiddleware.hasPermission('settings:read'), uiThemeController.getUIThemeById);
router.post('/', authMiddleware.hasPermission('settings:update'), uiThemeController.createUITheme);
router.put('/:id', authMiddleware.hasPermission('settings:update'), uiThemeController.updateUITheme);
router.delete('/:id', authMiddleware.hasPermission('settings:update'), uiThemeController.deleteUITheme);
router.put('/:id/activate', authMiddleware.hasPermission('settings:update'), uiThemeController.setActiveUITheme);
router.post('/:id/upload/:type', authMiddleware.hasPermission('settings:update'), upload.single('file'), uiThemeController.uploadLogo);
router.get('/:id/css', uiThemeController.generateCSS);
router.post('/default', authMiddleware.hasPermission('settings:update'), uiThemeController.createDefaultUITheme);

module.exports = router;
