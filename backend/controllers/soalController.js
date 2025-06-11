const Soal = require('../models/Soal');

exports.getSoalByMapelAndKelas = async (req, res) => {
  const { mapel, kelas } = req.params;
  try {
    const soalList = await Soal.find({
      mapel: mapel,
      kelas: { $regex: `^${kelas}`, $options: 'i' } 
    });

    if (soalList.length === 0) {
      return res.status(404).json({ msg: 'Tidak ada soal untuk mata pelajaran dan kelas ini' });
    }
    res.json(soalList);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.getAllSoal = async (req, res) => {
  try {
    const soal = await Soal.find();
    res.json(soal);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.getSoalById = async (req, res) => {
  try {
    const soal = await Soal.findById(req.params.id);
    if (!soal) {
      return res.status(404).json({ msg: 'Soal tidak ditemukan' });
    }
    res.json(soal);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Soal tidak ditemukan' });
    }
    res.status(500).send('Server Error');
  }
};

exports.createSoal = async (req, res) => {
  try {
    let newSoalData = req.body; 

    if (Array.isArray(newSoalData)) {
      const createdSoals = await Soal.insertMany(newSoalData); 
      res.status(201).json(createdSoals);
    } else {
      const newSoal = new Soal(newSoalData);
      const soal = await newSoal.save();
      res.status(201).json(soal);
    }
  } catch (err) {
    console.error(err.message);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ msg: err.message });
    }
    res.status(500).send('Server Error');
  }
};

exports.updateSoal = async (req, res) => {
  const { mapel, kelas, pertanyaan, pilihan, jawabanBenar } = req.body;

  const soalFields = {};
  if (mapel) soalFields.mapel = mapel;
  if (kelas) soalFields.kelas = kelas;
  if (pertanyaan) soalFields.pertanyaan = pertanyaan;
  if (pilihan) soalFields.pilihan = pilihan;
  if (jawabanBenar) soalFields.jawabanBenar = jawabanBenar;

  try {
    let soal = await Soal.findById(req.params.id);

    if (!soal) {
      return res.status(404).json({ msg: 'Soal tidak ditemukan' });
    }

    soal = await Soal.findByIdAndUpdate(
      req.params.id,
      { $set: soalFields },
      { new: true }
    );

    res.json(soal);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Soal tidak ditemukan' });
    }
    res.status(500).send('Server Error');
  }
};

exports.deleteSoal = async (req, res) => {
  try {
    const soal = await Soal.findById(req.params.id);

    if (!soal) {
      return res.status(404).json({ msg: 'Soal tidak ditemukan' });
    }

    await Soal.findByIdAndDelete(req.params.id);

    res.json({ msg: 'Soal berhasil dihapus' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Soal tidak ditemukan' });
    }
    res.status(500).send('Server Error');
  }
};