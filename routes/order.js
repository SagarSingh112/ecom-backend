const express = require('express');
const router  = express.Router();
const Order   = require('../models/Order');
const jwt     = require('jsonwebtoken');
const SECRET  = process.env.JWT_SECRET || 'shopzone_secret_2024';

// Inline auth — no external middleware dependency
function auth(req, res, next) {
  const token = req.header('x-auth-token');
  if (!token) return res.status(401).json({ msg: 'No token' });
  try { req.user = jwt.verify(token, SECRET).user; next(); }
  catch { res.status(401).json({ msg: 'Invalid token' }); }
}

async function adminAuth(req, res, next) {
  const token = req.header('x-auth-token');
  if (!token) return res.status(401).json({ msg: 'No token' });
  try {
    req.user = jwt.verify(token, SECRET).user;
    const User = require('../models/User');
    const u = await User.findById(req.user.id);
    if (!u?.isAdmin) return res.status(403).json({ msg: 'Admins only' });
    next();
  } catch { res.status(401).json({ msg: 'Invalid token' }); }
}

// POST /api/orders — create order
router.post('/', auth, async (req, res) => {
  try {
    const order = await new Order({
      user: req.user.id,
      ...req.body,
      trackingNumber: 'SZ' + Date.now()
    }).save();
    res.status(201).json(order);
  } catch(e) { res.status(500).json({ msg: e.message }); }
});

// GET /api/orders/myorders — user's orders
router.get('/myorders', auth, async (req, res) => {
  try {
    res.json(await Order.find({ user: req.user.id }).sort({ createdAt: -1 }));
  } catch(e) { res.status(500).json({ msg: e.message }); }
});

// GET /api/orders/all — admin only
router.get('/all', adminAuth, async (req, res) => {
  try {
    res.json(await Order.find().populate('user', 'name email').sort({ createdAt: -1 }));
  } catch(e) { res.status(500).json({ msg: e.message }); }
});

// GET /api/orders/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const o = await Order.findById(req.params.id).populate('user', 'name email');
    if (!o) return res.status(404).json({ msg: 'Order not found' });
    res.json(o);
  } catch(e) { res.status(500).json({ msg: e.message }); }
});

// PUT /api/orders/:id/status — admin update status
router.put('/:id/status', adminAuth, async (req, res) => {
  try {
    const upd = { orderStatus: req.body.orderStatus };
    if (req.body.orderStatus === 'Delivered') upd.deliveredAt = new Date();
    res.json(await Order.findByIdAndUpdate(req.params.id, upd, { new: true }));
  } catch(e) { res.status(500).json({ msg: e.message }); }
});

module.exports = router;