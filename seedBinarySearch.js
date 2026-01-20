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
  },

  // BS on Answers
  {
    name: "Find square root of a number in log n",
    leetcodeLink: "https://leetcode.com/problems/sqrtx/",
    gfgLink: "https://www.geeksforgeeks.org/problems/square-root/1",
    difficulty: "Medium",
    topic: "Binary Search"
  },
  {
    name: "Find the Nth root of a number using binary search",
    leetcodeLink: "https://leetcode.com/problems/powx-n/",
    gfgLink: "https://www.geeksforgeeks.org/problems/find-nth-root-of-m5843/1",
    difficulty: "Medium",
    topic: "Binary Search"
  },
  {
    name: "Koko Eating Bananas",
    leetcodeLink: "https://leetcode.com/problems/koko-eating-bananas/",
    gfgLink: "https://www.geeksforgeeks.org/problems/koko-eating-bananas/1",
    difficulty: "Medium",
    topic: "Binary Search"
  },
  {
    name: "Minimum days to make M bouquets",
    leetcodeLink: "https://leetcode.com/problems/minimum-number-of-days-to-make-m-bouquets/",
    gfgLink: "https://www.geeksforgeeks.org/problems/minimum-days-to-make-m-bouquets/1",
    difficulty: "Medium",
    topic: "Binary Search"
  },
  {
    name: "Find the smallest Divisor",
    leetcodeLink: "https://leetcode.com/problems/find-the-smallest-divisor-given-a-threshold/",
    gfgLink: "https://www.geeksforgeeks.org/problems/smallest-divisor/1",
    difficulty: "Medium",
    topic: "Binary Search"
  },
  {
    name: "Capacity to Ship Packages within D Days",
    leetcodeLink: "https://leetcode.com/problems/capacity-to-ship-packages-within-d-days/",
    gfgLink: "https://www.geeksforgeeks.org/problems/capacity-to-ship-packages-within-d-days/1",
    difficulty: "Hard",
    topic: "Binary Search"
  },
  {
    name: "Kth Missing Positive Number",
    leetcodeLink: "https://leetcode.com/problems/kth-missing-positive-number/",
    gfgLink: "https://www.geeksforgeeks.org/problems/kth-missing-positive-number/1",
    difficulty: "Easy",
    topic: "Binary Search"
  },
  {
    name: "Aggressive Cows",
    leetcodeLink: "https://leetcode.com/problems/magnetic-force-between-two-balls/",
    gfgLink: "https://www.geeksforgeeks.org/problems/aggressive-cows/1",
    difficulty: "Hard",
    topic: "Binary Search"
  },
  {
    name: "Book Allocation Problem",
    leetcodeLink: "https://leetcode.com/problems/split-array-largest-sum/",
    gfgLink: "https://www.geeksforgeeks.org/problems/allocate-minimum-number-of-pages0937/1",
    difficulty: "Hard",
    topic: "Binary Search"
  },
  {
    name: "Split array - Largest Sum",
    leetcodeLink: "https://leetcode.com/problems/split-array-largest-sum/",
    gfgLink: "https://www.geeksforgeeks.org/problems/split-array-largest-sum/1",
    difficulty: "Hard",
    topic: "Binary Search"
  },
  {
    name: "Painter's Partition",
    leetcodeLink: "https://leetcode.com/problems/split-array-largest-sum/",
    gfgLink: "https://www.geeksforgeeks.org/problems/the-painters-partition-problem1535/1",
    difficulty: "Hard",
    topic: "Binary Search"
  },
  {
    name: "Minimize Max Distance to Gas Station",
    leetcodeLink: "https://leetcode.com/problems/minimize-max-distance-to-gas-station/",
    gfgLink: "https://www.geeksforgeeks.org/problems/minimize-max-distance-to-gas-station/1",
    difficulty: "Hard",
    topic: "Binary Search"
  },
  {
    name: "Median of 2 sorted arrays",
    leetcodeLink: "https://leetcode.com/problems/median-of-two-sorted-arrays/",
    gfgLink: "https://www.geeksforgeeks.org/problems/median-of-two-sorted-arrays1618/1",
    difficulty: "Hard",
    topic: "Binary Search"
  },
  {
    name: "Kth element of 2 sorted arrays",
    leetcodeLink: "https://leetcode.com/problems/kth-smallest-element-in-a-sorted-matrix/",
    gfgLink: "https://www.geeksforgeeks.org/problems/k-th-element-of-two-sorted-array1317/1",
    difficulty: "Medium",
    topic: "Binary Search"
  },

  // BS on 2D Arrays
  {
    name: "Find the row with maximum number of 1's",
    leetcodeLink: "https://leetcode.com/problems/row-with-maximum-ones/",
    gfgLink: "https://www.geeksforgeeks.org/problems/row-with-max-1s0023/1",
    difficulty: "Easy",
    topic: "Binary Search"
  },
  {
    name: "Search in a 2D matrix",
    leetcodeLink: "https://leetcode.com/problems/search-a-2d-matrix/",
    gfgLink: "https://www.geeksforgeeks.org/problems/search-in-a-matrix-1587115621/1",
    difficulty: "Hard",
    topic: "Binary Search"
  },
  {
    name: "Search in a row and column wise sorted matrix",
    leetcodeLink: "https://leetcode.com/problems/search-a-2d-matrix-ii/",
    gfgLink: "https://www.geeksforgeeks.org/problems/search-in-a-row-wise-and-column-wise-sorted-matrix/1",
    difficulty: "Hard",
    topic: "Binary Search"
  },
  {
    name: "Find Peak Element (2D Matrix)",
    leetcodeLink: "https://leetcode.com/problems/find-a-peak-element-ii/",
    gfgLink: "https://www.geeksforgeeks.org/problems/find-peak-element-in-2d-matrix/1",
    difficulty: "Medium",
    topic: "Binary Search"
  },
  {
    name: "Matrix Median",
    leetcodeLink: "https://leetcode.com/problems/median-of-two-sorted-arrays/",
    gfgLink: "https://www.geeksforgeeks.org/problems/median-in-a-row-wise-sorted-matrix1527/1",
    difficulty: "Hard",
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
