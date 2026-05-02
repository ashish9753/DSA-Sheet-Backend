const express = require('express');
const router = express.Router();
const Question = require('../models/Question');
const UserProgress = require('../models/UserProgress');
const CompletionHistory = require('../models/CompletionHistory');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');

router.use(auth);
router.use(isAdmin);

const normalizeQuestionPayload = (body) => ({
  name: body.name?.trim(),
  topic: body.topic?.trim(),
  difficulty: body.difficulty,
  leetcodeLink: body.leetcodeLink?.trim() || '',
  gfgLink: body.gfgLink?.trim() || '',
  sequenceNo: Number.isFinite(Number(body.sequenceNo)) ? Number(body.sequenceNo) : 0
});

const validateQuestionPayload = (payload) => {
  if (!payload.name) return 'Question name is required';
  if (!payload.topic) return 'Topic is required';
  if (!['Easy', 'Medium', 'Hard'].includes(payload.difficulty)) return 'Difficulty must be Easy, Medium, or Hard';
  return null;
};

// GET /api/admin/questions
router.get('/', async (req, res) => {
  try {
    const { topic, search } = req.query;
    const filter = {};

    if (topic && topic !== 'all') {
      filter.topic = topic;
    }

    if (search?.trim()) {
      filter.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { topic: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    const [questions, topics] = await Promise.all([
      Question.find(filter).sort({ topic: 1, sequenceNo: 1, difficulty: 1, name: 1 }),
      Question.distinct('topic')
    ]);

    res.json({
      questions,
      topics: topics.filter(Boolean).sort()
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching questions', error: error.message });
  }
});

// POST /api/admin/questions
router.post('/', async (req, res) => {
  try {
    const payload = normalizeQuestionPayload(req.body);
    const validationError = validateQuestionPayload(payload);

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const question = await Question.create(payload);
    res.status(201).json(question);
  } catch (error) {
    res.status(500).json({ message: 'Error creating question', error: error.message });
  }
});

// PATCH /api/admin/questions/:id
router.patch('/:id', async (req, res) => {
  try {
    const payload = normalizeQuestionPayload(req.body);
    const validationError = validateQuestionPayload(payload);

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const question = await Question.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true
    });

    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    res.json(question);
  } catch (error) {
    res.status(500).json({ message: 'Error updating question', error: error.message });
  }
});

// DELETE /api/admin/questions/:id
router.delete('/:id', async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    await Question.findByIdAndDelete(req.params.id);
    await UserProgress.deleteMany({ question: req.params.id });
    await CompletionHistory.deleteMany({ question: req.params.id });

    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting question', error: error.message });
  }
});

module.exports = router;
