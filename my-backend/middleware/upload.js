// middleware/upload.js
const multer = require('multer');

// зберігаємо файли лише в пам’яті
const storage = multer.memoryStorage();

function checkFileType(file, cb) {
  const types = /jpe?g|png/;
  const ext  = types.test(file.originalname.toLowerCase());
  const mim  = types.test(file.mimetype);
  return ext && mim
    ? cb(null, true)
    : cb(new Error('Тільки jpg/jpeg/png'));
}

module.exports = multer({
  storage,
  fileFilter: (req, file, cb) => checkFileType(file, cb),
  limits: { fileSize: 10 * 1024 * 1024 },  // наприклад до 10 MB
});
