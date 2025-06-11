const mongoose = require('mongoose');

const HasilUjianSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', 
    required: true,
  },
  examId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Jadwal', 
    required: true,
  },
  mapel: { 
    type: String,
    required: true,
  },
  kelas: {
    type: String,
    required: true,
  },
  jumlahSoal: { 
    type: Number,
    required: true,
  },
  jawabanBenar: { 
    type: Number,
    required: true,
    default: 0,
  },
  jawabanSalah: { 
    type: Number,
    required: true,
    default: 0,
  },
  skor: { 
    type: Number,
    required: true,
  },
  persentase: { 
    type: Number,
    required: true,
  },
  waktuSelesai: { 
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('HasilUjian', HasilUjianSchema);