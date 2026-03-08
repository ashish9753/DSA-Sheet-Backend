const express = require('express');
const router = express.Router();
const Question = require('../models/Question');
const UserProgress = require('../models/UserProgress');
const CompletionHistory = require('../models/CompletionHistory');
const auth = require('../middleware/auth');

// Get all bit manipulation questions with user progress
router.get('/', auth, async (req, res) => {
  try {
    const questions = await Question.find({ topic: 'Bit Manipulation' }).sort({ difficulty: 1, name: 1 });

    const questionIds = questions.map(q => q._id);
    const userProgress = await UserProgress.find({
      user: req.userId,
      question: { $in: questionIds }
    });

    const progressMap = {};
    userProgress.forEach(progress => {
      progressMap[progress.question.toString()] = progress.completed;
    });

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

    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    const now = new Date();
    const todayDateKey = now.toISOString().split('T')[0];

    let userProgress = await UserProgress.findOne({
      user: req.userId,
      question: questionId
    });

    if (completed) {
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
      const updateData = {
        completed: false,
        lastStateChangeAt: now
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

// Get statistics
router.get('/stats/summary', auth, async (req, res) => {
  try {
    const total = await Question.countDocuments({ topic: 'Bit Manipulation' });
    const allQuestions = await Question.find({ topic: 'Bit Manipulation' }, '_id');
    const questionIds = allQuestions.map(q => q._id);

    const userProgress = await UserProgress.find({
      user: req.userId,
      question: { $in: questionIds },
      completed: true
    });
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
    const completionHistory = await CompletionHistory.find({
      user: req.userId
    }).sort({ completedAt: 1 });

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
