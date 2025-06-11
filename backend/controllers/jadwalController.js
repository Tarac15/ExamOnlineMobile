const Jadwal = require('../models/Jadwal');

exports.createJadwal = async (req, res) => {
  try {
    const { namaUjian, tanggal, kelas, waktu } = req.body;
    const jadwal = new Jadwal({ namaUjian, tanggal, kelas, waktu });
    await jadwal.save();
    res.status(201).json(jadwal);
  } catch (err) {
    console.error("Create Jadwal Error:", err);
    res.status(500).send('Server error');
  }
};

exports.getAllJadwal = async (req, res) => {
  try {
    const jadwals = await Jadwal.find();
    res.json(jadwals);
  } catch (err) {
    res.status(500).send('Server error');
  }
};