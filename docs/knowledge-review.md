# Knowledge review — 2026-11-07

## Evidence categories

| Label | Meaning |
| --- | --- |
| Extracted metadata | A measured property of the supplied private archive. Not service verification. |
| Official claims checked | Specific published claims were compared with primary documentation for this update. Original examples remain illustrative. |
| Prior editorial review | Existing original content and its review date were retained. Only claims in the current ledger were rechecked. |
| Pending | Incomplete resource coverage, ASR accuracy or questions requiring further investigation. |

The source for the audit is the attached `study_pack_path_16(1).zip`, identified by SHA-256 in `content/knowledge-audit.json`. The extractor repository was inspected at `eec2f7d1b137406b935220c56b7d72415fb7ba21`; its example output is not treated as the coverage report for this archive.

## Measured and declared coverage

- Measured: 15,169 records; 13,315 distinct exact text chunks; 1,854 repetitions; 1,113 source URLs. All records have `ai_verified: false`.
- Record kinds: 14,132 page chunks, 260 video transcript chunks, 59 recovered document chunks, 304 HTML-bundle chunks and 414 Rise-state observations. Chunk totals do not equal lesson totals.
- Declared by the archive index: 982 pages with text and 131 videos with transcripts; ASR accuracy is not automatically validated.
- Declared resource status: 19 recovered and 24 partial documents, 35 partial HTML bundles, 41 partial quizzes.
- The Rise audit reports evidence for 59 tried lessons, 694 control activations and 408 new text states. It explicitly says coverage is incomplete. No visible quiz questions are reported by that deep audit.
- Exact-URL document overlap connects 45 of 52 lessons with up to three archive source records each. The seven without direct overlap are not represented as directly extracted. Mapping IDs are discovery metadata; no excerpt is published and a match does not prove claim accuracy.

## Important distinctions

The standard guide still uses Dataproc, Cloud Composer and Dataplex terminology. Live documentation also uses managed Spark, managed Airflow and Knowledge Catalog terminology. The UI retains useful aliases.

External BigLake tables and Apache Iceberg managed tables have different mutation contracts. Pub/Sub delivery, Dataflow processing, business event identity and external side effects are separate guarantees. BigQuery result limits and query scan guardrails answer different questions. These distinctions have dedicated lessons and entries in `content/verification.json`.

All 115 reference URLs responded to public GET checks on the review date. Availability is recorded in `content/source-audit.json`; it is not a claim-level certificate. The 14-claim ledger states exactly which claims were checked. No exhaustive semantic contradiction detection, near-duplicate clustering or full ASR correction was performed.

## Supplied bank and image preservation

The user explicitly confirmed on 2026-11-08 that the owner supplied the 349 imported questions and instructed that neither the questions nor their images be removed. All 349 records and 25 source images are preserved byte-for-byte from base commit `904616979cded694b99245cc2ea585a650fab861`, alongside the original learning notes, cases and diagrams. `AGENTS.md` records this project requirement.

The source archive remains intact. Existing source-answer keys, editorial corrections, disputed statuses and image limitations are not silently changed. The permission basis and original hashes are recorded in `content/imported-preservation.json`. A user-provided collection is separate from the 41 partially observed Path 16 provider quiz resources.

Ten text/code images have visually checked selectable alternatives. One text table is represented with semantic headers and row groups. The overlays in `content/image-text.json` retain the source wording, identifiers, operators and apparent source syntax; the original images remain available at full size. Three diagrams, one visual bar and ten existing 9×6 placeholders stay visual. Unreadable details are not invented.

Raw course copies, provider PDFs, complete transcripts and videos remain outside the public research integration. That boundary does not exclude the separate owner-supplied question bank.

## Remaining work

1. Review ASR accuracy against the original videos if quotations or fine-grained transcript claims are later needed.
2. Complete interactive-state and partial-resource research only within the user's permitted access. No missing provider quizzes are reconstructed here.
3. Recheck service feature limits, locations, pricing and runtime compatibility before a real deployment; the lessons deliberately avoid fixed performance or cost promises.
4. Extend the original Applied pool with further difficult multi-select cases and cloud lab outcomes. This finite practice set is educational, not an official or predictive exam.
5. Revisit prior editorial lessons individually over time; their old review dates remain visible.
