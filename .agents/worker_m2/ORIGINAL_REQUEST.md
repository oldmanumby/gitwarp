## 2026-07-22T03:57:04Z

You are Worker for Milestone 2: Standard Trick Cards & Compatibility System.

Your working directory is `/Users/oldmanumby/Documents/Projects/CODING/APPS/gitswapForged/.agents/worker_m2`. Please write your briefing and handoff report in your working directory.

Project workspace: `/Users/oldmanumby/Documents/Projects/CODING/APPS/gitswapForged`

Task:
1. Implement `/Users/oldmanumby/Documents/Projects/CODING/APPS/gitswapForged/src/cards.js` based on the Explorer specification at `/Users/oldmanumby/Documents/Projects/CODING/APPS/gitswapForged/.agents/explorer_m2/handoff.md`.
   Exports required:
   - `STANDARD_CARDS`: Array of 23 standard trick card objects (11 existing + 12 new: `.keys`, `.gpg`, `.patch`, `.diff`, `releases.atom`, `commits.atom`, `zip_archive`, `codespaces_new`, `gitpod_io`, `vscode_dev`, `ssh_clone`, `raw_file`).
     Each card object structure: `{ id, name, icon, allowedContexts, description, generateUrl(parsedContext) }`
   - `isCardCompatible(card, parsedContext)`: returns boolean (true if parsedContext is valid and card can generate a valid URL for it)
   - `getCardUrl(card, parsedContext)`: returns generated URL string or null

2. Create `test/cards.test.js` using Node's native test runner (`node --test`) and `node:assert/strict`:
   - Test catalog completeness (23 cards)
   - Test compatibility across User, Repo, File, Commit, PR, and Unknown contexts
   - Test URL generation accuracy for all 23 cards

3. Run:
```bash
node --test test/parser.test.js
node --test test/cards.test.js
npm run build
```

4. MANDATORY INTEGRITY WARNING:
   DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

5. Write your handoff report to `/Users/oldmanumby/Documents/Projects/CODING/APPS/gitswapForged/.agents/worker_m2/handoff.md`.
6. Send a message to parent when completed.
