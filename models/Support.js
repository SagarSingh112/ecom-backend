const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
  sender:  { type: String, enum: ['user', 'admin'], required: true },
  message: { type: String, required: true },
  sentAt:  { type: Date, default: Date.now }
});

const supportSchema = new mongoose.Schema({
  user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName:  String,
  userEmail: String,
  userPhone: String,
  subject:   { type: String, required: true },
  category:  { type: String, default: 'General', enum: ['General','Order Issue','Payment','Return','Product','Other'] },
  status:    { type: String, default: 'Open', enum: ['Open','In Progress','Resolved','Closed'] },
  replies:   [replySchema],
}, { timestamps: true });

module.exports = mongoose.model('Support', supportSchema);