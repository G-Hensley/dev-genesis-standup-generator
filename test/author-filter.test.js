const fs = require('fs');
const os = require('os');
const path = require('path');
const { simpleGit } = require('simple-git');

const { getCommits, getCurrentUserEmail } = require('../src/git');

const repoDirs = [];

async function createRepo() {
  const repoDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'standup-git-'));
  repoDirs.push(repoDir);
  const git = simpleGit(repoDir);
  await git.init();
  return { repoDir, git };
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

function recentIsoDate(hoursAgo = 0) {
  return new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();
}

describe('author filtering', () => {
  afterAll(async () => {
    await Promise.all(
      repoDirs.map((dir) => fs.promises.rm(dir, { recursive: true, force: true }))
    );
  });

  test('filters commits to current user email by default (case-insensitive)', async () => {
    const { repoDir, git } = await createRepo();
    await git.addConfig('user.name', 'Default User');
    await git.addConfig('user.email', 'user@example.com');

    // Commit for current user but with different casing in email
    fs.writeFileSync(path.join(repoDir, 'mine.txt'), 'mine');
    await git.add(['.']);
    await git
      .env({
        ...process.env,
        GIT_AUTHOR_DATE: recentIsoDate(2),
        GIT_COMMITTER_DATE: recentIsoDate(2),
        GIT_AUTHOR_EMAIL: 'USER@EXAMPLE.COM',
        GIT_COMMITTER_EMAIL: 'USER@EXAMPLE.COM',
      })
      .commit('my commit');

    // Commit from another author
    fs.writeFileSync(path.join(repoDir, 'theirs.txt'), 'theirs');
    await git.add(['.']);
    await git
      .env({
        ...process.env,
        GIT_AUTHOR_DATE: recentIsoDate(1),
        GIT_COMMITTER_DATE: recentIsoDate(1),
        GIT_AUTHOR_EMAIL: 'someoneelse@example.com',
        GIT_COMMITTER_EMAIL: 'someoneelse@example.com',
        GIT_AUTHOR_NAME: 'Other Author',
        GIT_COMMITTER_NAME: 'Other Author',
      })
      .commit('their commit');

    await withRepo(repoDir, async () => {
      const commits = await getCommits({ since: '7 days ago' });
      const messages = commits.map((c) => c.message);

      expect(messages).toContain('my commit');
      expect(messages).not.toContain('their commit');
    });
  });

  test('returns all commits when allAuthors is true', async () => {
    const { repoDir, git } = await createRepo();
    await git.addConfig('user.name', 'Default User');
    await git.addConfig('user.email', 'user@example.com');

    fs.writeFileSync(path.join(repoDir, 'first.txt'), 'first');
    await git.add(['.']);
    await git.commit('first commit');

    fs.writeFileSync(path.join(repoDir, 'second.txt'), 'second');
    await git.add(['.']);
    await git
      .env({
        ...process.env,
        GIT_AUTHOR_EMAIL: 'other@example.com',
        GIT_COMMITTER_EMAIL: 'other@example.com',
        GIT_AUTHOR_NAME: 'Other Author',
        GIT_COMMITTER_NAME: 'Other Author',
      })
      .commit('second commit');

    await withRepo(repoDir, async () => {
      const commits = await getCommits({ allAuthors: true });
      const messages = commits.map((c) => c.message);

      expect(messages).toEqual(expect.arrayContaining(['first commit', 'second commit']));
    });
  });

  test('returns all commits when git user is not configured', async () => {
    const { repoDir, git } = await createRepo();

    fs.writeFileSync(path.join(repoDir, 'unconfigured.txt'), 'no config');
    await git.add(['.']);
    await git
      .env({
        ...process.env,
        GIT_AUTHOR_EMAIL: 'nocfg@example.com',
        GIT_COMMITTER_EMAIL: 'nocfg@example.com',
        GIT_AUTHOR_NAME: 'No Config',
        GIT_COMMITTER_NAME: 'No Config',
      })
      .commit('unconfigured commit');

    // Explicitly clear local config so getCurrentUserEmail cannot read a value.
    await git.addConfig('user.email', '');

    await withRepo(repoDir, async () => {
      const originalEnv = {
        GIT_CONFIG_GLOBAL: process.env.GIT_CONFIG_GLOBAL,
        GIT_CONFIG_SYSTEM: process.env.GIT_CONFIG_SYSTEM,
        HOME: process.env.HOME,
        XDG_CONFIG_HOME: process.env.XDG_CONFIG_HOME,
      };

      const tempHome = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'standup-home-'));
      repoDirs.push(tempHome);

      process.env.GIT_CONFIG_GLOBAL = path.join(tempHome, 'nonexistent');
      process.env.GIT_CONFIG_SYSTEM = '/dev/null';
      process.env.HOME = tempHome;
      process.env.XDG_CONFIG_HOME = tempHome;

      try {
        const email = await getCurrentUserEmail();
        expect(email).toBeNull();

        const commits = await getCommits();
        expect(commits.map((c) => c.message)).toContain('unconfigured commit');
      } finally {
        process.env.GIT_CONFIG_GLOBAL = originalEnv.GIT_CONFIG_GLOBAL;
        process.env.GIT_CONFIG_SYSTEM = originalEnv.GIT_CONFIG_SYSTEM;
        process.env.HOME = originalEnv.HOME;
        process.env.XDG_CONFIG_HOME = originalEnv.XDG_CONFIG_HOME;
      }
    });
  });
});
