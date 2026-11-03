"""Figura de la clase 23: inyectiva, sobreyectiva y biyectiva (flechas entre dominio y codominio)."""
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Ellipse, FancyArrowPatch

AZUL, VINO, VERDE, GRIS = "#1f4e79", "#8c1d2c", "#0f766e", "#6b7280"
plt.rcParams.update({"font.family": "DejaVu Sans", "font.size": 13,
                     "svg.fonttype": "path", "figure.facecolor": "none"})

CASOS = [
    ("Inyectiva", "salidas distintas;\npuede sobrar algo", 3, 4, [(0, 0), (1, 1), (2, 3)], VERDE),
    ("Sobreyectiva", "se llega a todo;\npuede haber choques", 4, 3, [(0, 0), (1, 0), (2, 1), (3, 2)], AZUL),
    ("Biyectiva", "exactamente una\nflecha a cada punto", 3, 3, [(0, 1), (1, 0), (2, 2)], VINO),
]


def ys(n):
    return [1.5 - 3 * (i + 0.5) / n for i in range(n)]


fig, axs = plt.subplots(1, 3, figsize=(12, 4.6))
for ax, (tit, sub, nd, nc, flechas, col) in zip(axs, CASOS):
    ax.set_xlim(-1.6, 1.6); ax.set_ylim(-2.4, 2.2); ax.axis("off"); ax.set_aspect("equal")
    for x, et in [(-0.9, "dominio"), (0.9, "codominio")]:
        ax.add_patch(Ellipse((x, 0), 1.0, 3.4, fc="#f3f4f6", ec=GRIS, lw=1.5))
        ax.text(x, -1.95, et, ha="center", color=GRIS, fontsize=11)
    yd, yc = ys(nd), ys(nc)
    usados = {j for _, j in flechas}
    for y in yd:
        ax.plot(-0.9, y, "o", color="#1b2430", ms=8)
    for j, y in enumerate(yc):
        ax.plot(0.9, y, "o", color="#1b2430" if j in usados else "#c9cdd3", ms=8,
                mec="#1b2430" if j in usados else GRIS)
    for i, j in flechas:
        ax.add_patch(FancyArrowPatch((-0.78, yd[i]), (0.78, yc[j]), arrowstyle="-|>",
                                     mutation_scale=16, color=col, lw=2))
    ax.text(0, 2.0, tit, ha="center", fontsize=16, weight="bold", color=col)
    ax.text(0, -2.35, sub, ha="center", va="top", fontsize=11, color="#1b2430")
fig.subplots_adjust(left=0.01, right=0.99, top=0.98, bottom=0.12, wspace=0.05)
fig.savefig(Path(__file__).with_name("inyectiva_sobreyectiva.svg"), bbox_inches="tight", transparent=True)
print("ok")
