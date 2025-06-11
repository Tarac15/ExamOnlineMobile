const mongoose = require('mongoose');

const JadwalSchema = new mongoose.Schema({
  namaUjian: String,
  tanggal: String,
  kelas: String,
  waktu: String
});

module.exports = mongoose.model('Jadwal', JadwalSchema);