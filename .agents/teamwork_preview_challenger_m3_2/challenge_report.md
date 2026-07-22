# Adversarial Challenge Report — Milestone 3 (Interactive Cards Component)

## Challenge Summary

**Overall risk assessment**: LOW

Empirical stress testing and property-based verification confirmed that `src/interactive.js` satisfies all target URL pattern invariants, contextual compatibility rules, error boundaries, and DOM visual reactivity guarantees. All 137 property, unit, and stress tests executed via `node --test test/*.test.js` pass cleanly without errors or side effects.

---

## Invariant Verification Results

### 1. `buildDeepLinkerUrl` Invariants
- **Invariant**: Always produces a valid URL matching `^https:\/\/github\.com\/[^\/]+\/[^\/]+\/blob\/[^\/]+\/.+` when given valid `File` context.
- **Verification**: Verified across 1,000 randomized iterations of valid `File` context and options permutations.
- **Key Behaviors & Boundary Defenses**:
  - Inverted line ranges (`lineStart > lineEnd`) are automatically swapped (e.g. `start=100, end=20` -> `#L20-L100`).
  - Equal line ranges (`lineStart === lineEnd`) collapse into single line fragment `#L{start}` (e.g. `start=50, end=50` -> `#L50`).
  - Raw text toggle (`plainToggle`) appends `?plain=1` **before** the hash fragment (`#L...`), maintaining standard URL RFC syntax.
  - Invalid line inputs (negative numbers, floats, non-numeric strings, NaN, Infinity) are safely ignored.
  - Returns `null` strictly when context is invalid, missing mandatory properties (`owner`, `repo`, `filePath`), or not `File` context.

### 2. `buildTimeMachineUrl` & `buildCommitFeedUrl` Invariants
- **Invariant**: Always produce valid URLs or fallback paths for all `Repo` and `File` contexts.
- **Verification**: Verified across 1,000 randomized iterations per function.
- **Key Behaviors & Boundary Defenses**:
  - `buildTimeMachineUrl` matches pattern `^https:\/\/github\.com\/[^\/]+\/[^\/]+\/compare\/.+` for all valid `Repo` and `File` contexts.
  - Base ref defaults to `parsedContext.ref` or `'main'` if `opts.baseRef` is empty, whitespace, or null.
  - `'ref'` mode defaults compare target to `HEAD` if `compareRef` is omitted.
  - `'timeframe'` mode correctly constructs relative date range `${baseRef}@{${timeframe}}...${baseRef}`.
  - `'custom_date'` mode constructs date comparison `${baseRef}@{${customDate}}...${baseRef}` and gracefully falls back to `1.week.ago` if date string is empty.
  - `buildCommitFeedUrl` matches pattern `^https:\/\/github\.com\/[^\/]+\/[^\/]+\/commits(\/.*)?(\?author=.*)?`.
  - Leading slashes in file paths are stripped (`rawPath.replace(/^\/+/, '')`) to prevent double-slash URL corruption.
  - Omitting branch ref when file path is present automatically prepends `HEAD` (e.g., `/commits/HEAD/path/to/file`).

### 3. Visual & DOM Invariants (`renderInteractiveCards`)
- **Fallback UI**: Renders a clear notice when given null, undefined, or invalid context.
- **Card Compatibility States**: Applies `active` or `disabled` classes and appropriate context badges based on `isInteractiveCardCompatible`.
- **Live Event Handling & Reactivity**:
  - Inputs attach `input` and `change` event listeners that dynamically recalculate target URLs and update `href`, `textContent`, `title`, and copy button `data-url` attributes synchronously.
  - Time Machine compare mode selector dynamically toggles element visibility (`style.display = 'none'` vs `''`) between Ref, Timeframe, and Custom Date form control groups.
  - Copy buttons update `disabled` attribute dynamically based on URL validity.

---

## Stress Test Results

| Scenario | Input/Condition | Expected Behavior | Actual Behavior | Pass/Fail |
|---|---|---|---|---|
| Deep Linker Inverted Lines | `lineStart: 100, lineEnd: 20` | Swap range to `#L20-L100` | Fragment formatted as `#L20-L100` | PASS |
| Deep Linker Raw Toggle + Hash | `plainToggle: true, lineStart: 15` | `?plain=1#L15` (Query before fragment) | `?plain=1#L15` | PASS |
| Deep Linker Malformed Options | `lineStart: -5, lineEnd: "abc"` | Ignore invalid line numbers | Produces base blob URL without fragment | PASS |
| Time Machine Missing Ref | `compareMode: 'ref', compareRef: ''` | Fallback to `...HEAD` | `https://github.com/owner/repo/compare/main...HEAD` | PASS |
| Time Machine Custom Date Empty | `compareMode: 'custom_date', customDate: ''` | Fallback to `1.week.ago` | `https://github.com/owner/repo/compare/main@{1.week.ago}...main` | PASS |
| Commit Feed Path Leading Slash | `pathInput: '/src/main.js'` | Strip leading slash | `/commits/main/src/main.js` | PASS |
| Commit Feed Missing Ref | `refInput: '', pathInput: 'src/main.js'` | Fallback ref to `HEAD` | `/commits/HEAD/src/main.js` | PASS |
| DOM Event Reactivity | Select mode change in Time Machine | Toggle display of input groups synchronously | Elements display toggled cleanly | PASS |

---

## Unchallenged Areas

- **Clipboard API Execution**: Browser environment clipboard writing (`navigator.clipboard.writeText`) is guarded with feature detection and optional chaining; unit testing under Node mock omits live system OS clipboard calls.
