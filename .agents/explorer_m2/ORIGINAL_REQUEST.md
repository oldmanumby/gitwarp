## 2026-07-21T22:56:08Z

<USER_REQUEST>
You are Explorer for Milestone 2: Standard Trick Cards & Compatibility System.

Your working directory is `/Users/oldmanumby/Documents/Projects/CODING/APPS/gitswapForged/.agents/explorer_m2`. Please write your briefing and handoff report in your working directory.

Project workspace: `/Users/oldmanumby/Documents/Projects/CODING/APPS/gitswapForged`

Task:
1. Examine existing card definitions in `src/main.js` and specify `src/cards.js`.
2. Define all standard trick cards (Tricks 1-13 + 14-26 excl 25):
   - Existing: bolt.new, deepwiki, gitdiagram, gitingest, github.dev, github.gg, github1s, gitmcp, gitpodcast, stackblitz, starhistory.
   - New (12 cards): .keys, .gpg, .patch, .diff, releases.atom, commits.atom, zip archive, codespaces.new, gitpod.io, vscode.dev, SSH clone URL, raw file URL.
3. Define the exact `card` data structure:
   - `id`, `name`, `icon`, `allowedContexts` (`['User', 'Repo', 'File', 'Commit', 'PR']`), `description`, `generateUrl(parsedContext)`
4. Define compatibility check function `isCardCompatible(card, parsedContext)`.
5. Specify visual indication requirements for incompatible cards (CSS classes, badges, disabled copy buttons).
6. Write a comprehensive specification report to `/Users/oldmanumby/Documents/Projects/CODING/APPS/gitswapForged/.agents/explorer_m2/handoff.md`.
7. Send a message to parent when completed.
</USER_REQUEST>
