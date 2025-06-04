// backend/routes/analysis.js (Express Routes)
const express = require('express');
const router = express.Router();
const AnalysisResult = require('../models/AnalysisResult');
const History = require('../models/History');
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

module.exports = router;
