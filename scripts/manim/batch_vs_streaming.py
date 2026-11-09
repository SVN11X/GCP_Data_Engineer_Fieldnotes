"""Manim scene for the batch versus streaming clip.

Set INTER_TTF to a local copy of Inter (OFL 1.1) before rendering. See scripts/manim/README.md.
The scene is silent and runs about 26 seconds. Captions live in assets/video/*.vtt.
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


def node(label, x, y, color):
    box = RoundedRectangle(corner_radius=0.15, width=2.9, height=1.5, color=color, fill_color=WHITE, fill_opacity=1, stroke_width=3)
    text = Text(label, font_size=22, color=INK, font=FONT)
    text.set(width=min(text.width, 2.6))
    text.move_to(box.get_top() + DOWN * 0.4)
    group = VGroup(box, text)
    group.move_to([x, y, 0])
    return group


def arrow(a, b, y):
    return Arrow([a, y, 0], [b, y, 0], buff=0.05, color=INK, stroke_width=3, max_tip_length_to_length_ratio=0.25)


class BatchVsStreaming(Scene):
    def construct(self):
        title = Text("Batch or streaming?", font_size=44, color=INK, font=FONT)
        self.play(FadeIn(title), run_time=1.0)
        self.wait(1.5)
        self.play(FadeOut(title), run_time=0.5)

        yb, ys = 1.6, -1.2
        lab_b = Text("Batch", font_size=30, color=BLUE, font=FONT).move_to([-6.1, yb, 0])
        lab_s = Text("Streaming", font_size=30, color=GREEN, font=FONT).move_to([-5.9, ys, 0])
        xs = [-3.0, 1.2, 5.4]
        b_nodes = [node("Cloud Storage", xs[0], yb, BLUE), node("Dataflow batch job", xs[1], yb, BLUE), node("BigQuery", xs[2], yb, BLUE)]
        s_nodes = [node("Pub/Sub", xs[0], ys, GREEN), node("Dataflow streaming job", xs[1], ys, GREEN), node("BigQuery", xs[2], ys, GREEN)]
        b_arrows = [arrow(xs[0] + 1.5, xs[1] - 1.5, yb), arrow(xs[1] + 1.5, xs[2] - 1.5, yb)]
        s_arrows = [arrow(xs[0] + 1.5, xs[1] - 1.5, ys), arrow(xs[1] + 1.5, xs[2] - 1.5, ys)]
        self.play(FadeIn(lab_b), FadeIn(lab_s), run_time=1.0)
        self.play(*[FadeIn(m) for m in b_nodes + s_nodes + b_arrows + s_arrows], run_time=1.5)

        caption = Text("", font_size=26, color=INK, font=FONT).move_to([0, -3.1, 0])

        def say(msg):
            new = Text(msg, font_size=26, color=INK, font=FONT).move_to([0, -3.1, 0])
            return Transform(caption, new)

        self.play(say("Batch: data piles up first"), run_time=0.5)
        squares = VGroup(*[Square(0.22, color=BLUE, fill_color=BLUE, fill_opacity=0.9, stroke_width=1) for _ in range(5)])
        squares.arrange(RIGHT, buff=0.12).move_to([xs[0], yb - 0.4, 0])
        for sq in squares:
            self.play(FadeIn(sq, shift=DOWN * 0.3), run_time=0.5)
        self.wait(0.5)
        self.play(squares.animate.move_to([xs[1], yb - 0.4, 0]).scale(0.9), run_time=2.0)
        self.play(Indicate(b_nodes[1], color=BLUE), run_time=1.0)
        result = Square(0.5, color=BLUE, fill_color=BLUE, fill_opacity=0.9).move_to([xs[2], yb - 0.4, 0])
        self.play(FadeOut(squares), FadeIn(result), say("One result, after the whole run"), run_time=1.0)
        self.wait(1.0)

        self.play(say("Streaming: each event is processed as it arrives"), run_time=0.5)
        dots = [Dot(radius=0.13, color=GREEN).move_to([xs[0], ys - 0.4, 0]) for _ in range(5)]
        bars = VGroup()
        anims = []
        for i, d in enumerate(dots):
            path = Line([xs[0], ys - 0.4, 0], [xs[2] - 0.6, ys - 0.4, 0])
            anims.append(Succession(Wait(i * 0.9), FadeIn(d, run_time=0.2), MoveAlongPath(d, path, run_time=2.6, rate_func=linear), FadeOut(d, run_time=0.2)))
        self.play(*anims, run_time=7.0)
        for i in range(4):
            bars.add(Rectangle(width=0.25, height=0.15 + 0.12 * i, color=GREEN, fill_color=GREEN, fill_opacity=0.9, stroke_width=1))
        bars.arrange(RIGHT, buff=0.1, aligned_edge=DOWN).move_to([xs[2], ys - 0.4, 0])
        self.play(LaggedStart(*[GrowFromEdge(b, DOWN) for b in bars], lag_ratio=0.4), say("Results keep updating within seconds"), run_time=1.6)
        self.wait(1.0)

        self.play(*[FadeOut(m) for m in self.mobjects], run_time=0.6)
        first = Text("Batch: finite data, results after the run", font_size=32, color=BLUE, font=FONT).move_to([0, 0.7, 0])
        second = Text("Streaming: unbounded data, results in seconds", font_size=32, color=GREEN, font=FONT).move_to([0, -0.7, 0])
        self.play(FadeIn(first), run_time=1.0)
        self.play(FadeIn(second), run_time=1.0)
        self.wait(3.0)
