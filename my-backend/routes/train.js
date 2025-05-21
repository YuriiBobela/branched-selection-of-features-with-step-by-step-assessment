// backend/routes/train.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { spawn } = require('child_process');
const path = require('path');

// Підключаємо модель для MongoDB
const Model = require('../models/Model');

const upload = multer({ storage: multer.memoryStorage() });

// POST /api/train
router.post('/', upload.array('images'), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No images uploaded" });
    }
    if (!req.body.labels) {
      return res.status(400).json({ error: "No labels provided" });
    }

    const imagesB64 = req.files.map(file => file.buffer.toString('base64'));
    const labels = JSON.parse(req.body.labels || "[]");
    const classnames = req.body.classnames ? JSON.parse(req.body.classnames) : [];
    const finetune = req.body.finetune === 'true' || req.body.finetune === true;

    // Підготуємо payload для Python-скрипта
    const payload = {
      images: imagesB64,
      labels,
      classnames,
      finetune,
    };

    // Запуск Python train_model.py через spawn
    const scriptPath = path.join(__dirname, '..', 'scripts', 'train_model.py');
    const py = spawn('python', [scriptPath]);

    // Відправляємо JSON в stdin
    py.stdin.write(JSON.stringify(payload));
    py.stdin.end();

    let output = "";
    let stderr = "";

    py.stdout.on('data', chunk => output += chunk.toString());
    py.stderr.on('data', chunk => stderr += chunk.toString());

    py.on('close', async (code) => {
      if (stderr) {
        console.error("[TrainModel][Python STDERR]:\n", stderr);
      }

      if (!output) {
        return res.status(500).json({ error: "No output from training script", stderr });
      }
      try {
        const result = JSON.parse(output);

        // Якщо у відповіді є ключ помилки — повертаємо її
        if (result.error) {
          return res.status(500).json({ error: result.error, stderr });
        }

        // Збережемо мета-інформацію про модель у MongoDB (залишаємо тільки останню)
        if (result.cnn_accuracy !== undefined && result.model_path) {
          await Model.deleteMany({});
          await Model.create({
            date: new Date(),
            accuracy: result.cnn_accuracy,
            architecture: result.architecture || "MobileNetV2",
            path: result.model_path,
          });
        }

        return res.json(result);
      } catch (e) {
        // Якщо не вдалося розпарсити output
        return res.status(500).json({
          error: "Invalid output from training script",
          detail: output,
          stderr,
        });
      }
    });
  } catch (err) {
    console.error("Training API error:", err);
    res.status(500).json({ error: err.message || "Training failed" });
  }
});

module.exports = router;
