# Validation — release 2.1.0

Review date: 2026-11-08. Full-update base: `904616979cded694b99245cc2ea585a650fab861`. Correction base: `2294a70c8f5ad7923e70a7862c5010ef91672bf9`.

## Commands executed

| Check | Result |
| --- | --- |
| Original baseline build, tests and validation | Passed: 13 baseline behavior tests, reviewed during the initial update. |
| Current `npm run build` | Passed; generated content release `cf8a8b04b3c23d4e`. |
| Current `npm test` | 30 tests passed; 0 failures, skipped or todo. |
| Current `npm run validate` | Passed: content, primary-reference mappings, relative entry assets, chunks, JSON, script syntax, preservation hashes and startup budgets. |
| Supplied question bank | All 349 source records unchanged; source numbers 1–349, keys, explanations and review labels retained. |
| Supplied images | All 25 image SHA-256 values match the original bytes. Source JSON hashes normalize LF/CRLF for Windows Git compatibility. |
| Readable image alternatives | Ten text/code alternatives and one grouped table, visually checked against the source images. |
| Private study-pack audit (2026-11-07) | 15,169 parsed records; 1,854 exact repetitions; 45 direct source-document lesson mappings. |
| Public reference GET checks (2026-11-07) | 115 / 115 responded; this checks link availability only. |
| Targeted credential-pattern scan | No private-key blocks, GitHub token patterns or Google API-key patterns found in the checked project sources. This is a scoped pattern check. |

The verification runtime was Node.js `v24.22.1`. The supported project engine and existing GitHub Actions workflow remain Node.js 22+. No external package installation was needed. The npm proxy-environment notice belongs to the runner, not a project dependency.

## Behavior coverage

The retained tests check exact multiple-select scoring, weighted session allocation for every supported length and difficulty, unanswered items, event-time lateness, scan-model units, progress recovery, deterministic deduplication, replay safety, join grain, quality gates, recovery snapshots and workshop predictions.

The tests also verify all 52 context / purpose briefings, stable-ID totals, publication rules, scan bounds and short-session restoration without falsely completing a full lesson. Search tests cover ranked concepts, services and bilingual vocabulary, punctuation and empty queries. Loader tests cover object identity, no content requests for the overview, demand-loaded imported metadata, domain-request coalescing, subdirectory URLs, HTTP retries, stale search releases and authored answer loading for timed sessions.

Six image / preservation regressions check all source records and image hashes, escaped SQL placeholders, exact copy text, image-text search indexing, retained diagrams and tiny originals, three table groups with eleven component rows, catalog-after-detail hydration, and restoration of imported bookmarks and attempts from the prior delivery without duplication or false verification.

The validator checks 52 lessons, 473 questions (349 supplied + 124 original), 161 terms, 28 service cards, 12 workshops, 4 architecture graphs, all 19 guide objectives, 115 source mappings and 14 checked-claim records. It rejects lost or altered supplied material, duplicate IDs, unsupported references, invalid answers, unsafe question HTML, missing images, mismatched chunks and excessive startup payloads. It does not certify the source bank's answer keys.

## Actual browser checks

A real Chromium browser loaded the locally served `dist` output. The initial update was checked on 2026-11-07; the correction and readable alternatives were checked on 2026-11-08.

The initial review covered all 12 new detailed lessons and review labels; global concept and vocabulary search; suggested Pub/Sub / Kafka and BigLake comparisons; architecture selection, rejected paths, reset and keyboard control; topic review flags; original question rationales; and a retained deduplication workshop. A 10-question timed session resumed at question 2 after reload with its original running deadline; finishing returned 1 / 10 correct and 9 unanswered. System / light / dark modes, mobile navigation and the provenance view were inspected.

The correction review confirmed:

- The bank displays 473 questions and the imported collection filters to all 349 supplied questions.
- Direct routes for image questions render readable code and accessible option labels. Question #243 still has all four SQL choices after navigating to the bank and reopening it.
- Copy controls show their success status. Unit tests independently check exact copy content; browser clipboard bytes were not independently inspected.
- Original #243 and #248 images load in the full-size dialog at 597 × 107 and 763 × 432 pixels respectively.
- The #248 semantic table has three VM groups and eleven component rows. Global search for `vm02781`, a value previously visible only in the image, finds #248.
- The #63 scatter diagram remains an expandable original image.
- Embedded 360 px and 768 px CSS viewports load the text and table questions under `/GCP_Data_Engineer_Fieldnotes/`. Measured document client / scroll widths match (345 / 345 and 753 / 753 px after scrollbar space), with no page-wide horizontal overflow.

These checks do not claim a complete screen-reader audit, every browser combination, live execution of Google Cloud examples, a production deployment or a certification score prediction.

## Context-first flow checks

The home screen exposes four primary navigation entries, with existing tools retained in a disclosure. Its prominent entry opens an original quick challenge. Each lesson explains the context, why it matters and its takeaway.

- The duplicate fixture changes from 70 to 60 illustrative units after enabling the stable business-ID rule.
- The scan fixture changes from 300 to 7 GB; keyboard Home / End changes the enabled model to 1 / 30 GB while preserving the fixed baseline.
- The quality fixture applies its explicit positive-amount rule, changing four published rows to two. Reset restores four rows.
- A completed four-step short session retains its step, selected answer and revealed feedback after reload; its recap is saved separately from full-chapter completion.
- The novice context and interactive model fit phone and tablet views. Brief transitions respond to actions; CSS respects reduced-motion preferences. Short sessions have no countdown, autoplay audio or continuous animation.

The flow has not been evaluated in a user study with the intended audience; no clinical effectiveness claim is made.

## Payload measurements

| Asset / group | Uncompressed bytes |
| --- | ---: |
| Original eager `dist/assets/data.js` | 1,511,371 |
| Current `dist/assets/data.js`, including wrapper and compact IDs | 227,232 |
| Initial HTML, scripts, stylesheet and icon | 427,377 |
| Search index, requested on search | 826,938 |
| Complete study JSON, explicit download | 1,681,242 |

The catalog script is approximately 85% smaller than the original eager script while retaining all supplied question identities. These are byte measurements, not latency, Lighthouse, TTI or compressed-transfer benchmarks. Startup does not request full lesson bodies, question answers, workshop fixtures, architectures, the audit or the search index. The bank list requests its searchable metadata; opening a supplied question requests the relevant imported domain. Timed sessions load the 124 authored scenarios and preserve existing deadlines.

## Patch verification

Both alternatives are exported from real commits with `git format-patch --full-index --binary`. The full V2 patch has a single commit directly on the original base, so it never deletes and re-adds the supplied bank. The correction starts from the previously delivered update. Each is applied with `git am` in an isolated clean copy of its respective base and its resulting Git tree is compared with the delivery tree. The ZIP contains every tracked file from that tree. The delivery receipt records exact commit and artifact hashes; the applied full copy is also built, tested and validated before handoff.
