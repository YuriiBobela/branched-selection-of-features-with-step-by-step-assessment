// controllers/featureController.js
const { spawn } = require('child_process');
const path = require('path');
const AnalysisResult = require('../models/AnalysisResult');

/**
 * Analyze images to compute feature importance using mutual information (existing functionality).
 * Expects `req.files` (images in memory) and `req.body.labels` (JSON array of labels).
 * Returns JSON with features and their MI scores.
 */
exports.analyzeImages = (req, res) => {
  console.log('⚡ analyzeImages called, files:', req.files.length);
  let imagesB64, labels;
  try {
    // Convert image buffers to base64 strings
    imagesB64 = req.files.map(f => f.buffer.toString('base64'));
    // Parse labels from request (expected as JSON string in form-data)
    labels = JSON.parse(req.body.labels);
  } catch (e) {
    console.error('❌ Invalid input:', e);
    return res.status(400).json({ error: 'Неправильний формат даних' }); // "Incorrect data format"
  }

  const payload = JSON.stringify({ images: imagesB64, labels });
  const scriptPath = path.join(__dirname, './scripts/main_b64.py');
  const py = spawn('python', [scriptPath], { stdio: ['pipe', 'pipe', 'pipe'] });

  // 1) Handle Python spawn error
  py.on('error', err => {
    console.error('❌ Cannot start Python:', err);
    return res.status(500).json({ error: 'Не вдалося запустити Python' }); // "Failed to start Python"
  });
  // 2) Handle stdin error (e.g., broken pipe)
  py.stdin.on('error', err => {
    console.warn('⚠️  STDIN error:', err);
    // (No response sent here, just log the warning)
  });
  // 3) Collect data from stdout/stderr
  let outData = '', errData = '';
  py.stdout.on('data', chunk => { outData += chunk.toString(); });
  py.stderr.on('data', chunk => { errData += chunk.toString(); });
  // 4) On process close, handle result
  py.on('close', code => {
    console.log(`🐍 Python process exited with code ${code}`);
    if (code !== 0) {
      console.error('Python stderr:', errData);
      return res.status(500).json({ error: errData.trim() || 'Python script error' });
    }
    try {
      const result = JSON.parse(outData);
      // Return mutual information analysis result to client
      return res.json(result);
    } catch (e) {
      console.error('❌ Invalid JSON from Python:', outData);
      return res.status(500).json({ error: 'Неочікуваний формат відповіді' }); // "Unexpected response format"
    }
  });
  // 5) Send data to Python process
  try {
    py.stdin.write(payload);
    py.stdin.end();
  } catch (e) {
    console.warn('⚠️  Failed to write to Python stdin:', e);
    // No response sent here since on('close') will handle if process exits
  }
};

/**
 * Perform step-by-step feature selection using the branch_selection.py script.
 * Expects `req.files` (images in memory) and `req.body.labels` (JSON array of labels).
 * Returns JSON with selected features and accuracy at each step.
 * Also saves the selection results to MongoDB (selected features, accuracies, final accuracy).
 */
exports.selectFeatures = (req, res) => {
  console.log('⚡ selectFeatures called, files:', req.files.length);
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No images uploaded for feature selection' });
  }

  let imagesB64, labels;
  try {
    imagesB64 = req.files.map(f => f.buffer.toString('base64'));
    labels = JSON.parse(req.body.labels);
  } catch (e) {
    console.error('❌ Invalid input (selectFeatures):', e);
    return res.status(400).json({ error: 'Неправильний формат даних' });
  }

  const payload = JSON.stringify({ images: imagesB64, labels });
  const scriptPath = path.join(__dirname, './scripts/branch_selection.py');
  const py = spawn('python', [scriptPath], { stdio: ['pipe', 'pipe', 'pipe'] });

  py.on('error', err => {
    console.error('❌ Cannot start Python (branch_selection):', err);
    return res.status(500).json({ error: 'Не вдалося запустити Python скрипт' });
  });
  py.stdin.on('error', err => {
    console.warn('⚠️  STDIN error (branch_selection):', err);
  });

  let outData = '', errData = '';
  py.stdout.on('data', chunk => { outData += chunk.toString(); });
  py.stderr.on('data', chunk => { errData += chunk.toString(); });

  py.on('close', code => {
    console.log(`🐍 branch_selection.py exited with code ${code}`);
    if (code !== 0) {
      console.error('Python stderr (branch_selection):', errData);
      return res.status(500).json({ error: errData.trim() || 'Python script error' });
    }
    let result;
    try {
      result = JSON.parse(outData);
    } catch (e) {
      console.error('❌ Invalid JSON from branch_selection.py:', outData);
      return res.status(500).json({ error: 'Неочікуваний формат відповіді' });
    }
    // Save feature selection results in MongoDB
    AnalysisResult.create({
      user: req.user._id,
      selectedFeatures: result.selected_features,   // array of feature names selected
      accuracies: result.accuracies,               // array of accuracies at each step
      finalAccuracy: result.final_accuracy         // final accuracy after selecting all features
    })
      .then(doc => {
        console.log('✅ Feature selection result saved:', doc._id);
        return res.json(result);  // return the result JSON (features and accuracies) to client
      })
      .catch(err => {
        console.error('❌ Failed to save feature selection result:', err);
        return res.status(500).json({ error: 'Не вдалося зберегти результат аналізу' }); // "Failed to save analysis result"
      });
  });

  try {
    py.stdin.write(payload);
    py.stdin.end();
  } catch (e) {
    console.warn('⚠️  Failed to write to Python stdin (branch_selection):', e);
  }
};

/**
 * Train a global classification model using selected features via model_train.py script.
 * Expects `req.files` (training images) and `req.body.labels` (JSON array of labels).
 * Optionally can accept `req.body.selected` (JSON array of feature names to use); 
 * if not provided, the last saved selection for the user is used.
 * Saves the model's final accuracy in MongoDB and returns it in the response.
 */
exports.trainModel = async (req, res) => {
  console.log('⚡ trainModel called, files:', req.files.length);
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No images uploaded for training' });
  }

  let imagesB64, labels;
  try {
    imagesB64 = req.files.map(f => f.buffer.toString('base64'));
    labels = JSON.parse(req.body.labels);
  } catch (e) {
    console.error('❌ Invalid input (trainModel):', e);
    return res.status(400).json({ error: 'Неправильний формат даних' });
  }

  // Determine which features to use for training
  let selectedFeatures = null;
  if (req.body.selected) {
    try {
      selectedFeatures = JSON.parse(req.body.selected);  // expecting an array of feature names if provided
    } catch (e) {
      console.warn('⚠️  Invalid selected features JSON:', e);
      selectedFeatures = null;
    }
  }
  if (!selectedFeatures) {
    // If no features specified in request, use the most recent selection result from DB
    try {
      const lastAnalysis = await AnalysisResult.findOne({ user: req.user._id })
        .sort({ createdAt: -1 })
        .exec();
      if (!lastAnalysis || !lastAnalysis.selectedFeatures || lastAnalysis.selectedFeatures.length === 0) {
        return res.status(400).json({ error: 'Спочатку виконайте вибір ознак' }); // "Perform feature selection first"
      }
      selectedFeatures = lastAnalysis.selectedFeatures;
    } catch (dbErr) {
      console.error('❌ DB lookup error (trainModel):', dbErr);
      return res.status(500).json({ error: 'Не вдалося отримати вибрані ознаки' }); // "Failed to retrieve selected features"
    }
  }

  const payload = JSON.stringify({ images: imagesB64, labels, selected: selectedFeatures });
  const scriptPath = path.join(__dirname, './scripts/model_train.py');
  const py = spawn('python', [scriptPath, 'train'], { stdio: ['pipe', 'pipe', 'pipe'] });

  py.on('error', err => {
    console.error('❌ Cannot start Python (model_train train):', err);
    return res.status(500).json({ error: 'Не вдалося запустити Python скрипт' });
  });
  py.stdin.on('error', err => {
    console.warn('⚠️  STDIN error (model_train train):', err);
  });

  let outData = '', errData = '';
  py.stdout.on('data', chunk => { outData += chunk.toString(); });
  py.stderr.on('data', chunk => { errData += chunk.toString(); });

  py.on('close', code => {
    console.log(`🐍 model_train.py (train) exited with code ${code}`);
    if (code !== 0) {
      console.error('Python stderr (model_train train):', errData);
      return res.status(500).json({ error: errData.trim() || 'Python training error' });
    }
    let result;
    try {
      result = JSON.parse(outData);  // expect { accuracy: number }
    } catch (e) {
      console.error('❌ Invalid JSON from model_train (train):', outData);
      return res.status(500).json({ error: 'Неочікуваний формат відповіді' });
    }
    const finalAcc = result.accuracy;
    // Update the latest AnalysisResult with the final accuracy of the trained model
    AnalysisResult.findOneAndUpdate(
      { user: req.user._id },
      { finalAccuracy: finalAcc },
      { sort: { createdAt: -1 } }
    )
      .then(doc => {
        if (doc) {
          console.log('✅ Model training result updated (id=%s, accuracy=%s)', doc._id, finalAcc);
        }
        return res.json(result);  // return { accuracy: ... } to client
      })
      .catch(err => {
        console.error('⚠️  Failed to update final accuracy in DB:', err);
        // Even if DB update fails, return the result to the client
        return res.json(result);
      });
  });

  try {
    py.stdin.write(payload);
    py.stdin.end();
  } catch (e) {
    console.warn('⚠️  Failed to write to Python stdin (model_train train):', e);
  }
};

/**
 * Classify a new image using the trained global model via model_train.py script (predict mode).
 * Expects `req.file` (single image in memory). Returns JSON with the predicted label.
 * Also logs the classification result to MongoDB.
 */
exports.classifyImage = (req, res) => {
  console.log('⚡ classifyImage called');
  if (!req.file) {
    return res.status(400).json({ error: 'No image provided for classification' });
  }

  // Convert the single image buffer to base64
  const imageB64 = req.file.buffer.toString('base64');
  const payload = JSON.stringify({ image: imageB64 });
  const scriptPath = path.join(__dirname, './scripts/model_train.py');
  const py = spawn('python', [scriptPath, 'predict'], { stdio: ['pipe', 'pipe', 'pipe'] });

  py.on('error', err => {
    console.error('❌ Cannot start Python (model_train predict):', err);
    return res.status(500).json({ error: 'Не вдалося запустити Python скрипт' });
  });
  py.stdin.on('error', err => {
    console.warn('⚠️  STDIN error (model_train predict):', err);
  });

  let outData = '', errData = '';
  py.stdout.on('data', chunk => { outData += chunk.toString(); });
  py.stderr.on('data', chunk => { errData += chunk.toString(); });

  py.on('close', code => {
    console.log(`🐍 model_train.py (predict) exited with code ${code}`);
    if (code !== 0) {
      console.error('Python stderr (model_train predict):', errData);
      return res.status(500).json({ error: errData.trim() || 'Python classification error' });
    }
    let result;
    try {
      result = JSON.parse(outData);  // expect { predicted_label: someValue }
    } catch (e) {
      console.error('❌ Invalid JSON from model_train (predict):', outData);
      return res.status(500).json({ error: 'Неочікуваний формат відповіді' });
    }
    const predicted = result.predicted_label;
    // Save classification result in MongoDB (for record-keeping)
    AnalysisResult.create({
      user: req.user._id,
      predictedLabel: predicted
    }).catch(err => {
      console.error('⚠️  Failed to save classification result:', err);
      // (Non-critical: we continue even if save fails)
    });
    // Return the prediction result to client
    return res.json(result);
  });

  try {
    py.stdin.write(payload);
    py.stdin.end();
  } catch (e) {
    console.warn('⚠️  Failed to write to Python stdin (model_train predict):', e);
  }
};
