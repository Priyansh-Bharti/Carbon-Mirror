'use strict';


import assert from 'node:assert';
import {
  formatEmissions,
  sanitizeHTML,
  sanitizeInput,
  getToday,
  daysSinceDate,
  formatDisplayDate
} from '../../public/js/utils.js';

describe('Utility Functions Unit Tests', () => {

  // ─── formatEmissions ─────────────────────────────────────────────────────

  describe('formatEmissions', () => {
    it('formats valid numbers to 1 decimal place', () => {
      assert.strictEqual(formatEmissions(2.345), '2.3');
      assert.strictEqual(formatEmissions(10), '10.0');
      assert.strictEqual(formatEmissions(0), '0.0');
    });

    it('handles invalid inputs gracefully by returning 0.0', () => {
      assert.strictEqual(formatEmissions(null), '0.0');
      assert.strictEqual(formatEmissions(undefined), '0.0');
      assert.strictEqual(formatEmissions(NaN), '0.0');
      assert.strictEqual(formatEmissions('not-a-number'), '0.0');
    });

    it('handles negative values correctly', () => {
      assert.strictEqual(formatEmissions(-1.5), '-1.5');
    });

    it('handles very large numbers without rounding past the decimal', () => {
      assert.strictEqual(formatEmissions(999999.9), '999999.9');
      assert.strictEqual(formatEmissions(1000000), '1000000.0');
    });
  });

  // ─── sanitizeHTML ────────────────────────────────────────────────────────

  describe('sanitizeHTML', () => {
    it('replaces dangerous XSS characters with HTML entities', () => {
      const unsafe = '<script>alert("XSS")</script>';
      const expected = '&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;';
      assert.strictEqual(sanitizeHTML(unsafe), expected);
    });

    it('returns empty string for non-string inputs', () => {
      assert.strictEqual(sanitizeHTML(12345), '');
      assert.strictEqual(sanitizeHTML(null), '');
      assert.strictEqual(sanitizeHTML(undefined), '');
      assert.strictEqual(sanitizeHTML([]), '');
      assert.strictEqual(sanitizeHTML({}), '');
    });

    it('preserves safe plain text', () => {
      assert.strictEqual(sanitizeHTML('Hello World'), 'Hello World');
    });

    it('escapes ampersands', () => {
      assert.strictEqual(sanitizeHTML('A & B'), 'A &amp; B');
    });

    it('escapes single quotes', () => {
      assert.strictEqual(sanitizeHTML("it's"), 'it&#x27;s');
    });

    it('handles emoji correctly (passthrough)', () => {
      assert.strictEqual(sanitizeHTML('🌍 Carbon'), '🌍 Carbon');
    });

    it('handles null bytes gracefully', () => {
      const withNull = 'abc\x00def';
      const result = sanitizeHTML(withNull);
      assert.ok(typeof result === 'string');
      assert.ok(result.includes('abc'));
    });

    it('handles an empty string', () => {
      assert.strictEqual(sanitizeHTML(''), '');
    });
  });

  // ─── sanitizeInput ───────────────────────────────────────────────────────

  describe('sanitizeInput', () => {
    it('truncates strings longer than 500 characters', () => {
      const long = 'a'.repeat(600);
      const result = sanitizeInput(long);
      // After truncation, 'a' * 500 has no special chars: stays same length
      assert.strictEqual(result.length, 500);
    });

    it('returns empty string for a 501-char input after truncation', () => {
      const almost = 'b'.repeat(501);
      assert.strictEqual(sanitizeInput(almost).length, 500);
    });

    it('sanitizes HTML tags within allowed length', () => {
      const input = '<b>bold</b>';
      assert.strictEqual(sanitizeInput(input), '&lt;b&gt;bold&lt;&#x2F;b&gt;');
    });

    it('sanitizes script injection attempts', () => {
      const injection = '<script>window.location="http://evil.com"</script>';
      const result = sanitizeInput(injection);
      assert.ok(!result.includes('<script>'));
    });

    it('returns empty string for non-strings', () => {
      assert.strictEqual(sanitizeInput(null), '');
      assert.strictEqual(sanitizeInput(42), '');
    });

    it('passes through empty string', () => {
      assert.strictEqual(sanitizeInput(''), '');
    });
  });

  // ─── getToday ────────────────────────────────────────────────────────────

  describe('getToday', () => {
    it('returns a string in YYYY-MM-DD format', () => {
      const today = getToday();
      assert.ok(typeof today === 'string');
      assert.match(today, /^\d{4}-\d{2}-\d{2}$/);
    });

    it('matches the current UTC date', () => {
      const today = getToday();
      const expected = new Date().toISOString().split('T')[0];
      assert.strictEqual(today, expected);
    });
  });

  // ─── daysSinceDate ───────────────────────────────────────────────────────

  describe('daysSinceDate', () => {
    it('returns 0 for today', () => {
      const today = getToday();
      assert.strictEqual(daysSinceDate(today), 0);
    });

    it('returns 1 for yesterday', () => {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      assert.strictEqual(daysSinceDate(yesterday), 1);
    });

    it('returns -1 for invalid format', () => {
      assert.strictEqual(daysSinceDate('2026-6-1'), -1);
      assert.strictEqual(daysSinceDate('not-a-date'), -1);
      assert.strictEqual(daysSinceDate(''), -1);
      assert.strictEqual(daysSinceDate(null), -1);
      assert.strictEqual(daysSinceDate(20260619), -1);
    });

    it('returns -1 for impossible dates', () => {
      assert.strictEqual(daysSinceDate('2026-13-01'), -1);
    });

    it('returns a positive number for past dates', () => {
      const result = daysSinceDate('2025-01-01');
      assert.ok(result > 0);
    });
  });

  // ─── formatDisplayDate ───────────────────────────────────────────────────

  describe('formatDisplayDate', () => {
    it('returns Invalid date for bad format', () => {
      assert.strictEqual(formatDisplayDate('2026-1-1'), 'Invalid date');
      assert.strictEqual(formatDisplayDate('not-a-date'), 'Invalid date');
      assert.strictEqual(formatDisplayDate(null), 'Invalid date');
      assert.strictEqual(formatDisplayDate(''), 'Invalid date');
    });

    it('returns Invalid date for impossible date values', () => {
      assert.strictEqual(formatDisplayDate('2026-13-01'), 'Invalid date');
    });

    it('returns a formatted date string for a valid input', () => {
      const result = formatDisplayDate('2026-06-19');
      assert.ok(typeof result === 'string');
      assert.ok(result.includes('2026'));
      assert.ok(result.includes('19'));
    });
  });
});
