// routes/historyRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const History = require('../models/History');

// GET всі історії юзера
router.get('/my', auth, async (req, res) => {
  try {
    const items = await History.find({ user: req.user._id }).sort({ date: -1 }).limit(20);
    res.json(items);
  } catch (err) {
    console.error('History fetch error:', err);
    res.status(500).json({ error: 'Помилка отримання історії' });
  }
});

// GET одну історію по id
router.get('/item/:id', auth, async (req, res) => {
  try {
    const item = await History.findOne({ _id: req.params.id, user: req.user._id });
    if (!item) return res.status(404).json({ error: 'Не знайдено' });
    res.json(item);
  } catch (err) {
    console.error('History fetch by id error:', err);
    res.status(500).json({ error: 'Помилка отримання запису' });
  }
});

// DELETE — видалити запис історії
router.delete('/item/:id', auth, async (req, res) => {
  try {
    const result = await History.deleteOne({ _id: req.params.id, user: req.user._id });
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Не знайдено' });
    res.json({ success: true });
  } catch (err) {
    console.error('History delete error:', err);
    res.status(500).json({ error: 'Помилка видалення' });
  }
});

module.exports = router;
