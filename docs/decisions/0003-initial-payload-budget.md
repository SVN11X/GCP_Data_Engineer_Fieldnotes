# 0003. Raise the initial payload budget to 500,000 bytes

- Status: accepted
- Date: 2026-11-08
- Proposed by: the AI tool, after the budget limited content accuracy
- Accepted by: owner, in chat on 2026-11-08

## Context

`scripts/validate.mjs` fails the build when `index.html` plus every file it references (scripts, the stylesheet and the catalog `data.js`) weigh 450,000 bytes or more. The original site used 428,126 bytes. After the focus mode, lesson blocks, motion, rewards, entry paths and the verification line, the total reached 449,982 bytes, which left 18 bytes.

The limit started to decide content. A service card could not get the old exam-guide name in parentheses, and a correction to the Memorystore card had to be rewritten to the same length. The Spanish interface also needs a language switch and its strings in the initial files.

## Decision

Raise the limit to 500,000 bytes. Keep the catalog limit (`bootBytes < 230000`) and keep loading long content on demand: lessons, questions, comparisons, the review plan, the verification log and the Spanish text still load only when a route needs them.

## Alternatives considered

- Keep 450,000 and move more code to on-demand loading, for example the lesson block and the focus mode. It keeps the first load smaller but touches working code and delays the Spanish interface.
- No limit. A fixed number still protects the first load, so it stays.

## Consequences

The first load can grow by up to about 50,000 bytes of code and interface text. New work should still prefer on-demand files. To undo it, set the number back to 450000 and move code out of the initial files until the check passes.

## Amendment, 2026-11-09

Thirteen new original questions add 8 KB of catalog entries (id, text, choices, search text). The catalog limit moves from 230,000 to 240,000 bytes. The initial total limit of 500,000 bytes is unchanged and the page still weighs about 468,000 bytes. This changes an owner-approved number, so the owner should confirm it in the pull request.
