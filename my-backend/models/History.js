const mongoose = require('mongoose');

const HistorySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, default: Date.now },
  classNames: [String],   // Назви класів (із запиту)
  labels: [Number],       // Мітки класів (опціонально)
  selectionTree: { type: Object }, // Дерево вибору ознак
  featureNames: [String],
  classicalFeatures: [String],
  deepFeatures: [String],
});

module.exports = mongoose.model('History', HistorySchema);
