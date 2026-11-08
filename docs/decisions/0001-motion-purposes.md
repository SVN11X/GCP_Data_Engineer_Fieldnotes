# 0001. Motion purposes

- Status: proposed
- Date: 2026-11-08
- Proposed by: Claude Code (improvement plan item 16)
- Accepted by: owner

## Context

The standard's web profile uses the "rich" motion option. Every animation needs a written purpose, may animate only transform and opacity (plus paint-only background effects), must have a pause control if it moves for more than 5 seconds, and must respect `prefers-reduced-motion`. DESIGN.md says motion only teaches or gives feedback, stays calm and has no sound. Nothing here has been checked in a browser yet.

## Decision

Add four small animations in `dist/assets/styles.css` and `dist/assets/lesson-block.js`. Everything else stays still.

| Animation | Purpose | Duration | Animates | Stop or pause rule | Reduced motion |
| --- | --- | --- | --- | --- | --- |
| Data flow dots on the lesson diagram | Show the direction data takes from each source node to its target | 1.6 s per pass, 3 passes, 4.8 s in total | `transform` of one SVG circle per edge | Stops by itself after 3 passes, under 5 s. A "Pause data flow" button (aria-pressed, 44 px target) pauses and resumes, and "Play data flow" restarts it | No movement. Dots rest at the target and the button is hidden, because there is nothing to step |
| Button press and hover | Confirm that a press registered | 100 to 150 ms | `transform: scale(.98)` on press, background and border color on hover, on `.button` and `.lb-choice` | Finishes in 150 ms | Transitions and scale removed |
| Quick check answer | Make a correct answer feel calm and clear | 150 ms | Background and border color, feedback text `opacity` | Finishes in 150 ms. A wrong answer gets no extra animation, only the existing dashed border and text | Transitions and fade removed |
| Key fact marker sweep | Draw the eye to the one fact to remember when a block opens | 600 ms, once | `background-size` of the highlighter gradient (paint only, no layout) | Plays once per render | Highlighter is fully drawn from the start |

Pass count, stop and reduced-motion behavior live in the pure functions `flowPlan`, `flowNext` and `flowLabel`, covered by `tests/lesson-block.test.mjs`. The existing global reduced-motion rule in `styles.css` also cancels animations and transitions.

Deliberately not animated: page and route transitions, scrolling effects, parallax, looping or idle motion, shaking or red flashes on a wrong answer, celebration effects for a correct answer, progress and score counters, hero and background decoration, and any sound.

## Alternatives considered

- No motion at all. Simplest, but data direction is a core idea in pipeline diagrams and a short pass teaches it better than arrows alone.
- A continuous looping flow with a pause button. Rejected because it competes for attention, which is a stated priority to avoid.
- SVG `animateMotion`. Rejected because pausing it needs extra scripting, while CSS `animation-play-state` is simple.

## Consequences

Easier: diagrams explain direction without extra text, and each animation has a stated purpose to review. Harder: the lesson block has a small amount of state (`data-flow`). To undo, delete the "Motion set" block at the end of `styles.css` and the flow code in `lesson-block.js`. Pending: a manual check in a real browser, including reduced motion.
