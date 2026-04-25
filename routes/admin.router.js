const express = require('express');
const router = express.Router();
const User = require('../models/User');
const UserProgress = require('../models/UserProgress');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');

const MAIN_ADMIN_EMAIL = 'admin@ashishdev.com';

router.use(auth);
router.use(isAdmin);

// Get all users with basic progress info
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });

    // Fetch progress and last submission for each user

    const ONLINE_WINDOW_MS = 2 * 60 * 1000; // 2 minutes
    const now = Date.now();
    const usersWithProgress = await Promise.all(users.map(async (user) => {
      const progressCount = await UserProgress.countDocuments({ user: user._id, completed: true });

      // Find the latest completedAt for this user
      const lastSubmission = await UserProgress.findOne({ user: user._id, completed: true })
        .sort({ completedAt: -1 })
        .select('completedAt');

      // Determine online status
      let isOnline = false;
      if (user.lastActive) {
        isOnline = (now - new Date(user.lastActive).getTime()) < ONLINE_WINDOW_MS;
      }

      return {
        ...user.toObject(),
        completedQuestions: progressCount,
        joiningDate: user.createdAt,
        lastSubmissionDate: lastSubmission?.completedAt || null,
        lastLoginDate: user.lastLogin || null,
        isOnline
      };
    }));

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

// Edit user (username, email, role)
router.patch('/users/:id', async (req, res) => {
  try {
    const { username, email, role } = req.body;
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

    await user.save();
    const progressCount = await UserProgress.countDocuments({ user: user._id, completed: true });

    res.json({
      ...user.toObject(),
      completedQuestions: progressCount
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating user', error: error.message });
  }
});

module.exports = router;