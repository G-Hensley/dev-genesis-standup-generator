const {
  isMergeCommit,
  filterMergeCommits,
  parseConventionalCommit,
  applyConventionalMetadata,
  truncateMessage,
  truncateCommitMessages,
  DEFAULT_TRUNCATE_LIMIT,
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

describe('message truncation', () => {
  test('truncates with ellipsis and keeps boundary when possible', () => {
    const short = 'short message';
    expect(truncateMessage(short, DEFAULT_TRUNCATE_LIMIT)).toBe(short);

    const exact = 'a'.repeat(DEFAULT_TRUNCATE_LIMIT);
    expect(truncateMessage(exact, DEFAULT_TRUNCATE_LIMIT)).toBe(exact);

    const longWithSpaces =
      'This is a very long commit message that should be truncated at a sensible boundary to keep it readable';
    const truncated = truncateMessage(longWithSpaces, 80);
    expect(truncated.endsWith('...')).toBe(true);
    expect(truncated.length).toBeLessThanOrEqual(80);
    expect(truncated).toMatch(/[A-Za-z0-9]\.{3}$/); // ellipsis should follow a character, not a space

    const longSingleWord = 'a'.repeat(100);
    const truncatedWord = truncateMessage(longSingleWord, 80);
    expect(truncatedWord.length).toBeLessThanOrEqual(80);
    expect(truncatedWord.endsWith('...')).toBe(true);
  });

  test('handles edge cases and small limits', () => {
    expect(truncateMessage(undefined, 10)).toBe('');
    expect(truncateMessage(null, 10)).toBe('');
    expect(truncateMessage('', 10)).toBe('');
    expect(() => truncateMessage('abc', '10')).toThrow(TypeError);
    expect(() => truncateMessage('abc', NaN)).toThrow(TypeError);

    // Limit zero returns empty, small limits return raw slice without ellipsis
    expect(truncateMessage('abc', 0)).toBe('');
    expect(truncateMessage('abc', 1)).toBe('a');
    expect(truncateMessage('abc', 2)).toBe('ab');
    expect(truncateMessage('abc', 3)).toBe('abc');
    expect(truncateMessage('hello', 4)).toBe('hell');
    expect(truncateMessage('hello', 5)).toBe('hello');

    expect(() => truncateMessage('abc', -1)).toThrow(RangeError);

    const multiLine = 'first line is long enough\nsecond line ignored';
    expect(truncateMessage(multiLine, 5)).toBe('first');
  });

  test('truncates commit lists without mutating other fields', () => {
    const commits = [
      { message: 'a'.repeat(90), id: 1 },
      { message: 'short', id: 2 },
    ];

    const truncated = truncateCommitMessages(commits, 80);
    expect(truncated[0].message.length).toBeLessThanOrEqual(80);
    expect(truncated[0].id).toBe(1);
    expect(truncated[1].message).toBe('short');
  });

  test('handles empty commits array and missing messages', () => {
    expect(truncateCommitMessages([], 80)).toEqual([]);

    const commits = [{ id: 1 }, null, undefined];
    const truncated = truncateCommitMessages(commits, 5);
    expect(truncated[0].message).toBe('');
    expect(truncated[1].message).toBe('');
    expect(truncated[2].message).toBe('');
  });
});
