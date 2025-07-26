const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: String,
  picture: String,
  provider: String, // 'google' or 'local'
  password: String, // For local auth
});

module.exports = mongoose.model('User', UserSchema); 