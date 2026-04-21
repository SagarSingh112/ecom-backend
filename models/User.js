const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const S = new mongoose.Schema({
  name:    { type: String, required: true },
  email:   { type: String, required: true, unique: true },
  password:{ type: String, required: true },
  phone:   { type: String, default: '' },
  isAdmin: { type: Boolean, default: false },
}, { timestamps: true });
S.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10); next();
});
S.methods.comparePassword = function(p) { return require('bcryptjs').compare(p, this.password); };
module.exports = mongoose.model('User', S);