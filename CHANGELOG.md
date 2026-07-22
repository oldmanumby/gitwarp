# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [1.3.3](https://github.com/oldmanumby/gitwarp/compare/v1.3.2...v1.3.3) (2026-07-22)

### Bug Fixes

- enforce GitWarp brand colors and lock docs into dark mode ([df947e9](https://github.com/oldmanumby/gitwarp/commit/df947e9ebd7e3707bc4075c801e5bcdb324660d6))

## [1.3.2](https://github.com/oldmanumby/gitwarp/compare/v1.3.1...v1.3.2) (2026-07-22)

### Bug Fixes

- explicitly provide `{ light, dark }` object syntax for Blume theme colors to prevent compiler from silently dropping strings ([d332eb8](https://github.com/oldmanumby/gitwarp/commit/d332eb8))

## [1.3.1](https://github.com/oldmanumby/gitwarp/compare/v1.3.0...v1.3.1) (2026-07-22)

### Bug Fixes

- initial attempt to add `blume.config.ts` theme override values using string shorthand (failed to compile) ([31012e2](https://github.com/oldmanumby/gitwarp/commit/31012e2))

## [1.3.0](https://github.com/oldmanumby/gitwarp/compare/v1.0.0...v1.3.0) (2026-07-22)

### Features

- integrate Blume docs build into vite pipeline and add UI link ([d2ff6d7](https://github.com/oldmanumby/gitwarp/commit/d2ff6d7708236fe7f87a405c14b2d97cb9c7a4da))
- expand trick card details and sync blume theme with main site ([c089fd1](https://github.com/oldmanumby/gitwarp/commit/c089fd1))

### Bug Fixes

- append trailing slashes to blume routes ([1acf7da](https://github.com/oldmanumby/gitwarp/commit/1acf7da69dd2d888265ddafada1564f54bf0168f))
- explicit index.html for static hosting routing ([67861ca](https://github.com/oldmanumby/gitwarp/commit/67861cac9edad504b6c2d588d2be4c50ff307a6d))
- use hex for blume config and fix nav link ([d3f1390](https://github.com/oldmanumby/gitwarp/commit/d3f1390ad099ad9ed8a8c141445c33917cf21ede))

## [1.0.0] - 2026-07-22

### Added

- **Project Renamed:** Officially renamed the project from `gitswapForged` to **GitWarp** across all files, configuration, and interfaces.
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
