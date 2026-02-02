const mongoose = require('mongoose');
const CoreConcept = require('../models/CoreConcept');
require('dotenv').config();

async function verifySystemDesignBasics() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');
    
    const concepts = await CoreConcept.find({ 
      topic: 'System Design', 
      subTopic: 'Basics' 
    }).sort({ _id: 1 });
    
    console.log(`Found ${concepts.length} System Design - Basics questions:\n`);
    
    concepts.forEach((c, i) => {
      console.log(`${i + 1}. ${c.name}`);
      console.log(`   YouTube: ${c.youtubeLink || '---'}`);
      console.log(`   Notes: ${c.notesLink || '---'}`);
      console.log('');
    });
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

verifySystemDesignBasics();
