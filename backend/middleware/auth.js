const jwt = require('jsonwebtoken');

exports.protect = function (req, res, next) {
  const authHeader = req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Tidak ada token, otorisasi ditolak' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, 'rahasia123');

    req.user = decoded; 
    next(); 
  } catch (err) {
    res.status(401).json({ message: 'Token tidak valid' });
  }
};

exports.authorize = (roles = []) => {
  if (typeof roles === 'string') {
    roles = [roles];
  }

  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ message: 'Akses ditolak: Peran pengguna tidak ditemukan.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: `Akses ditolak: Peran ${req.user.role} tidak diizinkan untuk mengakses resource ini.` });
    }

    next(); 
  };
};