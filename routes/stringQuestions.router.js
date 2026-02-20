const express = require('express');
const router = express.Router();
const Question = require('../models/Question');
const UserProgress = require('../models/UserProgress');
const CompletionHistory = require('../models/CompletionHistory');
const auth = require('../middleware/auth');

const TOPIC = 'String';

// Get all string questions with user progress
router.get('/', auth, async (req, res) => {
  try {
    const questions = await Question.find({ topic: TOPIC }).sort({ difficulty: 1, name: 1 });

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
        { user: req.userId, question: questionId, dateKey: todayDateKey },
        { user: req.userId, question: questionId, completedAt: now, dateKey: todayDateKey },
        { upsert: true, new: true }
      );

      userProgress = await UserProgress.findOneAndUpdate(
        { user: req.userId, question: questionId },
        {
          completed: true,
          completedAt: now,
          lastStateChangeAt: now,
          $inc: { completionCount: 1 }
        },
        { new: true, upsert: true }
      );
    } else {
      userProgress = await UserProgress.findOneAndUpdate(
        { user: req.userId, question: questionId },
        { completed: false, lastStateChangeAt: now },
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
    const total = await Question.countDocuments({ topic: TOPIC });
    const allStringQuestions = await Question.find({ topic: TOPIC }, '_id difficulty');
    const allIds = allStringQuestions.map(q => q._id);

    const userProgress = await UserProgress.find({
      user: req.userId,
      question: { $in: allIds },
      completed: true
    });
    const completedQuestionIds = userProgress.map(p => p.question);

    const completed = completedQuestionIds.length;
    const easyCompleted = allStringQuestions.filter(
      q => q.difficulty === 'Easy' && completedQuestionIds.some(id => id.equals(q._id))
    ).length;
    const mediumCompleted = allStringQuestions.filter(
      q => q.difficulty === 'Medium' && completedQuestionIds.some(id => id.equals(q._id))
    ).length;
    const hardCompleted = allStringQuestions.filter(
      q => q.difficulty === 'Hard' && completedQuestionIds.some(id => id.equals(q._id))
    ).length;

    res.json({ total, completed, easyCompleted, mediumCompleted, hardCompleted });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
