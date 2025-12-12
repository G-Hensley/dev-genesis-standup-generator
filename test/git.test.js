const fs = require('fs');
const os = require('os');
const path = require('path');
const { simpleGit } = require('simple-git');

const { getCommits } = require('../src/git');

const repoDirs = [];

function recentIsoDate(hoursAgo = 0) {
  return new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();
}

async function createRepoWithCommits() {
  const repoDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'standup-git-'));
  repoDirs.push(repoDir);
  const git = simpleGit(repoDir);
  const baseEnv = { ...process.env };

  await git.init();
  await git.addConfig('user.name', 'Test User');
  await git.addConfig('user.email', 'test@example.com');

  fs.writeFileSync(path.join(repoDir, 'first.txt'), 'first');
  await git.add(['.']);
  await git
    .env({
      ...baseEnv,
      GIT_AUTHOR_DATE: recentIsoDate(48),
      GIT_COMMITTER_DATE: recentIsoDate(48),
    })
    .commit('first commit');

  fs.writeFileSync(path.join(repoDir, 'second.txt'), 'second');
  await git.add(['.']);
  await git
    .env({
      ...baseEnv,
      GIT_AUTHOR_DATE: recentIsoDate(1),
      GIT_COMMITTER_DATE: recentIsoDate(1),
    })
    .commit('second commit');

  return repoDir;
}

async function createEmptyRepo() {
  const repoDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'standup-git-'));
  repoDirs.push(repoDir);
  const git = simpleGit(repoDir);

  await git.init();
  await git.addConfig('user.name', 'Test User');
  await git.addConfig('user.email', 'test@example.com');

  return repoDir;
}

async function withRepo(repoDir, fn) {
  const previousCwd = process.cwd();
  process.chdir(repoDir);
  try {
    await fn();
  } finally {
    process.chdir(previousCwd);
  }
}

describe('getCommits', () => {
  afterAll(async () => {
    await Promise.all(
      repoDirs.map((dir) => fs.promises.rm(dir, { recursive: true, force: true }))
    );
  });

  test('returns commits with expected fields', async () => {
    const repoDir = await createRepoWithCommits();

    await withRepo(repoDir, async () => {
      const commits = await getCommits({ since: '7 days ago' });

      expect(commits.length).toBeGreaterThanOrEqual(2);
      expect(commits[0]).toMatchObject({
        hash: expect.any(String),
        message: expect.any(String),
        author: expect.any(String),
        date: expect.any(String),
      });
    });
  });

  test('filters commits by since option', async () => {
    const repoDir = await createRepoWithCommits();

    await withRepo(repoDir, async () => {
      const commits = await getCommits({ since: '24 hours ago' });
      const messages = commits.map((c) => c.message);

      expect(messages).toContain('second commit');
      expect(messages).not.toContain('first commit');
    });
  });

  test('returns empty array for repositories with no commits', async () => {
    const repoDir = await createEmptyRepo();

    await withRepo(repoDir, async () => {
      const commits = await getCommits({ since: '2020-01-01' });
      expect(commits).toEqual([]);
    });
  });

  test('returns all commits when no options provided', async () => {
    const repoDir = await createRepoWithCommits();

    await withRepo(repoDir, async () => {
      const commits = await getCommits();
      const messages = commits.map((c) => c.message);

      expect(messages).toEqual(expect.arrayContaining(['first commit', 'second commit']));
    });
  });

  test('throws for non-empty-repo errors', async () => {
    const nonRepoDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'standup-git-'));
    repoDirs.push(nonRepoDir);

    await withRepo(nonRepoDir, async () => {
      await expect(getCommits({ since: '1 day ago' })).rejects.toThrow(/not a git repository/i);
    });
  });
});
