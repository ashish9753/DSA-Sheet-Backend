const mongoose = require('mongoose');
const Question = require('./models/Question');
require('dotenv').config();

const binarySearchQuestions = [
  // BS on 1D Arrays
  {
    name: "Binary Search to find X in sorted array",
    leetcodeLink: "https://leetcode.com/problems/binary-search/",
    gfgLink: "https://www.geeksforgeeks.org/problems/binary-search-1587115620/1",
    difficulty: "Easy",
    topic: "Binary Search"
  },
  {
    name: "Implement Lower Bound",
    leetcodeLink: "https://leetcode.com/problems/search-insert-position/",
    gfgLink: "https://www.geeksforgeeks.org/problems/lower-bound/1",
    difficulty: "Easy",
    topic: "Binary Search"
  },
  {
    name: "Implement Upper Bound",
    leetcodeLink: "https://leetcode.com/problems/find-first-and-last-position-of-element-in-sorted-array/",
    gfgLink: "https://www.geeksforgeeks.org/problems/upper-bound/1",
    difficulty: "Easy",
    topic: "Binary Search"
  },
  {
    name: "Search Insert Position",
    leetcodeLink: "https://leetcode.com/problems/search-insert-position/",
    gfgLink: "https://www.geeksforgeeks.org/problems/search-insert-position-of-k-in-a-sorted-array/1",
    difficulty: "Easy",
    topic: "Binary Search"
  },
  {
    name: "Floor/Ceil in Sorted Array",
    leetcodeLink: "https://leetcode.com/problems/search-insert-position/",
    gfgLink: "https://www.geeksforgeeks.org/problems/floor-in-a-sorted-array-1587115620/1",
    difficulty: "Easy",
    topic: "Binary Search"
  },
  {
    name: "Find the first or last occurrence of a given number in a sorted array",
    leetcodeLink: "https://leetcode.com/problems/find-first-and-last-position-of-element-in-sorted-array/",
    gfgLink: "https://www.geeksforgeeks.org/problems/first-and-last-occurrences-of-x/0",
    difficulty: "Easy",
    topic: "Binary Search"
  },
  {
    name: "Count occurrences of a number in a sorted array with duplicates",
    leetcodeLink: "https://leetcode.com/problems/find-first-and-last-position-of-element-in-sorted-array/",
    gfgLink: "https://www.geeksforgeeks.org/problems/number-of-occurrence2259/1",
    difficulty: "Easy",
    topic: "Binary Search"
  },
  {
    name: "Search in Rotated Sorted Array I",
    leetcodeLink: "https://leetcode.com/problems/search-in-rotated-sorted-array/",
    gfgLink: "https://www.geeksforgeeks.org/problems/search-in-a-rotated-array4618/1",
    difficulty: "Medium",
    topic: "Binary Search"
  },
  {
    name: "Search in Rotated Sorted Array II",
    leetcodeLink: "https://leetcode.com/problems/search-in-rotated-sorted-array-ii/",
    gfgLink: "https://www.geeksforgeeks.org/problems/search-in-rotated-array-2/1",
    difficulty: "Medium",
    topic: "Binary Search"
  },
  {
    name: "Find minimum in Rotated Sorted Array",
    leetcodeLink: "https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/",
    gfgLink: "https://www.geeksforgeeks.org/problems/minimum-number-in-a-sorted-rotated-array-1587115620/1",
    difficulty: "Easy",
    topic: "Binary Search"
  },
  {
    name: "Find out how many times has an array been rotated",
    leetcodeLink: "https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/",
    gfgLink: "https://www.geeksforgeeks.org/problems/rotation4723/1",
    difficulty: "Easy",
    topic: "Binary Search"
  },
  {
    name: "Single element in a Sorted Array",
    leetcodeLink: "https://leetcode.com/problems/single-element-in-a-sorted-array/",
    gfgLink: "https://www.geeksforgeeks.org/problems/find-the-element-that-appears-once-in-sorted-array0624/1",
    difficulty: "Medium",
    topic: "Binary Search"
  },
  {
    name: "Find peak element",
    leetcodeLink: "https://leetcode.com/problems/find-peak-element/",
    gfgLink: "https://www.geeksforgeeks.org/problems/peak-element/1",
    difficulty: "Medium",
    topic: "Binary Search"
  }
];

async function seedBinarySearchQuestions() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected successfully');

    // Remove existing binary search questions to avoid duplicates
    await Question.deleteMany({ topic: 'Binary Search' });
    console.log('Cleared existing Binary Search questions');

    // Insert new questions
    const result = await Question.insertMany(binarySearchQuestions);
    console.log(`Successfully added ${result.length} Binary Search questions`);

    await mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error seeding Binary Search questions:', error);
    process.exit(1);
  }
}

seedBinarySearchQuestions();
