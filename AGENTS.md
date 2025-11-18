# Repository Guidelines

## Project Structure & Module Organization
- `index.html` bootstraps the single-page app and wires Tailwind via CDN.  
- `assets/js/app.js` hosts all modules (navigation, manual analyzer, journal, AI heuristics, guide). Favor extending the existing factory pattern (`createXModule`) when adding features.  
- `assets/css/styles.css` contains bespoke styling layered on Tailwind utility classes; append component blocks near related sections.  
- `specs/` regroups the knowledge base (`overview.md`, `user_needs.md`, `ux.md`, `fonctionnel.md`, `décisions.md`, `changelog.md`). Update the relevant file whenever you touch product scope or rationale.  
- `resources/` centralises collateral (scripts in `exemples.txt`, dojo history in `anciens_scenarios.md`, business rules reference in `regles_metier.pdf`).

## Build, Test, and Development Commands
- `python3 -m http.server 8000` (project root) — quick static server to preview the SPA.  
- `npx serve .` — alternative live server with better MIME defaults.  
No build pipeline is required; ensure the app runs in evergreen browsers (Chrome, Edge).

## Coding Style & Naming Conventions
- **JavaScript:** ES2020+, strict mode enabled. Use descriptive factory functions (`createXModule`) and prefer `const`/`let`. Keep modules pure; inject dependencies instead of relying on globals.  
- **CSS:** Stick to Tailwind palette values already present, group custom classes by component, and keep selectors flat (no deep nesting).  
- **HTML:** Components rely on `data-*` hooks (e.g., `data-action`, `data-navigate`). Reuse these patterns for new interactions.

## Testing Guidelines
- Automated tests are not yet in place. Before opening a PR, run the SPA locally, exercise each tab (Manual, Journal, IA, Guide), and confirm toasts, filters, and modals behave as expected.  
- When adding features, note manual test cases in the PR description until a formal test harness is introduced.

## Commit & Pull Request Guidelines
- Write atomic commits with imperative subjects (e.g., `Add journal CSV exporter`). Reference related doc updates when applicable.  
- Pull requests should include: summary of changes, manual validation steps, screenshots or GIFs for UI tweaks, and pointeurs vers les sections des specs mises à jour (`specs/fonctionnel.md` ou `specs/décisions.md`).  
- Flag any configuration steps (e.g., Gemini API key requirements) so other contributors can reproduce the environment quickly.
