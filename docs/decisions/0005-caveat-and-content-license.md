# 0005. Caveat font and CC BY 4.0 for original content

Status: accepted by the owner on 2026-11-09.

## Context

DESIGN.md asks for one handwritten face for notes. The owner also had to choose a license for the original written content (plan items 6b and 12b).

## Decision

- Self-host Caveat (SIL OFL 1.1) as one WOFF2 file of 73 KB, subset to Latin, in `assets/fonts/`. It loads only when a lesson block shows its key fact. CSP stays `default-src 'self'`, so no request goes to another host.
- Use it only for the lesson key fact, at 22 px. Body text stays sans-serif.
- License the original written content under CC BY 4.0. The text is in `LICENSES/CC-BY-4.0.txt`. Google documentation, names and trademarks, the imported questions and their Spanish translation are excluded.

## Consequences

- Two font families in total, which is the limit of AGENTS.md.
- The README and `docs/credits.md` state both licenses. Reusers must credit the owner.
