# BRIEFING — 2026-07-21T22:58:00Z

## Mission
Analyze existing card definitions and specify `src/cards.js` with 23 standard trick cards, data structures, compatibility check logic, and visual indication requirements for incompatible cards.

## 🔒 My Identity
- Archetype: Explorer
- Roles: Read-only investigation, spec writer, analyst
- Working directory: /Users/oldmanumby/Documents/Projects/CODING/APPS/gitswapForged/.agents/explorer_m2
- Original parent: cb60e3aa-6a12-45dc-9981-67ef70ae0821
- Milestone: Milestone 2 (Standard Trick Cards & Compatibility System)

## 🔒 Key Constraints
- Read-only investigation — do NOT edit source code files (`src/*.js`, etc.)
- Only write metadata, reports, and specs inside working directory `.agents/explorer_m2/`
- Communicate findings and handoff report via `handoff.md` and `send_message` to parent

## Current Parent
- Conversation ID: cb60e3aa-6a12-45dc-9981-67ef70ae0821
- Updated: 2026-07-21T22:58:00Z

## Investigation State
- **Explored paths**: `src/main.js`, `src/parser.js`, `README.md`, `package.json`, `.agents/orchestrator/PROJECT.md`, `.agents/orchestrator/plan.md`
- **Key findings**:
  - `src/main.js` contains 11 legacy card objects in inline `services` array.
  - `src/parser.js` produces a frozen context object with `valid`, `context` (`'User'|'Repo'|'File'|'Commit'|'PR'|'Unknown'`), `owner`, `repo`, `ref`, `filePath`, `commitSha`, `prNumber`, etc.
  - Specified 23 standard trick cards (11 existing + 12 new: `.keys`, `.gpg`, `.patch`, `.diff`, `releases.atom`, `commits.atom`, `zip archive`, `codespaces.new`, `gitpod.io`, `vscode.dev`, `SSH clone URL`, `raw file URL`).
  - Standard card data structure: `{ id, name, icon, allowedContexts, description, generateUrl(parsedContext) }`.
  - Compatibility check function `isCardCompatible(card, parsedContext)` checks context match, non-null URL, and valid context.
  - Visual indication requirements specified (glass opacity, badge indicators, disabled link styling, disabled copy button).
- **Unexplored areas**: Milestone 3 interactive cards (`src/interactive.js`) which will be handled in M3.

## Key Decisions Made
- Organized all 23 standard cards into single catalog module `src/cards.js`.
- Exact context rules mapped for every card (e.g. `.keys`/`.gpg` work on User context, `.patch`/`.diff` require Commit/PR, `raw_file` requires File context, repo cards require Repo/File/Commit/PR).

## Artifact Index
- `/Users/oldmanumby/Documents/Projects/CODING/APPS/gitswapForged/.agents/explorer_m2/ORIGINAL_REQUEST.md` — Initial prompt
- `/Users/oldmanumby/Documents/Projects/CODING/APPS/gitswapForged/.agents/explorer_m2/BRIEFING.md` — Agent working state
- `/Users/oldmanumby/Documents/Projects/CODING/APPS/gitswapForged/.agents/explorer_m2/progress.md` — Heartbeat progress
- `/Users/oldmanumby/Documents/Projects/CODING/APPS/gitswapForged/.agents/explorer_m2/handoff.md` — Final Handoff Specification Report
