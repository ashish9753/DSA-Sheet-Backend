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
const { TIME_ZONE, RETENTION_DAYS, dayKey, daysAgoKey, enumerateDays } = require('../utils/analytics');

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

// Preset windows the UI can ask for by name. Resolved server-side so "today"
// always means today in TIME_ZONE, regardless of the admin's own clock.
const PERIOD_DAYS = { today: 1, '7d': 7, '30d': 30, '90d': 90 };

// Site traffic for a day or a date range. Admin-only: this router applies
// auth + isAdmin to every route above.
//
// Window is resolved by priority: ?period=today|7d|30d|90d, then explicit
// ?from=&to=, then a single ?date= (kept for backward compatibility), then
// today. A single-day window returns hourly buckets; a multi-day window
// returns daily buckets. Everything is clamped to the retention window, since
// older visits have already expired.
router.get('/analytics', async (req, res) => {
  try {
    const isDate = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
    const today = dayKey();
    const earliest = daysAgoKey(RETENTION_DAYS - 1);

    let from;
    let to;
    if (typeof req.query.period === 'string' && PERIOD_DAYS[req.query.period]) {
      const span = PERIOD_DAYS[req.query.period];
      to = today;
      from = span === 1 ? today : daysAgoKey(span - 1);
    } else if (isDate(req.query.from) || isDate(req.query.to)) {
      from = isDate(req.query.from) ? req.query.from : earliest;
      to = isDate(req.query.to) ? req.query.to : today;
    } else if (isDate(req.query.date)) {
      from = to = req.query.date;
    } else {
      from = to = today;
    }

    // Normalise: from <= to, never before what we still keep, never in the future.
    if (from > to) [from, to] = [to, from];
    if (from < earliest) from = earliest;
    if (to > today) to = today;

    const isSingleDay = from === to;
    const match = { day: { $gte: from, $lte: to } };

    const [totals, buckets, locations, pages, recent, last7, totalPageViews] = await Promise.all([
      // Note on uniqueVisitors over a range: the visitor hash is salted per day
      // (by design, so visits can't be linked across days), so a person on two
      // days counts as two. Over a range this is the sum of each day's uniques,
      // which is the honest number the privacy model allows.
      Visit.aggregate([
        { $match: match },
        { $group: { _id: null, pageViews: { $sum: 1 }, visitors: { $addToSet: '$visitorHash' } } },
        { $project: { _id: 0, pageViews: 1, uniqueVisitors: { $size: '$visitors' } } }
      ]),
      isSingleDay
        ? Visit.aggregate([
            { $match: match },
            { $group: { _id: { $hour: { date: '$createdAt', timezone: TIME_ZONE } }, pageViews: { $sum: 1 } } }
          ])
        : Visit.aggregate([
            { $match: match },
            { $group: { _id: '$day', pageViews: { $sum: 1 } } }
          ]),
      Visit.aggregate([
        { $match: match },
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
        { $match: match },
        { $group: { _id: '$path', pageViews: { $sum: 1 } } },
        { $project: { _id: 0, path: '$_id', pageViews: 1 } },
        { $sort: { pageViews: -1 } },
        { $limit: 10 }
      ]),
      Visit.find(match)
        .sort({ createdAt: -1 })
        .limit(RECENT_VISIT_LIMIT)
        .select('createdAt path country timezone referrer -_id')
        .lean(),
      // Fixed reference tile, independent of the selected window.
      Visit.aggregate([
        { $match: { day: { $gte: daysAgoKey(TREND_DAYS - 1) } } },
        { $group: { _id: null, pageViews: { $sum: 1 } } }
      ]),
      Visit.countDocuments()
    ]);

    // Build a gap-free series so the chart spans the whole window even where
    // there was no traffic.
    let series;
    if (isSingleDay) {
      const byHour = new Map(buckets.map(b => [b._id, b.pageViews]));
      series = Array.from({ length: 24 }, (_, hour) => ({
        key: String(hour),
        label: `${String(hour).padStart(2, '0')}:00`,
        pageViews: byHour.get(hour) || 0
      }));
    } else {
      const byDay = new Map(buckets.map(b => [b._id, b.pageViews]));
      series = enumerateDays(from, to).map(day => ({
        key: day,
        label: day,
        pageViews: byDay.get(day) || 0
      }));
    }

    res.json({
      from,
      to,
      timeZone: TIME_ZONE,
      retentionDays: RETENTION_DAYS,
      granularity: isSingleDay ? 'hour' : 'day',
      pageViews: totals[0]?.pageViews || 0,
      uniqueVisitors: totals[0]?.uniqueVisitors || 0,
      last7Days: last7[0]?.pageViews || 0,
      totalPageViews,
      series,
      locations,
      pages,
      recent
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
