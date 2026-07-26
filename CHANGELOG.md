# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [1.3.13](https://github.com/oldmanumby/gitwarp/compare/v1.3.12...v1.3.13) (2026-07-23)


### Bug Fixes

* update github repo link in footer to gitwarp ([7211273](https://github.com/oldmanumby/gitwarp/commit/72112735dd3694770fc2f19afd4a36bb99bf1fb0))

### [1.3.12](https://github.com/oldmanumby/gitwarp/compare/v1.3.11...v1.3.12) (2026-07-23)


### Chores

* fix changelog formatting for v1.3.11 ([dd58cdc](https://github.com/oldmanumby/gitwarp/commit/dd58cdc77220e5126f8ab23ef6609535ac0d1b48))
* remove old archive scripts ([b620636](https://github.com/oldmanumby/gitwarp/commit/b62063629b70eb3426c4abfaca4687814930fad8))
* remove unused imports in tests ([d625bd4](https://github.com/oldmanumby/gitwarp/commit/d625bd40aabc31faef2acdcbea3b00ab0ff3f2c9))
* revert patch headings to standard format (H3) ([48fa586](https://github.com/oldmanumby/gitwarp/commit/48fa58630a4a046d2805d99e0c58e0b708bd3884))


### Documentation

* update interactive tools and rename standard cards to standard tools ([e635ee7](https://github.com/oldmanumby/gitwarp/commit/e635ee70f66a603fbd2cfac2ce7ed5375963dc89))

### [1.3.11](https://github.com/oldmanumby/gitwarp/compare/v1.3.9...v1.3.11) (2026-07-23)

- **UI/Docs Cleanup**: Resolved Flash of Unstyled Content (FOUC) on the main site and navigation issues between the docs and the main app. Configured accurate GitWarp dark-mode theme colors natively.

### Bug Fixes

- resolve theme and FOUC issues ([edca401](https://github.com/oldmanumby/gitwarp/commit/edca4019e1fa1897d688595ff69fc20527275470))

### [1.3.9](https://github.com/oldmanumby/gitwarp/compare/v1.3.7...v1.3.9) (2026-07-23)

### Refactors

- resolve complexity errors across core modules ([c1684f9](https://github.com/oldmanumby/gitwarp/commit/c1684f9458b6114e7430bd6b2f87214cce0a6b50))

### [1.3.7](https://github.com/oldmanumby/gitwarp/compare/v1.3.6...v1.3.7) (2026-07-23)

### Bug Fixes

- resolve blume docs styling by removing broken theme.css and configuring natively ([a948bff](https://github.com/oldmanumby/gitwarp/commit/a948bff75f5252367f76276c7017f70bc07eb71f))
- resolve remaining adversarial UI test assertion failures ([2567751](https://github.com/oldmanumby/gitwarp/commit/25677511e1c9ef9ca7e4c17e45921c0b5a8d355d))

### [1.3.6](https://github.com/oldmanumby/gitwarp/compare/v1.3.5...v1.3.6) (2026-07-22)

### Chores

- format font quotes ([0acace0](https://github.com/oldmanumby/gitwarp/commit/0acace0))

### [1.3.5](https://github.com/oldmanumby/gitwarp/compare/v1.3.3...v1.3.5) (2026-07-22)

### Bug Fixes

- brute force CSS variables for blume docs theme ([40960a3](https://github.com/oldmanumby/gitwarp/commit/40960a3190731e73c2e4ffaea2a0eda5d5ff2899))
- resolve docs styling issues by using native theme.css ([0f337bf](https://github.com/oldmanumby/gitwarp/commit/0f337bf91b32bb2f8ce842e422c8bbeff6ec9e8e))

### [1.3.3](https://github.com/oldmanumby/gitwarp/compare/v1.3.2...v1.3.3) (2026-07-22)

### Bug Fixes

- enforce GitWarp brand colors and lock docs into dark mode ([df947e9](https://github.com/oldmanumby/gitwarp/commit/df947e9ebd7e3707bc4075c801e5bcdb324660d6))

### [1.3.2](https://github.com/oldmanumby/gitwarp/compare/v1.3.1...v1.3.2) (2026-07-22)

### Bug Fixes

- explicitly provide `{ light, dark }` object syntax for Blume theme colors to prevent compiler from silently dropping strings ([d332eb8](https://github.com/oldmanumby/gitwarp/commit/d332eb8))

### [1.3.1](https://github.com/oldmanumby/gitwarp/compare/v1.3.0...v1.3.1) (2026-07-22)

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

[1.0.0]: https://github.com/oldmanumby/gitwarp/releases/tag/v1.0.0
