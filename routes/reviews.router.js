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

    res.status(200).json({
      success: true,
      stats: {
        averageRating: Number(averageRating.toFixed(1)),
        totalReviews,
        distribution
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error while fetching stats',
      error: error.message
    });
  }
});

module.exports = router;
    const review = new Review({
      user: userId,
      question: questionId,
      rating,
      reviewText: reviewText || ''
    });

    await review.save();

    // Populate user data
    await review.populate('user', 'username email');

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      review: review
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error submitting review',
      error: error.message
    });
  }
});

// GET - Get all reviews for a question
router.get('/reviews/question/:questionId', async (req, res) => {
  try {
    const { questionId } = req.params;

    const reviews = await Review.find({ question: questionId })
      .populate('user', 'username email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      totalReviews: reviews.length,
      reviews: reviews
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching reviews',
      error: error.message
    });
  }
});

// GET - Get average rating for a question
router.get('/reviews/question/:questionId/rating', async (req, res) => {
  try {
    const { questionId } = req.params;

    const result = await Review.aggregate([
      { $match: { question: require('mongoose').Types.ObjectId(questionId) } },
      {
        $group: {
          _id: '$question',
          avgRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          ratingDistribution: {
            $push: '$rating'
          }
        }
      }
    ]);

    if (result.length === 0) {
      return res.status(200).json({
        success: true,
        avgRating: 0,
        totalReviews: 0,
        ratingCounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      });
    }

    // Calculate rating distribution
    const ratings = result[0].ratingDistribution;
    const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratings.forEach(r => ratingCounts[r]++);

    res.status(200).json({
      success: true,
      avgRating: Math.round(result[0].avgRating * 10) / 10,
      totalReviews: result[0].totalReviews,
      ratingCounts: ratingCounts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching rating',
      error: error.message
    });
  }
});

// GET - Get reviews by user
router.get('/reviews/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const reviews = await Review.find({ user: userId })
      .populate('question', 'title description')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      totalReviews: reviews.length,
      reviews: reviews
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user reviews',
      error: error.message
    });
  }
});

// GET - Get single review
router.get('/reviews/:reviewId', async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId)
      .populate('user', 'username email')
      .populate('question', 'title description');

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    res.status(200).json({
      success: true,
      review: review
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching review',
      error: error.message
    });
  }
});

// PUT - Update a review
router.put('/reviews/:reviewId', async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { userId, rating, reviewText } = req.body;

    // Find review
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    // Check ownership
    if (review.user.toString() !== userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only update your own reviews' 
      });
    }

    // Validate rating if provided
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    // Update fields
    if (rating) review.rating = rating;
    if (reviewText !== undefined) review.reviewText = reviewText;
    review.updatedAt = new Date();

    await review.save();
    await review.populate('user', 'username email');

    res.status(200).json({
      success: true,
      message: 'Review updated successfully',
      review: review
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating review',
      error: error.message
    });
  }
});

// DELETE - Delete a review
router.delete('/reviews/:reviewId', async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { userId } = req.body;

    // Find review
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    // Check ownership
    if (review.user.toString() !== userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only delete your own reviews' 
      });
    }

    await Review.findByIdAndDelete(reviewId);

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting review',
      error: error.message
    });
  }
});

module.exports = router;
