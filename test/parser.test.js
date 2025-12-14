const { isMergeCommit, filterMergeCommits } = require('../src/parser');

const {
  parseConventionalCommit,
  applyConventionalMetadata,
} = require('../src/parser');

describe('merge commit filtering', () => {
  test('detects common merge patterns case-insensitively', () => {
    const cases = [
      'Merge branch develop into main',
      'merge pull request #123 from feature/xyz',
      'Merge remote-tracking branch origin/main',
      'MERGE branch feature into main',
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
      'Merge sort implementation into algorithm library',
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

  test('handles empty and missing messages safely', () => {
    expect(isMergeCommit('')).toBe(false);
    expect(isMergeCommit(null)).toBe(false);
    expect(isMergeCommit(undefined)).toBe(false);

    const commits = [
      { message: null },
      { other: 'field' },
      { message: undefined },
      { message: 'Merge pull request #5' },
    ];

    const filtered = filterMergeCommits(commits);
    expect(filtered).toHaveLength(3);
    expect(filtered.map((c) => c.message)).toEqual([null, undefined, undefined]);
  });
});

describe('conventional commit parsing', () => {
  test('parses supported prefixes with optional scope', () => {
    expect(parseConventionalCommit('feat: add login')).toEqual({
      type: 'feat',
      scope: null,
      description: 'add login',
      raw: 'feat: add login',
    });

    expect(parseConventionalCommit('FIX(auth): handle expired tokens')).toEqual({
      type: 'fix',
      scope: 'auth',
      description: 'handle expired tokens',
      raw: 'FIX(auth): handle expired tokens',
    });
  });

  test('returns null for non-conventional messages', () => {
    expect(parseConventionalCommit('improve logging')).toBeNull();
    expect(parseConventionalCommit(null)).toBeNull();
  });

  test('applies conventional metadata across commits', () => {
    const commits = [
      { message: 'chore: bump deps' },
      { message: 'docs(readme): add usage' },
      { message: 'regular commit message' },
    ];

    const augmented = applyConventionalMetadata(commits);
    expect(augmented[0].conventional).toMatchObject({
      type: 'chore',
      description: 'bump deps',
    });
    expect(augmented[1].conventional).toMatchObject({
      type: 'docs',
      scope: 'readme',
    });
    expect(augmented[2].conventional).toBeNull();
  });
});
