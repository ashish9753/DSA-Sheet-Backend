const mongoose = require('mongoose');
const Question = require('../models/Question');
require('dotenv').config();

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch((err) => console.error('MongoDB connection error:', err));

const stringQuestions = [
  // Easy String Problems
  {
    name: "Remove Outermost Parentheses",
    leetcodeLink: "https://leetcode.com/problems/remove-outermost-parentheses/",
    gfgLink: "https://www.geeksforgeeks.org/problems/remove-outermost-parentheses/1",
    difficulty: "Easy",
    topic: "String"
  },
  {
    name: "Reverse Words in a Given String / Palindrome Check",
    leetcodeLink: "https://leetcode.com/problems/reverse-words-in-a-string/",
    gfgLink: "https://www.geeksforgeeks.org/problems/reverse-words-in-a-given-string5459/1",
    difficulty: "Easy",
    topic: "String"
  },
  {
    name: "Largest Odd Number in a String",
    leetcodeLink: "https://leetcode.com/problems/largest-odd-number-in-string/",
    gfgLink: "https://www.geeksforgeeks.org/problems/largest-odd-number-in-string/1",
    difficulty: "Easy",
    topic: "String"
  },
  {
    name: "Longest Common Prefix",
    leetcodeLink: "https://leetcode.com/problems/longest-common-prefix/",
    gfgLink: "https://www.geeksforgeeks.org/problems/longest-common-prefix-in-an-array5129/1",
    difficulty: "Easy",
    topic: "String"
  },
  {
    name: "Isomorphic String",
    leetcodeLink: "https://leetcode.com/problems/isomorphic-strings/",
    gfgLink: "https://www.geeksforgeeks.org/problems/isomorphic-strings-1587115620/1",
    difficulty: "Easy",
    topic: "String"
  },
  {
    name: "Rotate String",
    leetcodeLink: "https://leetcode.com/problems/rotate-string/",
    gfgLink: "https://www.geeksforgeeks.org/problems/are-rotations-of-each-other-1587115620/1",
    difficulty: "Easy",
    topic: "String"
  },
  {
    name: "Check if Two Strings are Anagram of Each Other",
    leetcodeLink: "https://leetcode.com/problems/valid-anagram/",
    gfgLink: "https://www.geeksforgeeks.org/problems/anagram-1587115620/1",
    difficulty: "Easy",
    topic: "String"
  },
  // Medium String Problems
  {
    name: "Sort Characters by Frequency",
    leetcodeLink: "https://leetcode.com/problems/sort-characters-by-frequency/",
    gfgLink: "https://www.geeksforgeeks.org/problems/sort-characters-by-frequency/1",
    difficulty: "Medium",
    topic: "String"
  },
  {
    name: "Maximum Nesting Depth of the Parentheses",
    leetcodeLink: "https://leetcode.com/problems/maximum-nesting-depth-of-the-parentheses/",
    gfgLink: "https://www.geeksforgeeks.org/problems/find-maximum-depth-of-nested-parenthesis/1",
    difficulty: "Medium",
    topic: "String"
  },
  {
    name: "Roman to Integer",
    leetcodeLink: "https://leetcode.com/problems/roman-to-integer/",
    gfgLink: "https://www.geeksforgeeks.org/problems/roman-number-to-integer3201/1",
    difficulty: "Medium",
    topic: "String"
  },
  {
    name: "String to Integer (atoi)",
    leetcodeLink: "https://leetcode.com/problems/string-to-integer-atoi/",
    gfgLink: "https://www.geeksforgeeks.org/problems/implement-atoi/1",
    difficulty: "Medium",
    topic: "String"
  },
  {
    name: "Count Number of Substrings",
    leetcodeLink: "https://leetcode.com/problems/count-substrings-with-only-one-distinct-letter/",
    gfgLink: "https://www.geeksforgeeks.org/problems/count-substrings/1",
    difficulty: "Medium",
    topic: "String"
  },
  {
    name: "Longest Palindromic Substring",
    leetcodeLink: "https://leetcode.com/problems/longest-palindromic-substring/",
    gfgLink: "https://www.geeksforgeeks.org/problems/longest-palindrome-in-a-string3411/1",
    difficulty: "Medium",
    topic: "String"
  },
  {
    name: "Sum of Beauty of All Substrings",
    leetcodeLink: "https://leetcode.com/problems/sum-of-beauty-of-all-substrings/",
    gfgLink: "https://www.geeksforgeeks.org/problems/sum-of-beauty-of-all-substrings/1",
    difficulty: "Medium",
    topic: "String"
  },
  {
    name: "Reverse Every Word in a String",
    leetcodeLink: "https://leetcode.com/problems/reverse-words-in-a-string-iii/",
    gfgLink: "https://www.geeksforgeeks.org/problems/reverse-each-word-in-a-given-string/1",
    difficulty: "Medium",
    topic: "String"
  },
  // Hard String Problems
  {
    name: "Minimum Number of Bracket Reversals to Make an Expression Balanced",
    leetcodeLink: "https://leetcode.com/problems/minimum-add-to-make-parentheses-valid/",
    gfgLink: "https://www.geeksforgeeks.org/problems/minimum-number-of-bracket-reversals/1",
    difficulty: "Hard",
    topic: "String"
  },
  {
    name: "Count and Say",
    leetcodeLink: "https://leetcode.com/problems/count-and-say/",
    gfgLink: "https://www.geeksforgeeks.org/problems/count-and-say-problem/1",
    difficulty: "Hard",
    topic: "String"
  },
  {
    name: "Hashing in Strings (Theory)",
    leetcodeLink: "",
    gfgLink: "https://www.geeksforgeeks.org/string-hashing-using-polynomial-rolling-hash-function/",
    difficulty: "Hard",
    topic: "String"
  },
  {
    name: "Rabin–Karp Algorithm",
    leetcodeLink: "https://leetcode.com/problems/find-the-index-of-the-first-occurrence-in-a-string/",
    gfgLink: "https://www.geeksforgeeks.org/rabin-karp-algorithm-for-pattern-searching/",
    difficulty: "Hard",
    topic: "String"
  },
  {
    name: "KMP Algorithm / LPS Array",
    leetcodeLink: "https://leetcode.com/problems/find-the-index-of-the-first-occurrence-in-a-string/",
    gfgLink: "https://www.geeksforgeeks.org/kmp-algorithm-for-pattern-searching/",
    difficulty: "Hard",
    topic: "String"
  },
  {
    name: "Shortest Palindrome",
    leetcodeLink: "https://leetcode.com/problems/shortest-palindrome/",
    gfgLink: "https://www.geeksforgeeks.org/problems/shortest-palindrome/1",
    difficulty: "Hard",
    topic: "String"
  },
  {
    name: "Longest Happy Prefix",
    leetcodeLink: "https://leetcode.com/problems/longest-happy-prefix/",
    gfgLink: "https://www.geeksforgeeks.org/problems/longest-prefix-suffix2527/1",
    difficulty: "Hard",
    topic: "String"
  },
  {
    name: "Count Palindromic Subsequences",
    leetcodeLink: "https://leetcode.com/problems/count-different-palindromic-subsequences/",
    gfgLink: "https://www.geeksforgeeks.org/problems/count-palindromic-subsequences/1",
    difficulty: "Hard",
    topic: "String"
  }
];

async function initializeStringQuestions() {
  try {
    console.log('Initializing string questions...');
    
    // Check if questions already exist to avoid duplicates
    const existingQuestions = await Question.find({ topic: 'String' });
    const existingNames = existingQuestions.map(q => q.name);
    
    // Filter out questions that already exist
    const newQuestions = stringQuestions.filter(q => !existingNames.includes(q.name));
    
    if (newQuestions.length === 0) {
      console.log('✅ All string questions already exist in the database');
      console.log(`📊 Total string questions in database: ${existingQuestions.length}`);
      process.exit(0);
    }

    // Insert new questions
    const insertedQuestions = await Question.insertMany(newQuestions);
    
    console.log('✅ String questions initialized successfully!');
    console.log(`📊 Added ${insertedQuestions.length} new questions`);
    console.log(`📊 Total string questions in database: ${existingQuestions.length + insertedQuestions.length}`);
    
    // Summary by difficulty
    const easyCount = stringQuestions.filter(q => q.difficulty === 'Easy').length;
    const mediumCount = stringQuestions.filter(q => q.difficulty === 'Medium').length;
    const hardCount = stringQuestions.filter(q => q.difficulty === 'Hard').length;
    
    console.log('\n📈 Summary by difficulty:');
    console.log(`   Easy: ${easyCount} questions`);
    console.log(`   Medium: ${mediumCount} questions`);
    console.log(`   Hard: ${hardCount} questions`);
    console.log(`   Total: ${stringQuestions.length} questions`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing string questions:', error);
    process.exit(1);
  }
}

// Wait for MongoDB connection before initializing
mongoose.connection.once('open', () => {
  initializeStringQuestions();
});