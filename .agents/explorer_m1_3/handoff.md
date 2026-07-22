# Handoff Report — Milestone 1: URL Context Parser Specification & Test Matrix

**Agent**: Explorer 3  
**Working Directory**: `/Users/oldmanumby/Documents/Projects/CODING/APPS/gitswapForged/.agents/explorer_m1_3`  
**Target Module**: `src/parser.js`  
**Date**: 2026-07-21  

---

## 1. Observation

1. **Workspace Architecture**:
   - `gitswapForged` is a Vite + Vanilla JS single-page web application (`package.json` specifies `"type": "module"`).
   - Node.js runtime version is `v26.5.0` (supports native ESM, `node:assert/strict`, and built-in test runner via `node --test`).
   - Existing `src/main.js` currently uses a rudimentary regex `githubRegex = /^(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+)\/?.*$/` which only captures `owner/repo` and lacks context classification (User, Repo, File, Commit, PR).

2. **Interface Specification (`PROJECT.md`)**:
   - `parseGithubUrl(inputUrl)` must extract and return an immutable context result object containing:
     `{ valid, context, owner, repo, ref, filePath, commitHash, prNumber, rawUrl, normalizedUrl }`.
   - `context` must be one of `'User'`, `'Repo'`, `'File'`, `'Commit'`, `'PR'`, or `'Unknown'`.

---

## 2. Logic Chain

1. **Immutability Strategy**:
   - The result object produced by `parseGithubUrl(inputUrl)` MUST be wrapped in `Object.freeze(...)`.
   - This prevents downstream components (cards, interactive tools, DOM listeners) from inadvertently mutating shared URL context objects.

2. **Parsing & Normalization Mechanics**:
   - **Protocol Prepending**: If input omits protocol (e.g. `github.com/owner/repo`), automatically prepend `https://` before URL parsing.
   - **Sanitization**: Strip hash fragments (`#L10-L20`, `#diff-xxx`) and query parameters (`?plain=1`, `?w=1`) when classifying context and building `normalizedUrl`, while preserving original raw input in `rawUrl`.
   - **Suffix Removal**: Strip trailing `.git` from repository names (e.g. `Spoon-Knife.git` -> `Spoon-Knife`).
   - **Reserved Route Defense**: GitHub has top-level system paths (`/settings`, `/pricing`, `/features`, `/explore`, `/topics`, `/marketplace`, `/orgs`, `/login`, `/notifications`, `/search`, `/sponsors`). Any 1-segment URL matching these keywords MUST return `context: 'Unknown'` and `valid: false` to prevent false positive `'User'` classifications.

3. **Context Classification Rules**:
   - **User**: Path has 1 segment (`/<owner>`) not in reserved keywords list.
   - **Repo**: Path has 2 segments (`/<owner>/<repo>`), or 4 segments matching `/<owner>/<repo>/tree/<ref>` where `<ref>` has no subpath.
   - **File**: Path matches `/<owner>/<repo>/blob/<ref>/<filePath...>`, `/<owner>/<repo>/tree/<ref>/<filePath...>` (directory folder view), or domain `raw.githubusercontent.com/<owner>/<repo>/<ref>/<filePath...>`.
   - **Commit**: Path matches `/<owner>/<repo>/commit/<commitHash>`.
   - **PR**: Path matches `/<owner>/<repo>/pull/<prNumber>` (including sub-views like `/files`, `/commits`, `/checks`).
   - **Unknown**: Empty input, non-string, invalid domain, or unrecognized path structure.

4. **Testing Architecture Strategy**:
   - Utilize Node.js native test runner (`node --test test/parser.test.js`) combined with `node:assert/strict`.
   - Requires 0 external npm test dependencies, executes sub-millisecond, and works seamlessly with ES Modules (`"type": "module"`).

---

## 3. Caveats

1. **Branch Names Containing Slashes**:
   - In GitHub URLs like `/owner/repo/blob/feature/login/src/index.js`, without hitting GitHub's API it is impossible to definitively know if the ref is `feature` or `feature/login`.
   - **Heuristic Assumption**: Standard ref parser splits by `/blob/` or `/tree/` and assumes the 1st segment after `/blob/` is the ref unless matched against known multi-segment patterns. For standard single-segment branch names (`main`, `master`, `dev`, `v1.0.0`) or simple single slashes, the parser should extract standard ref and file paths cleanly.
2. **Raw GitHub Links**:
   - `raw.githubusercontent.com` URLs do not contain `/blob/` in their path. The parser must normalize these into standard `github.com/.../blob/...` URLs in `normalizedUrl`.

---

## 4. Conclusion & Complete Specification

### 4.1 Exact JavaScript API Signatures (`src/parser.js`)

```javascript
/**
 * @typedef {'User' | 'Repo' | 'File' | 'Commit' | 'PR' | 'Unknown'} GithubContextType
 */

/**
 * @typedef {Readonly<{
 *   valid: boolean,
 *   context: GithubContextType,
 *   owner: string | null,
 *   repo: string | null,
 *   ref: string | null,
 *   filePath: string | null,
 *   commitHash: string | null,
 *   prNumber: string | null,
 *   rawUrl: string,
 *   normalizedUrl: string | null
 * }>} ParsedGithubContext
 */

/**
 * Parses any GitHub URL string into an immutable, structured context object.
 *
 * @param {string} inputUrl - Raw URL string entered by user
 * @returns {ParsedGithubContext} Immutable context object (Object.freeze)
 */
export function parseGithubUrl(inputUrl) { ... }

/**
 * Returns true if inputUrl is a valid parseable GitHub URL with context != 'Unknown'.
 *
 * @param {string} inputUrl
 * @returns {boolean}
 */
export function isValidGithubUrl(inputUrl) { ... }

/**
 * Extracts 'owner/repo' string if inputUrl is in Repo, File, Commit, or PR context.
 *
 * @param {string} inputUrl
 * @returns {string | null}
 */
export function extractRepoPath(inputUrl) { ... }

/**
 * Normalizes inputUrl into standard https://github.com canonical format without trailing slashes or anchors.
 *
 * @param {string} inputUrl
 * @returns {string | null}
 */
export function normalizeGithubUrl(inputUrl) { ... }
```

---

### 4.2 Concrete Test Matrix

| # | Context | Input URL | Expected Output Object |
|---|---------|-----------|------------------------|
| 1 | **User** | `"https://github.com/octocat"` | `{ valid: true, context: 'User', owner: 'octocat', repo: null, ref: null, filePath: null, commitHash: null, prNumber: null, rawUrl: 'https://github.com/octocat', normalizedUrl: 'https://github.com/octocat' }` |
| 2 | **User** | `"github.com/torvalds/"` | `{ valid: true, context: 'User', owner: 'torvalds', repo: null, ref: null, filePath: null, commitHash: null, prNumber: null, rawUrl: 'github.com/torvalds/', normalizedUrl: 'https://github.com/torvalds' }` |
| 3 | **Repo** | `"https://github.com/octocat/Spoon-Knife"` | `{ valid: true, context: 'Repo', owner: 'octocat', repo: 'Spoon-Knife', ref: null, filePath: null, commitHash: null, prNumber: null, rawUrl: 'https://github.com/octocat/Spoon-Knife', normalizedUrl: 'https://github.com/octocat/Spoon-Knife' }` |
| 4 | **Repo** | `"https://github.com/octocat/Spoon-Knife.git"` | `{ valid: true, context: 'Repo', owner: 'octocat', repo: 'Spoon-Knife', ref: null, filePath: null, commitHash: null, prNumber: null, rawUrl: 'https://github.com/octocat/Spoon-Knife.git', normalizedUrl: 'https://github.com/octocat/Spoon-Knife' }` |
| 5 | **Repo** | `"https://github.com/octocat/Spoon-Knife/tree/main"` | `{ valid: true, context: 'Repo', owner: 'octocat', repo: 'Spoon-Knife', ref: 'main', filePath: null, commitHash: null, prNumber: null, rawUrl: 'https://github.com/octocat/Spoon-Knife/tree/main', normalizedUrl: 'https://github.com/octocat/Spoon-Knife/tree/main' }` |
| 6 | **File** | `"https://github.com/octocat/Spoon-Knife/blob/main/README.md"` | `{ valid: true, context: 'File', owner: 'octocat', repo: 'Spoon-Knife', ref: 'main', filePath: 'README.md', commitHash: null, prNumber: null, rawUrl: 'https://github.com/octocat/Spoon-Knife/blob/main/README.md', normalizedUrl: 'https://github.com/octocat/Spoon-Knife/blob/main/README.md' }` |
| 7 | **File** | `"https://github.com/octocat/Spoon-Knife/blob/main/src/utils/math.js#L10-L25"` | `{ valid: true, context: 'File', owner: 'octocat', repo: 'Spoon-Knife', ref: 'main', filePath: 'src/utils/math.js', commitHash: null, prNumber: null, rawUrl: 'https://github.com/octocat/Spoon-Knife/blob/main/src/utils/math.js#L10-L25', normalizedUrl: 'https://github.com/octocat/Spoon-Knife/blob/main/src/utils/math.js' }` |
| 8 | **File** | `"https://raw.githubusercontent.com/octocat/Spoon-Knife/main/package.json"` | `{ valid: true, context: 'File', owner: 'octocat', repo: 'Spoon-Knife', ref: 'main', filePath: 'package.json', commitHash: null, prNumber: null, rawUrl: 'https://raw.githubusercontent.com/octocat/Spoon-Knife/main/package.json', normalizedUrl: 'https://github.com/octocat/Spoon-Knife/blob/main/package.json' }` |
| 9 | **File** | `"https://github.com/octocat/Spoon-Knife/tree/main/src/components"` | `{ valid: true, context: 'File', owner: 'octocat', repo: 'Spoon-Knife', ref: 'main', filePath: 'src/components', commitHash: null, prNumber: null, rawUrl: 'https://github.com/octocat/Spoon-Knife/tree/main/src/components', normalizedUrl: 'https://github.com/octocat/Spoon-Knife/tree/main/src/components' }` |
| 10 | **Commit** | `"https://github.com/octocat/Spoon-Knife/commit/d6b777053b94a8c92a9b40742f1f58273614138e"` | `{ valid: true, context: 'Commit', owner: 'octocat', repo: 'Spoon-Knife', ref: 'd6b777053b94a8c92a9b40742f1f58273614138e', filePath: null, commitHash: 'd6b777053b94a8c92a9b40742f1f58273614138e', prNumber: null, rawUrl: 'https://github.com/octocat/Spoon-Knife/commit/d6b777053b94a8c92a9b40742f1f58273614138e', normalizedUrl: 'https://github.com/octocat/Spoon-Knife/commit/d6b777053b94a8c92a9b40742f1f58273614138e' }` |
| 11 | **Commit** | `"https://github.com/octocat/Spoon-Knife/commit/d6b777#diff-1234"` | `{ valid: true, context: 'Commit', owner: 'octocat', repo: 'Spoon-Knife', ref: 'd6b777', filePath: null, commitHash: 'd6b777', prNumber: null, rawUrl: 'https://github.com/octocat/Spoon-Knife/commit/d6b777#diff-1234', normalizedUrl: 'https://github.com/octocat/Spoon-Knife/commit/d6b777' }` |
| 12 | **PR** | `"https://github.com/octocat/Spoon-Knife/pull/42"` | `{ valid: true, context: 'PR', owner: 'octocat', repo: 'Spoon-Knife', ref: null, filePath: null, commitHash: null, prNumber: '42', rawUrl: 'https://github.com/octocat/Spoon-Knife/pull/42', normalizedUrl: 'https://github.com/octocat/Spoon-Knife/pull/42' }` |
| 13 | **PR** | `"https://github.com/octocat/Spoon-Knife/pull/42/files?w=1"` | `{ valid: true, context: 'PR', owner: 'octocat', repo: 'Spoon-Knife', ref: null, filePath: null, commitHash: null, prNumber: '42', rawUrl: 'https://github.com/octocat/Spoon-Knife/pull/42/files?w=1', normalizedUrl: 'https://github.com/octocat/Spoon-Knife/pull/42' }` |
| 14 | **Unknown** | `"https://github.com/settings"` (System route) | `{ valid: false, context: 'Unknown', owner: null, repo: null, ref: null, filePath: null, commitHash: null, prNumber: null, rawUrl: 'https://github.com/settings', normalizedUrl: null }` |
| 15 | **Unknown** | `"https://gitlab.com/octocat/Spoon-Knife"` (External domain) | `{ valid: false, context: 'Unknown', owner: null, repo: null, ref: null, filePath: null, commitHash: null, prNumber: null, rawUrl: 'https://gitlab.com/octocat/Spoon-Knife', normalizedUrl: null }` |
| 16 | **Unknown** | `""` or `null` or `123` | `{ valid: false, context: 'Unknown', owner: null, repo: null, ref: null, filePath: null, commitHash: null, prNumber: null, rawUrl: '', normalizedUrl: null }` |

---

## 5. Verification Method

1. **Implementation Target**:
   Worker subagent creates `src/parser.js` implementing the signatures above.
2. **Test File**:
   Worker subagent creates `test/parser.test.js` exercising all 16 matrix cases above plus immutability check (`assert.ok(Object.isFrozen(parsed))`).
3. **Execution Command**:
   Run in project root `/Users/oldmanumby/Documents/Projects/CODING/APPS/gitswapForged`:
   ```bash
   node --test test/parser.test.js
   ```
4. **Invalidation Condition**:
   If any test case fails, if `parseGithubUrl()` output is not frozen, or if non-string/malformed inputs throw an unhandled exception, verification fails.
