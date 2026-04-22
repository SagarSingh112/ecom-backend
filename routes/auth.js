const express = require('express');
const router  = express.Router();
const jwt     = require('jsonwebtoken');
const User    = require('../models/User');
const SECRET  = process.env.JWT_SECRET || 'shopzone_secret_2024';
const sign    = id => jwt.sign({ user: { id } }, SECRET, { expiresIn: '7d' });
const dto     = u  => ({ id: u.id, name: u.name, email: u.email, isAdmin: u.isAdmin });

// Auto-create admin on startup
;(async () => {
  try {
    if (!await User.findOne({ email: 'singhsagarsingh11@gmail.com' })) {
      await new User({ name:'Admin', email:'singhsagarsingh11@gmail.com', password:'Sagar3120', isAdmin:true }).save();
      console.log('✅ Admin: singhsagarsingh11@gmail.com / Sagar3120');
    }
  } catch(e) {}
})();

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (await User.findOne({ email })) return res.status(400).json({ msg: 'Email already registered' });
    const user = await new User({ name, email, password, phone }).save();
    res.json({ token: sign(user.id), user: dto(user) });
  } catch(e) { res.status(500).json({ msg: e.message }); }
});

router.post('/login', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(400).json({ msg: 'No account found with this email' });
    if (!await user.comparePassword(req.body.password)) return res.status(400).json({ msg: 'Incorrect password' });
    res.json({ token: sign(user.id), user: dto(user) });
  } catch(e) { res.status(500).json({ msg: e.message }); }
});

router.get('/me', async (req, res) => {
  const token = req.header('x-auth-token');
  if (!token) return res.status(401).json({ msg: 'No token' });
  try {
    const { user: { id } } = jwt.verify(token, SECRET);
    res.json(await User.findById(id).select('-password'));
  } catch { res.status(401).json({ msg: 'Invalid token' }); }
});

// Make admin route
router.post('/make-admin', async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { email: req.body.email },
      { isAdmin: true },
      { new: true }
    );
    if (!user) return res.status(404).json({ msg: 'User not found' });
    res.json({ msg: 'User updated to admin successfully', user: dto(user) });
  } catch(e) { res.status(500).json({ msg: e.message }); }
});

module.exports = router;