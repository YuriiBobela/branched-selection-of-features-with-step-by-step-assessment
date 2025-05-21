// backend/routes/analysis.js (Express Routes)
const express = require('express');
const router = express.Router();
const AnalysisResult = require('../models/AnalysisResult');

const authMiddleware = require('../middleware/authMiddleware'); 



router.post('/analysis/save', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;  
    const { features, miScores, note } = req.body;
    if (!features || !miScores || features.length !== miScores.length) {
      return res.status(400).json({ error: 'Некоректні дані аналізу' });
    }

    const analysisResult = new AnalysisResult({ userId, features, miScores, note });
    await analysisResult.save();
    return res.status(201).json({ message: 'Результат аналізу збережено успішно' });
  } catch (err) {
    console.error('Помилка збереження аналізу:', err);
    res.status(500).json({ error: 'Внутрішня помилка сервера' });
  }
});


router.get('/analysis-history', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const history = await AnalysisResult.find({ userId }).sort({ createdAt: -1 });
    return res.json(history);
  } catch (err) {
    console.error('Помилка отримання історії аналізів:', err);
    res.status(500).json({ error: 'Внутрішня помилка сервера' });
  }
});

// router.post('/train', upload.array('images'), async (req, res) => {
//   try {
//     const imagesB64 = req.files.map(file => file.buffer.toString('base64'));
//     const labels = JSON.parse(req.body.labels || "[]");
//     const finetune = req.body.finetune === 'true';  

//     const payload = { images: imagesB64, labels: labels, finetune: finetune };
//     const py = spawn('python', ['scripts/train_model.py']);
//     py.stdin.write(JSON.stringify(payload));
//     py.stdin.end();

//     let output = "";
//     py.stdout.on('data', chunk => output += chunk.toString());
//     py.stderr.on('data', err => console.error("Train script error:", err.toString()));
//     py.stdout.on('close', async () => {
//       if (!output) {
//         return res.status(500).json({ error: "No output from training script" });
//       }
//       const result = JSON.parse(output);
//       await Model.deleteMany({});
//       await Model.create({
//         date: new Date(),
//         accuracy: result.cnn_accuracy,
//         architecture: "MobileNetV2",
//         path: result.model_path
//       });
//       return res.json(result);
//     });
//   } catch (err) {
//     console.error("Training API error:", err);
//     res.status(500).json({ error: err.message || "Training failed" });
//   }
// });

module.exports = router;
