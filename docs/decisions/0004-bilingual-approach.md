# 0004. Bilingual approach: a translator layer over exact strings

- Status: proposed
- Date: 2026-11-08
- Proposed by: the AI tool, from improvement plan item 37
- Accepted by: owner

## Context

The site is English-first because the exam is taken in English. A reader with A2 English already has the "English help" toggle, which shows Spanish definitions of vocabulary. Its state is the `english` field of the progress object under `data-engineer-fieldnotes.v1`. The owner also wants the whole site available in Spanish, in stages: first the interface shell, later lessons, questions and services.

The interface text is written inside JavaScript templates in the initial files. Moving every string into a lookup function would touch most of those files, grow the first load and risk saved progress, rewards and the entry paths that work today.

## Decision

Add a translator layer that replaces exact English strings with Spanish ones after the page is drawn.

- Language state lives under its own key, `data-engineer-fieldnotes.lang.v1`, with the value `en` or `es`. Anything else, or a failed read, means `en`. The progress key and its shape are not touched. The topbar button "ES / EN" toggles it, sets `document.documentElement.lang` and reapplies the translation without a reload.
- `src/scripts/i18n.js` and `data/i18n-es.json` load only when the language is Spanish. English visitors download neither. The dictionary source is `content/i18n-es.json`. The build validates it (no empty value, every `{placeholder}` kept, protected terms kept, no duplicate key) and copies it to `dist/data/`.
- The translator replaces whole text nodes and the attributes `aria-label`, `title`, `placeholder` and `alt`. Simple dynamic strings use patterns such as `Question {n} of {total}`. A MutationObserver translates every later change. The original text is kept per node, so switching back restores English.
- Left alone on purpose: lesson and question bodies, code (`pre`, `code`, `.code`), SVG text, anything marked `data-no-translate` or `data-english`, and links to lessons and questions. Only the routes whose chrome is translated (home, orientation, diagnostic, review, review/compare, progress, focus, learn, practice, workshops, english, compare, sources) get their main area translated. On those routes the lesson, question, service, workshop and glossary text stays English on purpose until its own stage, and a few interface pieces inside that text (the quick check label, the image buttons, the term buttons) are translated through an allow list. Other routes (lab, architectures, resources, exam, missions, search) keep English in the main area until their stage. The page title is translated the same way: the heading part when it has an entry, the site name always stays.
- Product and service names stay in English: BigQuery, Dataflow, Pub/Sub, Managed Service for Apache Spark and the rest of the `protected` list in the dictionary. A test fails if a translated value alters or loses one.
- Gloss style rule. A term the learner must know in English for the exam keeps its English form with the Spanish gloss in parentheses once on a page, or the Spanish word is used with the English term in parentheses once. Examples: "Pipeline (canalización)", "Los cinco dominios del examen (domains)". Spanish text uses plain words, tuteo, short sentences, no semicolons and no long dashes.
- The "English help" toggle, its saved state and the A2 vocabulary help keep working in both languages. In Spanish its label reads "Apoyo en inglés".
- `FieldI18n.report()` lists the visible text and attributes on the current page that still have no translation (`missing`). Text left in English on purpose is counted by region in `skipped`, with `skippedCount`, and `partial` is true when a covered route still has such text. It has no interface. Call it from the browser console while crawling routes.

Plan for the later stages, each a separate lazily loaded Spanish file loaded only for Spanish visitors:

1. Lessons: one file per domain next to `data/lessons/domain-N.json`, keyed by lesson id.
2. Authored questions: one file per domain, keyed by question id.
3. Services and comparisons: one file keyed by service and comparison id.
4. Imported questions: their Spanish exists only in a separate layer next to the untouched original. `content/imported.json`, the question ids, source keys, review labels and the 25 images are never edited. The Spanish text is a reading aid and is labelled as a translation.

## Lesson overlay format (item 38)

Spanish lesson text is an overlay per domain, not a copy of the lessons. The source is `content/es/lessons-d<N>.json` and the build validates it and writes `data/es/lessons/domain-<N>.json`. The loader asks for it only when the language is Spanish and only for the domain of the lesson being opened (same on-demand pattern as `data/lessons/domain-N.json`). `manifest.esDomains` lists the domains that have an overlay, so no request is made for the others. The overlay changes the release key, so a cached file never mixes with another release.

```json
{ "least-privilege": { "title": { "es": "Da a cada identidad ...", "src": "3f2a9c01b7de" } } }
```

- Keys are the lesson id and a stable path such as `sections.2.body`, `exercise.checkpoints.0` or `block.check.choices.1.why`. `src/scripts/lesson-es.js` lists the translatable paths: titles, lead, section titles and bodies, trap, exercise, briefing, review scope, decision card and the lesson block (diagram title, description and node lines, key fact, quick check question, choice texts and reasons). Code, ids, urls, references and keywords are not translatable.
- `src` is the first 12 hex characters of the sha256 of the English string that was translated.
- Stale hash rule. If the English text changes, the old hash no longer matches. The build then FAILS for any lesson that has an entry, and in the browser the entry is ignored, the English string is shown and a console warning lists the path. A stale translation never shows silently. A path without an entry also shows English and counts as missing.
- The build also fails for an unknown lesson or path, an empty Spanish string, a protected product name that is in the English but not in the Spanish, different numbers, a different count of quick check choices or a moved correct choice. Only strings are translated, so the correct choice keeps its index.
- `node scripts/i18n-skeleton.mjs <domain>` lists every path with its English text, hash and state (ok, missing, stale). With `--merge file.json` it adds plain translations and stamps fresh hashes. Items 39 to 42 reuse it for domains 2 to 5.
- On a lesson or short session page the Spanish is applied to the lesson object before it renders, so structure, quick check and diagram all show it. Switching language on such a page renders it again. The English text is kept and restored when the language goes back to English. List text is separate. The build also writes `data/es/titles.json` (lesson id to Spanish title and lead, same hash rule, all translated domains). The loader asks for it only for Spanish visitors and applies it after any route loads, so lists show Spanish titles without opening a lesson and without downloading whole overlays. A missing or stale entry shows English for that lesson. The verification note of a lesson is one more path, `verification.note`, hashed against the latest English note in `content/verification-log.json`, and the lazy verification line shows it when the hash matches.
- Services, comparisons, workshops and architecture patterns (item 43) use the same overlay rules in `content/es/services.json`, `comparisons.json`, `workshops.json` and `architectures.json`, ids being the service, comparison, workshop or pattern id. `src/scripts/content-es.js` lists their paths (service fit, signal, caution, strength and limitations, comparison title, question, quick rule, option texts and verification note, workshop title, goal, steps, prediction prompt and unit, explanation, pattern title, goal, outcomes, scope, node label, caption and detail, edge labels). Names, option names, source URLs, fixtures, code and answers stay as they are, and workshop `mode` and `cloudNote` stay in the interface dictionary. The build writes `data/es/<kind>.json`, `manifest.esContent` lists them and the loader requests one only in Spanish and only on its route (`#compare`, `#workshops`, `#architectures`, `#review/compare-*`). A list inside an item (options, steps, nodes, edges, limitations) is translated for every entry or none. `node scripts/i18n-skeleton.mjs <kind>` lists and merges them like the lesson domains.
- English exam terms keep their English form once with the Spanish meaning in parentheses. Product and service names never change. The Spanish needs the owner's review.

## Alternatives considered

- Rewrite every template to call a `t('key')` function. It is the cleanest long term, but it touches nearly every initial file, adds bytes for English visitors and risks regressions in code that works. The translator layer can be replaced by this later without changing the dictionary content.
- Duplicate the site as a separate Spanish build. It doubles maintenance and the content drifts.
- Machine translation in the browser. It would translate product names and exam terms unpredictably, and it needs a remote service, which the site does not use.

## Consequences

English visitors pay only for the language button and a few lines of code. Spanish visitors pay one script and one dictionary of about 25 kB.

Known limit: a dynamic string whose pieces change needs a pattern, and a string built from several text nodes (a sentence split by a link) is translated piece by piece, so the pieces must read well together. A new English string in the interface has no Spanish until it is added to `content/i18n-es.json`, and `FieldI18n.report()` shows what is missing. The Spanish strings need the owner's review. While lessons are not translated, a page in Spanish may mix Spanish chrome with English lesson text, and the page language is `es` for the whole page.

To undo it, remove the button, the few lines in `app.js` and `core.js`, `i18n.js`, the dictionary and the build step. Saved progress is not affected because the language has its own key.
