// middleware/authMiddleware.js

const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      next();
    } catch (error) {
      console.error('Помилка аутентифікації:', error);
      res.status(401).json({ error: 'Невірний токен' });
    }
  }
  
  if (!token) {
    res.status(401).json({ error: 'Токен не надано' });
  }
};

module.exports = authMiddleware;
