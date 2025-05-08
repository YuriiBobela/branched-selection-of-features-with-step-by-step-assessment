const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');
const mongoose = require('mongoose');
const Model = mongoose.model('Model');  // схема Model, описана далі

// ... (налаштування multer для отримання файлів у пам'ять)
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

router.post('/api/train', upload.array('images'), async (req, res) => {
  try {
    // Формуємо payload з зображень (base64) та міток
    const imagesB64 = req.files.map(file => file.buffer.toString('base64'));
    const labels = JSON.parse(req.body.labels || "[]");
    const finetune = req.body.finetune === 'true';  // прапор fine-tune (true/false)

    const payload = { images: imagesB64, labels: labels, finetune: finetune };
    // Запускаємо Python-скрипт train_model.py
    const py = spawn('python', ['scripts/train_model.py']);
    // Передаємо JSON-дані в stdin дочірнього процесу
    py.stdin.write(JSON.stringify(payload));
    py.stdin.end();

    let output = "";
    py.stdout.on('data', chunk => output += chunk.toString());
    py.stderr.on('data', err => console.error("Train script error:", err.toString()));
    py.stdout.on('close', async () => {
      if (!output) {
        return res.status(500).json({ error: "No output from training script" });
      }
      const result = JSON.parse(output);
      // Зберігаємо мета-інформацію про модель в MongoDB (лише одна активна модель)
      await Model.deleteMany({});
      await Model.create({
        date: new Date(),
        accuracy: result.cnn_accuracy,
        architecture: "MobileNetV2",
        path: result.model_path
      });
      return res.json(result);
    });
  } catch (err) {
    console.error("Training API error:", err);
    res.status(500).json({ error: err.message || "Training failed" });
  }
});
