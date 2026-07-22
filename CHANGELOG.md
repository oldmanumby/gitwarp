# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added

- **26 Swappable URL Tricks**: Expanded the registry of GitHub URL swaps from 13 to 26, including `.keys`, `.gpg`, `.patch`, `.diff`, `releases.atom`, `.zip`, and multiple cloud IDEs.
- **Context Parser Engine**: Automatically parses pasted GitHub URLs and determines the current context (User, Repo, File, Commit, PR, Unknown).
- **Interactive Tools**:
  - _Deep Linker_: Dynamically targets specific lines of code (e.g., L10-L20) and handles raw text toggle (`?plain=1`).
  - _Time Machine Compare_: Easily generates comparison diffs between branches, tags, or specific timeframes (e.g., `1.week.ago`).
  - _Commit Feed_: Filter commit history by author, branch, and specific file paths.
- **Context Awareness**: Standard cards dynamically enable or disable based on the parsed GitHub URL context (e.g. `.keys` requires a User context; `vscode.dev` requires a Repo or File context).
- **Categorized UI**: Cards are now neatly grouped into logical categories (Cloud IDEs, AI Utilities, Analytics, Git Operations, Feeds).

### Changed

- Refactored `main.js` to rely on an external `cards.js` registry for all swappable link logic.
- Restyled cards to show clear inactive states (red borders/text) for URLs that don't match the required context.
- Optimized the main layout and interactive cards for mobile viewing.
- The Interactive Tools and Standard Cards sections are now hidden cleanly until a valid URL is entered.
