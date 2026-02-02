const express = require('express');
const router = express.Router();
const Question = require('../models/Question');
const UserProgress = require('../models/UserProgress');
const CompletionHistory = require('../models/CompletionHistory');
const auth = require('../middleware/auth');

// Get all DP questions with user progress
router.get('/', auth, async (req, res) => {
  try {
    const { topic } = req.query;
    const filter = topic ? { topic } : { topic: { $regex: /^DP/i } };
    const questions = await Question.find(filter).sort({ topic: 1, name: 1 });
    
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
    
    // Find or create user progress
    let userProgress = await UserProgress.findOne({
      user: req.userId,
      question: questionId
    });
    
    if (!userProgress) {
      userProgress = new UserProgress({
        user: req.userId,
        question: questionId,
        completed: completed
      });
    } else {
      userProgress.completed = completed;
    }
    
    await userProgress.save();
    
    // If marking as completed, add to completion history
    if (completed) {
      const existingHistory = await CompletionHistory.findOne({
        user: req.userId,
        question: questionId
      });
      
      if (!existingHistory) {
        const completionHistory = new CompletionHistory({
          user: req.userId,
          question: questionId
        });
        await completionHistory.save();
      }
    }
    
    res.json({ message: 'Progress updated successfully', completed });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user's DP progress summary
router.get('/progress/summary', auth, async (req, res) => {
  try {
    const dpQuestions = await Question.find({ topic: { $regex: /^DP/i } });
    const questionIds = dpQuestions.map(q => q._id);
    
    const userProgress = await UserProgress.find({
      user: req.userId,
      question: { $in: questionIds },
      completed: true
    });
    
    const totalQuestions = dpQuestions.length;
    const completedQuestions = userProgress.length;
    
    // Group by topic
    const topicProgress = {};
    dpQuestions.forEach(q => {
      if (!topicProgress[q.topic]) {
        topicProgress[q.topic] = { total: 0, completed: 0 };
      }
      topicProgress[q.topic].total++;
    });
    
    userProgress.forEach(progress => {
      const question = dpQuestions.find(q => q._id.toString() === progress.question.toString());
      if (question && topicProgress[question.topic]) {
        topicProgress[question.topic].completed++;
      }
    });
    
    res.json({
      totalQuestions,
      completedQuestions,
      percentage: totalQuestions > 0 ? ((completedQuestions / totalQuestions) * 100).toFixed(2) : 0,
      topicProgress
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
