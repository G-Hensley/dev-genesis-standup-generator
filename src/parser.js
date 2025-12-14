/**
 * Commit message parser module
 * Handles merge commit filtering, conventional commit parsing, and message truncation
 */

const MERGE_PATTERNS = [
  /^merge\s+branch/i,
  /^merge\s+pull\s+request/i,
  /^merge\s+remote-tracking/i,
  /^merge\s+(?:\S*branch|\S*origin\/\S*|\S+\/\S+)\s+into\s+\S+/i,
];

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

module.exports = { isMergeCommit, filterMergeCommits };
