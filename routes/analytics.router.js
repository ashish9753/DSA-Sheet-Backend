const express = require('express');
const router = express.Router();
const Visit = require('../models/Visit');
const { dayKey, visitorHash } = require('../utils/analytics');

// Everything below arrives from the browser, so it is validated and truncated
// before it is allowed anywhere near the database.

const cleanPath = (value) => {
  if (typeof value !== 'string' || !value.startsWith('/')) return '/';
  // Query strings and fragments can carry anything; the route is the useful part.
  return value.split('?')[0].split('#')[0].slice(0, 200);
};

const cleanTimezone = (value) =>
  typeof value === 'string' && /^[A-Za-z][A-Za-z0-9_+\-/]{0,59}$/.test(value) ? value : '';

// Only the referring host is kept — a full referrer URL can carry query strings.
const cleanReferrer = (value) => {
  if (typeof value !== 'string' || !value) return '';
  try {
    return new URL(value).hostname.slice(0, 100);
  } catch {
    return '';
  }
};

// Populated only when a CDN that injects a geo header sits in front of the API.
// Without one this stays empty and the browser's timezone is the location signal.
const countryFrom = (req) => {
  const code = (req.get('cf-ipcountry') || req.get('x-vercel-ip-country') || '').trim().toUpperCase();
  return /^[A-Z]{2}$/.test(code) && code !== 'XX' ? code : '';
};

// Record a page view. Public by necessity — it fires for logged-out visitors.
router.post('/visit', async (req, res) => {
  // Answer before writing. Analytics must never delay or break the page it is
  // measuring, and the browser has no use for the result either way.
  res.status(204).end();

  try {
    const day = dayKey();
    await Visit.create({
      day,
      path: cleanPath(req.body?.path),
      country: countryFrom(req),
      timezone: cleanTimezone(req.body?.timezone),
      referrer: cleanReferrer(req.body?.referrer),
      visitorHash: visitorHash(req.ip, req.get('user-agent'), day)
    });
  } catch (error) {
    console.error('Failed to record visit:', error.message);
  }
});

module.exports = router;
