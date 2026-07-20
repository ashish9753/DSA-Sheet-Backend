const express = require('express');
const router = express.Router();
const Question = require('../models/Question');
const UserProgress = require('../models/UserProgress');
const CompletionHistory = require('../models/CompletionHistory');
const auth = require('../middleware/auth');

// Get all graphs questions with user progress
router.get('/', auth, async (req, res) => {
  try {
    const questions = await Question.find({ topic: 'Graphs' }).sort({ difficulty: 1, name: 1 });

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
    console.error('Error fetching graphs questions:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Toggle question completion
router.patch('/:id', auth, async (req, res) => {
  try {
    const { completed } = req.body;
    const questionId = req.params.id;

    let userProgress = await UserProgress.findOne({
      user: req.userId,
      question: questionId
    });

    if (userProgress) {
      userProgress.completed = completed;
      await userProgress.save();
    } else {
      userProgress = new UserProgress({
        user: req.userId,
        question: questionId,
        completed
      });
      await userProgress.save();
    }

    if (completed) {
      // Record in completion history (one entry per day per question) so the
      // activity graph picks it up. Must match the CompletionHistory schema:
      // question (singular) + dateKey are required.
      const now = new Date();
      const todayDateKey = now.toISOString().split('T')[0];

      await CompletionHistory.findOneAndUpdate(
        { user: req.userId, question: questionId, dateKey: todayDateKey },
        { user: req.userId, question: questionId, completedAt: now, dateKey: todayDateKey },
        { upsert: true, new: true }
      );
    }

    res.json({ message: 'Progress updated', completed });
  } catch (error) {
    console.error('Error updating graphs question progress:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get stats summary
router.get('/stats/summary', auth, async (req, res) => {
  try {
    const questions = await Question.find({ topic: 'Graphs' });
    const questionIds = questions.map(q => q._id);

    const userProgress = await UserProgress.find({
      user: req.userId,
      question: { $in: questionIds },
      completed: true
    });

    const completedIds = new Set(userProgress.map(p => p.question.toString()));

    const total = questions.length;
    const completed = completedIds.size;
    const easyCompleted = questions.filter(q => q.difficulty === 'Easy' && completedIds.has(q._id.toString())).length;
    const mediumCompleted = questions.filter(q => q.difficulty === 'Medium' && completedIds.has(q._id.toString())).length;
    const hardCompleted = questions.filter(q => q.difficulty === 'Hard' && completedIds.has(q._id.toString())).length;

    res.json({ total, completed, easyCompleted, mediumCompleted, hardCompleted });
  } catch (error) {
    console.error('Error fetching graphs stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get activity data
router.get('/stats/activity', auth, async (req, res) => {
  try {
    const history = await CompletionHistory.find({ user: req.userId });
    const activityMap = {};
    history.forEach(entry => {
      const dateStr = entry.dateKey;
      activityMap[dateStr] = (activityMap[dateStr] || 0) + 1;
    });
    res.json(activityMap);
  } catch (error) {
    console.error('Error fetching graphs activity:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
