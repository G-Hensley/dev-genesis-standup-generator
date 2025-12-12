/**
 * Utility functions module
 * Helper functions for time parsing and other common operations
 */

const DAY_NAMES = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

const RELATIVE_REGEX = /^(\d+)\s+(hour|hours|day|days|week|weeks|month|months|year|years)\s+ago$/i;
const ISO_LIKE = /^\d{4}-\d{2}-\d{2}/;
const RFC_2822_LIKE = /^[A-Za-z]{3},\s+\d{1,2}\s+[A-Za-z]{3}\s+\d{4}/;

/**
 * Normalizes human-readable time ranges to git-friendly --since values.
 * Accepts relative phrases ("24 hours ago", "2 days ago", "1 week ago") and day names ("Friday").
 * If the input already looks like a git-compatible date, it is passed through.
 * Returns a default value of "24 hours ago" for empty or missing inputs.
 * Throws on unsupported non-empty values with a helpful message.
 *
 * @param {*} input
 * @returns {string} git-compatible since value
 */
function parseSince(input) {
  if (!input || typeof input !== 'string' || !input.trim()) {
    return '24 hours ago';
  }

  const value = input.trim();
  const lower = value.toLowerCase();

  // Day-of-week handling: git understands day names directly
  if (DAY_NAMES.includes(lower)) {
    return lower;
  }

  // Recognized relative phrases that git accepts directly
  if (RELATIVE_REGEX.test(value)) {
    return lower;
  }

  // Heuristic: allow common git date formats to pass through
  if (ISO_LIKE.test(value) || RFC_2822_LIKE.test(value)) {
    return value;
  }

  throw new Error(
    `Invalid time range "${input}". Try values like "24 hours ago", "2 days ago", "1 week ago", or a day name (e.g., "Friday").`
  );
}

module.exports = { parseSince };
