const mongoose = require('mongoose');
const reviewSchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name:    String,
  rating:  { type: Number, required: true },
  comment: String,
}, { timestamps: true });
const S = new mongoose.Schema({
  name:          { type: String, required: true },
  description:   { type: String, default: '' },
  price:         { type: Number, required: true },
  originalPrice: Number,
  discount:      { type: Number, default: 0 },
  category:      { type: String, default: 'General' },
  brand:         { type: String, default: '' },
  stock:         { type: Number, default: 0 },
  images:        [String],
  reviews:       [reviewSchema],
  rating:        { type: Number, default: 0 },
  numReviews:    { type: Number, default: 0 },
}, { timestamps: true });
module.exports = mongoose.model('Product', S);