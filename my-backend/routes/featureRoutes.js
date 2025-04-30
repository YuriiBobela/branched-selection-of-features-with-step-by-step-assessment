// routes/featureRoutes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');
const featureController = require('../controllers/featureController');

// Аналіз зображень у пам'яті, без зберігання на диск
// POST /api/features/analyze
router.post(
  '/analyze',
  authMiddleware,
  upload.array('images'),                // multer.memoryStorage()
  featureController.analyzeImages       // тут точно має бути імя export в controllers/featureController.js
);

module.exports = router;
