# 0008. Lucide icons next to text, no decorative illustrations

Status: decided by the assistant on the owner's instruction on 2026-11-09 (plan item 19). The owner can reverse it.

## Context

The owner asked for the best practice on icons and illustrations. The site is for learners with attention deficit, so every extra picture competes with the lesson. AGENTS.md allows decorative illustrations only with a written reason.

## Decision

- Use three Lucide icons (ISC license): sun-moon, focus and languages. They sit beside the visible text of the theme, focus mode and language buttons. The text stays, so the icons are decoration and need no label of their own.
- Draw them with CSS `mask-image` and `currentColor`, so they follow both themes and the contrast of the text. The SVG files are copied into `assets/icons/`. No icon library, script or request to another host.
- Do not add Open Peeps, Open Doodles or other decorative illustrations. They add no teaching value and add visual noise. The lesson diagrams, the exam map and the clips already carry the visual teaching.
- The ISC text is in `LICENSES/ISC-Lucide.txt` and the credits list the three icons.

## Consequences

- Any later icon needs a job, a visible text label and a credit row.
