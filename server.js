const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Health check endpoint for keepalive
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// Routes
const questionRoutes = require('./routes/arrayQuestions.router');
const dpQuestionRoutes = require('./routes/dpQuestions.router');
const authRoutes = require('./routes/auth');
const coreConceptsRoutes = require('./routes/coreConcepts.router');

app.use('/api/questions', questionRoutes);
app.use('/api/dp-questions', dpQuestionRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/core-concepts', coreConceptsRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
