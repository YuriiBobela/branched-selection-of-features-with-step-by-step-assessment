// models/AnalysisResult.js
const mongoose = require('mongoose');

const analysisResultSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  selectedFeatures: { type: [String], default: [] },  // features selected (e.g., ['avg_r','std_gray', ...])
  accuracies: { type: [Number], default: [] },        // accuracy at each step of feature selection
  finalAccuracy: { type: Number },                    // final accuracy of the model after training
  predictedLabel: { type: Number },                   // predicted label for classification results (if applicable)
  resultData: { type: mongoose.Schema.Types.Mixed },  // (optional) any additional result data 
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AnalysisResult', analysisResultSchema);
