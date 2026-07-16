const crypto = require('crypto');

// Traffic is reported in IST so that "today" in the admin console means today
// on the admin's own clock, not the server's UTC day.
const TIME_ZONE = 'Asia/Kolkata';

// Visits are only ever read as recent trends, so they expire instead of piling up.
const RETENTION_DAYS = 90;

// The TIME_ZONE calendar day for an instant, as "2026-07-16" (en-CA formats ISO).
const dayKey = (date = new Date()) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE }).format(date);

const daysAgoKey = (days) => dayKey(new Date(Date.now() - days * 24 * 60 * 60 * 1000));

// Every "YYYY-MM-DD" from `from` to `to` inclusive. The day strings are opaque
// calendar labels, so we step through them in UTC to avoid any DST surprises —
// this reproduces the same sequence dayKey would, without a timezone shift.
const enumerateDays = (from, to) => {
  const days = [];
  let cursor = new Date(`${from}T00:00:00Z`);
  const end = new Date(`${to}T00:00:00Z`);
  while (cursor <= end) {
    days.push(cursor.toISOString().slice(0, 10));
    cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000);
  }
  return days;
};

// Anonymises a visitor for a single day. The day is mixed into the HMAC key, so
// the same person hashes to something different tomorrow: visits can never be
// linked across days, and the hash cannot be turned back into an IP address.
const visitorHash = (ip, userAgent, day) => {
  const secret = process.env.ANALYTICS_SALT || process.env.JWT_SECRET || 'analytics-dev-salt';
  return crypto
    .createHmac('sha256', `${secret}:${day}`)
    .update(`${ip || ''}|${userAgent || ''}`)
    .digest('hex')
    .slice(0, 32);
};

module.exports = { TIME_ZONE, RETENTION_DAYS, dayKey, daysAgoKey, enumerateDays, visitorHash };
