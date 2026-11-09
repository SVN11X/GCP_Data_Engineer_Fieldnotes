"""Manim scene for the Pub/Sub to Dataflow to BigQuery clip. About 25 seconds, silent.

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

XS = [-5.4, -1.8, 1.8, 5.4]
Y = 0.8


def label(msg, size, color=INK, pos=ORIGIN):
    return Text(msg, font_size=size, color=color, font=FONT).move_to(pos)


def node(text, x):
    box = RoundedRectangle(corner_radius=0.15, width=2.6, height=1.5, color=BLUE, fill_color=WHITE, fill_opacity=1, stroke_width=3)
    t = label(text, 20)
    t.set(width=min(t.width, 2.3)).move_to(box.get_top() + DOWN * 0.4)
    return VGroup(box, t).move_to([x, Y, 0])


class PubSubToBigQuery(Scene):
    def construct(self):
        title = label("Pub/Sub to Dataflow to BigQuery", 40)
        self.play(FadeIn(title), run_time=1.0)
        self.wait(1.5)
        self.play(FadeOut(title), run_time=0.5)

        nodes = [node("Publisher", XS[0]), node("Pub/Sub topic", XS[1]), node("Dataflow job", XS[2]), node("BigQuery", XS[3])]
        arrows = [Arrow([XS[i] + 1.35, Y, 0], [XS[i + 1] - 1.35, Y, 0], buff=0.05, color=INK, stroke_width=3, max_tip_length_to_length_ratio=0.3) for i in range(3)]
        self.play(*[FadeIn(m) for m in nodes + arrows], run_time=1.5)
        caption = label("", 26)
        caption.move_to([0, -2.4, 0])

        def say(msg):
            return Transform(caption, label(msg, 26, INK, [0, -2.4, 0]))

        def hop(a, b, color, count=3, gap=0.5, run=1.6):
            dots = [Dot(radius=0.13, color=color).move_to([XS[a], Y - 0.4, 0]) for _ in range(count)]
            anims = [Succession(Wait(i * gap), FadeIn(d, run_time=0.15), MoveAlongPath(d, Line([XS[a], Y - 0.4, 0], [XS[b], Y - 0.4, 0]), run_time=run, rate_func=linear)) for i, d in enumerate(dots)]
            return dots, anims

        self.play(say("Publishers send events to a topic"), run_time=0.5)
        d1, a1 = hop(0, 1, BLUE)
        self.play(*a1, run_time=3.0)
        self.play(say("Dataflow pulls them and transforms each one"), *[d.animate.set_color(GREEN) for d in d1], run_time=0.5)
        d2, a2 = hop(1, 2, GREEN)
        self.play(*a2, FadeOut(VGroup(*d1)), run_time=3.0)
        self.play(say("Rows are written to BigQuery"), run_time=0.5)
        d3, a3 = hop(2, 3, GREEN)
        self.play(*a3, FadeOut(VGroup(*d2)), run_time=3.0)
        bars = VGroup(*[Rectangle(width=0.25, height=0.15 + 0.12 * i, color=GREEN, fill_color=GREEN, fill_opacity=0.9, stroke_width=1) for i in range(4)])
        bars.arrange(RIGHT, buff=0.1, aligned_edge=DOWN).move_to([XS[3], Y - 0.4, 0])
        self.play(FadeOut(VGroup(*d3)), LaggedStart(*[GrowFromEdge(b, DOWN) for b in bars], lag_ratio=0.3), run_time=1.5)
        self.play(say("Dataflow acknowledges each message, so Pub/Sub does not send it again"), run_time=0.5)
        acks = [label("ack", 22, INK, [XS[2], Y - 1.2, 0]) for _ in range(3)]
        for a in acks:
            a.set_color("#8a5a00")
        self.play(*[Succession(Wait(i * 0.6), FadeIn(a, run_time=0.15), a.animate(run_time=1.4, rate_func=linear).move_to([XS[1], Y - 1.2, 0]), FadeOut(a, run_time=0.15)) for i, a in enumerate(acks)], run_time=3.6)
        self.wait(1.0)
        self.play(*[FadeOut(m) for m in self.mobjects], run_time=0.6)
        self.play(FadeIn(label("Pub/Sub holds the events until they are acknowledged.", 30, BLUE, [0, 0.6, 0])), run_time=1.0)
        self.play(FadeIn(label("Dataflow processes them and BigQuery stores the result.", 30, GREEN, [0, -0.6, 0])), run_time=1.0)
        self.wait(3.0)
