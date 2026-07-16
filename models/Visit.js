const mongoose = require('mongoose');
const { RETENTION_DAYS } = require('../utils/analytics');

// One document per page view. It deliberately holds nothing that identifies a
// person: no IP address, no cookie, no link to a user account. See
// utils/analytics.js for how visitorHash stays anonymous.
const visitSchema = new mongoose.Schema({
  // IST calendar day, e.g. "2026-07-16". Stored so a day's traffic is one
  // indexed lookup rather than a timezone conversion across the collection.
  day: { type: String, required: true },
  path: { type: String, default: '/' },
  // Two-letter code, set only when a CDN in front of the API sends a geo header.
  country: { type: String, default: '' },
  // IANA timezone the browser reports, e.g. "Asia/Kolkata".
  timezone: { type: String, default: '' },
  // Referring hostname only — never the full referring URL.
  referrer: { type: String, default: '' },
  // One-way daily hash, used only to approximate unique-visitor counts.
  visitorHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

visitSchema.index({ day: 1, visitorHash: 1 });
visitSchema.index({ day: 1, createdAt: -1 });
visitSchema.index({ createdAt: 1 }, { expireAfterSeconds: RETENTION_DAYS * 24 * 60 * 60 });

module.exports = mongoose.model('Visit', visitSchema);
