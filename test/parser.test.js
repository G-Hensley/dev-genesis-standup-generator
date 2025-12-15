const {
  isMergeCommit,
  filterMergeCommits,
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
      'Merge origin/main into develop',
      'Merge feature/login into develop',
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
      'Merge user settings into profile page',
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
      { message: 'Merge origin/feature/login into develop' },
      { message: 'Merge feature/payment into main' },
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
    expect(parseConventionalCommit('feat: add login\n\nBody line')).toEqual({
      type: 'feat',
      scope: null,
      description: 'add login',
      breaking: false,
      raw: 'feat: add login\n\nBody line',
    });

    expect(parseConventionalCommit('FIX(auth): handle expired tokens')).toEqual({
      type: 'fix',
      scope: 'auth',
      description: 'handle expired tokens',
      breaking: false,
      raw: 'FIX(auth): handle expired tokens',
    });

    expect(parseConventionalCommit('fix(AUTH): handle tokens')).toEqual({
      type: 'fix',
      scope: 'auth',
      description: 'handle tokens',
      breaking: false,
      raw: 'fix(AUTH): handle tokens',
    });

    expect(parseConventionalCommit('perf(API)!: speed up responses')).toEqual({
      type: 'perf',
      scope: 'api',
      description: 'speed up responses',
      breaking: true,
      raw: 'perf(API)!: speed up responses',
    });
  });

  test('returns null for non-conventional messages', () => {
    expect(parseConventionalCommit('improve logging')).toBeNull();
    expect(parseConventionalCommit(null)).toBeNull();
    expect(parseConventionalCommit('feat(): missing scope value')).toBeNull();
    expect(parseConventionalCommit('feat: ')).toBeNull();
    expect(parseConventionalCommit('feat:add')).toBeNull();
    expect(parseConventionalCommit('feat:   ')).toBeNull();
  });

  test('applies conventional metadata across commits', () => {
    const commits = [
      { message: 'chore: bump deps' },
      { message: 'docs(readme): add usage' },
      { message: 'regular commit message' },
      { message: 'feat!: breaking change' },
      { message: 'feat: add feature: part 2' },
      { message: 'fix(AUTH): handle tokens' },
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
    expect(augmented[3].conventional).toMatchObject({
      type: 'feat',
      breaking: true,
    });
    expect(augmented[4].conventional).toMatchObject({
      description: 'add feature: part 2',
    });
    expect(augmented[5].conventional).toMatchObject({
      scope: 'auth',
    });
  });
});
