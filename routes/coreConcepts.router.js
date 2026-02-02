const express = require('express');
const router = express.Router();
const CoreConcept = require('../models/CoreConcept');
const UserProgress = require('../models/UserProgress');
const auth = require('../middleware/auth');

// Get all core concepts or filter by topic
router.get('/', auth, async (req, res) => {
  try {
    const { topic, subTopic } = req.query;
    const filter = {};
    
    if (topic) {
      filter.topic = topic;
    }
    if (subTopic) {
      filter.subTopic = subTopic;
    }
    
    const concepts = await CoreConcept.find(filter).sort({ topic: 1, subTopic: 1, sequenceNo: 1, name: 1 });
    
    // Get user's progress for these concepts
    const conceptIds = concepts.map(c => c._id);
    const userProgress = await UserProgress.find({
      user: req.userId,
      question: { $in: conceptIds }
    });
    
    // Create a map of concept ID to completion status
    const progressMap = {};
    userProgress.forEach(progress => {
      progressMap[progress.question.toString()] = progress.completed;
    });
    
    // Add completion status to each concept
    const conceptsWithProgress = concepts.map(c => ({
      ...c.toObject(),
      completed: progressMap[c._id.toString()] || false
    }));
    
    res.json(conceptsWithProgress);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get unique topics
router.get('/topics', auth, async (req, res) => {
  try {
    const topics = await CoreConcept.distinct('topic');
    res.json(topics);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get subtopics for a specific topic
router.get('/subtopics/:topic', auth, async (req, res) => {
  try {
    const { topic } = req.params;
    const subTopics = await CoreConcept.distinct('subTopic', { topic });
    res.json(subTopics);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update concept completion status
router.patch('/:id', auth, async (req, res) => {
  try {
    const { completed } = req.body;
    const conceptId = req.params.id;
    
    // Check if concept exists
    const concept = await CoreConcept.findById(conceptId);
    if (!concept) {
      return res.status(404).json({ message: 'Concept not found' });
    }
    
    // Find or create user progress
    let userProgress = await UserProgress.findOne({
      user: req.userId,
      question: conceptId
    });
    
    if (!userProgress) {
      userProgress = new UserProgress({
        user: req.userId,
        question: conceptId,
        completed: completed
      });
    } else {
      userProgress.completed = completed;
    }
    
    await userProgress.save();
    
    res.json({ message: 'Progress updated successfully', completed });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get progress summary for a topic
router.get('/progress/summary', auth, async (req, res) => {
  try {
    const { topic } = req.query;
    const filter = topic ? { topic } : {};
    
    const allConcepts = await CoreConcept.find(filter);
    const conceptIds = allConcepts.map(c => c._id);
    
    const userProgress = await UserProgress.find({
      user: req.userId,
      question: { $in: conceptIds },
      completed: true
    });
    
    const summary = {
      total: allConcepts.length,
      completed: userProgress.length,
      percentage: allConcepts.length > 0 
        ? Math.round((userProgress.length / allConcepts.length) * 100) 
        : 0
    };
    
    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add new concept (optional - for admin use)
router.post('/', auth, async (req, res) => {
  try {
    const { topic, subTopic, name, youtubeLink, notesLink } = req.body;
    
    const newConcept = new CoreConcept({
      topic,
      subTopic,
      name,
      youtubeLink,
      notesLink
    });
    
    await newConcept.save();
    res.status(201).json(newConcept);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
