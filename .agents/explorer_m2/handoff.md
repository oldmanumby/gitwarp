# Handoff Report: Milestone 2 — Standard Trick Cards & Compatibility System Specification

## 1. Observation

### Codebase Examination
- **`src/main.js`**:
  - Lines 43–121: Contains an inline array `services` defining 11 existing cards (`boltnew`, `deepwiki`, `gitdiagram`, `gitingest`, `githubdev`, `githubgg`, `github1s`, `gitmcp`, `gitpodcast`, `stackblitz`, `starhistory`).
  - Currently relies on a simple regex `githubRegex` (line 137) matching only `owner/repo`, without context classification.
  - Generates URLs by replacing string `{repoPath}` in template strings (lines 149–153).
- **`src/parser.js`** (Milestone 1 output):
  - Function `parseGithubUrl(inputUrl)` (lines 76–410) parses URLs into context objects with `valid` boolean, `context` (`'User' | 'Repo' | 'File' | 'Commit' | 'PR' | 'Unknown'`), and fields: `owner`, `repo`, `ref`, `filePath`, `commitSha`, `prNumber`, `lineStart`, `lineEnd`, `isRaw`, `queryParams`, `rawUrl`, `normalizedUrl`.
- **`package.json`**:
  - Contains `"lucide": "^1.21.0"`.

---

## 2. Logic Chain

### 2.1 Standard Card Catalog Design (`src/cards.js`)
To support context-aware URL generation across all 5 parsed contexts, standard trick cards must be defined as modular objects in `src/cards.js`.

Each card object adheres to the following contract:
```typescript
interface StandardCard {
  id: string;
  name: string;
  icon: string; // Lucide icon identifier
  allowedContexts: Array<'User' | 'Repo' | 'File' | 'Commit' | 'PR'>;
  description: string;
  generateUrl: (parsedContext: ParsedContext) => string | null;
}
```

### 2.2 Specification of All 23 Standard Trick Cards
The 23 standard cards comprise 11 existing cards plus 12 new cards:

1. **`boltnew`** (`bolt.new`)
   - **Icon**: `bot`
   - **Allowed Contexts**: `['Repo', 'File', 'Commit', 'PR']`
   - **Description**: Imports the repository into an AI builder agent standing by to edit & ship.
   - **`generateUrl`**: Returns `https://bolt.new/github.com/${ctx.owner}/${ctx.repo}` (requires `owner` and `repo`).

2. **`deepwiki`** (`deepwiki.com`)
   - **Icon**: `book-open`
   - **Allowed Contexts**: `['Repo', 'File', 'Commit', 'PR']`
   - **Description**: Auto-generates a Wikipedia-style wiki and interactive Q&A assistant for the repository.
   - **`generateUrl`**: Returns `https://deepwiki.com/${ctx.owner}/${ctx.repo}`.

3. **`gitdiagram`** (`gitdiagram.com`)
   - **Icon**: `git-merge`
   - **Allowed Contexts**: `['Repo', 'File', 'Commit', 'PR']`
   - **Description**: Reads the repository and draws an interactive architecture diagram.
   - **`generateUrl`**: Returns `https://gitdiagram.com/${ctx.owner}/${ctx.repo}`.

4. **`gitingest`** (`gitingest`)
   - **Icon**: `file-text`
   - **Allowed Contexts**: `['Repo', 'File', 'Commit', 'PR']`
   - **Description**: Flattens repo or file into one prompt-friendly text document with token count.
   - **`generateUrl`**:
     - `File` with `filePath`: `https://gitingest.com/${ctx.owner}/${ctx.repo}/blob/${ctx.ref || 'main'}/${ctx.filePath}`
     - `Commit` with `commitSha`: `https://gitingest.com/${ctx.owner}/${ctx.repo}/commit/${ctx.commitSha}`
     - `PR` with `prNumber`: `https://gitingest.com/${ctx.owner}/${ctx.repo}/pull/${ctx.prNumber}`
     - Default: `https://gitingest.com/${ctx.owner}/${ctx.repo}`

5. **`githubdev`** (`github.dev`)
   - **Icon**: `code`
   - **Allowed Contexts**: `['Repo', 'File', 'Commit', 'PR']`
   - **Description**: Opens the repository or file in a full VS Code web editor.
   - **`generateUrl`**:
     - `File` with `filePath`: `https://github.dev/${ctx.owner}/${ctx.repo}/blob/${ctx.ref || 'main'}/${ctx.filePath}`
     - `Commit` with `commitSha`: `https://github.dev/${ctx.owner}/${ctx.repo}/commit/${ctx.commitSha}`
     - `PR` with `prNumber`: `https://github.dev/${ctx.owner}/${ctx.repo}/pull/${ctx.prNumber}`
     - Default: `https://github.dev/${ctx.owner}/${ctx.repo}`

6. **`githubgg`** (`github.gg`)
   - **Icon**: `layout-dashboard`
   - **Allowed Contexts**: `['Repo', 'File', 'Commit', 'PR']`
   - **Description**: Repository control panel: one-click copy for AI, security scan, and quality score.
   - **`generateUrl`**: Returns `https://github.gg/${ctx.owner}/${ctx.repo}`.

7. **`github1s`** (`github1s.com`)
   - **Icon**: `eye`
   - **Allowed Contexts**: `['Repo', 'File', 'Commit', 'PR']`
   - **Description**: Classic VS Code web view for fast read-only codebase navigation.
   - **`generateUrl`**:
     - `File` with `filePath`: `https://github1s.com/${ctx.owner}/${ctx.repo}/blob/${ctx.ref || 'main'}/${ctx.filePath}`
     - `Commit` with `commitSha`: `https://github1s.com/${ctx.owner}/${ctx.repo}/commit/${ctx.commitSha}`
     - `PR` with `prNumber`: `https://github1s.com/${ctx.owner}/${ctx.repo}/pull/${ctx.prNumber}`
     - Default: `https://github1s.com/${ctx.owner}/${ctx.repo}`

8. **`gitmcp`** (`gitmcp.io`)
   - **Icon**: `server`
   - **Allowed Contexts**: `['Repo', 'File', 'Commit', 'PR']`
   - **Description**: Converts the repository into a live MCP server for AI coding assistants.
   - **`generateUrl`**: Returns `https://gitmcp.io/${ctx.owner}/${ctx.repo}`.

9. **`gitpodcast`** (`gitpodcast.com`)
   - **Icon**: `headphones`
   - **Allowed Contexts**: `['Repo', 'File', 'Commit', 'PR']`
   - **Description**: Generates an audio podcast with host dialogue explaining the codebase.
   - **`generateUrl`**: Returns `https://gitpodcast.com/${ctx.owner}/${ctx.repo}`.

10. **`stackblitz`** (`stackblitz.com`)
    - **Icon**: `zap`
    - **Allowed Contexts**: `['Repo', 'File', 'Commit', 'PR']`
    - **Description**: Boots the repository in an interactive browser WebContainers dev environment.
    - **`generateUrl`**:
      - `File` with `filePath`: `https://stackblitz.com/github/${ctx.owner}/${ctx.repo}?file=${ctx.filePath}`
      - Default: `https://stackblitz.com/github/${ctx.owner}/${ctx.repo}`

11. **`starhistory`** (`star-history.com`)
    - **Icon**: `star`
    - **Allowed Contexts**: `['Repo', 'File', 'Commit', 'PR']`
    - **Description**: Interactive star growth chart over time for evaluating repository health.
    - **`generateUrl`**: Returns `https://star-history.com/#${ctx.owner}/${ctx.repo}&Date`.

12. **`keys`** (`.keys (SSH Public Keys)`) — *New*
    - **Icon**: `key`
    - **Allowed Contexts**: `['User', 'Repo', 'File', 'Commit', 'PR']`
    - **Description**: Fetches all public SSH keys associated with the GitHub user account.
    - **`generateUrl`**: Returns `https://github.com/${ctx.owner}.keys`.

13. **`gpg`** (`.gpg (GPG Public Keys)`) — *New*
    - **Icon**: `shield-check`
    - **Allowed Contexts**: `['User', 'Repo', 'File', 'Commit', 'PR']`
    - **Description**: Fetches all public GPG signing keys associated with the GitHub user account.
    - **`generateUrl`**: Returns `https://github.com/${ctx.owner}.gpg`.

14. **`patch`** (`.patch (Git Patch)`) — *New*
    - **Icon**: `file-diff`
    - **Allowed Contexts**: `['Commit', 'PR']`
    - **Description**: Appends .patch to commit or PR URLs to get formatted raw Git patch files.
    - **`generateUrl`**:
      - `Commit` with `commitSha`: `https://github.com/${ctx.owner}/${ctx.repo}/commit/${ctx.commitSha}.patch`
      - `PR` with `prNumber`: `https://github.com/${ctx.owner}/${ctx.repo}/pull/${ctx.prNumber}.patch`
      - Otherwise: `null`

15. **`diff`** (`.diff (Git Diff)`) — *New*
    - **Icon**: `file-diff`
    - **Allowed Contexts**: `['Commit', 'PR']`
    - **Description**: Appends .diff to commit or PR URLs to get raw unified diff output.
    - **`generateUrl`**:
      - `Commit` with `commitSha`: `https://github.com/${ctx.owner}/${ctx.repo}/commit/${ctx.commitSha}.diff`
      - `PR` with `prNumber`: `https://github.com/${ctx.owner}/${ctx.repo}/pull/${ctx.prNumber}.diff`
      - Otherwise: `null`

16. **`releases_atom`** (`releases.atom`) — *New*
    - **Icon**: `rss`
    - **Allowed Contexts**: `['Repo', 'File', 'Commit', 'PR']`
    - **Description**: Atom RSS feed tracking all published releases and tags for the repository.
    - **`generateUrl`**: Returns `https://github.com/${ctx.owner}/${ctx.repo}/releases.atom`.

17. **`commits_atom`** (`commits.atom`) — *New*
    - **Icon**: `rss`
    - **Allowed Contexts**: `['Repo', 'File', 'Commit', 'PR']`
    - **Description**: Atom RSS feed tracking commit history for the repository or branch.
    - **`generateUrl`**:
      - If `ref` present: `https://github.com/${ctx.owner}/${ctx.repo}/commits/${ctx.ref}.atom`
      - Otherwise: `https://github.com/${ctx.owner}/${ctx.repo}/commits.atom`

18. **`zip_archive`** (`Zip Archive`) — *New*
    - **Icon**: `archive`
    - **Allowed Contexts**: `['Repo', 'File', 'Commit', 'PR']`
    - **Description**: Direct link to download a ZIP archive of the repository codebase.
    - **`generateUrl`**:
      - If `ref` present: `https://github.com/${ctx.owner}/${ctx.repo}/archive/refs/heads/${ctx.ref}.zip`
      - Default: `https://github.com/${ctx.owner}/${ctx.repo}/archive/HEAD.zip`

19. **`codespaces_new`** (`codespaces.new`) — *New*
    - **Icon**: `terminal`
    - **Allowed Contexts**: `['Repo', 'File', 'Commit', 'PR']`
    - **Description**: Instantly launches a GitHub Codespaces cloud environment for the repository.
    - **`generateUrl`**: Returns `https://codespaces.new/${ctx.owner}/${ctx.repo}`.

20. **`gitpod_io`** (`gitpod.io`) — *New*
    - **Icon**: `box`
    - **Allowed Contexts**: `['Repo', 'File', 'Commit', 'PR']`
    - **Description**: Launches an automated cloud development environment on Gitpod.
    - **`generateUrl`**:
      - `File` with `filePath`: `https://gitpod.io/#https://github.com/${ctx.owner}/${ctx.repo}/blob/${ctx.ref || 'main'}/${ctx.filePath}`
      - `Commit` with `commitSha`: `https://gitpod.io/#https://github.com/${ctx.owner}/${ctx.repo}/commit/${ctx.commitSha}`
      - `PR` with `prNumber`: `https://gitpod.io/#https://github.com/${ctx.owner}/${ctx.repo}/pull/${ctx.prNumber}`
      - Default: `https://gitpod.io/#https://github.com/${ctx.owner}/${ctx.repo}`

21. **`vscode_dev`** (`vscode.dev`) — *New*
    - **Icon**: `code`
    - **Allowed Contexts**: `['Repo', 'File', 'Commit', 'PR']`
    - **Description**: Opens the repository or file in VS Code for Web without extension setup.
    - **`generateUrl`**:
      - `File` with `filePath`: `https://vscode.dev/github/${ctx.owner}/${ctx.repo}/blob/${ctx.ref || 'main'}/${ctx.filePath}`
      - `Commit` with `commitSha`: `https://vscode.dev/github/${ctx.owner}/${ctx.repo}/commit/${ctx.commitSha}`
      - `PR` with `prNumber`: `https://vscode.dev/github/${ctx.owner}/${ctx.repo}/pull/${ctx.prNumber}`
      - Default: `https://vscode.dev/github/${ctx.owner}/${ctx.repo}`

22. **`ssh_clone`** (`SSH Clone URL`) — *New*
    - **Icon**: `terminal`
    - **Allowed Contexts**: `['Repo', 'File', 'Commit', 'PR']`
    - **Description**: Formats repository location into a standard Git SSH clone URL.
    - **`generateUrl`**: Returns `git@github.com:${ctx.owner}/${ctx.repo}.git`.

23. **`raw_file`** (`Raw File URL`) — *New*
    - **Icon**: `file-text`
    - **Allowed Contexts**: `['File']`
    - **Description**: Direct link to fetch raw file contents from raw.githubusercontent.com.
    - **`generateUrl`**:
      - If `filePath` present: `https://raw.githubusercontent.com/${ctx.owner}/${ctx.repo}/${ctx.ref || 'main'}/${ctx.filePath}`
      - Otherwise: `null`

---

### 2.3 Compatibility Check Function (`isCardCompatible`)
The compatibility check function determines whether a card can be activated given the current `parsedContext`:

```javascript
/**
 * Checks if a card is compatible with a parsed GitHub URL context.
 *
 * @param {StandardCard} card
 * @param {ParsedContext} parsedContext
 * @returns {boolean}
 */
export function isCardCompatible(card, parsedContext) {
  if (!parsedContext || !parsedContext.valid || parsedContext.context === 'Unknown') {
    return false;
  }
  if (!card || !card.allowedContexts || !card.allowedContexts.includes(parsedContext.context)) {
    return false;
  }
  try {
    const url = card.generateUrl(parsedContext);
    return Boolean(url && typeof url === 'string' && url.length > 0);
  } catch {
    return false;
  }
}
```

---

### 2.4 Visual Indication Requirements for Incompatible Cards

When rendering cards in the grid:

1. **Card Container CSS Class**:
   - Active cards: `card glass`
   - Incompatible cards: `card glass card-disabled`
   - CSS for `card-disabled`:
     ```css
     .card-disabled {
       opacity: 0.55;
       border-color: rgba(255, 255, 255, 0.08);
       filter: grayscale(0.2);
     }
     ```

2. **Context Badges**:
   - Active cards:
     ```html
     <span class="badge badge-active"><i data-lucide="check"></i> Active</span>
     ```
   - Incompatible cards:
     ```html
     <span class="badge badge-incompatible"><i data-lucide="alert-circle"></i> Requires ${requiredContext}</span>
     ```
     - Examples: `Requires Commit/PR` (for `.patch`/`.diff`), `Requires File` (for `Raw File URL`), `Requires Repo` (for repo services in `User` context).

3. **Link & Copy Button State**:
   - Incompatible cards:
     - Anchor link gets class `card-link-disabled`, `href="#"`, `onclick="return false;"`.
     - Link text displays context requirement message (e.g. `Unavailable in ${context} mode`).
     - Copy button gets `disabled` attribute, class `copy-btn disabled`, `opacity: 0.4; cursor: not-allowed;`.

---

## 3. Caveats
- `SSH Clone URL` (`git@github.com:...`) is a Git protocol string rather than an HTTP URL. Copying it works natively, but clicking the link in browser will not open a web page. The UI should disable hyperlink navigation (`href="#"`) for SSH clone URLs or handle it cleanly.
- `gitingest` and `gitpod.io` handle directory vs file paths natively; if `ref` is missing, `main` or `master` defaults to `main`.
- Interactive cards (Deep Linker, Time Machine Diff, Commit Feed) are explicitly out of scope for `src/cards.js` and will be implemented in `src/interactive.js` during Milestone 3.

---

## 4. Conclusion
`src/cards.js` can be implemented cleanly with 23 standard cards exported via `STANDARD_CARDS`, `isCardCompatible`, and optional helper `getCompatibleCards`. The data model completely aligns with `src/parser.js` outputs and provides full visual indication requirements for disabled cards.

---

## 5. Verification Method

### Automated Unit Test Verification
Create `test/cards.test.js` using Node/Vite test runner (e.g., `npm test` or `node test/cards.test.js`) verifying:

1. **Card Catalog Completeness**:
   - `STANDARD_CARDS` contains exactly 23 cards.
   - Every card has valid `id`, `name`, `icon`, `allowedContexts`, `description`, `generateUrl`.

2. **Compatibility Verification Across Contexts**:
   - **User Context (`https://github.com/torvalds`)**:
     - `.keys` & `.gpg` return `isCardCompatible() === true`.
     - All 21 other cards return `isCardCompatible() === false`.
   - **Repo Context (`https://github.com/facebook/react`)**:
     - 20 cards return `isCardCompatible() === true`.
     - `.patch`, `.diff`, `raw_file` return `isCardCompatible() === false`.
   - **File Context (`https://github.com/facebook/react/blob/main/package.json`)**:
     - `raw_file` returns `isCardCompatible() === true` and generates `https://raw.githubusercontent.com/facebook/react/main/package.json`.
     - `.patch` and `.diff` return `isCardCompatible() === false`.
   - **Commit Context (`https://github.com/facebook/react/commit/a1b2c3d`)**:
     - `.patch` returns `https://github.com/facebook/react/commit/a1b2c3d.patch`.
     - `.diff` returns `https://github.com/facebook/react/commit/a1b2c3d.diff`.
     - `raw_file` returns `isCardCompatible() === false`.
   - **PR Context (`https://github.com/facebook/react/pull/42`)**:
     - `.patch` returns `https://github.com/facebook/react/pull/42.patch`.
     - `.diff` returns `https://github.com/facebook/react/pull/42.diff`.
     - `raw_file` returns `isCardCompatible() === false`.
   - **Invalid Context (`invalid-url`)**:
     - All 23 cards return `isCardCompatible() === false`.
