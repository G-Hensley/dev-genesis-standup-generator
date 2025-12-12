/**
 * Git operations module
 * Handles commit retrieval, repository detection, and user identification
 */

const { simpleGit } = require('simple-git');

const EMPTY_REPO_REGEX = /does not have any commits yet|no commits|unknown revision or path/i;

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
      author: entry.author_name || '',
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
