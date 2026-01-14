const express = require('express');
const router = express.Router();
const Question = require('../models/Question');
const UserProgress = require('../models/UserProgress');
const auth = require('../middleware/auth');

// Get all questions with user progress
router.get('/', auth, async (req, res) => {
  try {
    const { topic } = req.query;
    const filter = topic ? { topic } : {};
    const questions = await Question.find(filter).sort({ difficulty: 1, name: 1 });
    
    // Get user's progress for these questions
    const questionIds = questions.map(q => q._id);
    const userProgress = await UserProgress.find({
      user: req.userId,
      question: { $in: questionIds }
    });
    
    // Create a map of question ID to completion status
    const progressMap = {};
    userProgress.forEach(progress => {
      progressMap[progress.question.toString()] = progress.completed;
    });
    
    // Add completion status to each question
    const questionsWithProgress = questions.map(q => ({
      ...q.toObject(),
      completed: progressMap[q._id.toString()] || false
    }));
    
    res.json(questionsWithProgress);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update question completion status
router.patch('/:id', auth, async (req, res) => {
  try {
    const { completed } = req.body;
    const questionId = req.params.id;
    
    // Check if question exists
    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }
    
    // Update or create user progress
    const updateData = { 
      completed,
      completedAt: completed ? new Date() : null
    };
    const userProgress = await UserProgress.findOneAndUpdate(
      { user: req.userId, question: questionId },
      updateData,
      { new: true, upsert: true }
    );
    
    res.json({ ...question.toObject(), completed: userProgress.completed });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get statistics
router.get('/stats/summary', auth, async (req, res) => {
  try {
    const total = await Question.countDocuments();
    const userProgress = await UserProgress.find({ user: req.userId, completed: true });
    const completedQuestionIds = userProgress.map(p => p.question);
    
    const completed = completedQuestionIds.length;
    const easyCompleted = await Question.countDocuments({ 
      _id: { $in: completedQuestionIds },
      difficulty: 'Easy' 
    });
    const mediumCompleted = await Question.countDocuments({ 
      _id: { $in: completedQuestionIds },
      difficulty: 'Medium' 
    });
    const hardCompleted = await Question.countDocuments({ 
      _id: { $in: completedQuestionIds },
      difficulty: 'Hard' 
    });
    
    res.json({
      total,
      completed,
      easyCompleted,
      mediumCompleted,
      hardCompleted
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get daily activity for contribution heatmap
router.get('/stats/activity', auth, async (req, res) => {
  try {
    const userProgress = await UserProgress.find({ 
      user: req.userId,
      completed: true 
    }).sort({ completedAt: 1 });
    
    // Group by date
    const activityMap = {};
    const today = new Date().toISOString().split('T')[0];
    
    userProgress.forEach(progress => {
      // If completedAt is missing but question is completed, use today's date
      const date = progress.completedAt ? 
        new Date(progress.completedAt).toISOString().split('T')[0] : 
        today;
      activityMap[date] = (activityMap[date] || 0) + 1;
    });
    
    res.json(activityMap);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Migrate old completed questions to have completedAt timestamp
router.post('/migrate/timestamps', auth, async (req, res) => {
  try {
    const result = await UserProgress.updateMany(
      { 
        user: req.userId,
        completed: true,
        completedAt: null
      },
      { 
        $set: { completedAt: new Date() }
      }
    );
    
    res.json({ 
      message: 'Migration complete',
      updated: result.modifiedCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
