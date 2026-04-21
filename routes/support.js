const express = require('express');
const router  = express.Router();
const Support = require('../models/Support');
const User    = require('../models/User');
const jwt     = require('jsonwebtoken');
const SECRET  = process.env.JWT_SECRET || 'shopzone_secret_2024';

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
    const u  = await User.findById(req.user.id);
    if (!u?.isAdmin) return res.status(403).json({ msg: 'Admins only' });
    next();
  } catch { res.status(401).json({ msg: 'Invalid token' }); }
}

// User: create a new support ticket
router.post('/', auth, async (req, res) => {
  try {
    const user   = await User.findById(req.user.id);
    const ticket = await new Support({
      user:      req.user.id,
      userName:  user.name,
      userEmail: user.email,
      userPhone: user.phone || 'Not provided',
      subject:   req.body.subject,
      category:  req.body.category || 'General',
      replies:   [{ sender: 'user', message: req.body.message }]
    }).save();
    res.status(201).json(ticket);
  } catch(e) { res.status(500).json({ msg: e.message }); }
});

// User: get my own tickets
router.get('/mine', auth, async (req, res) => {
  try { res.json(await Support.find({ user: req.user.id }).sort({ updatedAt: -1 })); }
  catch(e) { res.status(500).json({ msg: e.message }); }
});

// User: add a reply to existing ticket
router.post('/:id/reply', auth, async (req, res) => {
  try {
    const ticket = await Support.findOne({ _id: req.params.id, user: req.user.id });
    if (!ticket) return res.status(404).json({ msg: 'Ticket not found' });
    ticket.replies.push({ sender: 'user', message: req.body.message });
    if (ticket.status === 'Resolved') ticket.status = 'In Progress';
    await ticket.save();
    res.json(ticket);
  } catch(e) { res.status(500).json({ msg: e.message }); }
});

// Admin: get all tickets
router.get('/all', adminAuth, async (req, res) => {
  try { res.json(await Support.find().sort({ updatedAt: -1 })); }
  catch(e) { res.status(500).json({ msg: e.message }); }
});

// Admin: reply to a ticket
router.post('/:id/admin-reply', adminAuth, async (req, res) => {
  try {
    const ticket = await Support.findById(req.params.id);
    if (!ticket) return res.status(404).json({ msg: 'Ticket not found' });
    ticket.replies.push({ sender: 'admin', message: req.body.message });
    ticket.status = req.body.status || 'In Progress';
    await ticket.save();
    res.json(ticket);
  } catch(e) { res.status(500).json({ msg: e.message }); }
});

// Admin: change ticket status
router.put('/:id/status', adminAuth, async (req, res) => {
  try {
    const t = await Support.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    res.json(t);
  } catch(e) { res.status(500).json({ msg: e.message }); }
});

module.exports = router;