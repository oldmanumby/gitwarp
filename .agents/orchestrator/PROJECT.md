# Project: gitswapForged Advanced GitHub URL Tricks

## Architecture
`gitswapForged` is a Vanilla JS + Vite single-page application.
The application architecture is modularized into pure client-side components:
1. `src/parser.js`: Parses any pasted GitHub URL into a structured context object (`User`, `Repo`, `File`, `Commit`, `PR`) and extracts details (`owner`, `repo`, `branch`/`ref`, `filePath`, `commitHash`, `prNumber`).
2. `src/cards.js`: Catalog of standard trick cards (Tricks 1-13 + 14-26 excl 25). Each card defines its template, required context, icon, title, description, and link generator. Includes compatibility checking to mark cards as active or disabled with visual badges.
3. `src/interactive.js`: Interactive "Advanced Tools" cards (Deep Linker, Time Machine Diff, Commit Feed). Renders full-width cards with inline form inputs (dropdowns, toggles, text fields) and updates output URLs live on input change.
4. `src/main.js`: Main entry point. Coordinates input listening, toast feedback, DOM updates, Lucide icon re-initialization, and layout rendering.
5. `src/style.css`: Glassmorphism UI styling, card grid responsive layout, disabled card states, badge indicators, full-width interactive cards, and form control styles.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | URL Context Parser | Implement `src/parser.js` supporting User, Repo, File, Commit, PR extraction | none | DONE |
| 2 | Standard Trick Cards & Compatibility | Implement `src/cards.js` with 12 new cards (14-26 excl 25) & context filtering | M1 | DONE |
| 3 | Interactive Cards Component | Implement `src/interactive.js` for Deep Linker, Time Machine, Commit Feed | M1, M2 | DONE |
| 4 | UI Integration, Styling & Build | Integrate all modules into `main.js` & `index.html`, style UI, verify `npm run build` | M1, M2, M3 | DONE |
| 5 | Publish & Victory Audit | Run `publish.sh`, verify `here.now` link, complete Victory Audit | M4 | DONE |

## Interface Contracts

### `src/parser.js`
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
  //   rawUrl: string
  // }
}
```

### `src/cards.js`
```javascript
export const STANDARD_CARDS = [
  // Card definitions with id, name, icon, contextsAllowed: ['User', 'Repo', 'File', 'Commit', 'PR'], generateUrl(parsed)
];

export function isCardCompatible(card, parsedContext) {
  // returns boolean
}
```

### `src/interactive.js`
```javascript
export function renderInteractiveCards(containerEl, parsedContext) {
  // Renders interactive cards for Deep Linker, Time Machine, Commit Feed
}
```

## Code Layout
```
/src
  ├── assets/
  ├── cards.js        # Card definitions & compatibility checks
  ├── interactive.js  # Full-width interactive tool cards
  ├── main.js         # DOM event handling & state orchestration
  ├── parser.js       # URL context parsing engine
  └── style.css       # Styles & glassmorphism theme
```
