const express = require('express');
const router = express.Router();
const Question = require('../models/Question');
const UserProgress = require('../models/UserProgress');
const CompletionHistory = require('../models/CompletionHistory');
const auth = require('../middleware/auth');

// Get all LinkedList questions with user progress
router.get('/', auth, async (req, res) => {
  try {
    const questions = await Question.find({ topic: 'LinkedList' })
      .sort({ difficulty: 1, name: 1 });
    
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

// Update LinkedList question completion status
router.patch('/:id', auth, async (req, res) => {
  try {
    const { completed } = req.body;
    const questionId = req.params.id;
    
    // Check if question exists and is a LinkedList question
    const question = await Question.findOne({ _id: questionId, topic: 'LinkedList' });
    if (!question) {
      return res.status(404).json({ message: 'LinkedList question not found' });
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
        await CompletionHistory.create({
          user: req.userId,
          question: questionId,
          completedAt: new Date()
        });
      }
    } else {
      // If marking as incomplete, remove from completion history
      await CompletionHistory.deleteOne({
        user: req.userId,
        question: questionId
      });
    }

    res.json({ 
      message: 'Question status updated successfully',
      completed: userProgress.completed 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get LinkedList questions statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const totalQuestions = await Question.countDocuments({ topic: 'LinkedList' });
    
    const completedQuestions = await UserProgress.countDocuments({
      user: req.userId,
      completed: true,
      question: { 
        $in: await Question.find({ topic: 'LinkedList' }).distinct('_id') 
      }
    });

    const userProgress = await UserProgress.find({
      user: req.userId,
      completed: true,
      question: { $in: await Question.find({ topic: 'LinkedList' }).distinct('_id') }
    });
    const completedQuestionIds = userProgress.map(p => p.question);

    const easyCompleted = await Question.countDocuments({ 
      _id: { $in: completedQuestionIds },
      difficulty: 'Easy',
      topic: 'LinkedList'
    });
    const mediumCompleted = await Question.countDocuments({ 
      _id: { $in: completedQuestionIds },
      difficulty: 'Medium',
      topic: 'LinkedList'
    });
    const hardCompleted = await Question.countDocuments({ 
      _id: { $in: completedQuestionIds },
      difficulty: 'Hard',
      topic: 'LinkedList'
    });

    res.json({
      total: totalQuestions,
      completed: completedQuestions,
      easyCompleted,
      mediumCompleted,
      hardCompleted,
      remaining: totalQuestions - completedQuestions,
      completionPercentage: totalQuestions > 0 ? Math.round((completedQuestions / totalQuestions) * 100) : 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get LinkedList questions statistics (alternative endpoint)
router.get('/stats/summary', auth, async (req, res) => {
// Get LinkedList questions statistics (alternative endpoint)
router.get('/stats/summary', auth, async (req, res) => {
  try {
    const totalQuestions = await Question.countDocuments({ topic: 'LinkedList' });
    
    const completedQuestions = await UserProgress.countDocuments({
      user: req.userId,
      completed: true,
      question: { 
        $in: await Question.find({ topic: 'LinkedList' }).distinct('_id') 
      }
    });

    const difficultyStats = await Question.aggregate([
      { $match: { topic: 'LinkedList' } },
      { $group: { _id: '$difficulty', count: { $sum: 1 } } }
    ]);

    const completedByDifficulty = await UserProgress.aggregate([
      {
        $lookup: {
          from: 'questions',
          localField: 'question',
          foreignField: '_id',
          as: 'questionInfo'
        }
      },
      { $unwind: '$questionInfo' },
      { 
        $match: { 
          user: req.userId, 
          completed: true,
          'questionInfo.topic': 'LinkedList'
        } 
      },
      { 
        $group: { 
          _id: '$questionInfo.difficulty', 
          count: { $sum: 1 } 
        } 
      }
    ]);

    res.json({
      total: totalQuestions,
      completed: completedQuestions,
      remaining: totalQuestions - completedQuestions,
      completionPercentage: totalQuestions > 0 ? Math.round((completedQuestions / totalQuestions) * 100) : 0,
      difficultyBreakdown: difficultyStats.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      completedByDifficulty: completedByDifficulty.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {})
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;