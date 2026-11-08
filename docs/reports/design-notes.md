# Context-first learning and attention — design notes

The intended visitor may arrive without context, with little time or with difficulty sustaining attention. This release makes purpose and the next action explicit. It does not make a clinical claim about attention disorders.

## Concrete changes

| Visitor need | Implemented behavior |
| --- | --- |
| “I do not know what this is.” | The first screen names the certification, explains the learning method and offers a plain-language orientation. |
| “I do not know where to start.” | One prominent challenge button; two smaller entries for a first-time learner or a five-minute session. |
| “Why should I learn this?” | All 52 chapters have an original situation, specific consequence and useful takeaway. |
| “A long page loses me.” | Optional four-step sessions reveal the problem, one rule, one decision and a recap. |
| “I need to see a consequence.” | Three original SVG / HTML playgrounds update the actual fixture output, graph, record status and explanation. |
| “I am interrupted.” | The active short session keeps its step, choice and revealed feedback after refresh. |
| “Too many tools compete for attention.” | Four primary navigation choices; existing tools remain inside an accessible disclosure that opens for the active tool. |
| “Time pressure is distracting.” | Short durations are estimates. The focused flow has no countdown or timed penalty. Timed exam practice remains optional. |
| “Movement distracts me.” | Action feedback uses brief transitions; there is no continuous animation or autoplay audio. Reduced-motion preferences disable the transitions. |
| “I want depth.” | Full chapters, practice, workshops, architecture diagrams and primary references remain available. |

Short-session completion and full-chapter completion are recorded separately. A short session does not silently mark a chapter complete. Focused question answers contribute to the existing practice history after the learner explicitly checks them.

## Three original playgrounds

1. **One order. Two messages.** Four synthetic messages contain three business purchases. Applying the stated stable-ID rule changes the reported amount from 70 to 60 illustrative units and marks the repeated record as excluded.
2. **Small result. Big scan.** A fixed 30-day, 300 GB toy dataset uses 10 GB/day and a 10% country share. Enabling both filters changes the logical-read model to the selected number of days in GB. The UI distinguishes this model from execution evidence and pricing.
3. **Green job. Bad data.** Four illustrative rows include two that violate the explicitly stated positive-amount rule. A validation boundary changes publication from four rows to two and holds the others for review. This is not a universal rule that negative financial values are always invalid.

All scenes are original native SVG / HTML / CSS. They work without WebGL, a CDN or added libraries. Numbers and outcomes come from the shared tested rules rather than decorative counters.

## Requested references and inspection scope

| User-supplied video | Title resolved through YouTube public metadata | Related app / inspection |
| --- | --- | --- |
| https://www.youtube.com/watch?v=7vMNteWMkCc | Learn ESP32 — One Circuit at a time | https://learn-esp32.vercel.app/ — primary page and real browser UI inspected, including the lesson rail, focused explanation, schematic and action panel. The browser could not render its WebGL scene. |
| https://www.youtube.com/watch?v=cu97LOxPna8 | Backcountry 101 — A Website for Learning Basic Survival Skills | https://backcountry-101.vercel.app/ — identified from the maker’s publicly indexed links; a complete live interaction was not verified. |
| https://www.youtube.com/watch?v=lyhLX-GUrjU | Learn Arduino — One Circuit at a time | https://learn-arduino-red.vercel.app/ — resolved from the original video’s description and primary-page content. |

The transferable pattern is a bounded lesson, a concrete object or problem, an action beside its explanation and visible feedback. The release applies that pattern to data engineering; it does not copy the reference apps’ code, illustrations, videos or course text. The three full videos were not watched end to end. Two direct YouTube watch-page requests returned HTTP 429, so that path was not retried.

## Remaining evaluation

The revised flow has behavior tests and real browser checks, including narrow viewports and saved-session recovery. It has not been evaluated in a user study with the intended audience. Feedback from those learners can guide further adjustments to terminology, pacing, spacing and challenge difficulty.
