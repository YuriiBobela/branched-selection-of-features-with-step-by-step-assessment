// backend/routes/analysis.js (Express Routes)
const express = require('express');
const router = express.Router();
const AnalysisResult = require('../models/AnalysisResult');
// Припускаємо наявність middleware для автентифікації
const authMiddleware = require('../middleware/authMiddleware'); 

// POST /api/analysis/save - Збереження результату аналізу (тільки для авторизованих)
router.post('/analysis/save', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;  // ID користувача отримано з authMiddleware
    const { features, miScores, note } = req.body;
    if (!features || !miScores || features.length !== miScores.length) {
      return res.status(400).json({ error: 'Некоректні дані аналізу' });
    }
    // Створюємо новий документ аналізу
    const analysisResult = new AnalysisResult({ userId, features, miScores, note });
    await analysisResult.save();
    return res.status(201).json({ message: 'Результат аналізу збережено успішно' });
  } catch (err) {
    console.error('Помилка збереження аналізу:', err);
    res.status(500).json({ error: 'Внутрішня помилка сервера' });
  }
});

// GET /api/analysis-history - Отримати всі результати аналізу поточного користувача
router.get('/analysis-history', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    // Знаходимо всі записи аналізу для даного користувача, сортуємо за датою (нові спочатку)
    const history = await AnalysisResult.find({ userId }).sort({ createdAt: -1 });
    return res.json(history);
  } catch (err) {
    console.error('Помилка отримання історії аналізів:', err);
    res.status(500).json({ error: 'Внутрішня помилка сервера' });
  }
});

module.exports = router;
