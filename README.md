# Google Cloud Data Engineer Fieldnotes

An independent, English-first static study workspace for the Professional Data Engineer standard exam. Learn the decisions, explain the tradeoffs and verify the source. Spanish vocabulary support is available without replacing the English study experience.

## Study workspace

Start with one of three original two-minute playgrounds, or choose a five-minute guided session. Every chapter explains its situation, why it matters and the idea to keep. Short sessions reveal one step at a time and resume after interruption.

- 52 lessons mapped to all 19 standard-guide objectives; review dates and scope are visible.
- All 349 owner-supplied imported questions, original keys, review labels and 25 unchanged images, plus 124 original explained scenarios. Collection and review filters remain available.
- Selectable text for ten code/text images and an accessible table alternative; every original image stays available at full size.
- Foundation / Applied levels, multiple-select answers and weighted timed sessions from the established original-question pool.
- 28 service cards and side-by-side architectural comparisons.
- Four original interactive solution patterns with accepted / rejected paths and keyboard-accessible node explanations.
- 12 synthetic workshops and the existing event-time, scan and architecture labs.
- 161 English terms with Spanish definitions, saved vocabulary, flashcards and browser pronunciation.
- Local progress, review flags, bookmarks, export / restore and resumed timed deadlines. Short sessions and full chapters are tracked separately.
- Responsive layouts, system / light / dark themes and downloadable text alternatives.
- A searchable local index requested only when search is opened.

## Build and validate

Node.js 22+; no package installation or service credentials are needed.

```sh
npm run build
npm test
npm run validate
```

`content/` is the editable knowledge source. `scripts/build.mjs` generates the public catalog, content chunks, local index, downloadable notes and inventory. `src/` holds the dependency-free client: the pages (`index.html`, `credits.html`), `scripts/` and `styles/`. `assets/` holds the images, including the 25 unchanged source images. `npm run build` copies them into `dist/`, which is generated, never committed, and is the GitHub Pages output. The Actions workflow builds, tests and validates it before publication. `npm test` builds first.

For local review, serve `dist/` over HTTP (for example `python -m http.server 8000 --directory dist`). Demand-loaded JSON does not work by double-clicking a `file://` entry. All assets and requests use relative paths and the application keeps hash routes, including under `/GCP_Data_Engineer_Fieldnotes/`.

## Knowledge and publication

The private Path 16 study pack was used as research input. Its audit reports 15,169 chunks, including 1,854 exact repetitions, and explicitly incomplete interactive and resource coverage. Metadata links help discovery; they do not verify claims. The website publishes original educational material, primary references, an explicit claim ledger and pending issues. It does not publish course copies, complete video transcripts, videos or unrecovered Path 16 provider quizzes. The separate supplied question bank is preserved. See [docs/knowledge-review.md](docs/knowledge-review.md).

The 349 imported questions and 25 source images are preserved byte-for-byte from the original repository. The user explicitly confirmed that the owner supplied this collection and instructed that it must never be removed. `AGENTS.md` records that requirement; the preservation manifest and tests detect accidental loss or alteration. Text alternatives are separate presentation overlays, not replacements for source files. Saved imported bookmarks and attempts remain active, including recovery from exports made with the earlier delivered patch.

The private Path 16 provider quiz resources are a separate research input. Their partial coverage does not remove or relabel the supplied question bank. Source keys retain their review status; transcription improves readability without automatically certifying a source answer.

No backend, remote search API, tracking, runtime CDN, paid dependency, browser profile or user progress file is included. Progress remains in the browser under the original storage key. The complete original-content study pack is an explicit download rather than an automatic startup request.

The context-first flow and visual-reference inspection scope are documented in [docs/reports/design-notes.md](docs/reports/design-notes.md).

See [docs/installation.md](docs/installation.md), [CHANGELOG.md](CHANGELOG.md), [docs/validation.md](docs/validation.md), [docs/reports/content-inventory.md](docs/reports/content-inventory.md) and [docs/reports/update-report.md](docs/reports/update-report.md).

## License

The source code is released under the [MIT License](LICENSE). The license does not cover the 349 owner-supplied imported questions in `content/imported.json` or the 25 source images, which were supplied by the owner and are not relicensed here. Google Cloud product names and documentation belong to Google LLC. The original written content of the site (the lessons, authored questions, comparisons, workshops, glossary and the Spanish text of that content) is released under [CC BY 4.0](LICENSES/CC-BY-4.0.txt). The license does not cover Google Cloud documentation, names or trademarks, the imported questions or their Spanish translation, or the third-party assets listed in [docs/credits.md](docs/credits.md).
