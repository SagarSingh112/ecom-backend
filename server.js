// Backend/server.js
const express      = require('express');
const cors         = require('cors');
const mongoose     = require('mongoose');
require('dotenv').config();

const app = express();

// ── MIDDLEWARE ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));
app.use(express.json());

// ── ROUTES ────────────────────────────────────────────────────────────────────
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/products', require('./routes/product'));
app.use('/api/orders',   require('./routes/order'));
app.use('/api/payment',  require('./routes/payment'));
app.use('/api/support',  require('./routes/supportRoute'));

// ── DATABASE ──────────────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

// ── START SERVER ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));