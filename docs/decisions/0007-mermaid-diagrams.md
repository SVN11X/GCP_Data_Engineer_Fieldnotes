# 0007. Mermaid diagrams rendered by hand and committed

Status: accepted by the owner on 2026-11-09 (plan item 13).

## Context

AGENTS.md asks for diagrams as Mermaid text. The site needs SVG that loads without a script. Mermaid CLI needs a browser to render.

## Decision

- Add `@mermaid-js/mermaid-cli` as a dev dependency (MIT). `.npmrc` sets `puppeteer_skip_download=true`, so `npm ci` in CI downloads no browser.
- `npm run diagrams` renders `content/diagrams/*.mmd` to `assets/diagrams/*.svg` with a local Chrome or Edge (`PUPPETEER_EXECUTABLE_PATH`). The SVG files are committed. The build, tests and CI never render.
- The first diagram is the exam map on the review plan page. Transparent background and mid-gray lines keep it readable in both themes.

## Consequences

- Changing a `.mmd` file needs a manual render and a commit of the SVG.
- The radar note for SVN11X/standards stays with the owner.
