const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const User = require('../models/User');
const auth = require('../middleware/auth'); // Using the actual JWT auth middleware

// @route   POST /api/website
// @desc    Create or update a review for the overall website
// @access  Private
router.post('/website', auth, async (req, res) => {
  try {
    const { rating, review, reviewText } = req.body;
    const finalReview = review || reviewText; // The frontend uses "review", the model historically used "reviewText"
    const userId = req.userId; // From auth middleware

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    if (!finalReview || finalReview.trim() === '') {
      return res.status(400).json({ success: false, message: 'Please provide a review text' });
    }

    // Check if user already reviewed the website
    let reviewDoc = await Review.findOne({ user: userId });

    if (reviewDoc) {
      // Update existing review
      reviewDoc.rating = rating;
      reviewDoc.reviewText = finalReview;
      reviewDoc.updatedAt = Date.now();
      await reviewDoc.save();
    } else {
      // Create new review
      reviewDoc = new Review({
        user: userId,
        rating,
        reviewText: finalReview
      });
      await reviewDoc.save();
    }

    // Populate user info for frontend
    await reviewDoc.populate('user', 'username');

    // Return the response format expected by your frontend
    const responseDoc = {
      ...reviewDoc.toObject(),
      review: reviewDoc.reviewText
    };

    res.status(200).json({
      success: true,
      message: 'Review saved successfully',
      review: responseDoc
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error while saving review',
      error: error.message
    });
  }
});

// @route   GET /api/website
// @desc    Get all website reviews
// @access  Public
router.get('/website', async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate('user', 'username')
      .sort({ createdAt: -1 });

    // Map `reviewText` to `review` so frontend correctly displays the text
    const formattedReviews = reviews.map(r => ({
      ...r.toObject(),
      review: r.reviewText 
    }));

    res.status(200).json({
      success: true,
      count: formattedReviews.length,
      reviews: formattedReviews
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error while fetching reviews',
      error: error.message
    });
  }
});

// @route   GET /api/website/stats
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
        averageRating: 0,
        totalReviews: 0,
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
      averageRating: Number(averageRating.toFixed(1)),
      totalReviews,
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

// @route   DELETE /api/reviews/:reviewId
// @desc    Delete a review
// @access  Private
router.delete('/reviews/:reviewId', auth, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.userId;

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
