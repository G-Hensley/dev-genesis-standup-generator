#!/usr/bin/env node

/**
 * CLI entry point for standup-generator
 * Parses command line arguments and orchestrates the standup generation process
 */

const { Command } = require('commander');
const pkg = require('../package.json');
const { main } = require('../src/index.js');

const DEFAULT_SINCE = '24 hours ago';

function createProgram({ exitOverride = false } = {}) {
  const program = new Command();

  if (exitOverride) {
    program.exitOverride();
  }

  program
    .name('standup')
    .description(pkg.description)
    .version(pkg.version, '-V, --version', 'output the current version')
    .option('--since <range>', 'Time range of commits to include', DEFAULT_SINCE)
    .option('--all-authors', 'Include commits from all authors', false)
    .option('--copy', 'Copy the generated standup to the clipboard', false)
    .showHelpAfterError()
    .showSuggestionAfterError();

  return program;
}

function run(argv = process.argv, { exitOverride = false, invokeMain = true } = {}) {
  const program = createProgram({ exitOverride });
  program.parse(argv);

  const options = program.opts();

  if (invokeMain) {
    main({
      since: options.since,
      allAuthors: options.allAuthors,
      copy: options.copy,
    });
  }

  return { program, options };
}

if (require.main === module) {
  run(process.argv);
}

module.exports = { run, createProgram, DEFAULT_SINCE };
