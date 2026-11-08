# Improvement plan

Approved by the owner on 2026-11-08 after a deep-reviewer pass. One pull request per item. Never merge, deploy or handle secrets without the owner. Update CHANGELOG.md when users see the change.

Format: `- [ ]` pending, `- [x]` done, `- [x] SKIPPED: reason`, `- [ ] BLOCKED: question`. Traffic light: G green, Y yellow (moves or URLs, show the plan first).

## Structure and standard

- [x] 1. G Browser baseline with Claude in Chrome at 360, 768, 1280 and 1920 px, plus imported IDs and image hashes from npm run validate, saved in docs/audit/baseline.md.
- [x] 2. Y Adopt the standard: .standard.yml (web, github-pages, npm build, rich motion, multi-step, both themes), AGENTS.md keeping preservation rules, docs/goals.md, DESIGN.md. Merge pages.yml, do not overwrite it.
- [ ] BLOCKED: 3. Y Move the client in dist/ (index.html, assets code) to src/, mark.svg and 25 images to assets/, untrack dist/. Do you approve? It changes how the site is built. Details after item 4.
- [ ] BLOCKED: 4. Y Do you approve docs/migration-plan.yml: INSTALLATION, KNOWLEDGE_REVIEW and VALIDATION move to docs/ in lowercase, and reports/ goes to docs/reports/? README links and build.mjs:57 get fixed.
- [x] 5. G Add docs/glossary.md and docs/assumptions.md. Each later decision record is written in the pull request that needs it.
- [x] 6. G Add an MIT LICENSE for code, excluding content/imported.json and the 25 source images (done).
- [ ] BLOCKED: 6b. G Which license should the original written content use, for example CC BY 4.0? Until you choose, the README says it is still to be chosen.
- [x] 7. G Footer and About notice: not affiliated with or endorsed by Google, trademarks of Google LLC. Credit line on every lesson. The CC BY 4.0 claim is not stated, because the license of cloud.google.com pages could not be verified.
- [x] 8. G LICENSES/ folder, docs/credits.md and a public credits.html page listing every outside source with its license. CSP default-src stays self. Later asset items add their own rows.
- [x] 9. G Commit package-lock.json and install with npm ci in the Pages workflow. The standard workflow from item 2 already runs the pinned check and gitleaks. Workflow permissions stay minimal.

## Domains, type and visual system

- [x] 10. G Official domain and objective titles from guide v4.2, IDs kept. Weights 22/25/20/15/18 rechecked against the guide on 2026-11-08 and recorded in content/verification.json.
- [ ] 11. G Type and spacing scale: body 16 px or more, labels 14 px or more, prose max 70ch, 4 and 8 px spacing. Replace every 8 to 12 px font rule in styles.css.
- [ ] 12. G Field-notebook visual system from DESIGN.md: paper tokens, one self-hosted OFL accent font (license in LICENSES/), domain colors, both themes at 4.5:1 contrast or more.
- [ ] 13. G Mermaid-to-SVG at build time (radar: trial) for whiteboard diagrams. The radar note goes as a separate pull request to SVN11X/standards.

## Focus, lessons and motion

- [ ] 14. G Focus mode on top of .focus-session: keyboard toggle, remembered state, progress bar. Test that old saved state still loads.
- [ ] 15. G Lesson block pilot on domain 1: 2 to 5 minutes, diagram first, highlighted key fact, one quick check.
- [ ] 16. G Motion set: data moving along pipeline SVGs, button feedback, key-fact highlight. Reduced-motion fallback, pause control over 5 s, decision record.
- [ ] 17. G Gentle rewards: streaks and domain marks as optional fields under data-engineer-fieldnotes.v1. Export and restore test with old state.
- [ ] 18. Y Official Google Cloud product icons in diagrams after confirming the terms on cloud.google.com/icons. Attribution on the credits page.
- [ ] 19. G Lucide UI icons copied as local SVG and CC0 illustrations (Open Peeps, Open Doodles), each listed in LICENSES/.
- [ ] 20. G Manim pilot: one 20 to 40 s WebM clip (batch vs streaming) rendered locally, 1 MB or less, poster, EN and ES VTT, pause control. Radar pull request to standards.
- [ ] 21. G Convert domain 2 to the lesson block format with diagrams.
- [ ] 22. G Convert domain 3 to the lesson block format with diagrams.
- [ ] 23. G Convert domain 4 to the lesson block format with diagrams.
- [ ] 24. G Convert domain 5 to the lesson block format with diagrams.
- [ ] 25. G Two more Manim clips (Pub/Sub to Dataflow to BigQuery, partition pruning) within the media budget of 10 MB new media in git.

## Entry paths, comparisons and questions

- [ ] 26. G First-visit question "Do you know the exam?": newcomer orientation, or a 10-question diagnostic from original questions to the weakest domain. Switchable, modeled as a state machine.
- [ ] 27. G Fast review path: a 1 to 2 hour plan across the five domains weighted by the guide, with a one-page summary per domain.
- [ ] 28. G Extend the services compare view: storage choice, Dataflow vs Dataproc vs Data Fusion, Pub/Sub vs Managed Kafka, Composer vs Workflows vs Scheduler.
- [ ] 29. G Original scenario questions until every objective has five, kept outside the timed pool. BLOCKED: allow them in timed sessions? AGENTS.md fixes that pool.

## Verification with the Google MCP

- [ ] 30. G Extend content/verification.json per topic with MCP query, source URL and date. The UI shows date and source. The build warns on gaps and on entries older than 90 days.
- [ ] 31. G Verify domain 1 topics with the MCP and the official certification page. Fix stale claims.
- [ ] 32. G Verify domain 2 topics with the MCP. Fix stale claims.
- [ ] 33. G Verify domain 3 topics with the MCP. Fix stale claims.
- [ ] 34. G Verify domain 4 topics with the MCP. Fix stale claims.
- [ ] 35. G Verify domain 5 topics with the MCP. Fix stale claims.
- [ ] 36. G Verify services and comparisons with the MCP. Then make missing verification records fail the build.

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
