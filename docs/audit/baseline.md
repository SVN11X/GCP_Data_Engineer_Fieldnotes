# Baseline before the improvement plan

Measured on 2026-11-08 from commit `c478ae5` plus the plan commit, before any structure move. Later items compare against this file.

## Preservation baseline

| Check | Result |
|-------|--------|
| `npm test` | 30 of 30 pass |
| `npm run validate` | 473 questions (349 imported + 124 original), 25 unchanged images, 52 lessons, 19 objectives, 161 terms, 28 services, 12 workshops, 4 architectures |
| `content/imported.json` | 349 questions, SHA-256 starts `57560a8c170dbd56` |
| `content/imported-preservation.json` | SHA-256 starts `6cb4b0fbb4e85eb3` |
| Source images in `dist/assets/images/` | 25 files, combined SHA-256 of the sorted per-file hashes starts `d57d61666904b5f3` |

After any move, `npm run validate` must report the same counts and the hashes above must not change.

## Home page layout

Method: the built site served over HTTP at `http://127.0.0.1:8000/#home` and opened in Chrome. The browser window ignored resize requests, so each width was measured inside an iframe of that width (same page, same CSS). Characters per line is the paragraph width divided by the average glyph width of its first 200 characters. This is an estimate, not a typesetting count. Rules come from `layout-and-space.md`.

| Width | Main column | Side margins (left / right) | Characters per line | Body font | Screens to scroll | CTA top edge |
|------:|------------:|----------------------------:|--------------------:|----------:|------------------:|-------------:|
| 360 px | 345 px | 0 / 15 px | 45 | 16 px | 4.2 | 493 px |
| 768 px | 753 px | 0 / 15 px | 50 | 17 px | 1.6 | 391 px |
| 1280 px | 1035 px | 230 / 15 px | 67 | 17 px | 2.1 | 402 px |
| 1920 px | 1350 px | 392 / 178 px | 71 | 17 px | 1.6 | 414 px |

The left margin at 1280 and 1920 px is the 230 px sidebar plus spacing. At 360 and 768 px the sidebar is hidden.

## Findings

1. **Line length is inside the rule** (50 to 75 characters, Baymard) from 768 px up. At 360 px it is 45, slightly short, which is normal for a phone.
2. **First screen works.** At every width the headline and the "Try a 2-minute challenge" action sit in the first screen (top edge 391 to 493 px). Rule: purpose and main action on the first screen (Nielsen Norman Group).
3. **No horizontal scroll** at 360 px (WCAG 1.4.10 asks for 320 px; 360 px passes, 320 px is not measured).
4. **Small text is the main problem.** On the home page 24 text nodes are under 12 px and 20 are 12 to 14 px, against 21 at 14 px or more. The web profile asks for readable text and the owner's readers have an A2 English level and attention deficit. This is item 11 of the plan.
5. **Right margin is 15 px at 360 to 1280 px**, with the content nearly touching the scrollbar edge. Check this when the type and spacing scale lands.

## Not measured

- Core Web Vitals (LCP, INP, CLS). No Lighthouse run yet.
- 320 px width, keyboard order, focus visibility, contrast ratios, reduced motion and the dark theme.
- Lesson, question and service pages. Only the home page was measured.
- Touch targets.

These are covered by item 46 (final browser check) and by the accessibility test planned in item 9.
