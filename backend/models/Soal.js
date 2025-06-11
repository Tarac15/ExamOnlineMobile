const mongoose = require('mongoose');

const SoalSchema = new mongoose.Schema({
  mapel: { 
    type: String,
    required: true,
  },
  kelas: { 
    type: String,
    required: true,
  },
  pertanyaan: { 
    type: String,
    required: true,
  },
  pilihan: { 
    type: [String], 
    required: true,
    validate: {
      validator: function(v) {
        return v && v.length >= 2; 
      },
      message: 'A question must have at least two options.',
    },
  },
  jawabanBenar: { 
    type: String,
    required: true,
  },
});

module.exports = mongoose.model('Soal', SoalSchema);