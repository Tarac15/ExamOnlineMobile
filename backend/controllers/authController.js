const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.register = async (req, res) => {
  const { username, password, kelas, nisn, images } = req.body;

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser)
      return res.status(400).json({ message: 'Username sudah digunakan' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword, kelas, nisn, images });
    await newUser.save();

    res.status(201).json({ message: 'User berhasil dibuat' });
  } catch (err) {
    res.status(500).send('Server error');
  }
};

exports.login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user)
      return res.status(400).json({ message: 'User tidak ditemukan' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: 'Password salah' });

    const token = jwt.sign({ id: user._id }, 'rahasia123', {
      expiresIn: '10h',
    });

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        nisn: user.nisn,  
        kelas: user.kelas, 
        images: user.images 
      }
    });
  } catch (err) {
    res.status(500).send('Server error');
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
        return res.status(404).json({ message: 'Pengguna tidak ditemukan' });
    }

    const imageUrl = user.images
        ? `http://192.168.1.6:3000/images/${user.images}`
        : 'https://via.placeholder.com/60'; 

    res.json({
      _id: user._id,
      id: user._id,
      username: user.username,
      nisn: user.nisn,
      kelas: user.kelas,
      images: imageUrl 
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Terjadi kesalahan server');
  }
};