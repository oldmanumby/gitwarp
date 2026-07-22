## 2026-07-21T22:52:28Z

You are Worker for Milestone 1: URL Context Parser.

Your working directory is `/Users/oldmanumby/Documents/Projects/CODING/APPS/gitswapForged/.agents/worker_m1`. Please write your briefing and handoff report in your working directory.

Project workspace: `/Users/oldmanumby/Documents/Projects/CODING/APPS/gitswapForged`

Task:
1. Implement `src/parser.js` in pure Vanilla JS with full support for GitHub URL context parsing.
   Exports required:
   - `parseGithubUrl(inputUrl)`: Returns an immutable (via `Object.freeze`) context object:
     `{ valid: boolean, context: 'User'|'Repo'|'File'|'Commit'|'PR'|'Unknown', type: string, owner: string|null, repo: string|null, ref: string|null, filePath: string|null, path: string|null, commitHash: string|null, commitSha: string|null, prNumber: string|null, lineStart: number|null, lineEnd: number|null, isRaw: boolean, queryParams: Record<string,string>, rawUrl: string, normalizedUrl: string|null }`
   - `isValidGithubUrl(inputUrl)`: returns boolean
   - `extractRepoPath(inputUrl)`: returns `owner/repo` string or null
   - `normalizeGithubUrl(inputUrl)`: returns normalized HTTPS URL string or null

   Reference the Explorer specifications at:
   - `/Users/oldmanumby/Documents/Projects/CODING/APPS/gitswapForged/.agents/explorer_m1_3/handoff.md`
   - `/Users/oldmanumby/Documents/Projects/CODING/APPS/gitswapForged/.agents/explorer_m1_1/handoff.md`

2. Create a test file `test/parser.test.js` using Node's native test runner (`node --test`) and `node:assert/strict`.
   Include test cases for:
   - User URLs (`github.com/octocat`) -> context: 'User', owner: 'octocat'
   - Repo URLs (`github.com/octocat/Spoon-Knife`, `.git` stripping, `/tree/main`) -> context: 'Repo'
   - File URLs (`blob/main/README.md`, line fragments `#L10-L20`, query parameters `?plain=1`, `raw.githubusercontent.com`) -> context: 'File'
   - Commit URLs (`commit/d6b777053b94a8c92a9b40742f1f58273614138e`) -> context: 'Commit'
   - PR URLs (`pull/42`, `pull/42/files`) -> context: 'PR'
   - Reserved routes (`github.com/settings`, `github.com/explore`) -> context: 'Unknown', valid: false
   - Immutability check (`assert.ok(Object.isFrozen(parsed))`)

3. Run `node --test test/parser.test.js` and `npm run build` to verify tests pass and Vite build compiles without errors.

4. MANDATORY INTEGRITY WARNING:
   DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

5. Write your complete handoff report with exact test command outputs to `/Users/oldmanumby/Documents/Projects/CODING/APPS/gitswapForged/.agents/worker_m1/handoff.md`.
6. Send a message to parent when completed.
