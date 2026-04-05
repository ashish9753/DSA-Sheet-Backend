const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const Review = require('../models/Review');

const seedReviews = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected successfully for seeding');

    // Create 10 dummy users and their reviews
    const dummyReviewsData = [
      { rating: 5, reviewText: "This website has helped me so much with my data structures preparation!" },
      { rating: 4, reviewText: "Great collection of questions. Needs a few more topics though." },
      { rating: 5, reviewText: "The progress tracking is a game-changer. Highly recommended!" },
      { rating: 3, reviewText: "It's decent, but the UI could be improved a bit." },
      { rating: 5, reviewText: "Best place to practice DSA. Covered all my interview top patterns." },
      { rating: 4, reviewText: "Very structured and systematic approach. Loved the DP section." },
      { rating: 5, reviewText: "Absolutely amazing! Finally, a good place without distractions." },
      { rating: 4, reviewText: "Really helpful sheet. Managed to clear my core concepts." },
      { rating: 5, reviewText: "Perfect for quick revision before tech interviews." },
      { rating: 2, reviewText: "Good, but I encountered some bugs while marking things done." }
    ];

    console.log('Creating 10 dummy users and reviews...');

    for (let i = 0; i < dummyReviewsData.length; i++) {
      const username = `dummyuser${i + Date.now()}`;
      const email = `${username}@example.com`;
      const password = 'password123'; // Some random password

      // Create dummy user
      const user = new User({
        username,
        email,
        password
      });
      await user.save();

      // Create dummy review
      const review = new Review({
        user: user._id,
        rating: dummyReviewsData[i].rating,
        reviewText: dummyReviewsData[i].reviewText
      });
      await review.save();
    }

    console.log('Successfully seeded 10 dummy reviews!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding reviews:', error);
    process.exit(1);
  }
};

seedReviews();
