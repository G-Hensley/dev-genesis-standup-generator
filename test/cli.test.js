const { run, DEFAULT_SINCE } = require('../bin/standup');

jest.mock('../src/index.js', () => ({
  main: jest.fn(),
}));

const { main } = require('../src/index.js');

describe('CLI parsing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('uses default options when none are provided', () => {
    const { options } = run(['node', 'standup'], {
      exitOverride: true,
      invokeMain: false,
    });

    expect(options).toEqual({
      since: DEFAULT_SINCE,
      allAuthors: false,
      copy: false,
    });
  });

  test('parses provided flags', () => {
    const { options } = run(
      ['node', 'standup', '--since', '2 days ago', '--all-authors', '--copy'],
      {
        exitOverride: true,
        invokeMain: false,
      }
    );

    expect(options).toEqual({
      since: '2 days ago',
      allAuthors: true,
      copy: true,
    });
  });

  test('passes parsed options to main when invoked', () => {
    run(['node', 'standup', '--since', '3 days ago', '--copy'], {
      exitOverride: true,
    });

    expect(main).toHaveBeenCalledWith({
      since: '3 days ago',
      allAuthors: false,
      copy: true,
    });
  });

  test('throws on unknown options and shows helpful error', () => {
    expect(() =>
      run(['node', 'standup', '--unknown'], {
        exitOverride: true,
        invokeMain: false,
      })
    ).toThrow(/unknown option/i);
  });
});
