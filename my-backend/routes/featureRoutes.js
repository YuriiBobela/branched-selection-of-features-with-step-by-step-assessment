// routes/featureRoutes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');  // Multer configured for memory storage
const featureController = require('../controllers/featureController');

// Analyze images in-memory without saving to disk (mutual information analysis)
 // POST /api/features/analyze
router.post(
  '/analyze',
  authMiddleware,
  upload.array('images'),           // expects multiple images uploaded (memoryStorage)
  featureController.analyzeImages   // calls main_b64.py script internally
);

// Perform branched feature selection (stepwise feature selection with accuracy evaluation)
 // POST /api/features/select
router.post(
  '/select',
  authMiddleware,
  upload.array('images'),           // upload images in-memory
  featureController.selectFeatures  // calls branch_selection.py script
);

// Train a global model using selected features
 // POST /api/features/train
router.post(
  '/train',
  authMiddleware,
  upload.array('images'),          // upload training images in-memory
  featureController.trainModel     // calls model_train.py (train mode)
);

// Classify a new image using the trained global model
 // POST /api/features/classify
router.post(
  '/classify',
  authMiddleware,
  upload.single('image'),          // upload a single image in-memory
  featureController.classifyImage  // calls model_train.py (predict mode)
);

module.exports = router;
