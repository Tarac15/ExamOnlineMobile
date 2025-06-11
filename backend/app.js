const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const path = require('path'); 

const authRoutes = require('./routes/authRoutes');
const jadwalRoutes = require('./routes/jadwalRoutes');
const hasilUjianRoutes = require('./routes/hasilUjianRoutes');
const soalRoutes = require('./routes/soalRoutes');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/images', express.static(path.join(__dirname, 'public', 'images')));

connectDB();

app.use('/api/auth', authRoutes);
app.use('/api/jadwal', jadwalRoutes);
app.use('/api/hasilUjian', hasilUjianRoutes);
app.use('/api/soal', soalRoutes);

const PORT = 3000;
app.listen(PORT, () => console.log(`Server jalan di port ${PORT}`));