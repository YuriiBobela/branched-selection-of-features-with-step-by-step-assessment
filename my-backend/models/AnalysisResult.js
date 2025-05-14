// backend/models/AnalysisResult.js (Mongoose Schema)
const mongoose = require('mongoose');

const AnalysisResultSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  features: { 
    type: [String],       // список назв ознак
    required: true 
  },
  miScores: { 
    type: [Number],       // список значень MI відповідно до ознак
    required: true 
  },
  note: {
    type: String,         // опціональна примітка від користувача
    default: ''
  },
  createdAt: { 
    type: Date,           // дата створення запису
    default: Date.now 
  }
});

module.exports = mongoose.model('AnalysisResult', AnalysisResultSchema);
