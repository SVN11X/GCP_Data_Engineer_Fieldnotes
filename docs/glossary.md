# Glossary

The shared language of this project. Use these terms exactly, in code and in conversation. The second column holds the word the owner uses, so a request in another language maps to the right term.

| Term | Owner's word | Means here | Does not mean |
|------|--------------|------------|---------------|
| imported question | pregunta importada | One of the 349 owner-supplied questions in `content/imported.json`, kept with its ID, source key, review label and images. | An original question. Never edited or removed without a new explicit owner instruction. |
| original question | pregunta original | A question written for this site (124 today) with an explained scenario. Also called authored. | An imported question or a real exam question. |
| source key | clave de la fuente | The answer key that came with an imported question. | A technically reviewed answer. |
| reviewed answer | respuesta revisada | The answer after a technical review, shown next to the source key. | The source key. |
| review label | etiqueta de revisión | The `status` of an imported question: unreviewed, reviewed, corrected, disputed, conditional, incomplete or legacy. | A score. |
| domain | dominio | One of the five sections of the official exam guide. | A web domain. |
| objective | objetivo | One numbered topic inside a domain, for example 3.1. There are 19. | A project objective in `docs/goals.md`. |
| lesson | lección | A chapter that explains the situation, why it matters and the idea to keep. | A video or a course module. |
| short session | sesión corta | A five-minute guided path that reveals one step at a time. | A timed session. |
| timed session | sesión cronometrada | A weighted practice run with a deadline, built from the established original-question pool. | A short session. |
| text alternative | alternativa de texto | Visually checked selectable text for a question image that only contains text. | A replacement for the image. The original image stays byte for byte. |
| preservation manifest | manifiesto de conservación | `content/imported-preservation.json`, the record of hashes that detects loss or change of imported content. | A backup. |
| verification record | registro de verificación | A claim, its source URL and its check date in `content/verification.json`. | Proof that a claim is complete. |
| entry path | camino de entrada | One of two ways in: orientation for a newcomer or a quick review for someone who knows the exam. | A lesson order. |
| demand loading | carga bajo demanda | Large JSON loads only when a page needs it, so the first screen stays light. | Lazy images only. |
| focus mode | modo foco | A view that hides navigation and search and shows only the current task. | Full screen. |
