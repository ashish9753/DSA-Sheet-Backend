const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

// Fail fast if the JWT secret is missing/insecure in production. A predictable
// secret lets anyone forge auth tokens, so we refuse to start with one.
// Comparing against a single known default was not enough: any other tutorial
// placeholder passed the check, which is exactly what happened in production.
// Reject anything too short to resist brute force or that still reads like a
// placeholder, rather than trying to enumerate every bad string.
const MIN_JWT_SECRET_LENGTH = 32;
const PLACEHOLDER_SECRET_PATTERN = /change|your[-_]|secret-key|placeholder|example|changeme/i;

const jwtSecret = process.env.JWT_SECRET || '';
const jwtSecretProblem = !jwtSecret
  ? 'is not set'
  : jwtSecret.length < MIN_JWT_SECRET_LENGTH
    ? `must be at least ${MIN_JWT_SECRET_LENGTH} characters (it is ${jwtSecret.length})`
    : PLACEHOLDER_SECRET_PATTERN.test(jwtSecret)
      ? 'still looks like a placeholder'
      : null;

if (isProduction && jwtSecretProblem) {
  console.error(`FATAL: JWT_SECRET ${jwtSecretProblem}. Refusing to start.`);
  process.exit(1);
}

const app = express();

// Behind Render's proxy — required for correct client IPs (rate limiting, etc.)
app.set('trust proxy', 1);

// Allow only our own front-end origin(s). Override/extend with ALLOWED_ORIGINS
// (comma-separated) if needed.
const DEFAULT_ALLOWED_ORIGINS = [
  'https://ashishdev.com',
  'https://www.ashishdev.com'
];
const envOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);
const allowedOrigins = new Set([...DEFAULT_ALLOWED_ORIGINS, ...envOrigins]);
// Local dev origins are only trusted when not running in production
if (!isProduction) {
  ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'].forEach((o) => allowedOrigins.add(o));
}

const corsOptions = {
  origin(origin, callback) {
    // Allow non-browser clients (no Origin header) such as health checks/curl
    if (!origin || allowedOrigins.has(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400
};

// Security middleware
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: '32kb' }));

// Global rate limiter — blunt protection against abuse/DoS
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests. Please slow down and try again later.' }
});
app.use(generalLimiter);

// Visit tracking is public and fires on every page load, so it gets its own
// allowance instead of eating into the general budget. The cap is well above
// what a real person browsing the site can produce, but low enough that nobody
// can meaningfully inflate the traffic numbers.
const analyticsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests. Please slow down and try again later.' }
});

// Stricter limiter for authentication endpoints (brute-force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many authentication attempts. Please try again in a few minutes.' }
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected successfully');
  })
  .catch((err) => console.error('MongoDB connection error:', err));

// Health check endpoint for keepalive
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Server is running securely. Created by Ashish Sharma.'
  });
});

// Routes
const questionRoutes = require('./routes/arrayQuestions.router');
const dpQuestionRoutes = require('./routes/dpQuestions.router');
const linkedListQuestionRoutes = require('./routes/linkedListQuestions.router');
const authRoutes = require('./routes/auth.router');
const coreConceptsRoutes = require('./routes/coreConcepts.router');
const stringQuestionRoutes = require('./routes/stringQuestions.router');
const recursionQuestionRoutes = require('./routes/recursionQuestions.router');
const bitManipulationQuestionRoutes = require('./routes/bitManipulationQuestions.router');
const stackAndQueuesQuestionRoutes = require('./routes/stackAndQueuesQuestions.router');
const slidingWindowQuestionRoutes = require('./routes/slidingWindowQuestions.router');
const heapsQuestionRoutes = require('./routes/heapsQuestions.router');
const greedyQuestionRoutes = require('./routes/greedyQuestions.router');
const graphsQuestionRoutes = require('./routes/graphsQuestions.router');
const leaderboardRoutes = require('./routes/leaderboard.router');
const reviewsRoutes = require('./routes/reviews.router');
const adminRoutes = require('./routes/admin.router');
const adminQuestionsRoutes = require('./routes/adminQuestions.router');
const analyticsRoutes = require('./routes/analytics.router');
app.use('/api/questions', questionRoutes);
app.use('/api/dp-questions', dpQuestionRoutes);
app.use('/api/linkedlist-questions', linkedListQuestionRoutes);
app.use('/api/string-questions', stringQuestionRoutes);
app.use('/api/recursion-questions', recursionQuestionRoutes);
app.use('/api/bit-manipulation-questions', bitManipulationQuestionRoutes);
app.use('/api/stack-queues-questions', stackAndQueuesQuestionRoutes);
app.use('/api/sliding-window-questions', slidingWindowQuestionRoutes);
app.use('/api/heaps-questions', heapsQuestionRoutes);
app.use('/api/greedy-questions', greedyQuestionRoutes);
app.use('/api/graphs-questions', graphsQuestionRoutes);
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/analytics', analyticsLimiter, analyticsRoutes);
app.use('/api/core-concepts', coreConceptsRoutes);
app.use('/api/admin/questions', adminQuestionsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', leaderboardRoutes);
app.use('/api', reviewsRoutes);

// Centralized error handler — avoids leaking stack traces to clients
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err && err.message === 'Not allowed by CORS') {
    return res.status(403).json({ message: 'Origin not allowed' });
  }
  if (err && err.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Request body too large' });
  }
  if (err && (err.type === 'entity.parse.failed' || err instanceof SyntaxError)) {
    return res.status(400).json({ message: 'Invalid request body' });
  }
  console.error('Unhandled error:', err);
  return res.status(500).json({ message: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server get running on port ${PORT} in ${isProduction ? 'production' : 'development'} mode`);
  // The checks above only run in production. Saying the mode out loud makes a
  // missing NODE_ENV on the live server obvious in the deploy logs, instead of
  // silently skipping every security check.
  if (!isProduction) {
    console.warn('WARNING: not in production mode — strict security checks are disabled.');
  }
});
