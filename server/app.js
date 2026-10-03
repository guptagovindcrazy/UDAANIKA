const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');
const { notFound, errorMiddleware } = require('./middleware/error');

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '1mb' }));
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

if (process.env.NODE_ENV !== 'test') {
  app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 100, standardHeaders: true, legacyHeaders: false }));
}
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (_req, res) => res.json({ success: true, message: 'Udaanika API is running', data: {} }));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/rescues', require('./routes/rescueRoutes'));
app.use('/api/volunteers', require('./routes/volunteerRoutes'));
app.use('/api/birds', require('./routes/birdRoutes'));
app.use('/api/migrations', require('./routes/migrationRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/stats', require('./routes/statsRoutes'));

app.use(notFound);
app.use(errorMiddleware);

module.exports = app;
