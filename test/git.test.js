const fs = require('fs');
const os = require('os');
const path = require('path');
const { simpleGit } = require('simple-git');

const { getCommits } = require('../src/git');

async function createRepoWithCommits() {
  const repoDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'standup-git-'));
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
      GIT_AUTHOR_DATE: '2020-01-01T00:00:00Z',
      GIT_COMMITTER_DATE: '2020-01-01T00:00:00Z',
    })
    .commit('first commit');

  fs.writeFileSync(path.join(repoDir, 'second.txt'), 'second');
  await git.add(['.']);
  await git
    .env({
      ...baseEnv,
      GIT_AUTHOR_DATE: '2024-01-01T00:00:00Z',
      GIT_COMMITTER_DATE: '2024-01-01T00:00:00Z',
    })
    .commit('second commit');

  return repoDir;
}

async function createEmptyRepo() {
  const repoDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'standup-git-'));
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
  test('returns commits with expected fields', async () => {
    const repoDir = await createRepoWithCommits();

    await withRepo(repoDir, async () => {
      const commits = await getCommits({ since: '2019-01-01' });

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
      const commits = await getCommits({ since: '2023-01-01' });
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
});
