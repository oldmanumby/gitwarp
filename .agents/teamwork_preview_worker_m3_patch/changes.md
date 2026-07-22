# Milestone 3 Hardening Patch — Changes Summary

## 1. `src/interactive.js`
- **`buildTimeMachineUrl` Ref Encoding**:
  - Implemented `safeEncodeRef(refStr)` helper function.
  - Splits ref strings by slash (`/`) and encodes each path segment using `encodeURIComponent(segment)`.
  - Preserves ref hierarchy slashes (e.g. `feature/fix-1`, `refs/tags/v1.0.0`) while encoding spaces (`%20`), hashes (`%23`), question marks (`%3F`), plus signs (`%2B`), and other special characters.
  - Applied `safeEncodeRef` to `rawBaseRef` and `rawCompareRef` in `buildTimeMachineUrl`.
- **`buildDeepLinkerUrl` Strict `plainToggle` Parsing**:
  - Replaced standard JavaScript truthy coercion (`Boolean(opts.plainToggle)`) with strict boolean/string parsing.
  - Explicitly treats boolean `true`, string `'true'`, and string `'1'` (case-insensitive) as enabled (`isPlain = true`).
  - Explicitly treats boolean `false`, string `'false'`, and string `'0'` (case-insensitive) as disabled (`isPlain = false`).
  - Retains fallback to `parsedContext.queryParams?.plain === '1'` or `parsedContext.isRaw` when `plainToggle` option is omitted or `undefined`/`null`.

## 2. `test/interactive_adversarial.test.js`
- Updated test assertions for `plainToggle` evaluation: verified string `'false'` and string `'0'` evaluate to disabled URL output (without `?plain=1`).
- Updated test assertions for `buildTimeMachineUrl` ref character encoding: verified special characters in `compareRef` (e.g., `v1.0.0-beta.1+build.123` and `feature #1?query=1`) are safely URL-encoded into path segments (`v1.0.0-beta.1%2Bbuild.123` and `feature%20%231%3Fquery%3D1`).
