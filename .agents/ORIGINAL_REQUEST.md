# Original User Request

## Initial Request — 2026-07-22T03:51:03Z

# Teamwork Project Prompt — Draft

> Status: Launched
> Goal: Craft prompt → get user approval → delegate to teamwork_preview

Update the existing `gitswapForged` Vanilla JS web app to support advanced GitHub URL tricks by implementing a robust URL context parser, adding 12 new trick cards (tricks 14-26, skipping 25), and introducing "Interactive Cards" for tricks requiring additional user inputs (like timeframes or line numbers).

Working directory: `/Users/oldmanumby/Documents/Projects/CODING/APPS/gitswapForged`
Integrity mode: development

## Requirements

### R1. URL Context Parser
Implement logic to parse a pasted GitHub URL and determine its context (`User`, `Repo`, `File`, `Commit`, or `PR`). Extract relevant data (owner, repo, branch, file path).

### R2. Standard Trick Cards
Expand the services grid to include the distinct trick cards (e.g., `.keys`, `.gpg`, `.patch`, `.diff`, `releases.atom`, `.zip`, `codespaces.new`, etc.). Ensure cards visually indicate when they are incompatible with the current URL context (e.g., a `.keys` card is disabled if a Repo URL is pasted).

### R3. Interactive Cards
Implement "Advanced Tools" cards at the bottom of the grid for complex URLs (Time Machine diff, Commit Feed, Deep Linker). These cards must span the full width and contain inline form inputs (dropdowns, checkboxes) that update the generated URL in real-time. 

### R4. Pure Vanilla JS
All DOM manipulation for the new cards and interactive inputs must be done using pure Vanilla JS. Do not introduce new frameworks (like React, Vue, or Alpine).

### R5. Adherence to Global Directives
Follow the workflow rules defined in `~/.agents/AGENTS.md`. Specifically, the agent must run the build, verify it works locally, and finally use the `here-now` skill (by running `~/.gemini/config/skills/here-now/scripts/publish.sh`) to publish the development version for user review.

## Acceptance Criteria

### URL Parsing & State
- [ ] The parser correctly identifies a User URL and enables only User-context cards.
- [ ] The parser correctly identifies a File URL and enables only File-context cards.

### Interactive Cards
- [ ] The Deep Linker card allows input of a line range (e.g., L10-L20) and a `?plain=1` toggle, successfully generating the correct URL.
- [ ] The Time Machine card dynamically builds a `/compare/...` URL based on user-selected branch and timeframe.

### Workflow & Verification
- [ ] The app successfully builds via `npm run build` with no errors.
- [ ] The updated app is published to `here.now` successfully.
