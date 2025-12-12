/**
 * Git operations module
 * Handles commit retrieval, repository detection, and user identification
 */

const { simpleGit } = require('simple-git');

const EMPTY_REPO_REGEX = /does not have any commits yet|no commits|unknown revision or path/i;

/**
 * Reads the current git user's email from config.
 * Returns null when not configured (exit code 1 from git config).
 * Propagates other git errors.
 */
async function getCurrentUserEmail() {
  const git = simpleGit();
  try {
    const email = (await git.raw(['config', '--get', 'user.email'])).trim();
    return email || null;
  } catch (error) {
    if (error?.exitCode === 1) {
      return null;
    }
    throw error;
  }
}

/**
 * Retrieves git commits from the current repository.
 *
 * @param {Object} [options]
 * @param {string} [options.since] - Time range (e.g., "2 days ago" or ISO string) to limit commits.
 * @param {boolean} [options.allAuthors=false] - When true, skip author email filtering.
 * @returns {Promise<Array<{hash: string, message: string, author: string, date: string}>>}
 * Resolves to normalized commit metadata. Empty array if repo has no commits.
 * @throws Propagates any git errors not related to empty history.
 */
async function getCommits({ since, allAuthors = false } = {}) {
  const git = simpleGit();
  const logOptions = {};

  if (since) {
    logOptions['--since'] = since;
  }

  const shouldFilter = !allAuthors;
  let currentEmail = null;

  if (shouldFilter) {
    currentEmail = await getCurrentUserEmail();
  }

  try {
    const { all = [] } = await git.log(logOptions);
    const normalized = all.map((entry) => ({
      hash: entry.hash,
      message: entry.message,
      author: entry.author_name || 'Unknown Author',
      email: entry.author_email || '',
      date: entry.date,
    }));

    if (!shouldFilter) {
      return normalized.map(stripEmail);
    }

    if (!currentEmail) {
      return normalized.map(stripEmail);
    }

    const target = currentEmail.toLowerCase();
    const filtered = normalized.filter(
      (entry) => entry.email && entry.email.toLowerCase() === target
    );
    return filtered.map(stripEmail);
  } catch (error) {
    const message = error?.message || '';
    if (EMPTY_REPO_REGEX.test(message)) {
      return [];
    }
    throw error;
  }
}

function stripEmail({ email, ...rest }) {
  return rest;
}

module.exports = { getCommits, getCurrentUserEmail };
