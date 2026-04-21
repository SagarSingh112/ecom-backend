// Backend/routes/payment.js
const express  = require('express');
const router   = express.Router();
const Razorpay = require('razorpay');
const crypto   = require('crypto');
const jwt      = require('jsonwebtoken');

// ✅ Inline protect middleware — no dependency on your auth.js file
const protect = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

const rzp = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// POST /api/payment/create-order
router.post('/create-order', protect, async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ msg: 'Invalid amount' });
    }
    const order = await rzp.orders.create({
      amount:   Math.round(amount * 100), // rupees → paise
      currency: 'INR',
      receipt:  'receipt_' + Date.now(),
    });
    res.json({
      orderId:  order.id,
      amount:   order.amount,
      currency: order.currency,
    });
  } catch (err) {
    console.error('Razorpay create-order error:', err);
    res.status(500).json({ msg: 'Failed to create Razorpay order: ' + err.message });
  }
});

// POST /api/payment/verify
router.post('/verify', protect, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ msg: 'Missing payment details' });
    }

    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    if (expected === razorpay_signature) {
      res.json({ success: true, paymentId: razorpay_payment_id });
    } else {
      res.status(400).json({ success: false, msg: 'Invalid payment signature' });
    }
  } catch (err) {
    console.error('Verify error:', err);
    res.status(500).json({ msg: 'Verification error: ' + err.message });
  }
});

module.exports = router;