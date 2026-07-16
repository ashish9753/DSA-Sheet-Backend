const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Question = require('../models/Question');
const UserProgress = require('../models/UserProgress');
const CompletionHistory = require('../models/CompletionHistory');
const Visit = require('../models/Visit');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');
const { TIME_ZONE, RETENTION_DAYS, dayKey, daysAgoKey } = require('../utils/analytics');

const MAIN_ADMIN_EMAIL = 'admin@ashishdev.com';
const TREND_DAYS = 7;
const RECENT_VISIT_LIMIT = 50;

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

// Site traffic for a single day, defaulting to today in TIME_ZONE. Admin-only:
// this router applies auth + isAdmin to every route above.
router.get('/analytics', async (req, res) => {
  try {
    const requestedDate = typeof req.query.date === 'string' ? req.query.date : '';
    const day = /^\d{4}-\d{2}-\d{2}$/.test(requestedDate) ? requestedDate : dayKey();

    const [totals, hourly, locations, pages, recent, trend, totalPageViews] = await Promise.all([
      Visit.aggregate([
        { $match: { day } },
        { $group: { _id: null, pageViews: { $sum: 1 }, visitors: { $addToSet: '$visitorHash' } } },
        { $project: { _id: 0, pageViews: 1, uniqueVisitors: { $size: '$visitors' } } }
      ]),
      Visit.aggregate([
        { $match: { day } },
        { $group: { _id: { $hour: { date: '$createdAt', timezone: TIME_ZONE } }, pageViews: { $sum: 1 } } }
      ]),
      Visit.aggregate([
        { $match: { day } },
        {
          $group: {
            _id: { country: '$country', timezone: '$timezone' },
            pageViews: { $sum: 1 },
            visitors: { $addToSet: '$visitorHash' }
          }
        },
        {
          $project: {
            _id: 0,
            country: '$_id.country',
            timezone: '$_id.timezone',
            pageViews: 1,
            uniqueVisitors: { $size: '$visitors' }
          }
        },
        { $sort: { pageViews: -1 } },
        { $limit: 20 }
      ]),
      Visit.aggregate([
        { $match: { day } },
        { $group: { _id: '$path', pageViews: { $sum: 1 } } },
        { $project: { _id: 0, path: '$_id', pageViews: 1 } },
        { $sort: { pageViews: -1 } },
        { $limit: 10 }
      ]),
      Visit.find({ day })
        .sort({ createdAt: -1 })
        .limit(RECENT_VISIT_LIMIT)
        .select('createdAt path country timezone referrer -_id')
        .lean(),
      Visit.aggregate([
        { $match: { day: { $gte: daysAgoKey(TREND_DAYS - 1) } } },
        { $group: { _id: '$day', pageViews: { $sum: 1 }, visitors: { $addToSet: '$visitorHash' } } },
        { $project: { _id: 0, day: '$_id', pageViews: 1, uniqueVisitors: { $size: '$visitors' } } },
        { $sort: { day: 1 } }
      ]),
      Visit.countDocuments()
    ]);

    // Fill the quiet hours back in so the chart always spans a full day.
    const pageViewsByHour = new Map(hourly.map(bucket => [bucket._id, bucket.pageViews]));
    const byHour = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      pageViews: pageViewsByHour.get(hour) || 0
    }));

    res.json({
      day,
      timeZone: TIME_ZONE,
      retentionDays: RETENTION_DAYS,
      pageViews: totals[0]?.pageViews || 0,
      uniqueVisitors: totals[0]?.uniqueVisitors || 0,
      totalPageViews,
      byHour,
      locations,
      pages,
      recent,
      trend
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching analytics', error: error.message });
  }
});

// Get all questions for admin management
router.get('/questions', async (req, res) => {
  try {
    const { topic, search } = req.query;
    const filter = {};
    if (topic && topic !== 'all') filter.topic = topic;
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

    res.json({ questions, topics: topics.filter(Boolean).sort() });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching questions', error: error.message });
  }
});

// Add question
router.post('/questions', async (req, res) => {
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

// Edit question
router.patch('/questions/:id', async (req, res) => {
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

// Delete question and its user progress
router.delete('/questions/:id', async (req, res) => {
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

// Get all users with basic progress info
router.get('/users', async (req, res) => {
  try {
    const [users, progressSummaries] = await Promise.all([
      User.find().select('-password').sort({ createdAt: -1 }).lean(),
      UserProgress.aggregate([
        { $match: { completed: true } },
        {
          $group: {
            _id: '$user',
            completedQuestions: { $sum: 1 },
            lastSubmissionDate: { $max: '$completedAt' }
          }
        }
      ])
    ]);

    const progressByUserId = new Map(
      progressSummaries.map(summary => [summary._id.toString(), summary])
    );

    const ONLINE_WINDOW_MS = 2 * 60 * 1000; // 2 minutes
    const now = Date.now();
    const usersWithProgress = users.map((user) => {
      const progressSummary = progressByUserId.get(user._id.toString());
      // Determine online status
      let isOnline = false;
      if (user.lastActive) {
        isOnline = (now - new Date(user.lastActive).getTime()) < ONLINE_WINDOW_MS;
      }

      return {
        ...user,
        completedQuestions: progressSummary?.completedQuestions || 0,
        joiningDate: user.createdAt,
        lastSubmissionDate: progressSummary?.lastSubmissionDate || null,
        lastLoginDate: user.lastLogin || null,
        isOnline
      };
    });

    res.json(usersWithProgress);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const actorIsMainAdmin = req.userEmail?.toLowerCase() === MAIN_ADMIN_EMAIL;
    const targetIsSelf = req.userId === user._id.toString();
    const targetIsAdmin = user.role === 'admin';

    // Nobody can delete themselves
    if (targetIsSelf) {
      return res.status(403).json({ message: 'You cannot delete your own account' });
    }

    // Only main admin can delete other admins
    if (targetIsAdmin && !actorIsMainAdmin) {
      return res.status(403).json({ message: 'Only the main admin can delete admin accounts' });
    }

    await User.findByIdAndDelete(req.params.id);
    await UserProgress.deleteMany({ user: req.params.id });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user', error: error.message });
  }
});

// Toggle block user
router.patch('/users/:id/block', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const actorIsMainAdmin = req.userEmail?.toLowerCase() === MAIN_ADMIN_EMAIL;
    const targetIsSelf = req.userId === user._id.toString();
    const targetIsAdmin = user.role === 'admin';

    // Nobody can block themselves
    if (targetIsSelf) {
      return res.status(403).json({ message: 'You cannot block your own account' });
    }

    // Only main admin can block other admins
    if (targetIsAdmin && !actorIsMainAdmin) {
      return res.status(403).json({ message: 'Only the main admin can block admin accounts' });
    }

    user.isBlocked = !user.isBlocked;
    await user.save();

    res.json({ message: `User ${user.isBlocked ? 'blocked' : 'unblocked'} successfully`, isBlocked: user.isBlocked });
  } catch (error) {
    res.status(500).json({ message: 'Error toggling user block status', error: error.message });
  }
});

// Edit user (username, email, role, password)
router.patch('/users/:id', async (req, res) => {
  try {
    const { username, email, role, password } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const actorIsMainAdmin = req.userEmail?.toLowerCase() === MAIN_ADMIN_EMAIL;
    const targetIsSelf = req.userId === user._id.toString();
    const targetIsAdmin = user.role === 'admin';

    // Nobody can edit themselves via admin panel
    if (targetIsSelf) {
      return res.status(403).json({ message: 'You cannot edit your own account here' });
    }

    // Only main admin can edit other admins
    if (targetIsAdmin && !actorIsMainAdmin) {
      return res.status(403).json({ message: 'Only the main admin can edit admin accounts' });
    }

    if (username && username !== user.username) {
      const existingUsername = await User.findOne({ username, _id: { $ne: user._id } });
      if (existingUsername) {
        return res.status(400).json({ message: 'Username already taken' });
      }
      user.username = username.trim();
    }

    if (email && email !== user.email) {
      const normalizedEmail = email.trim().toLowerCase();
      const existingEmail = await User.findOne({ email: normalizedEmail, _id: { $ne: user._id } });
      if (existingEmail) {
        return res.status(400).json({ message: 'Email already registered' });
      }
      user.email = normalizedEmail;
    }

    if (role) {
      if (!['user', 'admin'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role' });
      }
      user.role = role;
    }

    // Admin can reset a user's password (leave blank to keep it unchanged)
    if (password !== undefined && password !== '') {
      if (typeof password !== 'string' || password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters' });
      }
      user.password = await bcrypt.hash(password, 10);
    }

    await user.save();
    const progressCount = await UserProgress.countDocuments({ user: user._id, completed: true });

    const userObject = user.toObject();
    delete userObject.password;

    res.json({
      ...userObject,
      completedQuestions: progressCount
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating user', error: error.message });
  }
});

module.exports = router;
