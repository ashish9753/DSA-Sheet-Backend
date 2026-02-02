const mongoose = require('mongoose');
const CoreConcept = require('../models/CoreConcept');
require('dotenv').config();

const coreConcepts = [
  // Computer Networks
  {
    topic: "Computer Networks",
    subTopic: "OSI Model",
    name: "Introduction to OSI Model",
    youtubeLink: "https://www.youtube.com/watch?v=vv4y_uOneC0",
    notesLink: "https://www.geeksforgeeks.org/layers-of-osi-model/"
  },
  {
    topic: "Computer Networks",
    subTopic: "OSI Model",
    name: "Application Layer",
    youtubeLink: "https://www.youtube.com/watch?v=vv4y_uOneC0",
    notesLink: "https://www.geeksforgeeks.org/application-layer-in-osi-model/"
  },
  {
    topic: "Computer Networks",
    subTopic: "OSI Model",
    name: "Transport Layer",
    youtubeLink: "https://www.youtube.com/watch?v=vv4y_uOneC0",
    notesLink: "https://www.geeksforgeeks.org/transport-layer-responsibilities/"
  },
  {
    topic: "Computer Networks",
    subTopic: "Protocols",
    name: "TCP vs UDP",
    youtubeLink: "https://www.youtube.com/watch?v=uwoD5YsGACg",
    notesLink: "https://www.geeksforgeeks.org/differences-between-tcp-and-udp/"
  },
  {
    topic: "Computer Networks",
    subTopic: "Protocols",
    name: "HTTP and HTTPS",
    youtubeLink: "https://www.youtube.com/watch?v=T4Df5_cojAs",
    notesLink: "https://www.geeksforgeeks.org/difference-between-http-and-https/"
  },
  {
    topic: "Computer Networks",
    subTopic: "Network Security",
    name: "Encryption and SSL/TLS",
    youtubeLink: "https://www.youtube.com/watch?v=j9QmMEWmcfo",
    notesLink: "https://www.geeksforgeeks.org/secure-socket-layer-ssl/"
  },

  // DBMS
  {
    topic: "DBMS",
    subTopic: "Introduction",
    name: "What is DBMS",
    youtubeLink: "https://www.youtube.com/watch?v=c5HAwKX-suM",
    notesLink: "https://www.geeksforgeeks.org/introduction-of-dbms-database-management-system-set-1/"
  },
  {
    topic: "DBMS",
    subTopic: "SQL Basics",
    name: "SQL Queries - SELECT, INSERT, UPDATE, DELETE",
    youtubeLink: "https://www.youtube.com/watch?v=HXV3zeQKqGY",
    notesLink: "https://www.geeksforgeeks.org/sql-tutorial/"
  },
  {
    topic: "DBMS",
    subTopic: "SQL Basics",
    name: "SQL Joins",
    youtubeLink: "https://www.youtube.com/watch?v=9yeOJ0ZMUYw",
    notesLink: "https://www.geeksforgeeks.org/sql-join-set-1-inner-left-right-and-full-joins/"
  },
  {
    topic: "DBMS",
    subTopic: "Normalization",
    name: "1NF, 2NF, 3NF, BCNF",
    youtubeLink: "https://www.youtube.com/watch?v=UrYLYV7WSHM",
    notesLink: "https://www.geeksforgeeks.org/normal-forms-in-dbms/"
  },
  {
    topic: "DBMS",
    subTopic: "Transactions",
    name: "ACID Properties",
    youtubeLink: "https://www.youtube.com/watch?v=pomxJOFVcQs",
    notesLink: "https://www.geeksforgeeks.org/acid-properties-in-dbms/"
  },
  {
    topic: "DBMS",
    subTopic: "Indexing",
    name: "Database Indexing",
    youtubeLink: "https://www.youtube.com/watch?v=ITcOiLSfVJQ",
    notesLink: "https://www.geeksforgeeks.org/indexing-in-databases-set-1/"
  },

  // Operating System
  {
    topic: "Operating System",
    subTopic: "Introduction",
    name: "What is Operating System",
    youtubeLink: "https://www.youtube.com/watch?v=vBURTt97EkA",
    notesLink: "https://www.geeksforgeeks.org/introduction-of-operating-system-set-1/"
  },
  {
    topic: "Operating System",
    subTopic: "Process Management",
    name: "Process vs Thread",
    youtubeLink: "https://www.youtube.com/watch?v=4rLW7zg21gI",
    notesLink: "https://www.geeksforgeeks.org/difference-between-process-and-thread/"
  },
  {
    topic: "Operating System",
    subTopic: "Process Management",
    name: "CPU Scheduling Algorithms",
    youtubeLink: "https://www.youtube.com/watch?v=EWkQl0n0w5M",
    notesLink: "https://www.geeksforgeeks.org/cpu-scheduling-in-operating-systems/"
  },
  {
    topic: "Operating System",
    subTopic: "Synchronization",
    name: "Semaphores and Mutex",
    youtubeLink: "https://www.youtube.com/watch?v=XDIOC2EY5JE",
    notesLink: "https://www.geeksforgeeks.org/mutex-vs-semaphore/"
  },
  {
    topic: "Operating System",
    subTopic: "Deadlock",
    name: "Deadlock Detection and Prevention",
    youtubeLink: "https://www.youtube.com/watch?v=onkWXaXAgbY",
    notesLink: "https://www.geeksforgeeks.org/introduction-of-deadlock-in-operating-system/"
  },
  {
    topic: "Operating System",
    subTopic: "Memory Management",
    name: "Paging and Segmentation",
    youtubeLink: "https://www.youtube.com/watch?v=pJ6qrCB8pDw",
    notesLink: "https://www.geeksforgeeks.org/difference-between-paging-and-segmentation/"
  },
  {
    topic: "Operating System",
    subTopic: "Memory Management",
    name: "Virtual Memory",
    youtubeLink: "https://www.youtube.com/watch?v=qlH4-oHnBb8",
    notesLink: "https://www.geeksforgeeks.org/virtual-memory-in-operating-system/"
  },

  // System Design
  {
    topic: "System Design",
    subTopic: "Basics",
    name: "What is System Design?",
    youtubeLink: "",
    notesLink: ""
  },
  {
    topic: "System Design",
    subTopic: "Basics",
    name: "Horizontal vs. Vertical Scaling",
    youtubeLink: "",
    notesLink: ""
  },
  {
    topic: "System Design",
    subTopic: "Basics",
    name: "What is Capacity Estimation?",
    youtubeLink: "",
    notesLink: ""
  },
  {
    topic: "System Design",
    subTopic: "Basics",
    name: "What is HTTP?",
    youtubeLink: "",
    notesLink: ""
  },
  {
    topic: "System Design",
    subTopic: "Basics",
    name: "What is the Internet TCP/IP stack?",
    youtubeLink: "",
    notesLink: ""
  },
  {
    topic: "System Design",
    subTopic: "Basics",
    name: "What happens when you enter Google.com?",
    youtubeLink: "",
    notesLink: ""
  },
  {
    topic: "System Design",
    subTopic: "Basics",
    name: "What are Relational Databases?",
    youtubeLink: "",
    notesLink: ""
  },
  {
    topic: "System Design",
    subTopic: "Basics",
    name: "What are Database Indexes?",
    youtubeLink: "",
    notesLink: ""
  },
  {
    topic: "System Design",
    subTopic: "Basics",
    name: "What are NoSQL databases?",
    youtubeLink: "",
    notesLink: ""
  },
  {
    topic: "System Design",
    subTopic: "Basics",
    name: "What is a Cache?",
    youtubeLink: "",
    notesLink: ""
  },
  {
    topic: "System Design",
    subTopic: "Basics",
    name: "What is Thrashing?",
    youtubeLink: "",
    notesLink: ""
  },
  {
    topic: "System Design",
    subTopic: "Basics",
    name: "What are Threads?",
    youtubeLink: "",
    notesLink: ""
  },
  {
    topic: "System Design",
    subTopic: "Database Design",
    name: "SQL vs NoSQL",
    youtubeLink: "https://www.youtube.com/watch?v=ruz-vK8IesE",
    notesLink: "https://www.geeksforgeeks.org/difference-between-sql-and-nosql/"
  },
  {
    topic: "System Design",
    subTopic: "Database Design",
    name: "Database Sharding",
    youtubeLink: "https://www.youtube.com/watch?v=5faMjKuB9bc",
    notesLink: "https://www.geeksforgeeks.org/database-sharding-a-system-design-concept/"
  },
  {
    topic: "System Design",
    subTopic: "Advanced Concepts",
    name: "CAP Theorem",
    youtubeLink: "https://www.youtube.com/watch?v=BHqjEjzAicA",
    notesLink: "https://www.geeksforgeeks.org/the-cap-theorem-in-dbms/"
  },
  {
    topic: "System Design",
    subTopic: "Advanced Concepts",
    name: "Microservices Architecture",
    youtubeLink: "https://www.youtube.com/watch?v=CdBtNQZH8a4",
    notesLink: "https://www.geeksforgeeks.org/microservices/"
  },
  {
    topic: "System Design",
    subTopic: "Advanced Concepts",
    name: "Message Queues",
    youtubeLink: "https://www.youtube.com/watch?v=oUJbuFMyBDk",
    notesLink: "https://www.geeksforgeeks.org/message-queues-system-design-concept/"
  },

  // OOP
  {
    topic: "OOP",
    subTopic: "Basics",
    name: "Introduction to OOP",
    youtubeLink: "https://www.youtube.com/watch?v=pTB0EiLXUC8",
    notesLink: "https://www.geeksforgeeks.org/introduction-of-object-oriented-programming/"
  },
  {
    topic: "OOP",
    subTopic: "Pillars",
    name: "Encapsulation",
    youtubeLink: "https://www.youtube.com/watch?v=pTB0EiLXUC8",
    notesLink: "https://www.geeksforgeeks.org/encapsulation-in-java/"
  },
  {
    topic: "OOP",
    subTopic: "Pillars",
    name: "Inheritance",
    youtubeLink: "https://www.youtube.com/watch?v=pTB0EiLXUC8",
    notesLink: "https://www.geeksforgeeks.org/inheritance-in-java/"
  },
  {
    topic: "OOP",
    subTopic: "Pillars",
    name: "Polymorphism",
    youtubeLink: "https://www.youtube.com/watch?v=pTB0EiLXUC8",
    notesLink: "https://www.geeksforgeeks.org/polymorphism-in-java/"
  },
  {
    topic: "OOP",
    subTopic: "Pillars",
    name: "Abstraction",
    youtubeLink: "https://www.youtube.com/watch?v=pTB0EiLXUC8",
    notesLink: "https://www.geeksforgeeks.org/abstraction-in-java-2/"
  },
  {
    topic: "OOP",
    subTopic: "Advanced",
    name: "SOLID Principles",
    youtubeLink: "https://www.youtube.com/watch?v=_jDNAf3CzeY",
    notesLink: "https://www.geeksforgeeks.org/solid-principle-in-programming-understand-with-real-life-examples/"
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
