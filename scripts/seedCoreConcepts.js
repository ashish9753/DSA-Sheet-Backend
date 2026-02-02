const mongoose = require('mongoose');
const CoreConcept = require('../models/CoreConcept');
require('dotenv').config();

const coreConcepts = [
  // System Design
  {
    topic: "System Design",
    subTopic: "Basics",
    name: "What is System Design?",
    sequenceNo: 1,
    youtubeLink: "",
    notesLink: ""
  },
  {
    topic: "System Design",
    subTopic: "Basics",
    name: "Horizontal vs. Vertical Scaling",
    sequenceNo: 2,
    youtubeLink: "",
    notesLink: ""
  },
  {
    topic: "System Design",
    subTopic: "Basics",
    name: "What is Capacity Estimation?",
    sequenceNo: 3,
    youtubeLink: "",
    notesLink: ""
  },
  {
    topic: "System Design",
    subTopic: "Basics",
    name: "What is HTTP?",
    sequenceNo: 4,
    youtubeLink: "",
    notesLink: ""
  },
  {
    topic: "System Design",
    subTopic: "Basics",
    name: "What is the Internet TCP/IP stack?",
    sequenceNo: 5,
    youtubeLink: "",
    notesLink: ""
  },
  {
    topic: "System Design",
    subTopic: "Basics",
    name: "What happens when you enter Google.com?",
    sequenceNo: 6,
    youtubeLink: "",
    notesLink: ""
  },
  {
    topic: "System Design",
    subTopic: "Basics",
    name: "What are Relational Databases?",
    sequenceNo: 7,
    youtubeLink: "",
    notesLink: ""
  },
  {
    topic: "System Design",
    subTopic: "Basics",
    name: "What are Database Indexes?",
    sequenceNo: 8,
    youtubeLink: "",
    notesLink: ""
  },
  {
    topic: "System Design",
    subTopic: "Basics",
    name: "What are NoSQL databases?",
    sequenceNo: 9,
    youtubeLink: "",
    notesLink: ""
  },
  {
    topic: "System Design",
    subTopic: "Basics",
    name: "What is a Cache?",
    sequenceNo: 10,
    youtubeLink: "",
    notesLink: ""
  },
  {
    topic: "System Design",
    subTopic: "Basics",
    name: "What is Thrashing?",
    sequenceNo: 11,
    youtubeLink: "",
    notesLink: ""
  },
  {
    topic: "System Design",
    subTopic: "Basics",
    name: "What are Threads?",
    sequenceNo: 12,
    youtubeLink: "",
    notesLink: ""
  },
  {
    topic: "System Design",
    subTopic: "Database Design",
    name: "SQL vs NoSQL",
    sequenceNo: 1,
    youtubeLink: "https://www.youtube.com/watch?v=ruz-vK8IesE",
    notesLink: "https://www.geeksforgeeks.org/difference-between-sql-and-nosql/"
  },
  {
    topic: "System Design",
    subTopic: "Database Design",
    name: "Database Sharding",
    sequenceNo: 2,
    youtubeLink: "https://www.youtube.com/watch?v=5faMjKuB9bc",
    notesLink: "https://www.geeksforgeeks.org/database-sharding-a-system-design-concept/"
  },
  {
    topic: "System Design",
    subTopic: "Advanced Concepts",
    name: "CAP Theorem",
    sequenceNo: 1,
    youtubeLink: "https://www.youtube.com/watch?v=BHqjEjzAicA",
    notesLink: "https://www.geeksforgeeks.org/the-cap-theorem-in-dbms/"
  },
  {
    topic: "System Design",
    subTopic: "Advanced Concepts",
    name: "Microservices Architecture",
    sequenceNo: 2,
    youtubeLink: "https://www.youtube.com/watch?v=CdBtNQZH8a4",
    notesLink: "https://www.geeksforgeeks.org/microservices/"
  },
  {
    topic: "System Design",
    subTopic: "Advanced Concepts",
    name: "Message Queues",
    sequenceNo: 3,
    youtubeLink: "https://www.youtube.com/watch?v=oUJbuFMyBDk",
    notesLink: "https://www.geeksforgeeks.org/message-queues-system-design-concept/"
  }
];

async function seedCoreConcepts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Delete existing core concepts
    const deleteResult = await CoreConcept.deleteMany({});
    console.log(`Deleted ${deleteResult.deletedCount} existing core concepts`);
    
    // Insert all core concepts
    const result = await CoreConcept.insertMany(coreConcepts);
    console.log(`Successfully inserted ${result.length} core concepts`);
    
    // Display summary by topic
    const topicSummary = {};
    coreConcepts.forEach(c => {
      topicSummary[c.topic] = (topicSummary[c.topic] || 0) + 1;
    });
    
    console.log('\nConcepts by topic:');
    Object.entries(topicSummary).forEach(([topic, count]) => {
      console.log(`  ${topic}: ${count} concepts`);
    });
    
    // Display summary by subtopic
    console.log('\nBreakdown by subtopic:');
    const subTopicMap = {};
    coreConcepts.forEach(c => {
      const key = `${c.topic} - ${c.subTopic}`;
      subTopicMap[key] = (subTopicMap[key] || 0) + 1;
    });
    Object.entries(subTopicMap).forEach(([key, count]) => {
      console.log(`  ${key}: ${count} concepts`);
    });
    
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  } catch (error) {
    console.error('Error seeding core concepts:', error);
    process.exit(1);
  }
}

seedCoreConcepts();
