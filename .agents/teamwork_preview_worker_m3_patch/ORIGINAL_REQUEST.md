## 2026-07-21T23:09:07Z
You are Worker for Milestone 3 Hardening Patch in gitswapForged.
Your working directory is `/Users/oldmanumby/Documents/Projects/CODING/APPS/gitswapForged/.agents/teamwork_preview_worker_m3_patch/`.
Project root: `/Users/oldmanumby/Documents/Projects/CODING/APPS/gitswapForged`.

Adversarial testing revealed 2 minor edge-case hardening opportunities in `src/interactive.js`:
1. `buildTimeMachineUrl`: Ensure `baseRef` and `compareRef` have ref path segments safely URL-encoded or sanitized (e.g. replacing spaces with `%20` or split-encoding slashes/refs using `encodeURIComponent` per segment or `encodeURI`) so refs with spaces or special characters do not produce malformed URL strings.
2. `buildDeepLinkerUrl`: Handle `opts.plainToggle` strictly: if `opts.plainToggle` is boolean `true` or string `'true'` / `'1'`, treat as enabled; if string `'false'` or `'0'`, treat as disabled (so `plainToggle: 'false'` does not accidentally evaluate to truthy).

Tasks:
1. Update `src/interactive.js` to implement these 2 small hardenings.
2. Run `node --test test/*.test.js` to verify all 158 unit & adversarial tests pass cleanly.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task.

Write `changes.md` and `handoff.md` in your working directory and send a completion message when done.
