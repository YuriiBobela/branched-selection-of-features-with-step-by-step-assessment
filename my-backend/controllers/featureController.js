// controllers/featureController.js
const { spawn } = require('child_process');
const path = require('path');
const AnalysisResult = require('../models/AnalysisResult');
const History = require('../models/History');

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

exports.branchedFeatureSelection = async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'Не надано зображень для аналізу' });
  }
  if (!req.body.labels) {
    return res.status(400).json({ error: 'Не вказано мітки (labels)' });
  }

  let imagesB64, labels, classNames;
  try {
    imagesB64 = req.files.map(f => f.buffer.toString('base64'));
    labels = JSON.parse(req.body.labels);

    classNames = req.body.classNames ? JSON.parse(req.body.classNames) : [];
  } catch (e) {
    return res.status(400).json({ error: 'Неправильний формат даних' });
  }

  const payload = JSON.stringify({ images: imagesB64, labels });
  const scriptPath = path.join(__dirname, '../scripts/main_branched_selection.py');

  const py = spawn('python', [scriptPath], { stdio: ['pipe', 'pipe', 'pipe'] });

  let outData = '', errData = '';
  py.stdout.on('data', chunk => { outData += chunk.toString(); });
  py.stderr.on('data', chunk => { errData += chunk.toString(); });

  py.on('close', async code => {
    if (code !== 0) {
      return res.status(500).json({ error: errData.trim() || 'Python script error' });
    }
    try {
      const result = JSON.parse(outData);
      console.log('Python script result:', result);

      if (req.user?._id) {
        try {
          await History.create({
            user: req.user._id,
            date: new Date(),
            classNames: classNames,
            labels: labels,
            selectionTree: result.selectionTree,
            featureNames: result.featureNames,
            classicalFeatures: result.classicalFeatures,
            deepFeatures: result.deepFeatures,
          });
        } catch (e) {
          console.warn('⚠️ Не вдалося зберегти історію:', e);
        }
      }

      return res.json(result);
    } catch (e) {
      return res.status(500).json({ error: 'Неочікуваний формат відповіді' });
    }
  });

  try {
    py.stdin.write(payload);
    py.stdin.end();
  } catch (e) {
    return res.status(500).json({ error: 'Не вдалося передати дані до Python' });
  }
};


