const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const Question = require('./models/Question');
const UserProgress = require('./models/UserProgress');

const seedUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected for seeding users...');

    // Clear existing users and progress (optional - remove if you want to keep existing data)
    await User.deleteMany({});
    await UserProgress.deleteMany({});
    console.log('Cleared existing users and progress');

    // Hash password
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Create sample users
    const users = await User.create([
      {
        username: 'john_doe',
        email: 'john@example.com',
        password: hashedPassword
      },
      {
        username: 'jane_smith',
        email: 'jane@example.com',
        password: hashedPassword
      },
      {
        username: 'demo_user',
        email: 'demo@example.com',
        password: hashedPassword
      }
    ]);

    console.log('Created sample users:', users.length);

    // Get some questions to mark as completed
    const questions = await Question.find().limit(15);

    // Create progress for first user (john_doe) - completed 12 questions
    const johnProgress = [];
    for (let i = 0; i < 12; i++) {
      // Distribute completions over the last 30 days
      const daysAgo = Math.floor(Math.random() * 30);
      const completedDate = new Date();
      completedDate.setDate(completedDate.getDate() - daysAgo);

      johnProgress.push({
        user: users[0]._id,
        question: questions[i]._id,
        completed: true,
        completedAt: completedDate
      });
    }

    // Create progress for second user (jane_smith) - completed 8 questions
    const janeProgress = [];
    for (let i = 0; i < 8; i++) {
      const daysAgo = Math.floor(Math.random() * 20);
      const completedDate = new Date();
      completedDate.setDate(completedDate.getDate() - daysAgo);

      janeProgress.push({
        user: users[1]._id,
        question: questions[i]._id,
        completed: true,
        completedAt: completedDate
      });
    }

    // Create progress for third user (demo_user) - completed 5 questions
    const demoProgress = [];
    for (let i = 0; i < 5; i++) {
      const daysAgo = Math.floor(Math.random() * 10);
      const completedDate = new Date();
      completedDate.setDate(completedDate.getDate() - daysAgo);

      demoProgress.push({
        user: users[2]._id,
        question: questions[i]._id,
        completed: true,
        completedAt: completedDate
      });
    }

    // Insert all progress entries
    await UserProgress.insertMany([...johnProgress, ...janeProgress, ...demoProgress]);

    console.log('Created user progress entries');
    console.log('Sample credentials:');
    console.log('Username: john_doe | Email: john@example.com | Password: password123');
    console.log('Username: jane_smith | Email: jane@example.com | Password: password123');
    console.log('Username: demo_user | Email: demo@example.com | Password: password123');

    await mongoose.connection.close();
    console.log('Database seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding users:', error);
    process.exit(1);
  }
};

seedUsers();
