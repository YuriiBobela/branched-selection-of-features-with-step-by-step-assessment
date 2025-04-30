// models/AnalysisResult.js

const mongoose = require('mongoose');

const analysisResultSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  resultData: { type: mongoose.Schema.Types.Mixed, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AnalysisResult', analysisResultSchema);
