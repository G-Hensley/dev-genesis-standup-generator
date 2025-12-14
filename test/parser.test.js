const { isMergeCommit, filterMergeCommits } = require('../src/parser');

describe('merge commit filtering', () => {
  test('detects common merge patterns case-insensitively', () => {
    const cases = [
      'Merge branch develop into main',
      'merge pull request #123 from feature/xyz',
      'Merge remote-tracking branch origin/main',
      'MERGE feature into main',
    ];

    cases.forEach((msg) => {
      expect(isMergeCommit(msg)).toBe(true);
    });
  });

  test('does not flag non-merge commits', () => {
    const messages = [
      'feat: add login flow',
      'Fix typo',
      'chore: bump deps',
      'refactor parser',
    ];

    messages.forEach((msg) => {
      expect(isMergeCommit(msg)).toBe(false);
    });
  });

  test('filters merge commits from list', () => {
    const commits = [
      { message: 'Merge branch develop into main' },
      { message: 'feat: add login' },
      { message: 'merge pull request #12 from feature/foo' },
      { message: 'fix: bug' },
    ];

    const filtered = filterMergeCommits(commits);
    expect(filtered).toHaveLength(2);
    expect(filtered.map((c) => c.message)).toEqual([
      'feat: add login',
      'fix: bug',
    ]);
  });
});
