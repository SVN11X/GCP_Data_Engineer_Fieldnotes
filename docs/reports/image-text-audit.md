# Supplied question images — preservation and readable alternatives

Review: 2026-11-08. Source: the 25 images already committed with the 349 owner-supplied questions at `904616979cded694b99245cc2ea585a650fab861`. The user explicitly requires that both the bank and its images remain available.

The source question JSON is unchanged. Every original image retains its exact SHA-256. Readable alternatives live separately in `content/image-text.json`; `content/imported-preservation.json` contains the full hashes. The client loads these alternatives with the relevant question domain and retains access to the original file.

Ten text/code images were transcribed using local OCR where useful and visually compared with their originals. The four choices for #243 already included single-line source transcriptions; these were checked and formatted for reading. The #248 table was transcribed manually, preserving three groups and eleven visible component rows. No OCR engine or external OCR service runs in the website.

Text is selectable, copyable and indexed for search. Source identifiers, punctuation, apparent syntax errors and source keys are not silently corrected. This is a presentation review, not a new verification of the answer keys.

| Source image | Question | Size | Presentation |
| --- | --- | --- | --- |
| [0c8e1f5f248c8b5a1208.png](../../assets/images/0c8e1f5f248c8b5a1208.png) | #9 | 709 × 208 | Selectable text/code + original |
| [486c134d63ae0bade25b.png](../../assets/images/486c134d63ae0bade25b.png) | #11 | 9 × 6 | Original 9×6 placeholder; details unrecoverable |
| [e145a46844ed5dd43421.png](../../assets/images/e145a46844ed5dd43421.png) | #28 | 584 × 119 | Selectable text/code + original |
| [1a5925d364a48b03eddf.png](../../assets/images/1a5925d364a48b03eddf.png) | #34 | 9 × 6 | Original 9×6 placeholder; details unrecoverable |
| [0be795ba26c85bfaa856.png](../../assets/images/0be795ba26c85bfaa856.png) | #36 | 9 × 6 | Original 9×6 placeholder; details unrecoverable |
| [8df97e881639e0c5037e.png](../../assets/images/8df97e881639e0c5037e.png) | #36 | 9 × 6 | Original 9×6 placeholder; details unrecoverable |
| [1358bd5d2fa14f473fc4.png](../../assets/images/1358bd5d2fa14f473fc4.png) | #39 | 9 × 6 | Original 9×6 placeholder; details unrecoverable |
| [7eb39139d4e4856c5490.png](../../assets/images/7eb39139d4e4856c5490.png) | #40 | 9 × 6 | Original 9×6 placeholder; details unrecoverable |
| [dc345977d1d2c299d601.png](../../assets/images/dc345977d1d2c299d601.png) | #41 | 9 × 6 | Original 9×6 placeholder; details unrecoverable |
| [ce9a8c492e24c900585a.png](../../assets/images/ce9a8c492e24c900585a.png) | #44 | 371 × 255 | Selectable text/code + original |
| [ee0c886b58da167b2839.png](../../assets/images/ee0c886b58da167b2839.png) | #44 | 323 × 168 | Selectable text/code + original |
| [c49feb8746ff4ab526bb.jpg](../../assets/images/c49feb8746ff4ab526bb.jpg) | #53 | 294 × 28 | Original visual, expandable |
| [a7c13dca0a5fbb46c6ee.jpg](../../assets/images/a7c13dca0a5fbb46c6ee.jpg) | #63 | 450 × 345 | Original visual, expandable |
| [864a35b16e7e3df3c536.png](../../assets/images/864a35b16e7e3df3c536.png) | #81 | 9 × 6 | Original 9×6 placeholder; details unrecoverable |
| [eee8339cc86c53235551.png](../../assets/images/eee8339cc86c53235551.png) | #81 | 9 × 6 | Original 9×6 placeholder; details unrecoverable |
| [4e85222d4c68108414c8.png](../../assets/images/4e85222d4c68108414c8.png) | #155 | 9 × 6 | Original 9×6 placeholder; details unrecoverable |
| [6b92c412069e0bf0a37a.jpg](../../assets/images/6b92c412069e0bf0a37a.jpg) | #187 | 918 × 801 | Original visual, expandable |
| [ab3f73505d90839610a8.png](../../assets/images/ab3f73505d90839610a8.png) | #207 | 845 × 299 | Selectable text/code + original |
| [7084f71a164395328589.png](../../assets/images/7084f71a164395328589.png) | #208 | 736 × 331 | Original visual, expandable |
| [a947b8821c3294d68bf8.png](../../assets/images/a947b8821c3294d68bf8.png) | #213 | 780 × 66 | Selectable text/code + original |
| [7b852b6f96e70e0b3ea2.png](../../assets/images/7b852b6f96e70e0b3ea2.png) | #243 | 597 × 102 | Selectable text/code + original |
| [7e5b2a7681e6b722fbeb.png](../../assets/images/7e5b2a7681e6b722fbeb.png) | #243 | 597 × 139 | Selectable text/code + original |
| [c419afa5b850f34044da.png](../../assets/images/c419afa5b850f34044da.png) | #243 | 597 × 107 | Selectable text/code + original |
| [d86000254687563f3bde.png](../../assets/images/d86000254687563f3bde.png) | #243 | 597 × 139 | Selectable text/code + original |
| [e2f4b76a2f2a21b880f3.png](../../assets/images/e2f4b76a2f2a21b880f3.png) | #248 | 763 × 432 | Semantic table + original |

The ten 9×6 placeholders affect eight questions (#11, #34, #36, #39, #40, #41, #81 and #155). Their original files are preserved. The images do not contain enough information to reconstruct the missing details; no replacement content is invented.

Validation checks all 349 source records, all 25 image hashes, the 10 text alternatives, the table groups, escaping of SQL placeholders, copy content, search indexing and lazy catalog/detail navigation.
