const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const Review = require('../models/Review');

const userNames = [
  "Rahul", "Priya", "Amit", "Sneha", "Rohan", "Neha", "Vikram", "Pooja", "Sachin", "Kavita",
  "Suresh", "Divya", "Anil", "Aarti", "Sunil", "Rekha", "Manoj", "Anjali", "Rakesh", "Kiran",
  "Rajesh", "Swati", "Sanjay", "Sonal", "Vijay", "Megha", "Dinesh", "Ritu", "Ajay", "Pallavi",
  "Ramesh", "Deepa", "Deepak", "Nidhi", "Kapil", "Shweta", "Niraj", "Geeta", "Manish", "Sonali",
  "Vivek", "Kirti", "Gaurav", "Shruti", "Tarun", "Monika", "Ashok", "Shikha", "Pradeep", "Vandana",
  "Praveen", "Rani", "Naveen", "Nisha", "Yogesh", "Preeti", "Saurabh", "Archana", "Nitin", "Shilpa",
  "Prakash", "Anita", "Hemant", "Rashmi", "Alok", "Poonam", "Lalit", "Suman", "Vikas", "Sarita",
  "Harish", "Asha", "Satish", "Mamta", "Kamal", "Shalu", "Prashant", "Komal", "Sandeep", "Jyoti",
  "Ashish", "Meena", "Sameer", "Seema", "Sushil", "Usha", "Mukesh", "Savita", "Bipin", "Bhavna",
  "Mohit", "Payal", "Anand", "Rachna", "Sumit", "Neha", "Kapil", "Renuka", "Rajan", "Radhika"
];

const reviewsTexts = [
  "Bhai mast sheet hai, it really helped me prep for my interviews.",
  "Very helpful collection of questions, definitely recommending to my juniors.",
  "Good platform, but the UI can be improved a bit on mobile devices.",
  "Ache questions hain yaar, covered almost all standard patterns.",
  "Needs dark mode support urgently. Else it's pretty decent.",
  "Perfect for TCS and Infosys prep. Sahi hai.",
  "Tracking feature is great, I like marking my completed problems.",
  "Could use a few more advanced DP questions, but otherwise good.",
  "Sometimes the website lags, but the content is very solid.",
  "Awesome DSA sheet! Helped me clear my core concepts easily.",
  "Good job by the creator. Helped me structure my daily practice.",
  "Questions are good but would love to see some hints or solutions attached.",
  "Decent platform for beginners starting out with DSA.",
  "Very structured and systematic approach. Nice work.",
  "Sahi chal raha hai, definitely use this if you have placements coming up.",
  "Saved me a lot of time searching for questions everywhere. Thank you!",
  "A bit buggy when marking questions complete, please fix that.",
  "Excellent list! Just missing some graph advanced algorithms.",
  "Great initiative! It's like my daily tracker now.",
  "Not bad, but there are other platforms with better UI."
];

const seed100Reviews = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB. Seeding 100 Indian users and reviews...');

    // Clear existing if any? No, let's just append or create unique. We use timestamps to make unique usernames
    const timestamp = Date.now();

    for (let i = 0; i < 100; i++) {
        // Randomly pick a name and add some numbers to make it unique
        const baseName = userNames[i % userNames.length];
        const username = `${baseName.toLowerCase()}_${timestamp}_${i}`;
        const email = `${username}@example.com`;
        const password = 'password123';

        // Choose Rating:
        // Only 5 out of 100 people give 5 star. (i < 5) gets 5.
        // The remaining 95 get max 4 stars (1 to 4).
        let rating = 4;
        if (i < 5) {
            rating = 5;
        } else {
            // Random rating between 3 and 4 mostly, occasional 1 or 2
            const random = Math.random();
            if (random < 0.6) rating = 4;
            else if (random < 0.9) rating = 3;
            else if (random < 0.95) rating = 2;
            else rating = 1;
        }

        // Random review text
        const reviewText = reviewsTexts[Math.floor(Math.random() * reviewsTexts.length)];

        // Create user
        const user = new User({
            username,
            email,
            password
        });
        await user.save();

        // Create review
        const review = new Review({
            user: user._id,
            rating,
            reviewText
        });
        await review.save();
    }

    console.log('Successfully seeded 100 Indian users and their reviews!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding:', error);
    process.exit(1);
  }
};

seed100Reviews();