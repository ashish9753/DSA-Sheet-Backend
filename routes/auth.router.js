const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const auth = require('../middleware/auth');

const CLIENT_FALLBACK = '971496737518-r6ghl3vudfup2jlalm5d8pdq4ej904om.apps.googleusercontent.com';

const getGoogleClientId = () => process.env.GOOGLE_CLIENT_ID || CLIENT_FALLBACK;
const googleClient = new OAuth2Client(getGoogleClientId());

const getJwtSecret = () => process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Session lifetime: tokens expire after 7 days (auto-logout)
const TOKEN_TTL = '7d';

// Coerce request input to a trimmed string. Guards against NoSQL injection /
// type-confusion where a client sends an object (e.g. { "$ne": null }) instead
// of a string for an identifier field.
const asString = (value) => (typeof value === 'string' ? value.trim() : '');

const buildAuthResponse = (user) => {
  const token = jwt.sign(
    { userId: user._id, role: user.role },
    getJwtSecret(),
    { expiresIn: TOKEN_TTL }
  );

  return {
    token,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      isBlocked: user.isBlocked,
      lastLogin: user.lastLogin
    }
  };
};

const makeBaseUsername = (email, name) => {
  const source = (email?.split('@')[0] || name || 'user').toLowerCase();
  const cleaned = source.replace(/[^a-z0-9]/g, '').slice(0, 14);
  return cleaned.length >= 3 ? cleaned : `user${cleaned}`;
};

// Signup is intentionally Google-only: every account's email must be verified
// by Google. The local signup endpoint is disabled so no unverified email can
// create an account directly.
router.post('/signup', (req, res) => {
  res.status(403).json({
    message: 'Sign up is available with Google only, so your email can be verified.'
  });
});

// Login with email OR username + password
router.post('/login', async (req, res) => {
  try {
    const { email, username, identifier } = req.body;

    // Accept whichever identifier the client sends (email or username)
    const rawIdentifier = asString(identifier) || asString(email) || asString(username);
    const password = asString(req.body.password);
    if (!rawIdentifier || !password) {
      return res.status(400).json({ message: 'Email/username and password are required' });
    }

    const normalized = rawIdentifier.toLowerCase();
    // Email is stored lowercased; username is matched case-insensitively
    const user = await User.findOne({
      $or: [
        { email: normalized },
        { username: new RegExp(`^${rawIdentifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
      ]
    });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email/username or password' });
    }

    if (user.isBlocked) {
      return res.status(403).json({ message: 'Your account has been blocked' });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email/username or password' });
    }

    // Record last login time
    user.lastLogin = new Date();
    await user.save();

    res.json(buildAuthResponse(user));
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
});

// Google login/signup
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ message: 'Google credential is required' });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: getGoogleClientId()
    });
    const payload = ticket.getPayload();

    if (!payload?.email || !payload?.sub) {
      return res.status(400).json({ message: 'Google account did not return a valid email' });
    }

    const email = payload.email.toLowerCase();
    let user = await User.findOne({
      $or: [
        { googleId: payload.sub },
        { email }
      ]
    });

    if (user?.isBlocked) {
      return res.status(403).json({ message: 'Your account has been blocked' });
    }

    // New user: don't create the account yet. Hand back a short-lived setup
    // token carrying the verified email, and let them choose their own username
    // and password before the account is created.
    if (!user) {
      const setupToken = jwt.sign(
        { email, googleId: payload.sub, name: payload.name || '', purpose: 'google-signup' },
        getJwtSecret(),
        { expiresIn: '20m' }
      );

      return res.json({
        needsSetup: true,
        setupToken,
        email,
        suggestedUsername: makeBaseUsername(email, payload.name)
      });
    }

    // Existing user: log them in, linking the Google account if needed.
    user.googleId = user.googleId || payload.sub;
    user.authProvider = user.authProvider || 'google';

    user.lastLogin = new Date();
    await user.save();

    res.json(buildAuthResponse(user));
  } catch (error) {
    res.status(401).json({ message: 'Google authentication failed', error: error.message });
  }
});

// Complete a Google-verified signup by choosing username + password
router.post('/google/complete', async (req, res) => {
  try {
    const setupToken = asString(req.body.setupToken);
    const username = asString(req.body.username);
    const password = typeof req.body.password === 'string' ? req.body.password : '';

    if (!setupToken) {
      return res.status(400).json({ message: 'Signup session expired. Please sign up with Google again.' });
    }

    let payload;
    try {
      payload = jwt.verify(setupToken, getJwtSecret());
    } catch (err) {
      return res.status(400).json({ message: 'Signup session expired. Please sign up with Google again.' });
    }

    if (payload.purpose !== 'google-signup' || !payload.email || !payload.googleId) {
      return res.status(400).json({ message: 'Invalid signup session. Please sign up with Google again.' });
    }

    const trimmedUsername = (username || '').trim();
    if (trimmedUsername.length < 3) {
      return res.status(400).json({ message: 'Username must be at least 3 characters' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const email = payload.email.toLowerCase();

    // Guard against the account being created in the meantime, or the chosen
    // username being taken.
    const existing = await User.findOne({
      $or: [{ email }, { googleId: payload.googleId }, { username: trimmedUsername }]
    });
    if (existing) {
      if (existing.email === email || existing.googleId === payload.googleId) {
        return res.status(409).json({ message: 'An account already exists for this Google email. Please log in.' });
      }
      return res.status(400).json({ message: 'Username already taken' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userRole = email === 'admin@ashishdev.com' ? 'admin' : 'user';

    const user = new User({
      username: trimmedUsername,
      email,
      password: hashedPassword,
      googleId: payload.googleId,
      authProvider: 'google',
      role: userRole
    });

    user.lastLogin = new Date();
    await user.save();

    res.status(201).json(buildAuthResponse(user));
  } catch (error) {
    res.status(500).json({ message: 'Error completing signup', error: error.message });
  }
});

// Update profile (username only — email is fixed to the Google-verified address)
router.patch('/me', auth, async (req, res) => {
  try {
    const username = asString(req.body.username);
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Email is verified via Google and cannot be changed by the user.

    if (username && username !== user.username) {
      const trimmedUsername = username;
      if (trimmedUsername.length < 3) {
        return res.status(400).json({ message: 'Username must be at least 3 characters' });
      }
      const existingUsername = await User.findOne({ username: trimmedUsername, _id: { $ne: user._id } });
      if (existingUsername) {
        return res.status(400).json({ message: 'Username already taken' });
      }
      user.username = trimmedUsername;
    }

    await user.save();

    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isBlocked: user.isBlocked
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
});

// Update password: requires the current password plus the new password typed twice
router.patch('/me/password', auth, async (req, res) => {
  try {
    const oldPassword = typeof req.body.oldPassword === 'string' ? req.body.oldPassword : '';
    const newPassword = typeof req.body.newPassword === 'string' ? req.body.newPassword : '';
    const confirmNewPassword = typeof req.body.confirmNewPassword === 'string' ? req.body.confirmNewPassword : '';

    if (!oldPassword) {
      return res.status(400).json({ message: 'Current password is required' });
    }

    if (!newPassword || !confirmNewPassword) {
      return res.status(400).json({ message: 'Please enter the new password twice' });
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ message: 'New passwords do not match' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    if (await bcrypt.compare(newPassword, user.password)) {
      return res.status(400).json({ message: 'New password must be different from the current password' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating password', error: error.message });
  }
});

module.exports = router;
