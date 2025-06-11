const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const User = require('../models/User'); 
const { protect } = require('../middleware/auth'); 


router.post('/register', authController.register);
router.post('/login', authController.login);

router.get('/profile/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    const imageUrl = user.images
      ? `http://192.168.1.6:3000/images/${user.images}`
      : 'https://via.placeholder.com/60';

    res.json({
      username: user.username,
      nisn: user.nisn,
      kelas: user.kelas,
      images: imageUrl
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

router.get('/me', protect, authController.getMe); 

module.exports = router;