// routes/dataRoutes.js
const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/authMiddleware');
const upload  = require('../middleware/upload');
const ctrl    = require('../controllers/featureController');

// POST /api/data/analyze
router.post(
  '/analyze',
  auth,
  upload.array('images'),
  ctrl.analyzeImages
);

module.exports = router;
