const HasilUjian = require('../models/HasilUjian');
const Soal = require('../models/Soal');
const User = require('../models/User'); 

exports.submitHasilUjian = async (req, res) => {
  const { examId, mapel, kelas, submittedAnswers, totalDuration } = req.body; 
  const userId = req.user.id; 

  try {
    const questions = await Soal.find({ _id: { $in: submittedAnswers.map(ans => ans.questionId) }, mapel, kelas });

    if (questions.length !== submittedAnswers.length) {
      return res.status(400).json({ msg: 'Beberapa soal tidak valid atau tidak cocok dengan ujian yang ditentukan.' });
    }

    let jawabanBenar = 0;

    questions.forEach(q => {
      const submitted = submittedAnswers.find(sa => sa.questionId.toString() === q._id.toString());
      if (submitted && submitted.chosenOption === q.jawabanBenar) {
        jawabanBenar++;
      } 
    });

    const jumlahSoal = questions.length;
    const jawabanSalah = jumlahSoal - jawabanBenar;
    const skor = jawabanBenar; 
    const persentase = (jawabanBenar / jumlahSoal) * 100;

    const newHasilUjian = new HasilUjian({
      userId,
      examId,
      mapel,
      kelas,
      jumlahSoal,
      jawabanBenar,
      jawabanSalah,
      skor,
      persentase: parseFloat(persentase.toFixed(2)), 
    });

    const hasilUjian = await newHasilUjian.save();
    res.status(201).json(hasilUjian);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.getHasilUjianByUser = async (req, res) => {
  try {
    if (req.user.id !== req.params.userId && req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Akses ditolak' });
    }

    const hasil = await HasilUjian.find({ userId: req.params.userId }).sort({ waktuSelesai: -1 });
    res.json(hasil);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.getHasilUjianById = async (req, res) => {
  try {
    const hasil = await HasilUjian.findById(req.params.id);

    if (!hasil) {
      return res.status(404).json({ msg: 'Hasil ujian tidak ditemukan' });
    }

    if (hasil.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Akses ditolak' });
    }

    res.json(hasil);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Hasil ujian tidak ditemukan' });
    }
    res.status(500).send('Server Error');
  }
};

exports.getAllHasilUjian = async (req, res) => {
  try {
    const hasil = await HasilUjian.find().populate('userId', 'username nisn kelas').sort({ waktuSelesai: -1 });
    res.json(hasil);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};