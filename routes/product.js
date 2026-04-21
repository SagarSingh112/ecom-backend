const express  = require('express');
const router   = express.Router();
const Product  = require('../models/Product');
const jwt      = require('jsonwebtoken');
const SECRET   = process.env.JWT_SECRET || 'shopzone_secret_2024';

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

router.get('/', async (req, res) => {
  try {
    const q = {};
    if (req.query.category && req.query.category !== 'All') q.category = req.query.category;
    if (req.query.search) q.name = { $regex: req.query.search, $options: 'i' };
    res.json(await Product.find(q).sort({ createdAt: -1 }));
  } catch(e) { res.status(500).json({ msg: e.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const p = await Product.findById(req.params.id);
    if (!p) return res.status(404).json({ msg: 'Not found' });
    res.json(p);
  } catch(e) { res.status(500).json({ msg: e.message }); }
});

router.post('/', adminAuth, async (req, res) => {
  try { res.status(201).json(await new Product(req.body).save()); }
  catch(e) { res.status(500).json({ msg: e.message }); }
});

router.put('/:id', adminAuth, async (req, res) => {
  try { res.json(await Product.findByIdAndUpdate(req.params.id, req.body, { new: true })); }
  catch(e) { res.status(500).json({ msg: e.message }); }
});

router.delete('/:id', adminAuth, async (req, res) => {
  try { await Product.findByIdAndDelete(req.params.id); res.json({ msg: 'Deleted' }); }
  catch(e) { res.status(500).json({ msg: e.message }); }
});

router.post('/:id/review', auth, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ msg: 'Product not found' });
    if (product.reviews.some(r => r.user.toString() === req.user.id))
      return res.status(400).json({ msg: 'Already reviewed this product' });
    const user = await require('../models/User').findById(req.user.id);
    product.reviews.push({ user: req.user.id, name: user.name, rating: Number(rating), comment });
    product.numReviews = product.reviews.length;
    product.rating     = product.reviews.reduce((a, r) => a + r.rating, 0) / product.reviews.length;
    await product.save();
    res.json({ msg: 'Review added!' });
  } catch(e) { res.status(500).json({ msg: e.message }); }
});

module.exports = router;