const express = require('express');
const router = express.Router();
const soalController = require('../controllers/soalController');
const { protect, authorize } = require('../middleware/auth'); 

router.get('/', soalController.getAllSoal);

router.get('/byMapelAndKelas/:mapel/:kelas', protect, soalController.getSoalByMapelAndKelas);

router.get('/:id', soalController.getSoalById);

router.post('/', soalController.createSoal);

router.put('/:id', protect, authorize(['admin']), soalController.updateSoal);

router.delete('/:id', protect, authorize(['admin']), soalController.deleteSoal);

module.exports = router;