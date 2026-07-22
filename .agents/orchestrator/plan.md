# Execution Plan: gitswapForged Advanced GitHub URL Tricks

## Requirements Overview
- **R1. URL Context Parser**: Classify GitHub URLs into User, Repo, File, Commit, or PR context and extract metadata (owner, repo, branch/ref, filePath, commitHash, prNumber).
- **R2. Standard Trick Cards**: Expand services grid with 12 new cards (tricks 14-26, skipping 25) with context compatibility checks and disabled visual state.
- **R3. Interactive Cards**: Implement full-width "Advanced Tools" cards (Deep Linker, Time Machine, Commit Feed) with real-time form input updating generated URLs.
- **R4. Pure Vanilla JS**: DOM manipulation strictly in vanilla JS without external frameworks.
- **R5. Workflow & Verification**: Build via `npm run build` with zero errors, publish via `~/.gemini/config/skills/here-now/scripts/publish.sh`.

## Milestone Timeline

### Milestone 1: URL Context Parser Engine (`src/parser.js`)
- [ ] Dispatch Explorer subagent to analyze GitHub URL patterns & boundary conditions.
- [ ] Dispatch Worker subagent to implement `src/parser.js` and standalone test suite.
- [ ] Dispatch Reviewer & Challenger subagents to verify parsing accuracy across all 5 contexts.
- [ ] Forensic Audit gate check.

### Milestone 2: Standard Trick Cards & Compatibility System (`src/cards.js`)
- [ ] Define standard cards 1-13 (existing) + 14-26 excl 25 (new 12 cards).
- [ ] Implement context compatibility rules and disabled state badges.
- [ ] Worker, Reviewer, Challenger, Forensic Audit loop.

### Milestone 3: Interactive Advanced Tools (`src/interactive.js`)
- [ ] Implement Deep Linker card (L10-L20, ?plain=1 toggle).
- [ ] Implement Time Machine Compare card (base ref, timeframe, head ref).
- [ ] Implement Commit Feed Filter card (branch, author, path filters).
- [ ] Worker, Reviewer, Challenger, Forensic Audit loop.

### Milestone 4: UI Integration, CSS & Build Verification
- [ ] Wire `main.js`, `index.html`, and `style.css` together.
- [ ] Verify `npm run build` runs cleanly.
- [ ] Reviewer, Challenger, Forensic Audit loop.

### Milestone 5: Publishing & Final Verification
- [ ] Run `publish.sh` via worker to deploy to `here.now`.
- [ ] Verify live URL and complete Victory Audit.
