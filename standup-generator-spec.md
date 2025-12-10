# Project Specification: standup-generator

## Problem Statement
Developers need to provide standup updates that summarize their recent work, but manually reviewing commits across multiple repositories is time-consuming and error-prone. Current solutions involve manually browsing GitHub, checking git logs, or trying to remember what was worked on - all of which break flow and take 5-10 minutes per standup.

## Target Users
- **Primary**: Individual developers who give daily/regular standup updates and work across one or more git repositories
- **Secondary**: Tech leads who need to summarize team activity (using `--all-authors` flag)
- **Technical Level**: Comfortable with CLI tools and git workflows
- **Context**: Daily use from terminal, typically run right before standup meetings

## Core Value Proposition
Generate professional standup updates in seconds by automatically parsing git commit history across multiple repositories with intelligent filtering and formatting.

## MVP Features

### 1. Basic Commit Retrieval
   - Read commits from last 24 hours by default
   - Support custom time ranges via `--since` flag (e.g., "2 days ago", "Friday")
   - Filter to current git user's commits by default
   - Support `--all-authors` flag to include entire team

### 2. Intelligent Commit Processing
   - Automatically filter out merge commits (`Merge branch`, `Merge pull request`)
   - Parse conventional commit prefixes (`feat:`, `fix:`, `docs:`, `chore:`, `test:`, `refactor:`)
   - Truncate verbose commit messages (80 character limit with ellipsis)
   - Preserve commit message intent while keeping output readable

### 3. Multi-Repository Support
   - Auto-detect git repositories when run from parent directory (scan one level deep)
   - Group commits by repository name
   - Show clear message indicating which repos were found
   - Work seamlessly with single repository when run from within a repo

### 4. Output Generation
   - Generate simple markdown format (no emojis, professional)
   - Include date of commits in header
   - Bullet points for each commit
   - Repository grouping when multiple repos detected
   - Copy to clipboard with `--copy` flag

### 5. Error Handling & User Feedback
   - Clear error if not in a git repository
   - Helpful message if no commits found in time range
   - Show which repos were detected and processed
   - Gracefully handle repos with no commits in timeframe

## Technical Requirements

- **Platform**: CLI (cross-platform: macOS, Linux, Windows)
- **Runtime**: Node.js (14+)
- **Package Type**: NPM package, installable via `npm install -g` or included in Dev Genesis template
- **Tech Stack**: 
  - Node.js for CLI implementation
  - `commander` for CLI argument parsing
  - `simple-git` for git operations
  - `clipboardy` for clipboard functionality
- **Integrations**: None (pure git operations)
- **Data Requirements**: 
  - Read-only access to local git repositories
  - No external API calls or data storage
  - No user data collection
- **Scale**: Single user, local machine operations only

## Success Criteria

- **Time Savings**: Reduce standup prep time from 5-10 minutes to <30 seconds
- **Adoption**: Successfully used for personal APIsec standups for 1 week
- **Quality**: Generate readable, professional standup updates 90%+ of the time without manual editing
- **Dev Genesis Integration**: Added as optional install option in Dev Genesis template within 1 month of MVP completion
- **Usage Metric**: Personal daily use becomes habitual (used 5+ days in a row)

## Command Interface

```bash
# Basic usage - last 24 hours, current user only
standup

# Custom time range
standup --since "2 days ago"
standup --since "Friday"
standup --since "1 week ago"

# Include all team members
standup --all-authors

# Copy to clipboard
standup --copy

# Combine flags
standup --since "2 days ago" --all-authors --copy
```

## Output Format Example

**Single Repository:**
```markdown
Yesterday (Dec 10, 2024):

• feat: OAuth2 authentication flow
• fix: Race condition in user service
• test: Unit tests for auth middleware
• docs: Updated API documentation
```

**Multiple Repositories:**
```markdown
Yesterday (Dec 10, 2024):

backend-api:
• feat: OAuth2 authentication flow
• fix: Race condition in user service
• test: Unit tests for auth middleware

frontend:
• feat: New dashboard layout
• refactor: Simplified state management
• docs: Component documentation

docs:
• docs: Updated deployment guide
```

## Out of Scope (MVP)

- "Today" section generation or prompts
- Configuration files (`.standup-config.json`)
- Multiple output format options (Slack, plain text, etc.)
- GitHub PR/commit URL linking
- JIRA/ticket number parsing and linking
- Grouping by commit type (features vs. fixes vs. docs)
- Interactive mode or prompts
- Historical standup storage/tracking
- Team analytics or reporting
- Integration with standup/project management tools
- Custom commit message templates
- AI-powered commit summarization

## Assumptions

- Users have git configured with their name/email
- Users follow reasonable commit message conventions (or tool will show raw messages)
- Users work primarily on git-based projects
- Users prefer markdown-formatted output
- Command will be run from within a git repository or parent directory containing repos
- 24-hour default range is appropriate for daily standups
- 80-character truncation is sufficient for readability

## Open Questions

- Should we support `.gitignore`-style exclusion patterns for repos to skip? (Lean toward "no" for MVP)
- How should we handle uncommitted changes? (Lean toward "ignore" for MVP)
- Should there be a `--verbose` flag to show full commit messages? (Add if time permits)
- What's the best way to package this for Dev Genesis - as global CLI or project-local? (Decide during Dev Genesis integration)

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Commit messages are too messy/unclear for automated parsing | High | Medium | Truncate long messages, keep original intent, educate users on good commit practices |
| Performance issues with large repos/many commits | Low | Low | Simple-git is efficient; only parse commits in time range, not full history |
| Cross-platform compatibility issues (Windows paths, clipboard) | Medium | Medium | Use path.join(), test on Windows VM, clipboardy handles cross-platform |
| Users don't follow conventional commits | High | Low | Tool still works with raw messages; conventional parsing is enhancement, not requirement |
| Low adoption by other developers | Medium | Low | Tool solves personal problem first; Dev Genesis integration is bonus, not requirement |
| Multi-repo detection misses nested repos | Low | Low | Only scan one level deep (documented limitation); users can run from specific repo instead |

## Package Structure

```
standup-generator/
├── bin/
│   └── standup.js           # CLI entry point (#!/usr/bin/env node)
├── src/
│   ├── index.js             # Main orchestration
│   ├── git.js               # Git operations (get commits, detect repos)
│   ├── parser.js            # Commit message parsing & filtering
│   ├── formatter.js         # Markdown output generation
│   └── utils.js             # Helper functions (time parsing, etc.)
├── test/
│   ├── git.test.js
│   ├── parser.test.js
│   └── formatter.test.js
├── .gitignore
├── package.json
├── README.md
└── LICENSE
```

## Development Phases

**Phase 1: Core Functionality (Week 1)**
- Basic git commit retrieval from single repo
- Simple output formatting
- Time range support (`--since`)
- Current user filtering

**Phase 2: Intelligence Layer (Week 1-2)**
- Merge commit filtering
- Conventional commit parsing
- Message truncation
- Multi-repo detection

**Phase 3: Polish & Distribution (Week 2)**
- Clipboard copy functionality
- Error handling & user feedback
- README documentation
- Publish to NPM

**Phase 4: Testing & Integration (Week 3)**
- Use personally for APIsec standups (1 week)
- Bug fixes and refinements
- Prepare for Dev Genesis integration

---

## Next Steps

1. **Set up project**: Initialize npm package with dependencies
2. **Build git.js**: Implement commit retrieval with simple-git
3. **Build parser.js**: Add merge filtering and conventional commit parsing
4. **Build formatter.js**: Create markdown output generation
5. **Wire up CLI**: Add commander for argument parsing
6. **Test manually**: Run on APIsec repos for a week
7. **Polish & publish**: README, npm publish, add to Dev Genesis

**Estimated Timeline**: 2-3 weeks from start to Dev Genesis integration

Ready to build! 🚀
