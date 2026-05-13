const express = require('express');
const router = express.Router();
const User = require('../models/User');
const CompletionHistory = require('../models/CompletionHistory');

// Get leaderboard with all users and their completed questions count
router.get('/leaderboard', async (req, res) => {
  try {
    // Aggregate to get users with their completion counts
    const leaderboard = await User.aggregate([
      {
        $lookup: {
          from: 'completionhistories',
          localField: '_id',
          foreignField: 'user',
          as: 'completions'
        }
      },
      {
        $project: {
          username: 1,
          email: 1,
          completedQuestionsCount: { $size: '$completions' },
          createdAt: 1
        }
      },
      {
        $sort: { completedQuestionsCount: -1 }
      }
    ]);

    res.status(200).json({
      success: true,
      totalUsers: leaderboard.length,
      leaderboard: leaderboard
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching leaderboard',
      error: error.message
    });
  }
});

// Get leaderboard with detailed stats per user
router.get('/leaderboard/detailed', async (req, res) => {
  try {
    const leaderboardDetails = await User.aggregate([
      {
        $lookup: {
          from: 'completionhistories',
          localField: '_id',
          foreignField: 'user',
          as: 'completions'
        }
      },
      {
        $project: {
          userId: '$_id',
          username: 1,
          email: 1,
          completedQuestionsCount: { $size: '$completions' },
          joinedAt: '$createdAt'
        }
      },
      {
        $sort: { completedQuestionsCount: -1 }
      }
    ]);

    res.status(200).json({
      success: true,
      totalUsers: leaderboardDetails.length,
      leaderboard: leaderboardDetails
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching detailed leaderboard',
      error: error.message
    });
  }
});

// Get single user stats
router.get('/leaderboard/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select('username email createdAt');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const completionCount = await CompletionHistory.countDocuments({ user: userId });

    res.status(200).json({
      success: true,
      user: {
        userId: user._id,
        username: user.username,
        email: user.email,
        completedQuestionsCount: completionCount,
        joinedAt: user.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user stats',
      error: error.message
    });
  }
});

module.exports = router;
