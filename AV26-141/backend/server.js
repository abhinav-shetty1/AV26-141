const express = require('express');
const cors    = require('cors');
const path    = require('path');
const fs      = require('fs');
require('dotenv').config();

const app = express();

// ── Middleware ────────────────────────────────────────
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:5174', 'https://edupulse12.netlify.app'] }));
app.use(express.json());

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

// ── Routes ────────────────────────────────────────────
app.use('/api/student', require('./routes/student'));
app.use('/api/teacher', require('./routes/teacher'));
app.use('/api/import',  require('./routes/import'));
app.use('/api/alerts',  require('./routes/alerts'));

// ── Health check ──────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', app: 'EduPulse API' }));

// ── Global error handler ──────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('❌', err.message);
  res.status(err.status || 500).json({ error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ EduPulse API running on http://localhost:${PORT}`));
