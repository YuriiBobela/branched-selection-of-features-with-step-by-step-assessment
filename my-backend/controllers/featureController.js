// controllers/featureController.js
const { spawn } = require('child_process');
const path = require('path');
const AnalysisResult = require('../models/AnalysisResult');

/**
 * Analyze images to compute feature importance using mutual information (Classic & Deep features).
 * Expects `req.files` (images) and `req.body.labels` (JSON string).
 * Returns JSON: { features_classical, mi_classical, features_deep, mi_deep }.
 */
exports.analyzeImages = (req, res) => {
  console.log('⚡ analyzeImages called, files:', req.files?.length);
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'Не надано зображень для аналізу' });
  }
  if (!req.body.labels) {
    return res.status(400).json({ error: 'Не вказано мітки (labels)' });
  }

  let imagesB64, labels;
  try {
    imagesB64 = req.files.map(f => f.buffer.toString('base64'));
    labels = JSON.parse(req.body.labels);
  } catch (e) {
    console.error('❌ Invalid input:', e);
    return res.status(400).json({ error: 'Неправильний формат даних' });
  }

  const payload = JSON.stringify({ images: imagesB64, labels });
  const scriptPath = path.join(__dirname, '../scripts/main_b64.py');
  const py = spawn('python', [scriptPath], { stdio: ['pipe', 'pipe', 'pipe'] });

  py.on('error', err => {
    console.error('❌ Cannot start Python:', err);
    return res.status(500).json({ error: 'Не вдалося запустити Python' });
  });
  py.stdin.on('error', err => {
    console.warn('⚠️ STDIN error:', err);
  });

  let outData = '', errData = '';
  py.stdout.on('data', chunk => { outData += chunk.toString(); });
  py.stderr.on('data', chunk => { errData += chunk.toString(); });

  py.on('close', code => {
    console.log(`🐍 Python process exited with code ${code}`);
    console.log('📤 Python output:', outData);
    if (code !== 0) {
      console.error('Python stderr:', errData);
      return res.status(500).json({ error: errData.trim() || 'Python script error' });
    }
    try {
      const result = JSON.parse(outData);
      return res.json(result);
    } catch (e) {
      console.error('❌ Invalid JSON from Python:', outData);
      return res.status(500).json({ error: 'Неочікуваний формат відповіді' });
    }
  });

  try {
    py.stdin.write(payload);
    py.stdin.end();
  } catch (e) {
    console.warn('⚠️ Failed to write to Python stdin:', e);
  }
};

/**
 * Step-by-step feature selection using branch_selection.py.
 * Saves results to MongoDB and returns { selected_features, accuracies, final_accuracy }.
 */
exports.selectFeatures = (req, res) => {
  console.log('⚡ selectFeatures called, files:', req.files?.length);
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No images uploaded for feature selection' });
  }
  if (!req.body.labels) {
    return res.status(400).json({ error: 'Не вказано мітки (labels)' });
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
  const scriptPath = path.join(__dirname, '../scripts/branch_selection.py');
  const py = spawn('python', [scriptPath], { stdio: ['pipe', 'pipe', 'pipe'] });

  py.on('error', err => {
    console.error('❌ Cannot start Python (branch_selection):', err);
    return res.status(500).json({ error: 'Не вдалося запустити Python скрипт' });
  });
  py.stdin.on('error', err => {
    console.warn('⚠️ STDIN error (branch_selection):', err);
  });

  let outData = '', errData = '';
  py.stdout.on('data', chunk => { outData += chunk.toString(); });
  py.stderr.on('data', chunk => { errData += chunk.toString(); });

  py.on('close', code => {
    console.log(`🐍 branch_selection.py exited with code ${code}`);
    console.log('📤 branch_selection output:', outData);
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
    AnalysisResult.create({
      user: req.user._id,
      selectedFeatures: result.selected_features,
      accuracies: result.accuracies,
      finalAccuracy: result.final_accuracy
    })
    .then(doc => {
      console.log('✅ Feature selection result saved:', doc._id);
      return res.json(result);
    })
    .catch(err => {
      console.error('❌ Failed to save feature selection result:', err);
      return res.status(500).json({ error: 'Не вдалося зберегти результат аналізу' });
    });
  });

  try {
    py.stdin.write(payload);
    py.stdin.end();
  } catch (e) {
    console.warn('⚠️ Failed to write to Python stdin (branch_selection):', e);
  }
};

/**
 * Train a global classification model using train_model.py.
 * Saves final accuracy to MongoDB and returns training results to client.
 */
exports.trainModel = async (req, res) => {
  console.log('⚡ trainModel called, files:', req.files?.length);
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No images uploaded for training' });
  }
  if (!req.body.labels) {
    return res.status(400).json({ error: 'Не вказано мітки (labels)' });
  }

  let imagesB64, labels, selectedFeatures;
  try {
    imagesB64 = req.files.map(f => f.buffer.toString('base64'));
    labels = JSON.parse(req.body.labels);
  } catch (e) {
    console.error('❌ Invalid input (trainModel):', e);
    return res.status(400).json({ error: 'Неправильний формат даних' });
  }
  if (req.body.selected) {
    try {
      selectedFeatures = JSON.parse(req.body.selected);
    } catch (e) {
      console.warn('⚠️ Invalid selected features JSON:', e);
    }
  }
  if (!selectedFeatures) {
    try {
      const last = await AnalysisResult.findOne({ user: req.user._id }).sort({ createdAt: -1 });
      if (!last || !last.selectedFeatures?.length) {
        return res.status(400).json({ error: 'Спочатку виконайте вибір ознак' });
      }
      selectedFeatures = last.selectedFeatures;
    } catch (dbErr) {
      console.error('❌ DB lookup error (trainModel):', dbErr);
      return res.status(500).json({ error: 'Не вдалося отримати вибрані ознаки' });
    }
  }

  const payload = JSON.stringify({ images: imagesB64, labels, selected: selectedFeatures });
  const scriptPath = path.join(__dirname, '../scripts/train_model.py');
  const py = spawn('python', [scriptPath, 'train'], { stdio: ['pipe', 'pipe', 'pipe'] });

  py.on('error', err => {
    console.error('❌ Cannot start Python (train):', err);
    return res.status(500).json({ error: 'Не вдалося запустити Python скрипт' });
  });
  py.stdin.on('error', err => {
    console.warn('⚠️ STDIN error (train):', err);
  });

  let outData = '', errData = '';
  py.stdout.on('data', chunk => { outData += chunk.toString(); });
  py.stderr.on('data', chunk => { errData += chunk.toString(); });

  py.on('close', code => {
    console.log(`🐍 train_model.py (train) exited with code ${code}`);
    console.log('📤 train output:', outData);
    if (code !== 0) {
      console.error('Python stderr (train):', errData);
      return res.status(500).json({ error: errData.trim() || 'Python training error' });
    }
    let result;
    try {
      result = JSON.parse(outData);
    } catch (e) {
      console.error('❌ Invalid JSON from train_model (train):', outData);
      return res.status(500).json({ error: 'Неочікуваний формат відповіді' });
    }
    const finalAcc = result.cnn_accuracy;
    AnalysisResult.findOneAndUpdate(
      { user: req.user._id },
      { finalAccuracy: finalAcc },
      { sort: { createdAt: -1 } }
    )
      .then(doc => {
        console.log('✅ Model training result updated:', doc?._id, finalAcc);
        return res.json(result);
      })
      .catch(err => {
        console.error('⚠️ Failed to update final accuracy:', err);
        return res.json(result);
      });
  });

  try {
    py.stdin.write(payload);
    py.stdin.end();
  } catch (e) {
    console.warn('⚠️ Failed to write to Python stdin (train):', e);
  }
};

/**
 * Classify a new image using the trained model.
 * Expects `req.file` and returns { predicted_label }.
 */
exports.classifyImage = (req, res) => {
  console.log('⚡ classifyImage called');
  if (!req.file) {
    return res.status(400).json({ error: 'No image provided for classification' });
  }

  const imageB64 = req.file.buffer.toString('base64');
  const payload = JSON.stringify({ image: imageB64 });
  const scriptPath = path.join(__dirname, '../scripts/train_model.py');
  const py = spawn('python', [scriptPath, 'predict'], { stdio: ['pipe', 'pipe', 'pipe'] });

  py.on('error', err => {
    console.error('❌ Cannot start Python (predict):', err);
    return res.status(500).json({ error: 'Не вдалося запустити Python скрипт' });
  });
  py.stdin.on('error', err => {
    console.warn('⚠️ STDIN error (predict):', err);
  });

  let outData = '', errData = '';
  py.stdout.on('data', chunk => { outData += chunk.toString(); });
  py.stderr.on('data', chunk => { errData += chunk.toString(); });

  py.on('close', code => {
    console.log(`🐍 train_model.py (predict) exited with code ${code}`);
    console.log('📤 predict output:', outData);
    if (code !== 0) {
      console.error('Python stderr (predict):', errData);
      return res.status(500).json({ error: errData.trim() || 'Python classification error' });
    }
    let result;
    try {
      result = JSON.parse(outData);
    } catch (e) {
      console.error('❌ Invalid JSON from train_model (predict):', outData);
      return res.status(500).json({ error: 'Неочікуваний формат відповіді' });
    }
    const predicted = result.predicted_label;
    AnalysisResult.create({ user: req.user._id, predictedLabel: predicted })
      .catch(err => console.error('⚠️ Failed to save classification result:', err));
    return res.json(result);
  });

  try {
    py.stdin.write(payload);
    py.stdin.end();
  } catch (e) {
    console.warn('⚠️ Failed to write to Python stdin (predict):', e);
  }
};
