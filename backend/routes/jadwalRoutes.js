const express = require('express');
const router = express.Router();
const jadwalController = require('../controllers/jadwalController');

router.post('/', jadwalController.createJadwal);
router.get('/', jadwalController.getAllJadwal);

module.exports = router;