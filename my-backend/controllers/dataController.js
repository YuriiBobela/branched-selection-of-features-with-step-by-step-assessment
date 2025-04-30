// controllers/dataController.js

const cloudinary = require('cloudinary').v2;
const Dataset = require('../models/Dataset');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Завантаження зображення на Cloudinary та збереження запису в MongoDB
exports.uploadImage = async (req, res) => {
  try {
    // Завантаження зображення через multer (тимчасовий файл)
    const result = await cloudinary.uploader.upload(req.file.path);
    const dataset = await Dataset.create({
      user: req.user._id,
      url: result.secure_url,
      cloudinaryId: result.public_id,
    });
    res.status(201).json(dataset);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
