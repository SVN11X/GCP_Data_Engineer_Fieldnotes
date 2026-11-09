"""Manim scene for the partition pruning clip. About 22 seconds, silent.

Set INTER_TTF to a local copy of Inter (OFL 1.1) before rendering. See scripts/manim/README.md.
"""
import os

from manim import *
from manimpango import register_font

INK, BLUE, GREEN, GOLD, PAPER = "#1d2a3d", "#3159c9", "#187363", "#ebc67b", "#f7f8fa"
config.background_color = PAPER
FONT = "Inter"
_font_file = os.environ.get("INTER_TTF")
if _font_file:
    register_font(_font_file)


def label(msg, size, color=INK, pos=ORIGIN):
    return Text(msg, font_size=size, color=color, font=FONT).move_to(pos)


class PartitionPruning(Scene):
    def construct(self):
        title = label("Partition pruning", 44)
        self.play(FadeIn(title), run_time=1.0)
        self.wait(1.5)
        self.play(FadeOut(title), run_time=0.5)

        head = label("events table, partitioned by event_date", 26, BLUE, [0, 2.6, 0])
        cells = VGroup()
        for i in range(7):
            box = RoundedRectangle(corner_radius=0.1, width=1.6, height=1.5, color=INK, fill_color=WHITE, fill_opacity=1, stroke_width=3)
            tag = label("Nov %d" % (i + 1), 22, INK, box.get_center() + UP * 0.35)
            tag.set_z_index(2)
            cells.add(VGroup(box, tag))
        cells.arrange(RIGHT, buff=0.15).move_to([0, 0.6, 0])
        self.play(FadeIn(head), LaggedStart(*[FadeIn(c) for c in cells], lag_ratio=0.2), run_time=2.0)

        caption = label("", 26)
        caption.move_to([0, -2.4, 0])

        def say(msg):
            return Transform(caption, label(msg, 26, INK, [0, -2.4, 0]))

        self.play(say("No date filter: SELECT * FROM events"), run_time=0.5)
        fills = [c[0].animate.set_fill(GOLD, opacity=1) for c in cells]
        self.play(LaggedStart(*fills, lag_ratio=0.15), run_time=2.0)
        counter = label("Scanned: 7 of 7 partitions", 28, INK, [0, -1.0, 0])
        self.play(FadeIn(counter), run_time=1.0)
        self.wait(2.5)

        self.play(*[c[0].animate.set_fill(WHITE, opacity=1) for c in cells], FadeOut(counter), run_time=1.0)
        self.play(say("With a filter: WHERE event_date = 'Nov 3'"), run_time=0.5)
        self.play(cells[2][0].animate.set_fill(GOLD, opacity=1).set_stroke(GREEN), run_time=1.0)
        counter = label("Scanned: 1 of 7 partitions", 28, GREEN, [0, -1.0, 0])
        self.play(FadeIn(counter), run_time=1.0)
        self.wait(2.5)

        self.play(*[FadeOut(m) for m in self.mobjects], run_time=0.6)
        self.play(FadeIn(label("Filter on the partition column", 36, BLUE, [0, 0.6, 0])), run_time=1.0)
        self.play(FadeIn(label("to read fewer partitions and pay less", 36, GREEN, [0, -0.6, 0])), run_time=1.0)
        self.wait(3.0)
