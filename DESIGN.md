# Design direction

<!-- Written by the owner. AI tools may ask questions and format the answers, never invent them. Replace every TODO(owner) line. -->

## Identity

Fieldnotes: an engineer's field notebook for Google Cloud data engineering. It is independent and must never look like an official Google site. The impression to leave: "I understand this, and I know what to study next."

## Audience

Newcomers and experienced candidates preparing for the Professional Data Engineer exam, plus recruiters reading it as a portfolio. Phones and laptops. Many readers have an A2 level of English and some have attention deficit, so each screen carries one idea.

## Expression

Expressive. The motion option in `.standard.yml` is `rich`.

## Personality

- It should feel: calm, hand-made, focused.
- It must not feel: official, crowded, childish.

## Palette

- A light paper background and a dark ink background for the dark theme. Both keep text at 4.5:1 contrast or more.
- One color per exam domain, kept from `content/domains.json`: `#4263eb`, `#c47b14`, `#1b8778`, `#8c55b0`, `#bb5b52`. The color tells the reader where they are.
- One accent for highlighted key facts. The exact value is chosen in item 12 of `docs/improvement-plan.md` and checked for contrast.

## Typography

A readable sans-serif for body text, plus one handwritten face for notes and labels. Both are self-hosted with an open font license (OFL). Two families at most. The handwritten face is Caveat, used for the key fact of a lesson block (decision 0005).

## Motion

Everything that moves teaches or gives feedback: data travelling along pipeline diagrams, buttons that respond, a highlight on the key fact, gentle streaks and domain marks. No sound. `prefers-reduced-motion` turns movement off. Anything that moves for more than 5 seconds has a pause control. Each animation has its purpose written in `docs/decisions/`.

## References

Proposed by the assistant, to be confirmed by the owner:

- excalidraw.com: a whiteboard look for diagrams.
- Josh Comeau's interactive articles: motion that explains an idea.
- web.dev Learn courses: short modules with one goal each.

## Dials

TODO(owner): If you use antislop, set ENERGY, RHYTHM and MOTION here.
