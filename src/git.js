/**
 * Git operations module
 * Handles commit retrieval, repository detection, and user identification
 */

const { simpleGit } = require('simple-git');

const EMPTY_REPO_REGEX = /does not have any commits yet|no commits|unknown revision or path/i;

/**
 * Retrieves git commits from the current repository.
 *
 * @param {Object} [options]
 * @param {string} [options.since] - Time range (e.g., "2 days ago" or ISO string) to limit commits.
 * @returns {Promise<Array<{hash: string, message: string, author: string, date: string}>>}
 * Resolves to normalized commit metadata. Empty array if repo has no commits.
 * @throws Propagates any git errors not related to empty history.
 */
async function getCommits({ since } = {}) {
  const git = simpleGit();
  const logOptions = {};

  if (since) {
    logOptions['--since'] = since;
  }

  try {
    const { all = [] } = await git.log(logOptions);
    return all.map((entry) => ({
      hash: entry.hash,
      message: entry.message,
      author: entry.author_name || 'Unknown Author',
      date: entry.date,
    }));
  } catch (error) {
    const message = error?.message || '';
    if (EMPTY_REPO_REGEX.test(message)) {
      return [];
    }
    throw error;
  }
}

module.exports = { getCommits };
