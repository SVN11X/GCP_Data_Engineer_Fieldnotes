# 0002. Verification log

- Status: proposed
- Date: 2026-11-08
- Proposed by: Claude Code (improvement plan item 30)
- Accepted by: owner

## Context

Readers should be able to see when and where a topic was checked against official Google documentation. content/verification.json records claim-level reviews tied to source ids and is used by the sources page, so it is not shaped for one record per lesson, service or comparison with the exact search text and URL. Nothing in the UI or the build showed which topics had never been checked.

## Decision

- Add content/verification-log.json, a separate append-style list. Each entry has topic, kind (lesson, service, comparison or exam), checkedOn, method, query, sources, result (confirmed, updated or unverifiable) and a one-sentence note.
- Allowed methods are google-developer-knowledge-mcp (a Model Context Protocol server that searches official Google documentation) and official-page (a direct read of an official Google page, used when the page is not in the MCP corpus, such as the exam guide PDF).
- Sources must be https URLs on google.com, services.google.com, cloud.google.com, docs.cloud.google.com, developers.google.com or ai.google.dev. The latest entry per topic is the one shown. The same topic, method and date cannot repeat.
- The build and the validator check the schema and fail on invalid entries. The build only warns for lessons and services without an entry and for entries older than 90 days, measured against the build date (BUILD_DATE can override it in tests).
- The log is served as dist/data/verification-log.json and shown by a lazily loaded script on lesson pages. The page says "Not yet verified against Google documentation" when no entry exists. Service cards have no detail view, so they are skipped for now.
- Gaps only warn for now because only two topics have been checked. The gap check is one function (findGaps in scripts/verification-log.mjs) so a later item can make it fail the build.

## Alternatives considered

Extending verification.json was the simplest option. It was not enough because its consumers expect claims tied to source ids, and mixing the two shapes would risk breaking the sources page. Putting the log into data.js would spend the initial payload budget, so it loads on demand.

## Consequences

Readers see honest verification status per lesson. Most lessons will show "not yet verified" until they are checked and logged. The 90 day rule creates recurring warnings. To undo, delete the log, the lazy script and the loader line.
