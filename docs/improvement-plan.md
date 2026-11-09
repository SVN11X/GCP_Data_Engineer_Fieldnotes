# Improvement plan

Approved by the owner on 2026-11-08 after a deep-reviewer pass. One pull request per item. Never merge, deploy or handle secrets without the owner. Update CHANGELOG.md when users see the change.

Format: `- [ ]` pending, `- [x]` done, `- [x] SKIPPED: reason`, `- [ ] BLOCKED: question`. Traffic light: G green, Y yellow (moves or URLs, show the plan first).

## Structure and standard

- [x] 1. G Browser baseline with Claude in Chrome at 360, 768, 1280 and 1920 px, plus imported IDs and image hashes from npm run validate, saved in docs/audit/baseline.md.
- [x] 2. Y Adopt the standard: .standard.yml (web, github-pages, npm build, rich motion, multi-step, both themes), AGENTS.md keeping preservation rules, docs/goals.md, DESIGN.md. Merge pages.yml, do not overwrite it.
- [x] 3. Y Moved the client to src/ and the images to assets/. build.mjs copies them into dist/, which is untracked. A clean rebuild is byte-identical for 64 files and the 25 image hashes are unchanged.
- [x] 4. Y Moved INSTALLATION, KNOWLEDGE_REVIEW and VALIDATION to docs/ in lowercase and reports/ to docs/reports/. Fixed README links and build.mjs. The standard check now passes with 0 errors.
- [x] 5. G Add docs/glossary.md and docs/assumptions.md. Each later decision record is written in the pull request that needs it.
- [x] 6. G Add an MIT LICENSE for code, excluding content/imported.json and the 25 source images (done).
- [ ] BLOCKED: 6b. G Which license should the original written content use, for example CC BY 4.0? Until you choose, the README says it is still to be chosen.
- [x] 7. G Footer and About notice: not affiliated with or endorsed by Google, trademarks of Google LLC. Credit line on every lesson. The CC BY 4.0 claim is not stated, because the license of cloud.google.com pages could not be verified.
- [x] 8. G LICENSES/ folder, docs/credits.md and a public credits.html page listing every outside source with its license. CSP default-src stays self. Later asset items add their own rows.
- [x] 9. G Commit package-lock.json and install with npm ci in the Pages workflow. The standard workflow from item 2 already runs the pinned check and gitleaks. Workflow permissions stay minimal.

## Domains, type and visual system

- [x] 10. G Official domain and objective titles from guide v4.2, IDs kept. Weights 22/25/20/15/18 rechecked against the guide on 2026-11-08 and recorded in content/verification.json.
- [x] 11. G Type and spacing scale: body 16 px or more, labels 14 px or more, prose max 70ch, 4 and 8 px spacing. Replace every 8 to 12 px font rule in styles.css.
- [x] 12. G Field-notebook visual system from DESIGN.md: paper and ink tokens, key-fact style, domain text colors, both themes at 4.5:1 contrast or more. No new font yet (see 12b).
- [ ] BLOCKED: 12b. Do you approve downloading one handwritten OFL font (for example Caveat from Google Fonts, about 100 KB WOFF2) into assets/ with its OFL text in LICENSES/? A self-hosted copy adds no runtime request to other hosts.
- [ ] BLOCKED: 13. Mermaid-to-SVG at build time (radar: trial) for whiteboard diagrams. The radar note goes as a separate pull request to SVN11X/standards. Needs your OK to download or install: an npm package for Mermaid-to-SVG.

## Focus, lessons and motion

- [x] 14. G Focus mode: topbar button, f key, Escape, remembered in its own storage key, progress bar. Tests cover toggle, bad values, clamping and old saved progress. Bar shows session step or completed lessons.
- [x] 15. G Lesson block pilot: 4 of 9 domain 1 lessons start with a diagram, a key fact and a quick check. Text is derived from the lessons and needs owner review.
- [x] 16. G Motion set: dots moving along lesson diagrams (3 short passes, pause button), button feedback, key-fact sweep, reduced-motion fallback, decision 0001.
- [x] 17. G Gentle rewards: optional streak field under data-engineer-fieldnotes.v1, domain marks derived from completed lessons, calm chip and badges. Tests cover old state, export and restore.
- [ ] BLOCKED: 18. Official Google Cloud product icons in diagrams after confirming the terms on cloud.google.com/icons. Attribution on the credits page. Needs your OK to download or install: official Google Cloud icon files.
- [ ] BLOCKED: 19. Lucide UI icons copied as local SVG and CC0 illustrations (Open Peeps, Open Doodles), each listed in LICENSES/. Needs your OK to download or install: Lucide SVG files and CC0 illustrations.
- [ ] BLOCKED: 20. Manim pilot: one 20 to 40 s WebM clip (batch vs streaming) rendered locally, 1 MB or less, poster, EN and ES VTT, pause control. Radar pull requ... Needs your OK to download or install: Manim, ffmpeg and a rendered video.
- [x] 21. G Convert domain 2 to the lesson block format with diagrams. Done for the 8 most central of 16 lessons, text derived from the lessons, owner review pending.
- [x] 22. G Convert domain 3 to the lesson block format with diagrams. All 10 lessons have blocks, text derived from the lessons, owner review pending.
- [x] 23. G Convert domain 4 to the lesson block format with diagrams. All 7 lessons have blocks, text derived from the lessons, owner review pending.
- [x] 24. G Convert domain 5 to the lesson block format with diagrams. All 10 lessons have blocks, text derived from the lessons, owner review pending.
- [ ] BLOCKED: 25. Two more Manim clips (Pub/Sub to Dataflow to BigQuery, partition pruning) within the media budget of 10 MB new media in git. Needs your OK to download or install: Manim again, same approval as item 20.

## Entry paths, comparisons and questions

- [x] 26. G First-visit question "Do you know the exam?": orientation or a 10-question diagnostic, switchable, as a state machine. Orientation text awaits owner review.
- [x] 26b. Initial payload limit raised from 450,000 to 500,000 bytes, approved by the owner. Long content still loads on demand. See docs/decisions/0003-initial-payload-budget.md.
- [x] 27. G Fast review path: a 1 to 2 hour plan across the five domains weighted by the guide, with a one-page summary per domain.
- [x] 28. G Added 4 verified comparisons (storage, processing, messaging, orchestration) at #review/compare, loaded on demand. #compare already serves service cards.
- [ ] 29. G Original scenario questions until every objective has five, kept outside the timed pool. BLOCKED: allow them in timed sessions? AGENTS.md fixes that pool.

## Verification with the Google MCP

- [x] 30. G Added content/verification-log.json (query, source, date per topic), a lazy lesson-page line and build warnings for gaps and entries over 90 days.
- [x] 31. G Verified the 9 domain 1 lessons with the MCP: 9 confirmed, 0 updated, 0 unverifiable. No stale claims found, so lesson text is unchanged.
- [x] 32. G Verified the 16 domain 2 lessons with the MCP: 16 confirmed, 0 updated, 0 unverifiable. No stale claims found, so lesson text is unchanged.
- [x] 33. G Verified the 10 domain 3 lessons with the MCP: 9 confirmed, 1 updated, 0 unverifiable. Fixed the LIMIT cost note to say non-clustered tables.
- [x] 34. G Verified the 7 domain 4 lessons with the MCP: 7 confirmed, 0 updated, 0 unverifiable. No lesson text needed changes, unchecked claims are listed in each log note.
- [x] 35. G Verified the 9 domain 5 lessons with the MCP: 7 confirmed, 2 updated, 0 unverifiable. Capacity keeps its earlier entry. Renamed Composer in repeatability and qualified replication in recovery.
- [x] 36. G Verified the 28 service cards with the MCP: 25 confirmed, 3 updated, 0 unverifiable (Dataproc, Composer, serverless Spark renamed). Missing lesson or service records now fail the build.

## Bilingual

- [ ] 37. G Spanish interface on top of the English help toggle, keeping its saved state and A2 vocabulary help. Product names stay in English. Decision record.
- [ ] 38. G Translate domain 1 lessons and scenarios to Spanish.
- [ ] 39. G Translate domain 2 lessons and scenarios to Spanish.
- [ ] 40. G Translate domain 3 lessons and scenarios to Spanish.
- [ ] 41. G Translate domain 4 lessons and scenarios to Spanish.
- [ ] 42. G Translate domain 5 lessons and scenarios to Spanish.
- [ ] 43. G Translate services, comparisons and workshops to Spanish. The glossary already has 161 Spanish entries.
- [ ] 44. G Spanish layer for the 349 imported questions in content/imported-es.json. imported.json stays untouched, unreadable image text is not translated, one batch per domain.

## Presentation

- [ ] 45. G Rewrite the README with a status line and the live link. Show the GitHub About panel and topics for the owner to apply with --apply.
- [ ] 46. G Final browser check at four widths, keyboard, touch, reduced motion and dark theme, saved in docs/audit/final.md.

## Dropped

Iconify and Wikimedia MCP, Wikimedia photos, "see official photo" links, and MCP Toolbox with BigQuery. The owner can bring any of them back.
