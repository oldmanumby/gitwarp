# Adversarial Challenge Report: Interactive Cards Component (`src/interactive.js`)

## Challenge Summary

**Overall risk assessment**: MEDIUM

The Interactive Cards Component (`src/interactive.js`) displays strong overall stability, complete context-safety, zero input mutation, and robust HTML/path escaping for author filters and paths. However, adversarial testing surfaced two notable edge-case vulnerabilities:
1. **Unencoded URL parameters in Time Machine Compare**: Ref names containing spaces, hash anchors (`#`), or query markers (`?`) are inserted raw into the comparison URL path without `encodeURIComponent`, leading to malformed URLs.
2. **Boolean string parameter handling in Deep Linker**: Passing boolean strings like `'false'` or `'0'` for `plainToggle` evaluates to `true` via `Boolean('false')`, incorrectly adding `?plain=1` to the output URL.

---

## Challenges

### [Medium] Challenge 1: Unencoded Ref Names in Time Machine Compare URL
- **Assumption challenged**: User input or context refs for branches/tags/SHAs will always be pre-sanitized URI-safe string tokens without spaces, `#`, or `?`.
- **Attack scenario**: A user enters a branch ref containing spaces or special characters, such as `feature #42?debug=true` or `v1.0.0+build 12`. `buildTimeMachineUrl` directly interpolates this into the URL path (`compare/main...feature #42?debug=true`), breaking standard URL encoding rules and causing fragment/query parameter hijacking.
- **Blast radius**: User is redirected to a broken or misdirected GitHub comparison URL.
- **Mitigation**: Encode `baseRef` and `compareRef` (or ref path segments) using `encodeURIComponent` before concatenating into the `/compare/` URL path.

### [Low] Challenge 2: Loose Boolean Coercion of `plainToggle` Option
- **Assumption challenged**: The `plainToggle` option in `buildDeepLinkerUrl` will only ever be passed as a primitive boolean (`true`/`false`).
- **Attack scenario**: Form handler inputs or serialized configuration objects pass `plainToggle` as string `'false'` or `'0'`. `Boolean('false')` evaluates to `true` in JavaScript, causing `buildDeepLinkerUrl` to produce a `?plain=1` URL when raw text mode was intended to be disabled.
- **Blast radius**: Unexpected `?plain=1` query parameter added to deep links when options contain string representations of boolean `false`.
- **Mitigation**: Use strict comparison or parse boolean strings: `opts.plainToggle === true || opts.plainToggle === 'true' || opts.plainToggle === '1'`.

### [Low] Challenge 3: Floating Point & Oversized Line Number Handling
- **Assumption challenged**: Line numbers passed to Deep Linker will fit within JS `Number.MAX_SAFE_INTEGER` (`9007199254740991`).
- **Attack scenario**: When line numbers exceed `Number.MAX_SAFE_INTEGER`, `parseInt(String(lineStart), 10)` suffers IEEE-754 floating point precision loss, coercing `9007199254741091` to `9007199254741092`.
- **Blast radius**: Minimal — GitHub line numbers do not realistically approach 9 quadrillion.
- **Mitigation**: Restrict upper bound on line numbers or format BigInt strings if super-huge line numbers are required.

---

## Stress Test Results

| Scenario | Expected Behavior | Actual Behavior | Result |
|---|---|---|---|
| Deep Linker huge line numbers (`9999999999999999999999`) | Generates `#L...` without throwing or freezing | Returns `https://github.com/facebook/react/blob/main/src/index.js#L1e+22` | PASS |
| Deep Linker negative line numbers (`-100`) | Ignores line numbers `< 1` | Returns base URL without `#L` fragment | PASS |
| Deep Linker reversed bounds (`start=100`, `end=1`) | Automatically swaps bounds to `#L1-L100` | Returns `https://github.com/facebook/react/blob/main/src/index.js#L1-L100` | PASS |
| Deep Linker floating point line numbers (`10.5`) | Truncates to integer `10` via `parseInt` | Returns `#L10` | PASS |
| Deep Linker `plainToggle: 'false'` | Ignores string `'false'` as boolean `false` | Includes `?plain=1` due to `Boolean('false')` | FAIL (Finding) |
| Time Machine ref with slashes (`feature/fix-1`) | Generates `compare/feature/fix-1...HEAD` | Returns `https://github.com/facebook/react/compare/feature/fix-1...HEAD` | PASS |
| Time Machine ref with spaces/hashes (`feat #1`) | Encodes special chars in compare path | Generates raw unencoded `compare/main...feat #1` | FAIL (Finding) |
| Time Machine empty/whitespace refs | Falls back to context ref or `HEAD` | Returns `compare/main...HEAD` | PASS |
| Commit Feed malicious author (`"John" <j@x.com> & <script>`) | URI encodes author parameter | Returns `?author=%22John%22%20%3Cj%40x.com%3E%20%26%20%3Cscript%3E...` | PASS |
| Commit Feed deep nested path (`///a//b///c///d.js`) | Cleans leading slashes & encodes path segments | Returns `commits/main/a//b///c///d.js` | PASS |
| Context object property mutation / `Object.freeze` | Operates without mutating input objects or throwing | Functions execute with 0 mutations and 0 errors | PASS |
| Icon initialization error in headless test | Suppresses icon library failure gracefully | `renderInteractiveCards` completes without throwing | PASS |

---

## Unchallenged Areas

- CSS/Style layout rendering in actual browser viewports (out of scope for Node test environment).
