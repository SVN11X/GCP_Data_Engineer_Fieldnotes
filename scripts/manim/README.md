# Manim clips

Source scenes for the short silent clips on lesson pages. The rendered files live in `assets/video/`.

- Goes here: Manim scenes (`*.py`). Does not go here: rendered media, fonts or Manim itself.
- Naming: snake_case scene file, kebab-case clip name in `assets/video/`.

## Render

Run in a Python virtual environment outside this repository with `manim` installed. Set `INTER_TTF` to a local copy of Inter (SIL OFL 1.1) so the labels use the site's body font. Then:

```
manim -ql --format=webm -o batch_vs_streaming scripts/manim/batch_vs_streaming.py BatchVsStreaming
```

Copy the `.webm` to `assets/video/batch-vs-streaming.webm` and a frame at 23 s as the WebP poster. The captions in `assets/video/*.vtt` follow the scene timing: title 0 s, nodes 3 s, batch 5.5 s, streaming 14.2 s, summary 24.9 s, end 29.9 s. Keep each clip at 1 MB or less.
