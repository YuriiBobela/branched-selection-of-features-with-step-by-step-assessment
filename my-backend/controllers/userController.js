// controllers/userController.js

const User = require('../models/User');

// Отримання профілю користувача
exports.getProfile = async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  if (user) {
    res.json(user);
  } else {
    res.status(404).json({ error: 'Користувача не знайдено' });
  }
};

// Оновлення профілю користувача
exports.updateProfile = async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.username = req.body.username || user.username;
    user.email = req.body.email || user.email;
    // Логіка зміни пароля може бути додана за потребою

    const updatedUser = await user.save();
    res.json({
      _id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
    });
  } else {
    res.status(404).json({ error: 'Користувача не знайдено' });
  }
};
