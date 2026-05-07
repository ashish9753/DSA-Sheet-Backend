const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const Question = require('./models/Question');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected successfully');

    // Log total question count every 1 minute
    const logQuestionCount = async () => {
      try {
        const count = await Question.countDocuments();
      } catch (err) {
        console.error('Error counting questions:', err);
      }
      setTimeout(logQuestionCount, 40 * 1000);
    };

    setTimeout(logQuestionCount, 40 * 1000);
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
const authRoutes = require('./routes/auth');
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
app.use('/api/auth', authRoutes);
app.use('/api/core-concepts', coreConceptsRoutes);
app.use('/api/admin/questions', adminQuestionsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', leaderboardRoutes);
app.use('/api', reviewsRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server get running on port Number ${PORT}`);
});