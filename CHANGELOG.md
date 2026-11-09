# Changelog

## Unreleased

- Domain 5 lessons now read in Spanish (389 strings): cost, capacity, retries, diagnosis, SLOs and recovery, with the Spanish verification notes. Lesson titles in lists now show Spanish for all 52 lessons. The Spanish needs the owner's review.
- Domain 4 lessons now read in Spanish (267 strings): analytics and BI Engine, materialized views, features, ML evaluation, embeddings and vector search, RAG evaluation and BigQuery sharing. Spanish needs the owner's review.
- Domain 3 lessons now read in Spanish (388 strings): storage choice, lifecycle, databases, warehouse model, SQL grain, lakes, BigLake, Iceberg, file layout and governance, with the Spanish "What was checked" notes. The titles index now covers domains 1 to 3. English text, questions, images and saved progress are unchanged. The Spanish needs the owner's review.
- Domain 2 lessons now read in Spanish (475 strings). Lesson titles in lists such as Learn, Review and the home page now show Spanish right after a reload, from a small titles index that loads only for Spanish visitors. The "What was checked" note on a lesson page is also in Spanish for domains 1 and 2, with a fallback to English when the English note changes. English text, questions, images and saved progress are unchanged.
- Domain 1 lessons now read in Spanish when the language is Spanish: titles, explanations, scenarios, exercises, quick checks and diagram text (254 strings). The text lives in an overlay file per domain, loads only for Spanish visitors and only for the domain being opened, and falls back to English if the English changed. The build fails on a stale or unsafe entry. The Spanish text needs owner review (decision 0004).
- Spanish interface stage 2: the Learning path list and lesson pages, the practice bank and question pages, workshops, the English studio, service comparisons and Sources now show Spanish labels, buttons, filters, notices and toasts, and the page title follows. Lesson, question and service text stays English until its own stage, and FieldI18n.report() now lists that text as skipped by region instead of missing. The ES / EN button is 44 px high. The Spanish text needs owner review.
- Added a Spanish interface behind a new ES / EN switch in the top bar. The choice has its own saved key, the translator and its dictionary load only for Spanish visitors, product names stay in English and the English help toggle works as before. This stage covers the navigation, footer, home, orientation, diagnostic, review, comparison pages, progress and short sessions. Lessons and questions come later. The Spanish text needs owner review (decision 0004).
- Added four service comparisons at #review/compare: where to store data, Dataflow versus the Spark service versus Data Fusion, Pub/Sub versus Managed Kafka, and Airflow versus Workflows versus Scheduler. Each option cites Google documentation and has a verification log entry. The page, styles and data load on demand.
- Verified the 28 service cards against Google documentation through the Developer Knowledge MCP and logged each check. 25 were confirmed and 3 updated to the current Managed Service for Apache Spark and Airflow names. A lesson or service without a log entry now fails the build.
- Verified the nine remaining domain 5 lessons against Google documentation through the Developer Knowledge MCP and logged each check. Seven were confirmed and two updated: repeatability now names Managed Service for Apache Airflow (formerly Cloud Composer) and recovery says cross-region replication alone is not a regional outage plan.
- Verified the seven domain 4 lessons against Google documentation through the Developer Knowledge MCP and logged each check. All were confirmed, no lesson text changed.
- Verified the ten domain 3 lessons against Google documentation through the Developer Knowledge MCP and logged each check. Nine were confirmed and one updated: the LIMIT cost note now says it applies to non-clustered tables.
- Verified the sixteen domain 2 lessons against Google documentation through the Developer Knowledge MCP and logged each check. All were confirmed, no lesson text changed.
- Verified the nine domain 1 lessons against Google documentation through the Developer Knowledge MCP and logged each check. All were confirmed, no lesson text changed.
- Added a verification log (content/verification-log.json) with the date, method, query and official source of each check. Lesson pages show a lazy line with the date and source or say the lesson is not yet verified, and the build warns about topics without an entry and entries older than 90 days.
- Added a fast review path: #review splits a 1 or 2 hour plan across the five domains by exam weight with objective checklists and lesson links, and #review/1 to #review/5 give a one-page summary per domain from existing lesson key facts. The reviewer path and the diagnostic result link to it. New code loads on demand.
- Added the first-visit question "Do you know the exam?" with two switchable paths: a newcomer orientation (#orientation) and a 10-question diagnostic from original questions (#diagnostic) that names the weakest domain. The choice is stored under its own key, nothing enters saved progress, and the orientation text awaits owner review.
- Added lesson blocks to all ten domain 5 lessons, with correct quick-check answers spread over all three positions. Text is derived from the lessons and awaits owner review.
- Added lesson blocks to all seven domain 4 lessons, with correct quick-check answers spread over all three positions. Text is derived from the lessons and awaits owner review.
- Added lesson blocks to all ten domain 3 lessons, with correct quick-check answers spread over all three positions. Text is derived from the lessons and awaits owner review.
- Added lesson blocks to eight domain 2 lessons: pipeline contract, Pub/Sub contracts, processing engine, event time, bad records, streaming semantics, schema evolution and deployment. Text is derived from the lessons and awaits owner review.
- Added gentle rewards: a "Days studied in a row" chip and domain mark badges on My progress and Start here. The optional streak field loads from old saves and exports, a missed day restarts quietly, and nothing is animated.
- Added a calm motion set: dots that travel along lesson diagram edges for three short passes with a pause button, quick button feedback, and a one-time key-fact marker sweep. Reduced motion shows everything still. Purposes are in docs/decisions/0001-motion-purposes.md.
- Reorganized the repository: the client lives in src/, images in assets/, and dist/ is generated. The published site is byte-identical.
- Added a lesson block pilot on four domain 1 lessons: a small diagram, one highlighted key fact and a quick check with an immediate explanation. Nothing is scored or saved, and the text is derived from the lessons and awaits owner review.
- Added the field-notebook look: warm paper and ink tokens, a key-fact highlighter style, and domain text colors that keep 4.5:1 contrast in both themes. The handwritten font waits for approval.
- Added a focus mode: a topbar button or the F key hides navigation and search, Escape turns it off, the choice is remembered in the browser, and a thin bar shows progress.
- Added a type and spacing scale in styles.css: no font below 14 px, 16 px body text, prose capped at 70ch, and size and spacing tokens in :root.
- Added a notice in the footer that the site is independent and not affiliated with Google, and a credit line to the Google Cloud documentation on every lesson.
- Renamed the five domains and 19 objectives to the official titles of exam guide v4.2. IDs, colors and weights are unchanged, so saved progress is not affected.
- Added a Credits page with the licenses and terms of everything the site relies on, linked from the footer.

## 2.1.0 — 2026-11-08

- Preserved all 349 owner-supplied imported questions and all 25 original images, with source keys, review labels, explanations, IDs and import/review tools unchanged from the original repository.
- Kept all prior improvements: 52 lessons, 124 original scenarios, quick challenges, four-step sessions, service comparisons, architecture diagrams, vocabulary and local progress.
- Added visually checked selectable alternatives for ten text/code images and one structured table. Source files remain byte-for-byte available under “View original image” and at full size.
- Made extracted image text searchable and added copy controls. Preserved the original query syntax and table groups instead of silently correcting source questions.
- Restored imported-bank collection/review filters and direct question links. The full library contains 473 questions; timed sessions keep their established authored-question pool.
- Kept startup small using a compact imported ID catalog, demand-loaded bank metadata and separate imported domain chunks.
- Restored bookmarks and attempts from exports made with the earlier delivery; opening the bank catalog does not erase previously loaded choices.
- Added `AGENTS.md`, a preservation manifest with original hashes and six additional regression tests. No supplied question or image is to be removed without a new explicit user instruction.

## 2.0.0 — 2026-11-07

- Added a context-first home screen, three original two-minute SVG / HTML playgrounds and four-step short sessions for all 52 lessons. Each explains the problem, why it matters and the takeaway. The active short session resumes with its answer and revealed feedback, while full chapters remain separately tracked.
- Simplified primary navigation to four entries and an accessible disclosure for existing study tools. Focused sessions hide the surrounding navigation and use one main next action, with no countdown. Animations are brief and action-driven, with reduced-motion support.
- Expanded the original English curriculum from 40 to 52 lessons across all 19 standard exam objectives. Added Kafka, serverless Spark, Beam portability, processing guarantees, schema evolution, Iceberg, migration selection, lake layouts, database decisions, query economics, safe retries and streaming diagnosis.
- Added 24 original explained scenarios, retaining all 100 original scenarios. The authored collection contains 124 questions, alongside the 349 supplied imports. Foundation and Applied sessions, multiple-select scoring, weighted allocation, bookmarks and timed-session recovery remain available.
- Added 28 comparable service cards, five suggested comparison pairs and four original interactive solution architectures with accepted and rejected paths.
- Added a dedicated progress view and topic review flags; retained completed lessons, vocabulary, workshop progress, original attempts and running exam deadlines. Imported identifiers remain active and are preserved in progress exports.
- Expanded English vocabulary from 150 to 161 terms with Spanish definitions. Preserved flashcards, pronunciation, saved terms and term explanations. Avoided inserting interactive term buttons into checkbox labels.
- Replaced the eager 1,511,371-byte data script with a catalog around 217 KB and demand-loaded domain, question, workshop, architecture, audit and search content. Added release-keyed requests, request coalescing, retry handling and stale-search detection.
- Added saved system / light / dark preferences; responsive navigation and comparisons; keyboard-operable architecture controls; readable text alternatives in downloadable notes.
- Audited all 15,169 private research chunks: 13,315 unique exact texts, 1,854 repetitions, 1,113 source URLs and no automatically verified chunks. Published metadata and discovery links only.
- Added a 14-claim primary-source verification ledger. Preserved earlier review dates rather than claiming a full revalidation. Rechecked availability of all 115 reference URLs.
- Added behavior tests for search, lazy loading, retries, architecture branching and progress migration. Preserved scoring, stream, scan, quality, replay and recovery tests.
- Kept the dependency-free static architecture, hash routes, relative assets, CSP and GitHub Pages deployment workflow. No production server, database, tracking, API key or external runtime script was added.
