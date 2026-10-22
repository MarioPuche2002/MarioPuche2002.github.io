"""Genera las figuras SVG de las clases de Álgebra Lineal.

Uso:  python generar_figuras.py   (requiere numpy y matplotlib)
"""
from pathlib import Path
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

OUT = Path(__file__).parent
AZUL, VINO, VERDE, GRIS, AMBAR = "#1f4e79", "#8c1d2c", "#0f766e", "#6b7280", "#b45309"
plt.rcParams.update({
    "font.family": "DejaVu Sans", "font.size": 12, "axes.edgecolor": GRIS,
    "axes.labelcolor": "#1b2430", "xtick.color": GRIS, "ytick.color": GRIS,
    "svg.fonttype": "path", "figure.facecolor": "none", "axes.facecolor": "none",
})


def flecha(ax, o, v, color, label=None, off=(0.1, 0.1), lw=2.4):
    ax.annotate("", xy=(o[0] + v[0], o[1] + v[1]), xytext=o,
                arrowprops=dict(arrowstyle="-|>", color=color, lw=lw, mutation_scale=18))
    if label:
        ax.text(o[0] + v[0] + off[0], o[1] + v[1] + off[1], label, color=color, fontsize=15)


def ejes(ax, lim):
    ax.axhline(0, color=GRIS, lw=.8); ax.axvline(0, color=GRIS, lw=.8)
    ax.set_xlim(*lim[0]); ax.set_ylim(*lim[1]); ax.set_aspect("equal")
    for s in ax.spines.values():
        s.set_visible(False)
    ax.grid(color="#e5e7eb", lw=.6)


# 1. Interpretación geométrica de sistemas 2x2
def sistemas():
    fig, axs = plt.subplots(1, 3, figsize=(12, 4))
    x = np.linspace(-1, 5, 50)
    casos = [
        ("Solución única", [(x, (5 - x) / 1, "x + y = 5"), (x, (2 * x - 1) / 1, "2x − y = 1")], (2, 3)),
        ("Sin solución", [(x, 3 - x, "x + y = 3"), (x, 5 - x, "x + y = 5")], None),
        ("Infinitas soluciones", [(x, (6 - 2 * x) / 2, "2x + 2y = 6"), (x, 3 - x, "x + y = 3")], None),
    ]
    for ax, (tit, rectas, punto) in zip(axs, casos):
        for i, (xx, yy, lab) in enumerate(rectas):
            ls = "-" if i == 0 else ("--" if tit.startswith("Inf") else "-")
            ax.plot(xx, yy, color=[AZUL, VINO][i], lw=2.4, ls=ls, label=lab)
        if punto:
            ax.plot(*punto, "o", color=VERDE, ms=9); ax.text(punto[0] + .2, punto[1] + .3, "(2, 3)", color=VERDE)
        ejes(ax, ((-1, 5), (-1, 6)))
        ax.set_title(tit, color="#1b2430", fontsize=14)
        ax.legend(loc="upper right", frameon=False, fontsize=11)
    fig.tight_layout(); fig.savefig(OUT / "sistemas_2x2.svg"); plt.close(fig)


# 2. Proyección ortogonal
def proyeccion():
    u = np.array([5.0, 1.0]); v = np.array([2.0, 3.5])
    p = (v @ u) / (u @ u) * u
    fig, ax = plt.subplots(figsize=(6.5, 4.2))
    flecha(ax, (0, 0), u, AZUL, r"$\vec u$", (.1, -.45))
    flecha(ax, (0, 0), v, VINO, r"$\vec v$", (-.35, .1))
    flecha(ax, (0, 0), p, VERDE, r"$\mathrm{proy}_{\vec u}\,\vec v$", (-1.6, -.6), lw=3.2)
    ax.plot([v[0], p[0]], [v[1], p[1]], ls="--", color=GRIS)
    ax.text((v[0] + p[0]) / 2 + .15, (v[1] + p[1]) / 2, r"$\vec v-\mathrm{proy}_{\vec u}\vec v$", color=GRIS, fontsize=12)
    d = -u / np.linalg.norm(u) * .3; n = np.array([-u[1], u[0]]) / np.linalg.norm(u) * .3
    ax.plot([p[0] + d[0], p[0] + d[0] + n[0], p[0] + n[0]], [p[1] + d[1], p[1] + d[1] + n[1], p[1] + n[1]], color=GRIS, lw=1)
    ax.text(.55, .32, r"$\theta$", fontsize=14)
    ejes(ax, ((-.5, 6), (-.8, 4.2))); ax.set_xticks([]); ax.set_yticks([])
    fig.tight_layout(); fig.savefig(OUT / "proyeccion.svg"); plt.close(fig)


# 3. Paralelogramo y área con producto cruz
def paralelogramo():
    u = np.array([4.0, 0.6]); v = np.array([1.4, 2.6])
    fig, ax = plt.subplots(figsize=(6.5, 3.8))
    ax.fill([0, u[0], u[0] + v[0], v[0]], [0, u[1], u[1] + v[1], v[1]], color=AZUL, alpha=.10)
    ax.plot([u[0], u[0] + v[0], v[0]], [u[1], u[1] + v[1], v[1]], color=GRIS, ls="--", lw=1)
    flecha(ax, (0, 0), u, AZUL, r"$\vec u$", (.1, -.4))
    flecha(ax, (0, 0), v, VINO, r"$\vec v$", (-.45, .05))
    t = (v @ u) / (u @ u); f = t * u
    ax.plot([v[0], f[0]], [v[1], f[1]], color=VERDE, lw=1.6)
    ax.text((v[0] + f[0]) / 2 + .1, (v[1] + f[1]) / 2, r"$h=\|\vec v\|\,\mathrm{sen}\,\theta$", color=VERDE, fontsize=12)
    ax.text(.55, .28, r"$\theta$", fontsize=13)
    ax.text(3.0, 2.05, r"Área $=\|\vec u\times\vec v\|$", fontsize=13, color="#1b2430")
    ejes(ax, ((-.5, 6), (-.6, 3.6))); ax.set_xticks([]); ax.set_yticks([])
    for s in ("left", "bottom"):
        pass
    ax.axhline(0, color="none"); ax.axvline(0, color="none")
    fig.tight_layout(); fig.savefig(OUT / "paralelogramo.svg"); plt.close(fig)


def ejes3d(ax):
    ax.set_xticks([]); ax.set_yticks([]); ax.set_zticks([])
    ax.xaxis.pane.fill = ax.yaxis.pane.fill = ax.zaxis.pane.fill = False
    for a in (ax.xaxis, ax.yaxis, ax.zaxis):
        a.pane.set_edgecolor("#e5e7eb")
    ax.grid(False)


# 4. Recta en el espacio
def recta():
    fig = plt.figure(figsize=(6, 4.6)); ax = fig.add_subplot(projection="3d")
    P0 = np.array([1, 1, 1]); v = np.array([1.2, 1.5, 0.9])
    t = np.linspace(-1.2, 1.6, 2); L = P0[:, None] + v[:, None] * t
    ax.plot(*L, color=AZUL, lw=2.4)
    ax.quiver(*P0, *v, color=VINO, lw=2.4, arrow_length_ratio=.15)
    ax.scatter(*P0, color=VERDE, s=40)
    ax.text(*(P0 + [-.35, 0, -.45]), r"$P_0$", color=VERDE, fontsize=14)
    ax.text(*(P0 + v + [.05, .05, .1]), r"$\vec v$", color=VINO, fontsize=15)
    Q = P0 + 1.5 * v; ax.scatter(*Q, color=AZUL, s=30); ax.text(*(Q + [.1, 0, .1]), r"$P=P_0+t\vec v$", color=AZUL, fontsize=12)
    ax.quiver(0, 0, 0, *P0, color=GRIS, lw=1.2, arrow_length_ratio=.1, linestyle="--")
    ax.text(0, 0, -.3, "O", color=GRIS)
    ejes3d(ax); ax.view_init(20, -60)
    fig.tight_layout(); fig.savefig(OUT / "recta_espacio.svg"); plt.close(fig)


# 5. Plano con vector normal
def plano():
    fig = plt.figure(figsize=(6.2, 4.8)); ax = fig.add_subplot(projection="3d")
    xx, yy = np.meshgrid(np.linspace(-2, 2, 2), np.linspace(-2, 2, 2))
    zz = 1 - 0.3 * xx - 0.2 * yy
    ax.plot_surface(xx, yy, zz, color=AZUL, alpha=.15, edgecolor=AZUL, lw=.5)
    P0 = np.array([0, 0, 1.0]); n = np.array([0.3, 0.2, 1.0]) * 1.4
    P = np.array([1.2, -0.8, 1 - .36 + .16])
    ax.quiver(*P0, *n, color=VINO, lw=2.6, arrow_length_ratio=.12)
    ax.quiver(*P0, *(P - P0), color=VERDE, lw=2.2, arrow_length_ratio=.12)
    ax.scatter(*P0, color="#1b2430", s=30); ax.scatter(*P, color=VERDE, s=30)
    ax.text(*(P0 + n + [.05, 0, .05]), r"$\vec n=(a,b,c)$", color=VINO, fontsize=13)
    ax.text(*(P0 + [-.6, -.1, -.35]), r"$P_0$", fontsize=13)
    ax.text(*(P + [.1, 0, -.3]), r"$P$", color=VERDE, fontsize=13)
    ax.text2D(.02, .92, r"$\vec n\cdot\overrightarrow{P_0P}=0$", transform=ax.transAxes, fontsize=14)
    ejes3d(ax); ax.view_init(18, -55); ax.set_zlim(0, 2.6)
    fig.tight_layout(); fig.savefig(OUT / "plano_normal.svg"); plt.close(fig)


# 6. Distancia de un punto a un plano
def distancia():
    fig = plt.figure(figsize=(6.2, 4.8)); ax = fig.add_subplot(projection="3d")
    xx, yy = np.meshgrid(np.linspace(-2, 2, 2), np.linspace(-2, 2, 2))
    ax.plot_surface(xx, yy, 0 * xx, color=AZUL, alpha=.15, edgecolor=AZUL, lw=.5)
    Q = np.array([0.6, 0.4, 1.8]); P = np.array([-1.2, -0.6, 0]); F = np.array([0.6, 0.4, 0])
    ax.quiver(*P, *(Q - P), color=VERDE, lw=2.2, arrow_length_ratio=.08)
    ax.plot(*np.c_[Q, F], color=VINO, lw=2.6)
    ax.quiver(-1.5, 1.2, 0, 0, 0, 1.0, color=AMBAR, lw=2.2, arrow_length_ratio=.15)
    ax.text(-1.45, 1.2, 1.05, r"$\vec n$", color=AMBAR, fontsize=14)
    for X, lab, c in ((Q, "Q", "#1b2430"), (P, r"$P$", VERDE), (F, "", VINO)):
        ax.scatter(*X, color=c, s=30)
        if lab:
            ax.text(*(X + [.08, .05, .1]), lab, color=c, fontsize=13)
    ax.text(.8, .5, 1.1, r"$d=\dfrac{|\overrightarrow{PQ}\cdot\vec n|}{\|\vec n\|}$", color=VINO, fontsize=13)
    ejes3d(ax); ax.view_init(16, -60); ax.set_zlim(0, 2.2)
    fig.tight_layout(); fig.savefig(OUT / "distancia_punto_plano.svg"); plt.close(fig)


# 7. Transformación lineal del cuadrado unitario
def transformacion():
    A = np.array([[2, 1], [0, 1.5]])
    fig, axs = plt.subplots(1, 2, figsize=(10, 4))
    sq = np.array([[0, 1, 1, 0, 0], [0, 0, 1, 1, 0]]); im = A @ sq
    for ax, pts, e1, e2, tit, l1, l2 in (
        (axs[0], sq, (1, 0), (0, 1), "Antes", r"$\vec e_1$", r"$\vec e_2$"),
        (axs[1], im, A[:, 0], A[:, 1], r"Después: $T(\vec x)=A\vec x$", r"$T(\vec e_1)$", r"$T(\vec e_2)$")):
        ax.fill(*pts, color=AZUL, alpha=.12); ax.plot(*pts, color=AZUL, lw=1)
        flecha(ax, (0, 0), e1, VINO, l1, (.05, -.35)); flecha(ax, (0, 0), e2, VERDE, l2, (-.5, .1))
        ejes(ax, ((-.6, 3.4), (-.6, 2.1))); ax.set_title(tit, fontsize=13)
    fig.text(.5, .02, "A = [[2, 1], [0, 1.5]]:  las columnas de A son las imágenes de e₁ y e₂", ha="center", fontsize=12)
    fig.tight_layout(rect=(0, .06, 1, 1)); fig.savefig(OUT / "transformacion.svg"); plt.close(fig)


# 8. Vectores propios
def propios():
    A = np.array([[1, 1], [-2, 4]])
    fig, ax = plt.subplots(figsize=(6.4, 5))
    for v, c, lab in (((1, 1), VERDE, r"$\lambda=2$"), ((1, 2), VINO, r"$\lambda=3$")):
        v = np.array(v, float); t = np.linspace(-1.5, 3.5, 2)
        ax.plot(t * v[0], t * v[1], color=c, lw=1, ls=":")
        flecha(ax, (0, 0), v, c, None); flecha(ax, (0, 0), A @ v, c, None, lw=1.4)
        ax.text(*(A @ v + [.15, -.1]), r"$A\vec x=$" + lab.replace(r"$\lambda=", "$").replace("$", "") + r"$\,\vec x$", color=c, fontsize=12)
    x = np.array([2.0, 1.0]); flecha(ax, (0, 0), x, GRIS, r"$\vec y$", (.05, .1))
    flecha(ax, (0, 0), A @ x, GRIS, r"$A\vec y$", (.1, -.45), lw=1.4)
    ax.text(-1.9, 6.2, "Sobre las rectas\npunteadas, A\nsolo estira.", fontsize=11, color="#1b2430")
    ejes(ax, ((-2, 5), (-1, 7)))
    fig.tight_layout(); fig.savefig(OUT / "vectores_propios.svg"); plt.close(fig)


# 9. Combinación lineal
def combinacion():
    v1 = np.array([2.0, 0.5]); v2 = np.array([0.5, 1.5]); w = 2 * v1 + v2
    fig, ax = plt.subplots(figsize=(6.2, 4))
    flecha(ax, (0, 0), v1, AZUL, r"$\vec v_1$", (-.2, -.45)); flecha(ax, v1, v1, AZUL, r"$2\vec v_1$", (-.4, -.5), lw=1.4)
    flecha(ax, 2 * v1, v2, VINO, r"$\vec v_2$", (.1, -.2), lw=1.4); flecha(ax, (0, 0), v2, VINO, r"$\vec v_2$", (-.5, 0))
    flecha(ax, (0, 0), w, VERDE, r"$\vec w=2\vec v_1+\vec v_2$", (-2.6, .1), lw=3)
    ejes(ax, ((-.5, 5.2), (-.5, 3.2))); ax.set_xticks([]); ax.set_yticks([])
    fig.tight_layout(); fig.savefig(OUT / "combinacion_lineal.svg"); plt.close(fig)


if __name__ == "__main__":
    for f in (sistemas, proyeccion, paralelogramo, recta, plano, distancia, transformacion, propios, combinacion):
        f()
    print("Figuras generadas en", OUT)
