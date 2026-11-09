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
- Left alone on purpose: lesson and question bodies, code (`pre`, `code`, `.code`), SVG text, anything marked `data-no-translate` or `data-english`, and links to lessons and questions. Only the routes whose shell is translated (home, orientation, diagnostic, review, review/compare, progress, focus) get their main area translated. Other routes keep English in the main area until their stage.
- Product and service names stay in English: BigQuery, Dataflow, Pub/Sub, Managed Service for Apache Spark and the rest of the `protected` list in the dictionary. A test fails if a translated value alters or loses one.
- Gloss style rule. A term the learner must know in English for the exam keeps its English form with the Spanish gloss in parentheses once on a page, or the Spanish word is used with the English term in parentheses once. Examples: "Pipeline (canalización)", "Los cinco dominios del examen (domains)". Spanish text uses plain words, tuteo, short sentences, no semicolons and no long dashes.
- The "English help" toggle, its saved state and the A2 vocabulary help keep working in both languages. In Spanish its label reads "Apoyo en inglés".
- `FieldI18n.report()` lists the visible text and attributes on the current page that still have no translation. It has no interface. Call it from the browser console while crawling routes.

Plan for the later stages, each a separate lazily loaded Spanish file loaded only for Spanish visitors:

1. Lessons: one file per domain next to `data/lessons/domain-N.json`, keyed by lesson id.
2. Authored questions: one file per domain, keyed by question id.
3. Services and comparisons: one file keyed by service and comparison id.
4. Imported questions: their Spanish exists only in a separate layer next to the untouched original. `content/imported.json`, the question ids, source keys, review labels and the 25 images are never edited. The Spanish text is a reading aid and is labelled as a translation.

## Alternatives considered

- Rewrite every template to call a `t('key')` function. It is the cleanest long term, but it touches nearly every initial file, adds bytes for English visitors and risks regressions in code that works. The translator layer can be replaced by this later without changing the dictionary content.
- Duplicate the site as a separate Spanish build. It doubles maintenance and the content drifts.
- Machine translation in the browser. It would translate product names and exam terms unpredictably, and it needs a remote service, which the site does not use.

## Consequences

English visitors pay only for the language button and a few lines of code. Spanish visitors pay one script and one dictionary of about 25 kB.

Known limit: a dynamic string whose pieces change needs a pattern, and a string built from several text nodes (a sentence split by a link) is translated piece by piece, so the pieces must read well together. A new English string in the interface has no Spanish until it is added to `content/i18n-es.json`, and `FieldI18n.report()` shows what is missing. The Spanish strings need the owner's review. While lessons are not translated, a page in Spanish may mix Spanish chrome with English lesson text, and the page language is `es` for the whole page.

To undo it, remove the button, the few lines in `app.js` and `core.js`, `i18n.js`, the dictionary and the build step. Saved progress is not affected because the language has its own key.
