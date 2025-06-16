// routes/dataRoutes.js
const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/authMiddleware');
const upload  = require('../middleware/upload');
const ctrl    = require('../controllers/featureController');

router.post(
  '/branched-select',
  auth,
  upload.array('images'),
  ctrl.branchedFeatureSelection
);
module.exports = router;
