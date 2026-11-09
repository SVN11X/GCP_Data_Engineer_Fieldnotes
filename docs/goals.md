# Goals

<!-- Written by the owner. AI tools may format or translate this file, never invent its content. Replace every TODO(owner) line. -->

## Vision

An independent, bilingual (English and Spanish) and visual study site that takes a newcomer to passing the Google Cloud Professional Data Engineer exam, and lets someone who already knows the exam review all five domains in 1 to 2 hours.

## Users

- A newcomer who does not know the exam yet and needs orientation and a guided route.
- A candidate who knows the exam and wants a fast review and a diagnostic of weak domains.
- Recruiters and peers who read the site as a portfolio piece.
- Spanish help is written for readers with an A2 level of English. The design accounts for attention deficit: visual first, short blocks, a focus mode.

## Objectives

- Two entry paths chosen by a first question, "Do you know the exam?": orientation for newcomers, a quick review and diagnostic for the others. The visitor can switch at any time.
- Content organized by the domains and names of the official exam guide.
- Every topic verified with the Google Developer Knowledge MCP, with its check date and source.
- Comparisons that help decide between services, and original scenario questions.
- Visible credit to the Google Cloud documentation and a notice that the site is not official.

## Non-goals

- Never remove, hide or delete the 349 owner-supplied imported questions in `content/imported.json` or the 25 source images without a new explicit instruction from the owner.
- Never change question IDs, source keys, review labels, image files or saved progress. Keep imported source keys distinct from technically reviewed answers.
- Do not leave the static GitHub Pages architecture or demand loading. Timed sessions keep the established pool of authored questions unless the owner changes it.

## Success criteria

- People, including the owner, pass the exam using the site.
- A full review of the five domains fits in 1 to 2 hours.
- The site works as a portfolio piece, and its final design is polished. An ugly result counts as a failure.
- Every topic shows a recent verification date and source.
- Verified before every handoff: imported IDs 1 to 349, all source image hashes, transcript references, the build, the behavior tests and `git am` delivery.

## Priorities

1. Adopt the repository standard.
2. Visuals and focus for attention deficit.
3. Entry paths and the official domains.
4. Verification with the Google MCP.
5. Complete bilingual content.

## Constraints

- Static site on GitHub Pages. No backend, no runtime CDN, and data loads on demand.
- Text-only question images may receive visually checked text alternatives. Every original image stays byte-for-byte and opens at full size. Unreadable diagram details are never invented.
- Imported questions get their Spanish translation in a separate layer. The originals stay untouched.
- Assets are free to use and carry a clear license. A new tool goes through tool-radar first.
- The owner reviews every pull request before it is merged. A merge to `main` publishes the site.
- Open question for the owner: which other things the site deliberately will not do, such as backend, tracking, real exam questions, or exact prices. See `docs/assumptions.md`.
