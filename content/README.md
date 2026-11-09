# content

Editable knowledge source of the study site: lessons, questions, glossary, the Spanish interface dictionary (`i18n-es.json`), services, sources and verification records. `scripts/build.mjs` reads these JSON files and writes the public catalog into `dist/`.

The 349 owner-supplied imported questions live in `imported.json`. Never remove or edit them without a new explicit owner instruction (see `AGENTS.md`).

- `captions/`: WebVTT captions for the clips in `assets/video/`. The build copies them to `dist/assets/video/`.
