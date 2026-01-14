const mongoose = require('mongoose');
const Question = require('./models/Question');
require('dotenv').config();

const questions = [
  // Easy Questions
  { name: "Largest Element in an Array", leetcodeLink: "https://leetcode.com/problems/largest-number-at-least-twice-of-others/", gfgLink: "https://www.geeksforgeeks.org/problems/largest-element-in-array4009/1", difficulty: "Easy", topic: "Array" },
  { name: "Second Largest Element in an Array without sorting", leetcodeLink: "https://leetcode.com/problems/second-largest-digit-in-a-string/", gfgLink: "https://www.geeksforgeeks.org/problems/second-largest3735/1", difficulty: "Easy", topic: "Array" },
  { name: "Check if the array is sorted", leetcodeLink: "https://leetcode.com/problems/check-if-array-is-sorted-and-rotated/", gfgLink: "https://www.geeksforgeeks.org/problems/check-if-array-is-sorted-and-rotated-clockwise-1587115620/1", difficulty: "Easy", topic: "Array" },
  { name: "Remove duplicates from Sorted array", leetcodeLink: "https://leetcode.com/problems/remove-duplicates-from-sorted-array/", gfgLink: "https://www.geeksforgeeks.org/problems/remove-duplicate-elements-from-sorted-array/1", difficulty: "Easy", topic: "Array" },
  { name: "Left Rotate an array by one place", leetcodeLink: "https://leetcode.com/problems/rotate-array/", gfgLink: "https://www.geeksforgeeks.org/problems/rotate-array-by-one-1587115621/1", difficulty: "Easy", topic: "Array" },
  { name: "Left rotate an array by D places", leetcodeLink: "https://leetcode.com/problems/rotate-array/", gfgLink: "https://www.geeksforgeeks.org/problems/rotate-array-by-n-elements/1", difficulty: "Easy", topic: "Array" },
  { name: "Move Zeros to end", leetcodeLink: "https://leetcode.com/problems/move-zeroes/", gfgLink: "https://www.geeksforgeeks.org/problems/move-all-zeroes-to-end-of-array0751/1", difficulty: "Easy", topic: "Array" },
  { name: "Linear Search", leetcodeLink: "https://leetcode.com/problems/find-target-indices-after-sorting-array/", gfgLink: "https://www.geeksforgeeks.org/problems/search-an-element-in-an-array-1587115621/1", difficulty: "Easy", topic: "Array" },
  { name: "Find the Union", leetcodeLink: "https://leetcode.com/problems/union-of-two-arrays-ii/", gfgLink: "https://www.geeksforgeeks.org/problems/union-of-two-sorted-arrays-1587115621/1", difficulty: "Easy", topic: "Array" },
  { name: "Find missing number in an array", leetcodeLink: "https://leetcode.com/problems/missing-number/", gfgLink: "https://www.geeksforgeeks.org/problems/missing-number-in-array1416/1", difficulty: "Easy", topic: "Array" },
  { name: "Maximum Consecutive Ones", leetcodeLink: "https://leetcode.com/problems/max-consecutive-ones/", gfgLink: "https://www.geeksforgeeks.org/problems/max-consecutive-ones/1", difficulty: "Easy", topic: "Array" },
  { name: "Find the number that appears once, and other numbers twice", leetcodeLink: "https://leetcode.com/problems/single-number/", gfgLink: "https://www.geeksforgeeks.org/problems/element-appearing-once2552/1", difficulty: "Easy", topic: "Array" },
  { name: "Longest subarray with given sum K", leetcodeLink: "https://leetcode.com/problems/subarray-sum-equals-k/", gfgLink: "https://www.geeksforgeeks.org/problems/longest-sub-array-with-sum-k0809/1", difficulty: "Easy", topic: "Array" },
  { name: "Longest subarray with sum K", leetcodeLink: "https://leetcode.com/problems/subarray-sum-equals-k/", gfgLink: "https://www.geeksforgeeks.org/problems/longest-sub-array-with-sum-k0809/1", difficulty: "Easy", topic: "Array" },
  
  // Medium Questions
  { name: "2Sum Problem", leetcodeLink: "https://leetcode.com/problems/two-sum/", gfgLink: "https://practice.geeksforgeeks.org/problems/two-sum", difficulty: "Medium", topic: "Array" },
  { name: "Sort an array of 0's 1's and 2's", leetcodeLink: "https://leetcode.com/problems/sort-colors/", gfgLink: "https://practice.geeksforgeeks.org/problems/sort-an-array-of-0s-1s-and-2s", difficulty: "Medium", topic: "Array" },
  { name: "Majority Element (>n/2 times)", leetcodeLink: "https://leetcode.com/problems/majority-element/", gfgLink: "https://practice.geeksforgeeks.org/problems/majority-element", difficulty: "Medium", topic: "Array" },
  { name: "Kadane's Algorithm, maximum subarray sum", leetcodeLink: "https://leetcode.com/problems/maximum-subarray/", gfgLink: "https://practice.geeksforgeeks.org/problems/kadanes-algorithm", difficulty: "Medium", topic: "Array" },
  { name: "Print subarray with maximum subarray sum (extended version of above problem)", leetcodeLink: "", gfgLink: "https://practice.geeksforgeeks.org/problems/subarray-with-maximum-sum", difficulty: "Medium", topic: "Array" },
  { name: "Stock Buy and Sell", leetcodeLink: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/", gfgLink: "https://practice.geeksforgeeks.org/problems/stock-buy-and-sell", difficulty: "Medium", topic: "Array" },
  { name: "Rearrange the array in alternating positive and negative items", leetcodeLink: "https://leetcode.com/problems/rearrange-array-elements-by-sign/", gfgLink: "https://practice.geeksforgeeks.org/problems/rearrange-array-alternately", difficulty: "Medium", topic: "Array" },
  { name: "Next Permutation", leetcodeLink: "https://leetcode.com/problems/next-permutation/", gfgLink: "https://practice.geeksforgeeks.org/problems/next-permutation", difficulty: "Medium", topic: "Array" },
  { name: "Leaders in an Array problem", leetcodeLink: "", gfgLink: "https://practice.geeksforgeeks.org/problems/leaders-in-an-array", difficulty: "Medium", topic: "Array" },
  { name: "Longest Consecutive Sequence in an Array", leetcodeLink: "https://leetcode.com/problems/longest-consecutive-sequence/", gfgLink: "https://practice.geeksforgeeks.org/problems/longest-consecutive-subsequence", difficulty: "Medium", topic: "Array" },
  { name: "Set Matrix Zeros", leetcodeLink: "https://leetcode.com/problems/set-matrix-zeroes/", gfgLink: "https://practice.geeksforgeeks.org/problems/set-matrix-zeros", difficulty: "Medium", topic: "Array" },
  { name: "Rotate Matrix by 90 degrees", leetcodeLink: "https://leetcode.com/problems/rotate-image/", gfgLink: "https://practice.geeksforgeeks.org/problems/rotate-by-90-degree", difficulty: "Medium", topic: "Array" },
  { name: "Print the matrix in spiral manner", leetcodeLink: "https://leetcode.com/problems/spiral-matrix/", gfgLink: "https://practice.geeksforgeeks.org/problems/spirally-traversing-a-matrix", difficulty: "Medium", topic: "Array" },
  { name: "Count subarrays with given sum", leetcodeLink: "https://leetcode.com/problems/subarray-sum-equals-k/", gfgLink: "https://practice.geeksforgeeks.org/problems/subarrays-with-sum-k", difficulty: "Medium", topic: "Array" },
  
  // Hard Questions
  { name: "Pascal's Triangle", leetcodeLink: "https://leetcode.com/problems/pascals-triangle/", gfgLink: "https://practice.geeksforgeeks.org/problems/pascal-triangle", difficulty: "Hard", topic: "Array" },
  { name: "Majority Element (n/3 times)", leetcodeLink: "https://leetcode.com/problems/majority-element-ii/", gfgLink: "https://practice.geeksforgeeks.org/problems/majority-element", difficulty: "Hard", topic: "Array" },
  { name: "3-Sum Problem", leetcodeLink: "https://leetcode.com/problems/3sum/", gfgLink: "https://practice.geeksforgeeks.org/problems/three-sum", difficulty: "Hard", topic: "Array" },
  { name: "4-Sum Problem", leetcodeLink: "https://leetcode.com/problems/4sum/", gfgLink: "https://practice.geeksforgeeks.org/problems/four-sum", difficulty: "Hard", topic: "Array" },
  { name: "Largest Subarray with 0 Sum", leetcodeLink: "", gfgLink: "https://practice.geeksforgeeks.org/problems/largest-subarray-with-0-sum", difficulty: "Hard", topic: "Array" },
  { name: "Count number of subarrays with given xor K", leetcodeLink: "", gfgLink: "https://practice.geeksforgeeks.org/problems/count-subarray-with-given-xor", difficulty: "Hard", topic: "Array" },
  { name: "Merge Overlapping Subintervals", leetcodeLink: "https://leetcode.com/problems/merge-intervals/", gfgLink: "https://practice.geeksforgeeks.org/problems/merge-intervals", difficulty: "Hard", topic: "Array" },
  { name: "Merge two sorted arrays without extra space", leetcodeLink: "https://leetcode.com/problems/merge-sorted-array/", gfgLink: "https://practice.geeksforgeeks.org/problems/merge-two-sorted-arrays", difficulty: "Hard", topic: "Array" },
  { name: "Find the repeating and missing number", leetcodeLink: "", gfgLink: "https://practice.geeksforgeeks.org/problems/find-missing-and-repeating", difficulty: "Hard", topic: "Array" },
  { name: "Count Inversions", leetcodeLink: "", gfgLink: "https://practice.geeksforgeeks.org/problems/inversion-of-array", difficulty: "Hard", topic: "Array" },
  { name: "Reverse Pairs", leetcodeLink: "https://leetcode.com/problems/reverse-pairs/", gfgLink: "https://practice.geeksforgeeks.org/problems/reverse-pairs", difficulty: "Hard", topic: "Array" },
  { name: "Maximum Product Subarray", leetcodeLink: "https://leetcode.com/problems/maximum-product-subarray/", gfgLink: "https://practice.geeksforgeeks.org/problems/maximum-product-subarray", difficulty: "Hard", topic: "Array" }
];

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('MongoDB connected');
    
    // Clear existing questions
    await Question.deleteMany({});
    console.log('Cleared existing questions');
    
    // Insert new questions
    await Question.insertMany(questions);
    console.log('Questions seeded successfully');
    
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
