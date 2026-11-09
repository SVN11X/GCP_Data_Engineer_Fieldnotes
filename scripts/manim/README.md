# Manim clips

Source scenes for the short silent clips on lesson pages. The rendered files live in `assets/video/`.

- Goes here: Manim scenes (`*.py`). Does not go here: rendered media, fonts or Manim itself.
- Naming: snake_case scene file, kebab-case clip name in `assets/video/`.

## Render

Run in a Python virtual environment outside this repository with `manim` installed. Set `INTER_TTF` to a local copy of Inter (SIL OFL 1.1) so the labels use the site's body font. Then:

```
manim -ql --format=webm -o partition_pruning scripts/manim/partition_pruning.py PartitionPruning
```

Copy the `.webm` to `assets/video/` and a frame as the WebP poster. The captions in `content/captions/*.vtt` follow the scene timing, so rerun the scene and check them after any change. Keep each clip at 1 MB or less.
