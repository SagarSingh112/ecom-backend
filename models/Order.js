const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    product:  { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name:     String,
    price:    Number,
    quantity: Number,
    image:    String,
  }],
  shippingAddress: {
    name:  String,
    phone: String,
    line1: String,
    city:  String,
    state: String,
    pin:   String,
  },
  paymentMethod: { type: String, default: 'Cash on Delivery' },
  totalPrice:    { type: Number, required: true },
  isPaid:        { type: Boolean, default: false },
  paidAt:        { type: Date },

  orderStatus: {
    type:    String,
    enum:    ['Processing', 'Shipped', 'Delivered', 'Cancelled'],
    default: 'Processing',
  },

  // ── Cancellation fields ──
  cancelReason:  { type: String, default: '' },
  cancelledAt:   { type: Date },

}, { timestamps: true });

module.exports = mongoose.model('Order', OrderSchema);