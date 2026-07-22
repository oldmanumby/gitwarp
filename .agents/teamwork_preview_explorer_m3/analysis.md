# Milestone 3 Analysis & Design Specification: Interactive Cards Component (`src/interactive.js`)

## Executive Summary

`gitswapForged` is a modern single-page web application providing developer "superpower" links for GitHub URLs. While Milestone 1 established the GitHub URL Parser (`src/parser.js`) and Milestone 2 created the 23 Standard Trick Cards Catalog (`src/cards.js`), Milestone 3 introduces **Interactive Cards** (`src/interactive.js`).

Interactive Cards differ from standard cards by providing inline form controls (inputs, dropdowns, checkboxes, date selectors) that allow users to customize target GitHub URLs in real time.

This specification details the technical architecture, component layout, context compatibility, live-updating state management, URL generation algorithms, edge-case handling, and unit testing strategy for `src/interactive.js`.

---

## Context Compatibility Matrix

Each interactive card targets specific GitHub URL contexts (`User`, `Repo`, `File`, `Commit`, `PR`). When a user inputs a URL, interactive cards evaluate whether they are active or inactive.

| Interactive Card ID | Card Name | Allowed Contexts | Incompatible Action | Primary Use Case |
| :--- | :--- | :--- | :--- | :--- |
| `deep_linker` | Deep Linker | `File` | Disabled card / Inactive notice | Highlighting line numbers, line ranges, and raw text view (`?plain=1`) |
| `time_machine` | Time Machine Compare | `Repo`, `File` | Disabled card / Inactive notice | Comparing branches, tags, commit SHAs, or relative historical dates |
| `commit_feed` | Commit Feed | `Repo`, `File` | Disabled card / Inactive notice | Filtering repository commit logs by branch, author, and file path |

### Compatibility Rules & State Rendering
1. **Valid Context & Allowed Context**: Card is rendered as **Active**. Controls are enabled, and output links live update as user types.
2. **Valid Context but Disallowed Context**: Card is rendered as **Inactive / Disabled**. An informative badge (`Context Mismatch`) is displayed along with a message explaining which context is required (e.g. "Deep Linker requires a File context URL"). Form controls are disabled (`disabled` attribute).
3. **Invalid / Unknown Context**: Interactive cards section renders a fallback empty state or disables all cards until a valid GitHub URL is provided.

---

## Detailed Tool Specifications

### 1. Deep Linker Card (`id: 'deep_linker'`)

- **Name**: Deep Linker
- **Icon**: `file-text` (or `code` / `link`)
- **Allowed Contexts**: `['File']`
- **Description**: Target precise code line numbers, line ranges, and raw code views with live-updating deep links.

#### Form Controls
1. **Line Start (`lineStart`)**: `<input type="number" min="1" class="interactive-input" placeholder="Start line (e.g. 10)">`
   - Prefilled from `parsedContext.lineStart` if present in the input URL hash (e.g. `#L10`).
2. **Line End (`lineEnd`)**: `<input type="number" min="1" class="interactive-input" placeholder="End line (e.g. 25)">`
   - Prefilled from `parsedContext.lineEnd` if present in the input URL hash (e.g. `#L10-L25`).
3. **Raw Text Format Toggle (`plainToggle`)**: `<input type="checkbox" class="interactive-checkbox"> <label>Format as Raw Text (?plain=1)</label>`
   - Prefilled as checked if `parsedContext.queryParams.plain === '1'` or `parsedContext.isRaw === true`.

#### URL Generation Algorithm (`buildDeepLinkerUrl`)
```javascript
export function buildDeepLinkerUrl(parsedContext, state = {}) {
  if (!parsedContext || !parsedContext.valid || parsedContext.context !== 'File') return null;
  const { owner, repo, ref, filePath } = parsedContext;
  if (!owner || !repo || !filePath) return null;

  const effectiveRef = ref || 'main';
  const baseUrl = `https://github.com/${owner}/${repo}/blob/${effectiveRef}/${filePath}`;
  
  // Parse inputs
  let start = state.lineStart !== undefined && state.lineStart !== '' ? parseInt(state.lineStart, 10) : null;
  let end = state.lineEnd !== undefined && state.lineEnd !== '' ? parseInt(state.lineEnd, 10) : null;

  // Validate positive integers
  if (start !== null && (isNaN(start) || start < 1)) start = null;
  if (end !== null && (isNaN(end) || end < 1)) end = null;

  // Handle inverted line ranges (swap if end < start)
  if (start !== null && end !== null && end < start) {
    const temp = start;
    start = end;
    end = temp;
  }

  // Construct fragment
  let fragment = '';
  if (start !== null && end !== null) {
    fragment = start === end ? `#L${start}` : `#L${start}-L${end}`;
  } else if (start !== null) {
    fragment = `#L${start}`;
  } else if (end !== null) {
    fragment = `#L${end}`;
  }

  // Construct query params
  const queryString = state.plainToggle ? '?plain=1' : '';

  return `${baseUrl}${queryString}${fragment}`;
}
```

---

### 2. Time Machine Compare Card (`id: 'time_machine'`)

- **Name**: Time Machine Compare
- **Icon**: `history` (or `git-compare`)
- **Allowed Contexts**: `['Repo', 'File']`
- **Description**: Compare branches, tags, commit SHAs, or relative historical timeframes across the repository or single file.

#### Form Controls
1. **Base Ref (`baseRef`)**: `<input type="text" class="interactive-input" placeholder="Base ref (e.g. main)">`
   - Prefilled with `parsedContext.ref || 'main'`.
2. **Compare Mode Selector (`compareMode`)**: `<select class="interactive-select">`
   - Options: `'ref'` ("Branch / Tag / SHA") vs `'timeframe'` ("Relative Timeframe") vs `'custom_date'` ("Custom Date").
3. **Compare Ref Input (`compareRef`)** *(Active when mode is `'ref'`)*:
   - `<input type="text" class="interactive-input" placeholder="Compare ref (e.g. dev, v1.0.0, SHA)">`
4. **Timeframe Selector (`timeframe`)** *(Active when mode is `'timeframe'`)*:
   - `<select class="interactive-select">` with options:
     - `1.week.ago` ("1 week ago")
     - `1.month.ago` ("1 month ago")
     - `yesterday` ("Yesterday")
     - `1.year.ago` ("1 year ago")
5. **Custom Date Input (`customDate`)** *(Active when mode is `'custom_date'`)*:
   - `<input type="date" class="interactive-input">`
6. **File Path Toggle (`includeFilePath`)** *(Active when `parsedContext.context === 'File'`)*:
   - `<input type="checkbox" class="interactive-checkbox" checked>` <label>Filter diff to current file path (`${filePath}`)</label>

#### URL Generation Algorithm (`buildTimeMachineUrl`)
```javascript
export function buildTimeMachineUrl(parsedContext, state = {}) {
  if (!parsedContext || !parsedContext.valid) return null;
  if (parsedContext.context !== 'Repo' && parsedContext.context !== 'File') return null;

  const { owner, repo, filePath } = parsedContext;
  if (!owner || !repo) return null;

  const baseRef = (state.baseRef && state.baseRef.trim()) || parsedContext.ref || 'main';
  const compareMode = state.compareMode || 'ref';
  
  let compareTarget = '';

  if (compareMode === 'timeframe') {
    const timeframe = state.timeframe || '1.week.ago';
    compareTarget = `${baseRef}@{${timeframe}}...${baseRef}`;
  } else if (compareMode === 'custom_date') {
    const dateVal = state.customDate || '';
    if (dateVal) {
      compareTarget = `${baseRef}@{${dateVal}}...${baseRef}`;
    } else {
      compareTarget = `${baseRef}@{1.week.ago}...${baseRef}`;
    }
  } else {
    // Default: Ref comparison
    const compareRef = (state.compareRef && state.compareRef.trim()) || '';
    if (compareRef) {
      compareTarget = `${baseRef}...${compareRef}`;
    } else {
      compareTarget = `${baseRef}...HEAD`;
    }
  }

  let baseUrl = `https://github.com/${owner}/${repo}/compare/${compareTarget}`;

  // If context is File and user toggled path filter
  if (parsedContext.context === 'File' && filePath && state.includeFilePath !== false) {
    baseUrl += `?path=${encodeURIComponent(filePath)}`;
  }

  return baseUrl;
}
```

---

### 3. Commit Feed Card (`id: 'commit_feed'`)

- **Name**: Commit Feed
- **Icon**: `git-commit` (or `rss`)
- **Allowed Contexts**: `['Repo', 'File']`
- **Description**: Filter repository commit history by branch/ref, author username, and file/folder path.

#### Form Controls
1. **Branch / Ref (`refInput`)**: `<input type="text" class="interactive-input" placeholder="Branch / Tag / SHA (e.g. main)">`
   - Prefilled with `parsedContext.ref || ''`.
2. **Author Filter (`authorInput`)**: `<input type="text" class="interactive-input" placeholder="Author username/email (e.g. octocat)">`
   - Prefilled with `parsedContext.queryParams.author || ''`.
3. **Path Filter (`pathInput`)**: `<input type="text" class="interactive-input" placeholder="File / folder path (e.g. src/index.js)">`
   - Prefilled with `parsedContext.filePath || ''`.

#### URL Generation Algorithm (`buildCommitFeedUrl`)
```javascript
export function buildCommitFeedUrl(parsedContext, state = {}) {
  if (!parsedContext || !parsedContext.valid) return null;
  if (parsedContext.context !== 'Repo' && parsedContext.context !== 'File') return null;

  const { owner, repo } = parsedContext;
  if (!owner || !repo) return null;

  const ref = (state.refInput !== undefined ? state.refInput : (parsedContext.ref || '')).trim();
  const path = (state.pathInput !== undefined ? state.pathInput : (parsedContext.filePath || '')).trim();
  const author = (state.authorInput !== undefined ? state.authorInput : (parsedContext.queryParams?.author || '')).trim();

  let urlPath = `https://github.com/${owner}/${repo}/commits`;

  if (ref && path) {
    urlPath += `/${encodeURIComponent(ref)}/${path}`;
  } else if (ref && !path) {
    urlPath += `/${encodeURIComponent(ref)}`;
  } else if (!ref && path) {
    urlPath += `/HEAD/${path}`;
  }

  if (author) {
    const separator = urlPath.includes('?') ? '&' : '?';
    urlPath += `${separator}author=${encodeURIComponent(author)}`;
  }

  return urlPath;
}
```

---

## DOM Layout & CSS Architecture

Interactive cards span full width in the CSS grid using `grid-column: 1 / -1;`. They inherit the glassmorphism design system (`.glass`, `.card`, OKLCH theme variables) from `src/style.css`.

### HTML Structure (`renderInteractiveCards`)

```html
<div class="interactive-section-title">
  <h2><i data-lucide="sliders"></i> Interactive Tools</h2>
</div>
<div class="interactive-grid">
  <!-- Deep Linker Card -->
  <div class="card glass card-interactive" data-card-id="deep_linker">
    <div class="card-header">
      <div class="card-icon"><i data-lucide="file-text"></i></div>
      <div class="card-header-text">
        <h3 class="card-title">Deep Linker</h3>
        <span class="context-badge active">File Context</span>
      </div>
    </div>
    <p class="card-description">Target precise code line numbers, line ranges, and raw code views.</p>
    
    <div class="interactive-controls">
      <div class="form-group">
        <label for="deep-start">Line Start</label>
        <input type="number" id="deep-start" min="1" class="interactive-input" placeholder="Start (e.g. 10)">
      </div>
      <div class="form-group">
        <label for="deep-end">Line End</label>
        <input type="number" id="deep-end" min="1" class="interactive-input" placeholder="End (e.g. 25)">
      </div>
      <div class="form-group checkbox-group">
        <label class="checkbox-label">
          <input type="checkbox" id="deep-plain" class="interactive-checkbox">
          Format as Raw Text (<code>?plain=1</code>)
        </label>
      </div>
    </div>

    <div class="card-link-container interactive-output">
      <a href="#" target="_blank" rel="noopener noreferrer" class="card-link" id="deep-linker-url"></a>
      <button class="copy-btn" data-copy-target="deep-linker-url" aria-label="Copy Deep Linker link">
        <i data-lucide="copy"></i>
      </button>
    </div>
  </div>

  <!-- Time Machine Compare Card -->
  <div class="card glass card-interactive" data-card-id="time_machine">
    <!-- Controls for Base Ref, Compare Mode, Compare Ref / Timeframe, File Toggle -->
  </div>

  <!-- Commit Feed Card -->
  <div class="card glass card-interactive" data-card-id="commit_feed">
    <!-- Controls for Ref, Author, Path -->
  </div>
</div>
```

### Proposed CSS Rules to append to `src/style.css`
```css
/* Interactive Cards Layout */
.card-interactive {
  grid-column: 1 / -1;
  text-align: left;
  align-items: stretch;
  padding: 1.75rem;
}

.card-interactive.disabled {
  opacity: 0.6;
  pointer-events: none;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.card-header-text {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.context-badge {
  font-size: 0.75rem;
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.context-badge.active {
  background-color: oklch(0.3 0.12 150);
  color: oklch(0.95 0.05 150);
}

.context-badge.inactive {
  background-color: oklch(0.3 0.05 255);
  color: oklch(0.7 0.02 255);
}

.interactive-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin: 1.25rem 0;
  padding: 1rem;
  background: var(--bg-site);
  border-radius: 6px;
  border: 1px solid var(--color-border);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  flex: 1 1 200px;
}

.form-group label {
  font-size: 0.85rem;
  color: var(--color-muted);
  font-weight: 500;
}

.interactive-input, .interactive-select {
  padding: 0.6rem 0.8rem;
  border-radius: 4px;
  border: 1px solid var(--color-border);
  background-color: var(--bg-card);
  color: var(--text-body);
  font-size: 0.9rem;
  outline: none;
}

.interactive-input:focus, .interactive-select:focus {
  border-color: var(--text-heading);
}

.checkbox-group {
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  padding-top: 1.5rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.9rem;
  color: var(--text-body);
}

.interactive-checkbox {
  width: 16px;
  height: 16px;
  accent-color: var(--text-heading);
  cursor: pointer;
}
```

---

## Edge Case Handling Strategy

| Scenario / Input | Potential Issue | Handling & Resolution Strategy |
| :--- | :--- | :--- |
| **Negative / non-numeric line numbers** (e.g. `start = -5`, `end = "abc"`) | Invalid fragment generation | `parseInt` checks; values `< 1` or `isNaN` are set to `null` and ignored. |
| **Inverted line ranges** (e.g. `start = 50`, `end = 10`) | Confusing or broken GitHub fragment | Automatically swap start and end so range is `#L10-L50`. |
| **Equal line range** (e.g. `start = 15`, `end = 15`) | Redundant `#L15-L15` range | Collapse equal range to single line fragment `#L15`. |
| **Special characters in path / ref / author** (e.g. `feature/my-branch`, `John Doe`) | Malformed output URL | Use `encodeURIComponent` for query values and ref path segments as appropriate. Preserve forward slashes in file paths. |
| **Empty fields** (e.g. blank author or ref) | Trailing slash or redundant `?author=` | Omit blank query parameters or route fallback (`HEAD` or `main`). |
| **Context mismatch** (e.g. Deep Linker rendered for Repo URL) | Interactive controls unusable | Disable inputs, mark card with `Inactive` badge, display context requirement message. |
| **Null / Undefined `parsedContext`** | Uncaught TypeError | Guard clauses at function entry returning `null` or early return from `renderInteractiveCards`. |

---

## Recommended Unit Test Suite Architecture (`test/interactive.test.js`)

Using Node's native `node:test` runner and `node:assert/strict` (consistent with `test/cards.test.js`), unit tests will verify URL builders, compatibility checks, edge cases, and DOM state updates.

### Recommended Test Cases

```javascript
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseGithubUrl } from '../src/parser.js';
import { 
  buildDeepLinkerUrl, 
  buildTimeMachineUrl, 
  buildCommitFeedUrl, 
  isInteractiveCardCompatible 
} from '../src/interactive.js';

describe('Interactive Cards Component (src/interactive.js)', () => {

  describe('Context Compatibility', () => {
    const fileCtx = parseGithubUrl('https://github.com/facebook/react/blob/main/package.json');
    const repoCtx = parseGithubUrl('https://github.com/facebook/react');
    const userCtx = parseGithubUrl('https://github.com/torvalds');

    it('deep_linker is compatible only with File context', () => {
      assert.equal(isInteractiveCardCompatible('deep_linker', fileCtx), true);
      assert.equal(isInteractiveCardCompatible('deep_linker', repoCtx), false);
      assert.equal(isInteractiveCardCompatible('deep_linker', userCtx), false);
    });

    it('time_machine is compatible with Repo and File context', () => {
      assert.equal(isInteractiveCardCompatible('time_machine', fileCtx), true);
      assert.equal(isInteractiveCardCompatible('time_machine', repoCtx), true);
      assert.equal(isInteractiveCardCompatible('time_machine', userCtx), false);
    });

    it('commit_feed is compatible with Repo and File context', () => {
      assert.equal(isInteractiveCardCompatible('commit_feed', fileCtx), true);
      assert.equal(isInteractiveCardCompatible('commit_feed', repoCtx), true);
      assert.equal(isInteractiveCardCompatible('commit_feed', userCtx), false);
    });
  });

  describe('Deep Linker URL Generation', () => {
    const fileCtx = parseGithubUrl('https://github.com/facebook/react/blob/main/src/index.js');

    it('generates basic line link #L10', () => {
      const url = buildDeepLinkerUrl(fileCtx, { lineStart: 10 });
      assert.equal(url, 'https://github.com/facebook/react/blob/main/src/index.js#L10');
    });

    it('generates range line link #L10-L20', () => {
      const url = buildDeepLinkerUrl(fileCtx, { lineStart: 10, lineEnd: 20 });
      assert.equal(url, 'https://github.com/facebook/react/blob/main/src/index.js#L10-L20');
    });

    it('handles plain=1 toggle checkbox', () => {
      const url = buildDeepLinkerUrl(fileCtx, { lineStart: 10, plainToggle: true });
      assert.equal(url, 'https://github.com/facebook/react/blob/main/src/index.js?plain=1#L10');
    });

    it('swaps inverted line range (start=50, end=10 -> #L10-L50)', () => {
      const url = buildDeepLinkerUrl(fileCtx, { lineStart: 50, lineEnd: 10 });
      assert.equal(url, 'https://github.com/facebook/react/blob/main/src/index.js#L10-L50');
    });

    it('collapses equal range (start=15, end=15 -> #L15)', () => {
      const url = buildDeepLinkerUrl(fileCtx, { lineStart: 15, lineEnd: 15 });
      assert.equal(url, 'https://github.com/facebook/react/blob/main/src/index.js#L15');
    });
  });

  describe('Time Machine Compare URL Generation', () => {
    const repoCtx = parseGithubUrl('https://github.com/octocat/Hello-World');
    const fileCtx = parseGithubUrl('https://github.com/octocat/Hello-World/blob/main/README.md');

    it('generates ref compare URL (main...dev)', () => {
      const url = buildTimeMachineUrl(repoCtx, { baseRef: 'main', compareMode: 'ref', compareRef: 'dev' });
      assert.equal(url, 'https://github.com/octocat/Hello-World/compare/main...dev');
    });

    it('generates relative timeframe compare URL (main@{1.week.ago}...main)', () => {
      const url = buildTimeMachineUrl(repoCtx, { baseRef: 'main', compareMode: 'timeframe', timeframe: '1.week.ago' });
      assert.equal(url, 'https://github.com/octocat/Hello-World/compare/main@{1.week.ago}...main');
    });

    it('includes path query parameter when context is File and checkbox is checked', () => {
      const url = buildTimeMachineUrl(fileCtx, { baseRef: 'main', compareMode: 'ref', compareRef: 'dev', includeFilePath: true });
      assert.equal(url, 'https://github.com/octocat/Hello-World/compare/main...dev?path=README.md');
    });
  });

  describe('Commit Feed URL Generation', () => {
    const repoCtx = parseGithubUrl('https://github.com/octocat/Hello-World');
    const fileCtx = parseGithubUrl('https://github.com/octocat/Hello-World/blob/main/src/main.js');

    it('generates branch commits URL', () => {
      const url = buildCommitFeedUrl(repoCtx, { refInput: 'main' });
      assert.equal(url, 'https://github.com/octocat/Hello-World/commits/main');
    });

    it('generates branch + author filter URL', () => {
      const url = buildCommitFeedUrl(repoCtx, { refInput: 'main', authorInput: 'octocat' });
      assert.equal(url, 'https://github.com/octocat/Hello-World/commits/main?author=octocat');
    });

    it('generates branch + path filter URL for File context', () => {
      const url = buildCommitFeedUrl(fileCtx, { refInput: 'main', pathInput: 'src/main.js' });
      assert.equal(url, 'https://github.com/octocat/Hello-World/commits/main/src/main.js');
    });
  });

});
```

---

## Conclusion

The Interactive Cards Component (`src/interactive.js`) provides intuitive, real-time customization of GitHub URLs for code deep-linking, ref/timeframe comparisons, and commit history filtering.

By exposing pure URL builder functions (`buildDeepLinkerUrl`, `buildTimeMachineUrl`, `buildCommitFeedUrl`, `isInteractiveCardCompatible`), the design ensures 100% testability via Node's native test runner without browser or external framework dependencies.
