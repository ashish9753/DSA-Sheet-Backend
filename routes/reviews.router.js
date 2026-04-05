const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const User = require('../models/User');
const auth = require('../middleware/auth'); // Using the actual JWT auth middleware

// @route   POST /api/reviews/website
// @desc    Create or update a review for the overall website
// @access  Private
router.post('/website', auth, async (req, res) => {
  try {
    const { rating, reviewText } = req.body;
    const userId = req.userId; // From auth middleware

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    if (!reviewText || reviewText.trim() === '') {
      return res.status(400).json({ success: false, message: 'Please provide a review text' });
    }

    // Check if user already reviewed the website
    let review = await Review.findOne({ user: userId });

    if (review) {
      // Update existing review
      review.rating = rating;
      review.reviewText = reviewText;
      review.updatedAt = Date.now();
      await review.save();
    } else {
      // Create new review
      review = new Review({
        user: userId,
        rating,
        reviewText
      });
      await review.save();
    }

    // Populate user info for frontend
    await review.populate('user', 'username');

    res.status(200).json({
      success: true,
      message: 'Review saved successfully',
      review
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error while saving review',
      error: error.message
    });
  }
});

// @route   GET /api/reviews/website
// @desc    Get all website reviews
// @access  Public
router.get('/website', async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate('user', 'username')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reviews.length,
      reviews
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error while fetching reviews',
      error: error.message
    });
  }
});

// @route   GET /api/reviews/website/stats
// @desc    Get overall website review statistics
// @access  Public
router.get('/website/stats', async (req, res) => {
  try {
    const stats = await Review.aggregate([
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          starCounts: { $push: '$rating' }
        }
      }
    ]);

    if (stats.length === 0) {
      return res.status(200).json({
        success: true,
        stats: {
          averageRating: 0,
          totalReviews: 0,
          distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        }
      });
    }

    const { averageRating, totalReviews, starCounts } = stats[0];
    
    // Calculate star distribution
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    starCounts.forEach(star => {
      if (distribution[star] !== undefined) {
        distribution[star]++;
      }
    });