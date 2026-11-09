# Final browser check

Date: 2026-11-09. Build of the item 45 branch served from `dist/` on localhost, checked in Chrome through the browser tools.

## What was measured

- Widths 360, 768, 1280 and 1920 px, measured in same-origin frames because the window could not be resized. Routes: lesson, learning path, practice, review, resources.
- Result before fixes: no horizontal scroll except `#resources` at 1280 px, where the top bar was 6 px too wide. Fixed by letting the top bar wrap from 1000 px. After the fix the page is 1263 px wide inside 1280.
- Text below 14 px: none found on the five routes at the four widths.
- Click targets below 24 px: eight found on the lesson page (back link, three summaries, English studio link, two footer links). Fixed with a 24 px minimum. None remain.
- Lesson "Choose the engine that fits the work": the clip loads metadata (29.9 s), has no autoplay, `preload="none"`, native controls and two caption tracks. Caveat loads and styles the key fact.
- Dark theme: the system theme was dark during the check. Body background and text were rgb(12, 18, 30) and rgb(202, 217, 233).
- Keyboard: a focused control shows a solid outline of about 2.7 px. Fields have labels, images have alt text, the page has `lang` and a title.
- Reduced motion: four `prefers-reduced-motion` rule blocks exist in the stylesheet.

## Not verified

- Real touch input and a real 360 px window. Only frame widths were used.
- Light theme screenshots and contrast ratios of the new Caveat key fact were not measured with a tool.
- Playback of the other two clips and the Spanish captions were not opened. The files exist and `npm run validate` checks them.
- Core Web Vitals were not measured.
