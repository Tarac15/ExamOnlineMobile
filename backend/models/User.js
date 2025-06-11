const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  password: { type: String, required: true }, 
  kelas: { type: String, required: true },
  nisn: { type: String, required: true },
  images: {type: String, required: true}
});

module.exports = mongoose.model('User', UserSchema);