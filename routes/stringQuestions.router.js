const express = require('express');
const router = express.Router();
const Question = require('../models/Question');
const UserProgress = require('../models/UserProgress');
const CompletionHistory = require('../models/CompletionHistory');
const auth = require('../middleware/auth');

// Get all string questions with user progress
router.get('/', auth, async (req, res) => {
  try {
    const questions = await Question.find({ topic: 'String' }).sort({ difficulty: 1, name: 1 });
    
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
    
    const now = new Date();
    const todayDateKey = now.toISOString().split('T')[0];
    
    // Get current progress
    let userProgress = await UserProgress.findOne({
      user: req.userId,
      question: questionId
    });
    
    if (completed) {
      // User is marking the question as completed
      
      // Record in completion history (one entry per day per question)
      // This will create a new entry or update if already exists for today
      await CompletionHistory.findOneAndUpdate(
        {
          user: req.userId,
          question: questionId,
          dateKey: todayDateKey
        },
        {
          user: req.userId,
          question: questionId,
          completedAt: now,
          dateKey: todayDateKey
        },
        { upsert: true, new: true }
      );
      
      // Update user progress
      const updateData = {
        completed: true,
        completedAt: now,
        lastStateChangeAt: now,
        $inc: { completionCount: 1 }
      };
      
      userProgress = await UserProgress.findOneAndUpdate(
        { user: req.userId, question: questionId },
        updateData,
        { new: true, upsert: true }
      );
    } else {
      // User is unmarking the question
      // We keep the completion history intact (never delete)
      // Only update the current status
      
      const updateData = {
        completed: false,
        lastStateChangeAt: now
        // Don't change completedAt or completionCount when unmarking
      };
      
      userProgress = await UserProgress.findOneAndUpdate(
        { user: req.userId, question: questionId },
        updateData,
        { new: true, upsert: true }
      );
    }
    
    res.json({ ...question.toObject(), completed: userProgress.completed });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get statistics for string questions
router.get('/stats/summary', auth, async (req, res) => {
  try {
    const total = await Question.countDocuments({ topic: 'String' });
    const userProgress = await UserProgress.find({ user: req.userId, completed: true });
    const completedQuestionIds = userProgress.map(p => p.question);
    
    const completed = await Question.countDocuments({
      _id: { $in: completedQuestionIds },
      topic: 'String'
    });
    const easyCompleted = await Question.countDocuments({ 
      _id: { $in: completedQuestionIds },
      difficulty: 'Easy',
      topic: 'String'
    });
    const mediumCompleted = await Question.countDocuments({ 
      _id: { $in: completedQuestionIds },
      difficulty: 'Medium',
      topic: 'String'
    });
    const hardCompleted = await Question.countDocuments({ 
      _id: { $in: completedQuestionIds },
      difficulty: 'Hard',
      topic: 'String'
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

// Get daily activity for contribution heatmap (string questions only)
router.get('/stats/activity', auth, async (req, res) => {
  try {
    // Get string question IDs
    const stringQuestions = await Question.find({ topic: 'String' }).select('_id');
    const stringQuestionIds = stringQuestions.map(q => q._id);
    
    // Get all completion history entries for this user's string questions
    const completionHistory = await CompletionHistory.find({ 
      user: req.userId,
      question: { $in: stringQuestionIds }
    }).sort({ completedAt: 1 });
    
    // Group by date and count unique questions per day
    const activityMap = {};
    
    completionHistory.forEach(entry => {
      const date = entry.dateKey;
      activityMap[date] = (activityMap[date] || 0) + 1;
    });
    
    res.json(activityMap);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;