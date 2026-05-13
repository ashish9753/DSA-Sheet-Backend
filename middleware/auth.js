const jwt = require('jsonwebtoken');
const User = require('../models/User');

const LAST_ACTIVE_UPDATE_INTERVAL_MS = 60 * 1000;

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      throw new Error();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');
    const user = await User.findById(decoded.userId).select('role isBlocked email lastActive');
    if (!user) {
      return res.status(401).json({ message: 'Please authenticate' });
    }

    if (user.isBlocked) {
      return res.status(403).json({ message: 'Your account has been blocked' });
    }

    const now = new Date();
    const shouldUpdateLastActive = !user.lastActive ||
      now.getTime() - new Date(user.lastActive).getTime() > LAST_ACTIVE_UPDATE_INTERVAL_MS;

    if (shouldUpdateLastActive) {
      user.lastActive = now;
      await user.save();
    }

    req.userId = decoded.userId;
    req.userRole = user.role || decoded.role;
    req.userEmail = user.email;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Please authenticate' });
  }
};

module.exports = auth;
