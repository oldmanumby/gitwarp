# Handoff Report: Milestone 1 - URL Context Parser Analysis & Specification

**Working Directory**: `/Users/oldmanumby/Documents/Projects/CODING/APPS/gitswapForged/.agents/explorer_m1_1`  
**Target Module**: `src/parser.js`  
**Date**: 2026-07-22  
**Author**: Explorer 1  

---

## 1. Observation

Direct examination of existing code in `src/main.js` reveals the following current implementation:

- **Line 137**:
  ```javascript
  const githubRegex = /^(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+)\/?.*$/;
  ```
- **Lines 201–225**:
  ```javascript
  function handleInput() {
    const value = repoInput.value.trim();
    errorMessage.textContent = '';
    
    if (!value) {
      renderCards('');
      return;
    }
    
    const match = value.match(githubRegex);
    
    if (match && match[1]) {
      // Valid GitHub URL
      let repoPath = match[1];
      // Remove .git if present at the end
      if (repoPath.endsWith('.git')) {
          repoPath = repoPath.slice(0, -4);
      }
      renderCards(repoPath);
    } else {
      // Invalid URL format
      errorMessage.textContent = 'Please enter a valid GitHub repository URL (e.g., https://github.com/owner/repo)';
      renderCards('');
    }
  }
  ```

### Key Flaws Identified:
1. **Context Inflexibility**: The regex strictly requires two slashes (`owner/repo`). It fails completely on:
   - **User Context** (`https://github.com/username`): Regex yields `null`, displaying an invalid URL error.
   - **File Context** (`https://github.com/owner/repo/blob/main/src/main.js`): `match[1]` extracts only `owner/repo`, discarding branch (`main`), path (`src/main.js`), and fragment/query information.
   - **Commit Context** (`https://github.com/owner/repo/commit/sha`): Discards commit SHA.
   - **PR Context** (`https://github.com/owner/repo/pull/123`): Discards PR number.
2. **Edge Case Truncation**:
   - Query strings (`?plain=1`) and line fragments (`#L10-L20`) are matched by `.*$` and discarded.
   - `.git` suffix stripping is only evaluated against `match[1]` (`owner/repo.git`), failing if additional path segments follow.
   - Lack of structured URL object usage leads to fragile regex matching instead of leveraging browser-native `URL` parsing.

---

## 2. Logic Chain

To support all 5 GitHub URL context types while gracefully handling edge cases, parsing must be split into three distinct logical stages:

### Stage 1: Pre-processing & Normalization (`normalizeUrl`)
1. **Whitespace Trimming**: `rawInput.trim()` removes leading/trailing whitespace.
2. **Protocol Insertion**: If the URL lacks `http://` or `https://`, prepend `https://` (e.g., `github.com/owner/repo` -> `https://github.com/owner/repo`).
3. **Native URL Parsing**: Construct `new URL(normalizedString)`. If `new URL()` throws an exception, flag input as malformed.
4. **Domain Validation**: Verify `url.hostname` belongs to supported GitHub domains (`github.com`, `www.github.com`, `raw.githubusercontent.com`, `github.dev`, `github1s.com`).

### Stage 2: Path Decomposition & Context Routing (`parseGitHubUrl`)
Break `url.pathname` into sanitized non-empty path segments (`pathname.split('/').filter(Boolean)`):

1. **Empty Path (`segments.length === 0`)**: Homepage (`https://github.com/`) -> Invalid context.
2. **Single Segment (`segments.length === 1`)**:
   - Check if `segments[0]` exists in `RESERVED_NAMES` set (`orgs`, `settings`, `notifications`, `explore`, `marketplace`, `trending`, `topics`, `login`, `join`, `search`, etc.).
   - If reserved: Return invalid context (not a profile).
   - If valid name: **User Context** (`type: 'user'`, `owner: segments[0]`).
3. **Two Segments (`segments.length === 2`)**:
   - `[owner, rawRepo]` -> Strip `.git` from `rawRepo` to get `repo`.
   - **Repo Context** (`type: 'repo'`, `owner`, `repo`, `repoPath: '${owner}/${repo}'`).
4. **Three or More Segments (`segments.length >= 3`)**:
   - `owner = segments[0]`, `repo = segments[1].replace(/\.git$/, '')`, `route = segments[2]`.
   - **Route Matching**:
     - `route === 'tree'`: **Repo Context** with branch/path (`ref = segments[3]`, `path = segments.slice(4).join('/')`).
     - `route === 'blob' || route === 'raw'`: **File Context** (`type: 'file'`, `ref = segments[3]`, `path = segments.slice(4).join('/')`, `isRaw = route === 'raw'`).
     - `route === 'commit'`: **Commit Context** (`type: 'commit'`, `commitSha = segments[3]`).
     - `route === 'pull' || route === 'pulls'`: **PR Context** (`type: 'pr'`, `prNumber = parseInt(segments[3], 10)`, `subView = segments[4] || null`).

### Stage 3: Metadata Extraction (Query & Fragment Parsing)
1. **Query Parameters**: Convert `url.searchParams` into a plain object `queryParams`.
2. **Line Fragments (`#L10-L20` or `#L15`)**:
   - Match `#L(\d+)(?:C\d+)?-L(\d+)(?:C\d+)?` -> `{ lineStart: N1, lineEnd: N2 }`.
   - Match `#L(\d+)(?:C\d+)?` -> `{ lineStart: N, lineEnd: N }`.

---

## 3. Recommended Function Specifications for `src/parser.js`

### Data Structure: `ParsedContext`

```javascript
/**
 * @typedef {Object} ParsedContext
 * @property {boolean} valid - True if URL is a valid, supported GitHub URL
 * @property {'user' | 'repo' | 'file' | 'commit' | 'pr' | 'unknown'} type - Primary context type
 * @property {string|null} owner - GitHub user or organization name
 * @property {string|null} repo - Repository name (stripped of .git)
 * @property {string|null} repoPath - 'owner/repo' shorthand if repo exists
 * @property {string|null} ref - Branch, tag, or ref name (for blob/tree)
 * @property {string|null} path - Relative file or directory path
 * @property {string|null} commitSha - Full or short commit SHA
 * @property {number|null} prNumber - Pull request issue number
 * @property {string|null} subView - PR tab/subview ('files', 'commits', etc.)
 * @property {boolean} isRaw - True if pointing directly to raw file contents
 * @property {number|null} lineStart - Start line number from fragment
 * @property {number|null} lineEnd - End line number from fragment
 * @property {string} originalUrl - Unmodified user input string
 * @property {string} normalizedUrl - Cleaned canonical HTTPS URL
 * @property {Record<string, string>} queryParams - Key-value map of URL query params
 * @property {string|null} error - Human-readable error description if invalid
 */
```

### Core Implementation Specs

```javascript
// Reserved GitHub top-level path segments that are NOT usernames
const RESERVED_NAMES = new Set([
  'orgs', 'settings', 'notifications', 'explore', 'marketplace', 
  'trending', 'topics', 'login', 'join', 'signup', 'search', 
  'features', 'enterprise', 'pricing', 'customer-stories', 
  'security', 'about', 'contact', 'blog', 'press', 'careers', 
  'site', 'sponsors', 'apps'
]);

/**
 * Normalizes user input into a valid URL object or null
 * @param {string} inputUrl 
 * @returns {URL|null}
 */
export function normalizeUrl(inputUrl) {
  if (typeof inputUrl !== 'string') return null;
  let cleaned = inputUrl.trim();
  if (!cleaned) return null;

  // Prepend protocol if missing
  if (!/^https?:\/\//i.test(cleaned)) {
    cleaned = 'https://' + cleaned;
  }

  try {
    const parsed = new URL(cleaned);
    const validHostnames = ['github.com', 'www.github.com', 'raw.githubusercontent.com', 'github.dev', 'github1s.com'];
    if (!validHostnames.includes(parsed.hostname.toLowerCase())) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Parses hash fragment for line numbers (e.g. #L10-L20 or #L15)
 * @param {string} hash 
 * @returns {{ lineStart: number|null, lineEnd: number|null }}
 */
export function extractLineNumbers(hash) {
  if (!hash) return { lineStart: null, lineEnd: null };
  
  // Range: #L10-L20 or #L10C1-L20C5
  const rangeMatch = hash.match(/^#L(\d+)(?:C\d+)?-L(\d+)(?:C\d+)?$/i);
  if (rangeMatch) {
    return {
      lineStart: parseInt(rangeMatch[1], 10),
      lineEnd: parseInt(rangeMatch[2], 10)
    };
  }

  // Single line: #L10 or #L10C5
  const singleMatch = hash.match(/^#L(\d+)(?:C\d+)?$/i);
  if (singleMatch) {
    const line = parseInt(singleMatch[1], 10);
    return { lineStart: line, lineEnd: line };
  }

  return { lineStart: null, lineEnd: null };
}

/**
 * Parses any GitHub URL into a detailed ParsedContext object
 * @param {string} inputUrl 
 * @returns {ParsedContext}
 */
export function parseGitHubUrl(inputUrl) {
  const originalUrl = inputUrl || '';
  const urlObj = normalizeUrl(inputUrl);

  const baseResult = {
    valid: false,
    type: 'unknown',
    owner: null,
    repo: null,
    repoPath: null,
    ref: null,
    path: null,
    commitSha: null,
    prNumber: null,
    subView: null,
    isRaw: false,
    lineStart: null,
    lineEnd: null,
    originalUrl,
    normalizedUrl: urlObj ? urlObj.href : '',
    queryParams: {},
    error: null
  };

  if (!urlObj) {
    return {
      ...baseResult,
      error: 'Please enter a valid GitHub URL (e.g., https://github.com/owner/repo)'
    };
  }

  // Extract Query Parameters
  const queryParams = {};
  urlObj.searchParams.forEach((val, key) => {
    queryParams[key] = val;
  });
  baseResult.queryParams = queryParams;

  // Extract Line Numbers from Hash
  const { lineStart, lineEnd } = extractLineNumbers(urlObj.hash);
  baseResult.lineStart = lineStart;
  baseResult.lineEnd = lineEnd;

  // Handle raw.githubusercontent.com domain special case
  if (urlObj.hostname.toLowerCase() === 'raw.githubusercontent.com') {
    const segments = urlObj.pathname.split('/').filter(Boolean);
    if (segments.length >= 3) {
      const owner = segments[0];
      const repo = segments[1].replace(/\.git$/i, '');
      const ref = segments[2];
      const filePath = segments.slice(3).join('/');
      return {
        ...baseResult,
        valid: true,
        type: 'file',
        owner,
        repo,
        repoPath: `${owner}/${repo}`,
        ref,
        path: filePath || null,
        isRaw: true
      };
    }
  }

  // Path segments decomposition for github.com, github.dev, github1s.com
  const segments = urlObj.pathname.split('/').filter(Boolean);

  if (segments.length === 0) {
    return { ...baseResult, error: 'GitHub homepage URL has no context' };
  }

  // 1. User Context: github.com/username
  if (segments.length === 1) {
    const owner = segments[0];
    if (RESERVED_NAMES.has(owner.toLowerCase())) {
      return { ...baseResult, error: `'${owner}' is a reserved GitHub page, not a user context` };
    }
    return {
      ...baseResult,
      valid: true,
      type: 'user',
      owner
    };
  }

  const owner = segments[0];
  const rawRepo = segments[1];
  const repo = rawRepo.replace(/\.git$/i, '');
  const repoPath = `${owner}/${repo}`;

  if (RESERVED_NAMES.has(owner.toLowerCase())) {
    return { ...baseResult, error: `Invalid user/org name '${owner}'` };
  }

  // 2. Repo Context (Root): github.com/owner/repo
  if (segments.length === 2) {
    return {
      ...baseResult,
      valid: true,
      type: 'repo',
      owner,
      repo,
      repoPath
    };
  }

  // 3. Sub-resource routes (tree, blob, raw, commit, pull)
  const route = segments[2].toLowerCase();

  if (route === 'tree') {
    const ref = segments[3] || null;
    const subpath = segments.slice(4).join('/') || null;
    return {
      ...baseResult,
      valid: true,
      type: 'repo',
      owner,
      repo,
      repoPath,
      ref,
      path: subpath
    };
  }

  if (route === 'blob' || route === 'raw') {
    const ref = segments[3] || null;
    const filePath = segments.slice(4).join('/') || null;
    return {
      ...baseResult,
      valid: true,
      type: 'file',
      owner,
      repo,
      repoPath,
      ref,
      path: filePath,
      isRaw: route === 'raw'
    };
  }

  if (route === 'commit') {
    const sha = segments[3] || null;
    if (!sha || !/^[0-9a-fA-F]{7,40}$/.test(sha)) {
      return { ...baseResult, error: 'Invalid commit SHA format' };
    }
    return {
      ...baseResult,
      valid: true,
      type: 'commit',
      owner,
      repo,
      repoPath,
      commitSha: sha
    };
  }

  if (route === 'pull' || route === 'pulls') {
    const prStr = segments[3] || null;
    const prNumber = prStr && /^\d+$/.test(prStr) ? parseInt(prStr, 10) : null;
    if (!prNumber) {
      return { ...baseResult, error: 'Invalid Pull Request number' };
    }
    const subView = segments[4] || null;
    return {
      ...baseResult,
      valid: true,
      type: 'pr',
      owner,
      repo,
      repoPath,
      prNumber,
      subView
    };
  }

  // Fallback for other repository paths (e.g. /releases, /issues, /actions)
  return {
    ...baseResult,
    valid: true,
    type: 'repo',
    owner,
    repo,
    repoPath,
    path: segments.slice(2).join('/')
  };
}
```

---

## 4. Caveats

1. **Branch Names containing Slashes**:
   - In GitHub URLs like `github.com/owner/repo/blob/feature/login/src/app.js`, client-side parsing without GitHub REST API calls cannot definitively distinguish whether the ref is `feature` or `feature/login`.
   - *Strategy*: By convention in static parsers, `segments[3]` (`feature`) is extracted as the initial `ref`, and `login/src/app.js` as `path`. If required by services, an optional branch delimiter parameter can be added.
2. **Reserved Route List**:
   - The static list `RESERVED_NAMES` covers standard GitHub routes. If GitHub introduces new top-level routes, updating `RESERVED_NAMES` ensures user profile URLs aren't misclassified.
3. **Commit SHA Verification**:
   - SHA length checking allows standard short SHAs (7 chars) up to full 40-char SHA-1 (and 64-char SHA-256).

---

## 5. Conclusion

The specification provides a complete, robust, zero-dependency Vanilla JS module for `src/parser.js`. It expands gitswapForged from supporting only basic `owner/repo` paths to accurately recognizing all 5 context types (User, Repo, File, Commit, PR) alongside edge cases like line fragments (`#L10-L20`), raw domains, `.git` suffixes, missing protocols, and query parameters.

---

## 6. Verification Method

### Test Matrix for Invalidation & Verification

To verify the implementation of `src/parser.js`, run the following test suite against `parseGitHubUrl`:

| # | Input URL | Expected `valid` | Expected `type` | Key Output Verification |
|---|---|---|---|---|
| 1 | `https://github.com/octocat` | `true` | `'user'` | `owner: 'octocat'`, `repo: null` |
| 2 | `github.com/facebook/react` | `true` | `'repo'` | `owner: 'facebook'`, `repo: 'react'` |
| 3 | `https://github.com/owner/repo.git/` | `true` | `'repo'` | `repo: 'repo'` (stripped `.git`) |
| 4 | `https://github.com/owner/repo/tree/main` | `true` | `'repo'` | `ref: 'main'`, `path: null` |
| 5 | `https://github.com/owner/repo/tree/v1.0.0/src/utils` | `true` | `'repo'` | `ref: 'v1.0.0'`, `path: 'src/utils'` |
| 6 | `https://github.com/owner/repo/blob/main/src/main.js` | `true` | `'file'` | `ref: 'main'`, `path: 'src/main.js'` |
| 7 | `https://github.com/owner/repo/blob/main/index.js#L10-L20` | `true` | `'file'` | `lineStart: 10`, `lineEnd: 20` |
| 8 | `https://github.com/owner/repo/blob/main/index.js?plain=1` | `true` | `'file'` | `queryParams: { plain: '1' }` |
| 9 | `https://raw.githubusercontent.com/owner/repo/main/pkg.json` | `true` | `'file'` | `isRaw: true`, `path: 'pkg.json'` |
| 10 | `https://github.com/owner/repo/commit/6dcb09b5b57875f33` | `true` | `'commit'` | `commitSha: '6dcb09b5b57875f33'` |
| 11 | `https://github.com/owner/repo/pull/123` | `true` | `'pr'` | `prNumber: 123`, `subView: null` |
| 12 | `https://github.com/owner/repo/pull/123/files` | `true` | `'pr'` | `prNumber: 123`, `subView: 'files'` |
| 13 | `https://github.com/settings` | `false` | `'unknown'` | `error: "'settings' is a reserved..."` |
| 14 | `https://gitlab.com/owner/repo` | `false` | `'unknown'` | `error: "Please enter a valid GitHub..."` |
| 15 | `  github.com/owner/repo  ` | `true` | `'repo'` | Leading/trailing whitespace trimmed |

### Command to Execute Verification:
Once `src/parser.js` is written by the Implementer agent, execute the test cases via Node.js or Vite test.
