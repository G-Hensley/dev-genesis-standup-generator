/**
 * Commit message parser module
 * Handles merge commit filtering and conventional commit parsing
 */

const MERGE_PATTERNS = [
  /^merge\s+branch/i,
  /^merge\s+pull\s+request/i,
  /^merge\s+remote-tracking/i,
  /^merge\s+[\w/-]+\s+into\s+[\w/-]+/i,
];

const CONVENTIONAL_REGEX =
  /^(feat|fix|docs|chore|test|refactor|style|perf|ci|build)(\(([^)]+)\))?(!)?:\s+(.+)$/i;

const DEFAULT_TRUNCATE_LIMIT = 80;

/**
 * Returns true if the commit message looks like a merge commit.
 * Matching is case-insensitive and covers common merge message patterns.
 *
 * @param {string} message
 * @returns {boolean}
 */
function isMergeCommit(message = '') {
  return MERGE_PATTERNS.some((pattern) => pattern.test(message));
}

/**
 * Filters out merge commits from a list of commit objects.
 * Commit objects are expected to include a `message` field.
 *
 * @param {Array<{message: string}>} commits
 * @returns {Array<{message: string}>} commits without merges
 */
function filterMergeCommits(commits = []) {
  return commits.filter((commit) => !isMergeCommit(commit?.message || ''));
}

/**
 * Parses a conventional commit message and returns its components.
 * Returns null when the message does not follow the expected prefixes.
 * Note: type and scope are normalized to lowercase.
 *
 * @param {string} message
 * @returns {{type: string, scope: string|null, description: string, breaking: boolean, raw: string}|null}
 */
function parseConventionalCommit(message = '') {
  if (typeof message !== 'string') {
    return null;
  }

  const firstLine = message.split('\n')[0];
  const match = firstLine.match(CONVENTIONAL_REGEX);
  if (!match) {
    return null;
  }

  const [, type, , scope, breaking, description] = match;
  const trimmedDescription = description.trim();
  if (!trimmedDescription) {
    return null;
  }

  return {
    type: type.toLowerCase(),
    scope: scope ? scope.toLowerCase() : null,
    description: trimmedDescription,
    breaking: Boolean(breaking),
    raw: message,
  };
}

/**
 * Adds conventional commit metadata to each commit.
 * Each commit gains a `conventional` field that is either the parsed metadata or null.
 *
 * @param {Array<{message: string}>} commits
 * @returns {Array<{message: string, conventional: object|null}>}
 */
function applyConventionalMetadata(commits = []) {
  return commits.map((commit) => ({
    ...commit,
    conventional: parseConventionalCommit(commit?.message || ''),
  }));
}

/**
 * Truncates a commit message to the specified limit, adding an ellipsis when truncated.
 * Attempts to avoid cutting mid-word by trimming back to the last space before the cutoff.
 *
 * @param {string} message
 * @param {number} [limit=DEFAULT_TRUNCATE_LIMIT]
 * @throws {RangeError} If limit is negative.
 * @returns {string}
 */
function truncateMessage(message = '', limit = DEFAULT_TRUNCATE_LIMIT) {
  if (typeof message !== 'string') {
    return '';
  }

  if (limit < 0) {
    throw new RangeError('truncateMessage: limit must not be negative');
  }

  if (limit === 0) {
    return '';
  }

  const firstLine = message.split('\n')[0];
  if (firstLine.length <= limit) {
    return firstLine;
  }

  // Very small limits cannot accommodate an ellipsis; just return the slice.
  if (limit <= 5) {
    return firstLine.slice(0, limit);
  }

  const cutoff = limit - 3; // account for ellipsis
  const slicePoint = firstLine.lastIndexOf(' ', cutoff);
  const trimmed = (slicePoint > 0 ? firstLine.slice(0, slicePoint) : firstLine.slice(0, cutoff)).trimEnd();

  return `${trimmed}...`;
}

/**
 * Returns a new list of commits with their message truncated to the limit.
 *
 * @param {Array<{message: string}>} commits
 * @param {number} [limit=DEFAULT_TRUNCATE_LIMIT]
 * @returns {Array<{message: string}>}
 */
function truncateCommitMessages(commits = [], limit = DEFAULT_TRUNCATE_LIMIT) {
  return commits.map((commit) => {
    const safeCommit = commit && typeof commit === 'object' ? commit : {};
    return {
      ...safeCommit,
      message: truncateMessage(safeCommit.message || '', limit),
    };
  });
}

module.exports = {
  isMergeCommit,
  filterMergeCommits,
  parseConventionalCommit,
  applyConventionalMetadata,
  truncateMessage,
  truncateCommitMessages,
  DEFAULT_TRUNCATE_LIMIT,
};
