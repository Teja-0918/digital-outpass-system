const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load env
dotenv.config();

// Connect DB
connectDB();

const app = express();

// Middleware — allow all origins (Netlify + local)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.send('Backend is running ✅');
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/student', require('./routes/studentRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  // ── Keep Render free tier awake (ping every 14 min) ──
  const BACKEND_URL = process.env.BACKEND_URL || `https://digital-outpass-system-nb41.onrender.com`;
  setInterval(() => {
    fetch(BACKEND_URL)
      .then(() => console.log(`[Keep-Alive] Pinged ${BACKEND_URL}`))
      .catch((e) => console.log(`[Keep-Alive] Ping failed:`, e.message));
  }, 14 * 60 * 1000); // every 14 minutes
});