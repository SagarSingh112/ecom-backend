const jwt = require('jsonwebtoken');
const User = require('../models/User');
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_here';

const adminAuth = async (req, res, next) => {
  const token = req.header('x-auth-token');
  if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded.user;
    const user = await User.findById(req.user.id);
    if (!user || !user.isAdmin) return res.status(403).json({ msg: 'Access denied. Admins only.' });
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

module.exports = adminAuth;