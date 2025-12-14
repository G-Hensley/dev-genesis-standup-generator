/**
 * Commit message parser module
 * Handles merge commit filtering, conventional commit parsing, and message truncation
 */

const MERGE_PATTERNS = [
  /^merge\s+branch/i,
  /^merge\s+pull\s+request/i,
  /^merge\s+remote-tracking/i,
  /^merge\s+origin\/[\w/-]+\s+into\s+[\w/-]+/i,
  /^merge\s+[\w/-]+\s+into\s+[\w/-]+/i,
];

const CONVENTIONAL_REGEX =
  /^(feat|fix|docs|chore|test|refactor|style|perf|ci|build)(\(([^)]+)\))?(!)?:\s+(.+)$/i;

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
 *
 * @param {string} message
 * @returns {{type: string, scope: string|null, description: string, raw: string}|null}
 */
function parseConventionalCommit(message = '') {
  if (typeof message !== 'string') {
    return null;
  }

  const match = message.match(CONVENTIONAL_REGEX);
  if (!match) {
    return null;
  }

  const [, type, , scope, breaking, description] = match;

  return {
    type: type.toLowerCase(),
    scope: scope ? scope.toLowerCase() : null,
    description: description.trim(),
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

module.exports = {
  isMergeCommit,
  filterMergeCommits,
  parseConventionalCommit,
  applyConventionalMetadata,
};
