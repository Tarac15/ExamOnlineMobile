const express = require('express');
const router = express.Router();
const hasilUjianController = require('../controllers/hasilUjianController');
const { protect, authorize } = require('../middleware/auth'); 

router.post('/', protect, hasilUjianController.submitHasilUjian);

router.get('/user/:userId', protect, hasilUjianController.getHasilUjianByUser);

router.get('/:id', protect, hasilUjianController.getHasilUjianById);

router.get('/', protect, authorize(['admin']), hasilUjianController.getAllHasilUjian);

module.exports = router;