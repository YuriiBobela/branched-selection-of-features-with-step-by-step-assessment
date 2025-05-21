const mongoose = require('mongoose');

const ModelSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  accuracy: Number,
  architecture: String,
  path: String
});

module.exports = mongoose.model('Model', ModelSchema);
