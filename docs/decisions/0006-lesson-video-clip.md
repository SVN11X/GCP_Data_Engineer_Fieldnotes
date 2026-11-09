# 0006. A silent captioned clip on one lesson

Status: accepted by the owner on 2026-11-09 (plan item 20, pilot).

## Context

Batch versus streaming is easier to see than to read. The motion rule of AGENTS.md asks for a written purpose for every animation and a pause control when something moves for more than 5 seconds.

## Decision

- One 30 second clip rendered with Manim, 854 by 480, WebM, 576 KB, on the lesson "Choose the engine that fits the work".
- Purpose: show that batch data piles up and gives one result, while streaming events flow one by one and keep the result fresh.
- It never autoplays and loads nothing until the learner presses play (`preload="none"`). The native player gives pause, seek and captions. The poster is a WebP of 12 KB.
- Captions in English and Spanish (WebVTT) describe what the picture shows. The clip has no sound.
- Only transform and opacity style motion: dots slide along the arrows and bars grow.

## Consequences

- The media budget of 10 MB of new media in git has 9.4 MB left for item 25.
- Manim and Inter are used only at render time and are not shipped. Inter appears as rendered glyphs in the video and is credited in `docs/credits.md`.
- The Spanish page shows the same English figure caption. The clip text itself is English, and the Spanish captions explain it.
