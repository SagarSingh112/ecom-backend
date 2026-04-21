const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'shopzone_secret_2024';

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

module.exports = { auth, adminAuth };