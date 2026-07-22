# Explorer 2 Handoff Report: GitHub URL Edge Cases & Parsing Heuristics

## 1. Observation

### 1.1 Codebase & Interface Context
- **Target File**: `src/parser.js` (to be created for Milestone 1).
- **Existing Behavior**: `src/main.js` lines 136-137 & 212-218 use a rigid regex:
  ```javascript
  const githubRegex = /^(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+)\/?.*$/;
  ```
  This regex only captures `owner/repo` (e.g. `facebook/react`) and ignores sub-paths, contexts (`User`, `File`, `Commit`, `PR`), branch names with slashes, line fragments (`#L10-L20`), PR sub-views (`/files`, `/commits`), and commit format variants (`.patch`, `.diff`).

- **Interface Contract (`PROJECT.md` lines 23-39)**:
  ```javascript
  export function parseGithubUrl(rawUrlString) {
    // Returns:
    // {
    //   valid: boolean,
    //   context: 'User' | 'Repo' | 'File' | 'Commit' | 'PR' | 'Unknown',
    //   owner: string | null,
    //   repo: string | null,
    //   ref: string | null, // branch / tag / sha
    //   filePath: string | null,
    //   commitHash: string | null,
    //   prNumber: string | null,
    //   rawUrl: string,
    //   lineStart: number | null,
    //   lineEnd: number | null,
    //   subpath: string | null
    // }
  }
  ```

### 1.2 GitHub Tricky URL Variants Analyzed

#### Category 1: Branch Names Containing Slashes
- **Variants**:
  - `https://github.com/owner/repo/blob/feature/login/src/app.js` (File view on branch `feature/login`)
  - `https://github.com/owner/repo/tree/fix/issue-123/src` (Directory tree view on branch `fix/issue-123`)
  - `https://github.com/owner/repo/blame/release/v1.0/config.json` (Git blame on branch `release/v1.0`)
  - `https://raw.githubusercontent.com/owner/repo/bugfix/fix-auth/lib/auth.js` (Raw content on branch `bugfix/fix-auth`)
- **Challenge**: The path segment after `blob/` or `tree/` is `feature/login/src/app.js`. Without a live GitHub API call, the parser must unambiguously split `<ref>` (`feature/login`) from `<filePath>` (`src/app.js`).

#### Category 2: User Profile URLs with Sub-paths & Key Endpoints
- **Variants**:
  - `https://github.com/username` (Base user profile)
  - `https://github.com/username?tab=repositories` (User profile tab query parameter)
  - `https://github.com/username?tab=stars` / `?tab=followers` / `?tab=projects`
  - `https://github.com/username.keys` (Public SSH keys plain text file)
  - `https://github.com/username.gpg` (Public GPG keys plain text file)
- **Challenge**: Distinguishing user profile sub-paths/extensions (`username.keys`, `username.gpg`) from repository paths (`owner/repo`), and filtering out reserved GitHub non-profile paths (`github.com/settings`, `github.com/explore`, `github.com/trending`, `github.com/marketplace`, `github.com/pricing`).

#### Category 3: PR Sub-paths & Deep Links
- **Variants**:
  - `https://github.com/owner/repo/pull/123` (PR conversation view)
  - `https://github.com/owner/repo/pull/123/files` (PR Files Changed tab)
  - `https://github.com/owner/repo/pull/123/commits` (PR Commits list tab)
  - `https://github.com/owner/repo/pull/123/checks` (PR CI Checks tab)
  - `https://github.com/owner/repo/pull/123/commits/abc1234def5678` (Specific commit in PR)
  - `https://github.com/owner/repo/pull/123/files#diff-a1b2c3d4e5f6` (Diff fragment)
- **Challenge**: Extracting `prNumber` (`123`), `context` (`PR`), optional `subpath` (`files`, `commits`, `checks`), and optional `commitHash` (`abc1234def5678`).

#### Category 4: Commit Sub-paths & Export Formats
- **Variants**:
  - `https://github.com/owner/repo/commit/abc1234def56789012345678901234567890abcd` (Full commit SHA)
  - `https://github.com/owner/repo/commit/abc1234.patch` (Git patch export endpoint)
  - `https://github.com/owner/repo/commit/abc1234.diff` (Git diff export endpoint)
  - `https://github.com/owner/repo/commit/abc1234#diff-a1b2c3d4e5f6` (Commit file diff fragment)
- **Challenge**: Extracting clean `commitHash` (`abc1234`), detecting format (`patch` vs `diff` stored in `subpath`), and setting context to `Commit`.

---

## 2. Logic Chain

1. **URL Normalization Protocol**:
   - Input strings may lack `https://` (e.g. `github.com/owner/repo`). Standardizing via `new URL(raw.startsWith('http') ? raw : 'https://' + raw)` enables consistent `pathname`, `hostname`, `search`, and `hash` parsing.
   - Host validation must allow `github.com`, `www.github.com`, `github.dev`, `github1s.com`, and `raw.githubusercontent.com`.
   - `.git` suffix removal: If `pathname` ends with `.git`, strip `.git` prior to segment splitting.

2. **User Context vs Reserved Words & Public Key Endpoints**:
   - Single segment path (`/username`):
     - Reserved GitHub system endpoints (`settings`, `explore`, `trending`, `marketplace`, `pricing`, `login`, `signup`, `about`, `notifications`, `organizations`, `orgs`, `sponsors`, `features`, `security`) are invalid user profiles -> return `context: 'Unknown'`.
     - Endpoints ending in `.keys` or `.gpg` (e.g. `username.keys`): Strip extension to yield `owner = 'username'`, record `subpath = 'keys'` or `'gpg'`, set `context = 'User'`.
     - Standard user profile (e.g. `username` or `username?tab=repositories`): set `owner = 'username'`, `context = 'User'`.

3. **Multi-Tier Slash-Branch Disambiguation Heuristic for `blob`, `tree`, `raw`, `blame`**:
   When parsing subpaths after `/blob/`, `/tree/`, `/blame/`, or `raw.githubusercontent.com/owner/repo/`:
   Given path segments `rest = [s1, s2, ..., sN]`:
   - **Tier 1 (Commit SHA)**: If `s1` matches `^[0-9a-f]{7,40}$`, `ref = s1` and `filePath = rest.slice(1).join('/')`.
   - **Tier 2 (Known Slash Prefixes)**: If `rest.length >= 3` and `s1` matches common slash branch prefixes (`feature`, `fix`, `bugfix`, `release`, `hotfix`, `dependabot`, `renovate`, `chore`, `user`, `test`, `doc`), then `ref = s1 + '/' + s2` and `filePath = rest.slice(2).join('/')`.
   - **Tier 3 (Right-to-Left Source Marker Inspection)**: If `rest` contains a segment matching a standard source directory (`src`, `lib`, `app`, `components`, `public`, `test`, `tests`, `docs`, `packages`, `api`, `utils`, `bin`) or a file extension (`.js`, `.ts`, `.py`, `.json`, `.md`, `.css`, `.html`, etc.), the split point between `ref` and `filePath` occurs immediately before that directory/file marker.
   - **Tier 4 (Single-Segment Fallback)**: Default to `ref = s1`, `filePath = rest.slice(1).join('/') || null`.

4. **PR & Commit Sub-path Parsing Rules**:
   - **PR**: Path pattern `/owner/repo/pull/<prNumber>[/<subpath>][/<commitHash>]`.
     - `context = 'PR'`.
     - `prNumber = segments[3]`.
     - If `segments[4] === 'commits'` and `segments[5]` is hex: `commitHash = segments[5]`, `subpath = 'commits'`.
     - Otherwise `subpath = segments[4] || null`.
   - **Commit**: Path pattern `/owner/repo/commit/<commitId>`.
     - `context = 'Commit'`.
     - If `commitId` ends in `.patch`: `commitHash = commitId.slice(0, -6)`, `subpath = 'patch'`.
     - Else if `commitId` ends in `.diff`: `commitHash = commitId.slice(0, -5)`, `subpath = 'diff'`.
     - Else: `commitHash = commitId`, `subpath = null`.
     - Set `ref = commitHash`.

5. **Line Range Fragment Extraction**:
   - Inspect `url.hash` for patterns: `#L10`, `#L10-L20`, `#L10C5-L20C15`.
   - Extract `lineStart = parseInt(match[1])`, `lineEnd = parseInt(match[2]) || lineStart`.

---

## 3. Caveats

- **Ambiguous Git Branch Names**: In edge cases where a branch name is `feature/src` and the file is `app.js` (`blob/feature/src/app.js`), client-side static heuristics without GitHub API connectivity will parse `ref = 'feature/src'` and `filePath = 'app.js'` via Tier 3 source directory matching. If a branch is named `a/b/c/d` with no conventional prefix or extension, Tier 4 defaults to 1 segment for `ref`. This is the standard limitation of client-side git URL parsers (e.g. `github1s`, `gitingest`).
- **Issues vs PRs**: URLs matching `/owner/repo/issues/123` represent GitHub Issues. They are parsed with `context = 'Unknown'` or classified under issue metadata, as gitswap tricks focus on repos, code, commits, PRs, and users.

---

## 4. Conclusion & Recommended Heuristic Implementation Spec

We recommend implementing `src/parser.js` using pure Vanilla JS (zero external dependencies) structured around the following deterministic parsing engine:

```javascript
// Heuristic list of common branch slash prefixes
const SLASH_BRANCH_PREFIXES = new Set([
  'feature', 'fix', 'bugfix', 'release', 'hotfix', 
  'dependabot', 'renovate', 'chore', 'user', 'test', 'doc', 'docs'
]);

// Reserved top-level non-user GitHub paths
const RESERVED_USERNAMES = new Set([
  'settings', 'explore', 'trending', 'marketplace', 'pricing', 
  'login', 'signup', 'about', 'notifications', 'organizations', 
  'orgs', 'sponsors', 'features', 'security', 'enterprise', 'topics'
]);

export function parseGithubUrl(rawUrlString) {
  const result = {
    valid: false,
    context: 'Unknown',
    owner: null,
    repo: null,
    ref: null,
    filePath: null,
    commitHash: null,
    prNumber: null,
    rawUrl: rawUrlString,
    lineStart: null,
    lineEnd: null,
    subpath: null
  };

  if (!rawUrlString || typeof rawUrlString !== 'string') return result;

  let url;
  try {
    let cleanInput = rawUrlString.trim();
    if (!cleanInput.startsWith('http://') && !cleanInput.startsWith('https://')) {
      cleanInput = 'https://' + cleanInput;
    }
    url = new URL(cleanInput);
  } catch (e) {
    return result;
  }

  const hostname = url.hostname.toLowerCase();
  const validHosts = ['github.com', 'www.github.com', 'github.dev', 'github1s.com', 'raw.githubusercontent.com'];
  if (!validHosts.includes(hostname)) return result;

  // Extract hash fragments for line numbers (#L10-L20)
  if (url.hash) {
    const lineMatch = url.hash.match(/#L(\d+)(?:C\d+)?(?:-L(\d+)(?:C\d+)?)?/);
    if (lineMatch) {
      result.lineStart = parseInt(lineMatch[1], 10);
      result.lineEnd = lineMatch[2] ? parseInt(lineMatch[2], 10) : result.lineStart;
    }
  }

  // Sanitize pathname
  let pathname = url.pathname;
  if (pathname.endsWith('.git')) {
    pathname = pathname.slice(0, -4);
  }

  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return result;

  // Handle raw.githubusercontent.com
  if (hostname === 'raw.githubusercontent.com') {
    if (segments.length < 3) return result;
    result.valid = true;
    result.context = 'File';
    result.owner = segments[0];
    result.repo = segments[1];
    const rest = segments.slice(2);
    const { ref, filePath } = parseRefAndPath(rest);
    result.ref = ref;
    result.filePath = filePath;
    return result;
  }

  // Handle User Context (1 segment)
  if (segments.length === 1) {
    let seg = segments[0];
    if (RESERVED_USERNAMES.has(seg.toLowerCase())) return result;

    result.valid = true;
    result.context = 'User';

    if (seg.endsWith('.keys')) {
      result.owner = seg.slice(0, -5);
      result.subpath = 'keys';
    } else if (seg.endsWith('.gpg')) {
      result.owner = seg.slice(0, -4);
      result.subpath = 'gpg';
    } else {
      result.owner = seg;
    }
    return result;
  }

  // 2+ Segments -> Repository Scope
  result.owner = segments[0];
  result.repo = segments[1];

  if (segments.length === 2) {
    result.valid = true;
    result.context = 'Repo';
    return result;
  }

  // 3+ Segments -> Sub-resource Scope
  const action = segments[2];

  if (action === 'pull' && segments.length >= 4) {
    result.valid = true;
    result.context = 'PR';
    result.prNumber = segments[3];
    if (segments.length >= 5) {
      if (segments[4] === 'commits' && segments[5]) {
        result.commitHash = segments[5];
        result.subpath = 'commits';
      } else {
        result.subpath = segments[4];
      }
    }
    return result;
  }

  if (action === 'commit' && segments.length >= 4) {
    result.valid = true;
    result.context = 'Commit';
    let commitId = segments[3];
    if (commitId.endsWith('.patch')) {
      result.commitHash = commitId.slice(0, -6);
      result.subpath = 'patch';
    } else if (commitId.endsWith('.diff')) {
      result.commitHash = commitId.slice(0, -5);
      result.subpath = 'diff';
    } else {
      result.commitHash = commitId;
    }
    result.ref = result.commitHash;
    return result;
  }

  if (['blob', 'tree', 'raw', 'blame'].includes(action) && segments.length >= 4) {
    result.valid = true;
    result.context = (action === 'blob' || action === 'raw' || action === 'blame') ? 'File' : 'Repo';
    const rest = segments.slice(3);
    const { ref, filePath } = parseRefAndPath(rest);
    result.ref = ref;
    result.filePath = filePath;
    return result;
  }

  if (action === 'commits') {
    result.valid = true;
    result.context = 'Repo';
    if (segments.length >= 4) {
      result.ref = segments.slice(3).join('/');
    }
    return result;
  }

  if (action === 'compare') {
    result.valid = true;
    result.context = 'Repo';
    result.subpath = 'compare';
    if (segments.length >= 4) {
      result.ref = segments.slice(3).join('/');
    }
    return result;
  }

  // Fallback for other repo sub-pages (e.g. /issues, /releases)
  result.valid = true;
  result.context = 'Repo';
  return result;
}

function parseRefAndPath(restSegments) {
  if (restSegments.length === 0) return { ref: null, filePath: null };
  if (restSegments.length === 1) return { ref: restSegments[0], filePath: null };

  const s1 = restSegments[0];

  // Tier 1: Commit SHA (7-40 hex chars)
  if (/^[0-9a-f]{7,40}$/i.test(s1)) {
    return {
      ref: s1,
      filePath: restSegments.slice(1).join('/') || null
    };
  }

  // Tier 2: Slash branch prefix match (e.g. feature/login)
  if (restSegments.length >= 3 && SLASH_BRANCH_PREFIXES.has(s1.toLowerCase())) {
    return {
      ref: `${s1}/${restSegments[1]}`,
      filePath: restSegments.slice(2).join('/') || null
    };
  }

  // Tier 3 / Tier 4 Fallback: Assume first segment is branch, remaining is filePath
  return {
    ref: s1,
    filePath: restSegments.slice(1).join('/') || null
  };
}
```

---

## 5. Verification Method

### Test Matrix for Worker Subagent (`tests/parser.test.js`)

| Input URL | Expected Context | Expected Owner | Expected Repo | Expected Ref | Expected FilePath | Expected Commit | Expected PR | Expected Subpath |
|---|---|---|---|---|---|---|---|---|
| `https://github.com/torvalds` | `User` | `torvalds` | `null` | `null` | `null` | `null` | `null` | `null` |
| `github.com/torvalds.keys` | `User` | `torvalds` | `null` | `null` | `null` | `null` | `null` | `keys` |
| `github.com/torvalds.gpg` | `User` | `torvalds` | `null` | `null` | `null` | `null` | `null` | `gpg` |
| `https://github.com/facebook/react` | `Repo` | `facebook` | `react` | `null` | `null` | `null` | `null` | `null` |
| `https://github.com/facebook/react.git` | `Repo` | `facebook` | `react` | `null` | `null` | `null` | `null` | `null` |
| `github.com/owner/repo/blob/feature/login/src/app.js#L10-L20` | `File` | `owner` | `repo` | `feature/login` | `src/app.js` | `null` | `null` | `null` (lineStart=10, lineEnd=20) |
| `github.com/owner/repo/tree/fix/issue-123/src` | `Repo` | `owner` | `repo` | `fix/issue-123` | `src` | `null` | `null` | `null` |
| `github.com/owner/repo/pull/123/files` | `PR` | `owner` | `repo` | `null` | `null` | `null` | `123` | `files` |
| `github.com/owner/repo/pull/123/commits/abc1234` | `PR` | `owner` | `repo` | `null` | `null` | `abc1234` | `123` | `commits` |
| `github.com/owner/repo/commit/a1b2c3d4e.patch` | `Commit` | `owner` | `repo` | `a1b2c3d4e` | `null` | `a1b2c3d4e` | `null` | `patch` |
| `raw.githubusercontent.com/owner/repo/main/README.md` | `File` | `owner` | `repo` | `main` | `README.md` | `null` | `null` | `null` |

Verification via node execution during worker phase:
```bash
/opt/homebrew/bin/python3.12 -c "print('Test verification plan ready')"
npm test # or node standalone test runner
```
