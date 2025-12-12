const { parseSince } = require('../src/utils');

describe('parseSince', () => {
  test('defaults to 24 hours ago on empty input', () => {
    expect(parseSince()).toBe('24 hours ago');
    expect(parseSince('')).toBe('24 hours ago');
    expect(parseSince('   ')).toBe('24 hours ago');
  });

  test('defaults to 24 hours ago on non-string input', () => {
    expect(parseSince(null)).toBe('24 hours ago');
    expect(parseSince(123)).toBe('24 hours ago');
  });

  test('passes through recognized relative phrases', () => {
    expect(parseSince('24 hours ago')).toBe('24 hours ago');
    expect(parseSince('2 days ago')).toBe('2 days ago');
    expect(parseSince('1 week ago')).toBe('1 week ago');
    expect(parseSince('12 HOURS AGO')).toBe('12 hours ago');
  });

  test('handles day names', () => {
    expect(parseSince('Friday')).toBe('friday');
    expect(parseSince('monday')).toBe('monday');
  });

  test('passes through ISO and RFC2822-like dates', () => {
    expect(parseSince('2024-01-01')).toBe('2024-01-01');
    expect(parseSince('Tue, 15 Nov 1994 08:12:31 GMT')).toBe('Tue, 15 Nov 1994 08:12:31 GMT');
  });

  test('throws on invalid inputs', () => {
    expect(() => parseSince('yesterday-ish')).toThrow(/invalid time range/i);
    expect(() => parseSince('next week')).toThrow(/invalid time range/i);
  });
});
