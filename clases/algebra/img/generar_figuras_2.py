"""Figuras adicionales de las clases de Álgebra Lineal.

Uso:  python generar_figuras_2.py   (requiere numpy y matplotlib; usa generar_figuras.py)
"""
import numpy as np
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle, Polygon, FancyArrowPatch, Ellipse
from mpl_toolkits.mplot3d.art3d import Poly3DCollection
from generar_figuras import OUT, AZUL, VINO, VERDE, GRIS, AMBAR, flecha, ejes, ejes3d

TINTA = "#1b2430"
MORADO = "#6d28d9"


def guardar(fig, nombre):
    fig.savefig(OUT / nombre, bbox_inches="tight")
    plt.close(fig)


def plano3d(ax, n, d, lim=2.0, color=AZUL, alpha=.16):
    """Dibuja el plano n·x = d sobre un cuadrado de lado 2*lim."""
    a, b, c = n
    g = np.linspace(-lim, lim, 2)
    if abs(c) > 1e-9:
        X, Y = np.meshgrid(g, g); Z = (d - a * X - b * Y) / c
    elif abs(b) > 1e-9:
        X, Z = np.meshgrid(g, g); Y = (d - a * X - c * Z) / b
    else:
        Y, Z = np.meshgrid(g, g); X = (d - b * Y - c * Z) / a
    ax.plot_surface(X, Y, Z, color=color, alpha=alpha, edgecolor=color, lw=.4)


def flecha3d(ax, o, v, color, label=None, lw=2.2, off=(0, 0, 0), fs=13):
    ax.quiver(*o, *v, color=color, lw=lw, arrow_length_ratio=.12)
    if label:
        p = np.array(o) + np.array(v) + np.array(off)
        ax.text(*p, label, color=color, fontsize=fs)


def matriz_grid(ax, M, x0, y0, color_celdas=None, titulo=None, w=.8):
    """Dibuja una matriz como cuadrícula con números. color_celdas: dict (i,j)->color."""
    m, n = len(M), len(M[0])
    for i in range(m):
        for j in range(n):
            c = (color_celdas or {}).get((i, j))
            ax.add_patch(Rectangle((x0 + j * w, y0 - (i + 1) * w), w, w, fc=c if c else "white", ec="#cbd5e1", lw=1))
            ax.text(x0 + j * w + w / 2, y0 - i * w - w / 2, str(M[i][j]), ha="center", va="center", fontsize=13, color=TINTA)
    ax.plot([x0 - .08, x0 - .15, x0 - .15, x0 - .08], [y0, y0, y0 - m * w, y0 - m * w], color=TINTA, lw=1.4)
    ax.plot([x0 + n * w + .08, x0 + n * w + .15, x0 + n * w + .15, x0 + n * w + .08], [y0, y0, y0 - m * w, y0 - m * w], color=TINTA, lw=1.4)
    if titulo:
        ax.text(x0 + n * w / 2, y0 + .25, titulo, ha="center", fontsize=13, color=TINTA)


# ---------- Unidad 1 ----------
def planos_3x3():
    fig = plt.figure(figsize=(13, 4.3))
    casos = [
        ("Solución única (un punto)", [((1, 0, 0), 0), ((0, 1, 0), 0), ((0, 0, 1), 0)], "punto"),
        ("Infinitas (una recta)", [((0, 0, 1), 0), ((0, 1, 1), 0), ((0, 1, -1), 0)], "recta"),
        ("Sin solución", [((0, 0, 1), -1), ((0, 1, 1), 1.2), ((0, 1, -1), 1.2)], None),
    ]
    for k, (tit, planos, tipo) in enumerate(casos):
        ax = fig.add_subplot(1, 3, k + 1, projection="3d")
        for (n, d), c in zip(planos, (AZUL, VINO, VERDE)):
            plano3d(ax, n, d, lim=1.6, color=c, alpha=.18)
        if tipo == "punto":
            ax.scatter(0, 0, 0, color=TINTA, s=50)
        if tipo == "recta":
            ax.plot([-1.6, 1.6], [0, 0], [0, 0], color=TINTA, lw=3)
        ax.set_title(tit, fontsize=13, color=TINTA)
        ejes3d(ax); ax.view_init(22, -58); ax.set_xlim(-1.6, 1.6); ax.set_ylim(-1.6, 1.6); ax.set_zlim(-1.6, 1.6)
    guardar(fig, "planos_3x3.svg")


def particular_homogenea():
    fig, ax = plt.subplots(figsize=(6.5, 4.6))
    d = np.array([1.0, 0.5]); xp = np.array([-0.5, 2.0]); t = np.linspace(-3, 3.5, 2)
    ax.plot(t * d[0], t * d[1], color=AZUL, lw=2.4, label=r"$A\mathbf{x}=\mathbf{0}$ (pasa por el origen)")
    ax.plot(xp[0] + t * d[0], xp[1] + t * d[1], color=VINO, lw=2.4, label=r"$A\mathbf{x}=\mathbf{b}$ (paralela)")
    flecha(ax, (0, 0), xp, VERDE, r"$\mathbf{x}_p$", (-.55, -.1))
    xh = 1.8 * d
    flecha(ax, (0, 0), xh, AZUL, r"$\mathbf{x}_h$", (.05, -.4), lw=1.8)
    flecha(ax, xp, xh, VINO, None, lw=1.8)
    ax.plot(*(xp + xh), "o", color=VINO); ax.text(*(xp + xh + [.1, .15]), r"$\mathbf{x}_p+\mathbf{x}_h$", color=VINO, fontsize=13)
    ejes(ax, ((-3, 3.6), (-1.5, 3.8))); ax.set_xticks([]); ax.set_yticks([])
    ax.legend(loc="lower right", frameon=False, fontsize=11)
    guardar(fig, "particular_homogenea.svg")


# ---------- Unidad 2 ----------
def suma_vectores():
    fig, axs = plt.subplots(1, 2, figsize=(11, 4.2))
    u = np.array([3.0, 1.0]); v = np.array([1.0, 2.0])
    ax = axs[0]
    ax.fill([0, u[0], u[0] + v[0], v[0]], [0, u[1], u[1] + v[1], v[1]], color=AZUL, alpha=.08)
    flecha(ax, (0, 0), u, AZUL, r"$\mathbf{u}$", (-.2, -.45)); flecha(ax, (0, 0), v, VINO, r"$\mathbf{v}$", (-.45, 0))
    flecha(ax, u, v, VINO, None, lw=1.2); flecha(ax, v, u, AZUL, None, lw=1.2)
    flecha(ax, (0, 0), u + v, VERDE, r"$\mathbf{u}+\mathbf{v}$", (.1, .05), lw=3)
    ejes(ax, ((-.5, 4.8), (-.5, 3.6))); ax.set_title("Suma: regla del paralelogramo", fontsize=13)
    ax = axs[1]
    for c, col, lab, off in ((2, VERDE, r"$2\mathbf{u}$", (.1, .1)), (1, AZUL, r"$\mathbf{u}$", (.05, -.45)), (-1, VINO, r"$-\mathbf{u}$", (-.6, -.4)), (.5, AMBAR, r"$\frac{1}{2}\mathbf{u}$", (-.2, .25))):
        flecha(ax, (0, 0) if c != .5 else (0, .6), c * u, col, lab, off, lw=2.2)
    ejes(ax, ((-3.8, 6.8), (-1.6, 2.6))); ax.set_title("Múltiplos escalares de $\\mathbf{u}$", fontsize=13)
    guardar(fig, "suma_vectores.svg")


def producto_fila_columna():
    fig, ax = plt.subplots(figsize=(11, 3.6))
    A = [[1, 2, -1], [3, 1, 4]]; B = [[-2, 5], [4, -3], [2, 1]]; C = [[4, -2], [6, 16]]
    fa = {(0, j): "#fde2e4" for j in range(3)}; fb = {(i, 1): "#dbeafe" for i in range(3)}
    matriz_grid(ax, A, 0, 2.4, fa, r"$A$ $(2\times 3)$")
    ax.text(2.75, 1.2, "×", fontsize=22, ha="center", va="center")
    matriz_grid(ax, B, 3.3, 2.4, fb, r"$B$ $(3\times 2)$")
    ax.text(5.35, 1.2, "=", fontsize=22, ha="center", va="center")
    matriz_grid(ax, C, 5.9, 2.4, {(0, 1): "#fef3c7"}, r"$AB$ $(2\times 2)$")
    ax.text(7.9, 1.75, "Entrada (1,2):\nrenglón 1 de A · columna 2 de B\n" + r"$= 1(5)+2(-3)+(-1)(1)=-2$", fontsize=12, va="center", color=TINTA)
    ax.set_xlim(-.3, 12); ax.set_ylim(-.2, 2.9); ax.axis("off")
    guardar(fig, "producto_fila_columna.svg")


def columnas_plano():
    fig = plt.figure(figsize=(6.4, 5)); ax = fig.add_subplot(projection="3d")
    a1 = np.array([1, 2, 1.]); a2 = np.array([2, 5, 3.]); n = np.cross(a1, a2)
    s, t = np.meshgrid(np.linspace(-.8, 1.4, 2), np.linspace(-.6, 1.2, 2))
    P = s[..., None] * a1 + t[..., None] * a2
    ax.plot_surface(P[..., 0], P[..., 1], P[..., 2], color=AZUL, alpha=.15, edgecolor=AZUL, lw=.4)
    flecha3d(ax, (0, 0, 0), a1, AZUL, r"$\mathbf{a}_1$", off=(.1, 0, -.2)); flecha3d(ax, (0, 0, 0), a2, AZUL, r"$\mathbf{a}_2$", off=(.1, .1, .1))
    flecha3d(ax, (0, 0, 0), (1, 4, 3), VERDE, r"$\mathbf{b}$ (en el plano)", off=(-.4, -.6, .3))
    c = np.array([1, 4, 4.6]); nn = n / np.linalg.norm(n); pc = c - (c @ nn) * nn
    flecha3d(ax, (0, 0, 0), c, VINO, r"$\mathbf{c}$ (fuera)", off=(0, 0, .2))
    ax.plot(*np.c_[c, pc], ls=":", color=VINO, lw=1.5); ax.scatter(*pc, color=VINO, s=12)
    ax.text2D(.02, .93, r"gen$\{\mathbf{a}_1,\mathbf{a}_2,\mathbf{a}_3\}$ es un plano", transform=ax.transAxes, fontsize=12)
    ejes3d(ax); ax.view_init(28, -25)
    guardar(fig, "columnas_plano.svg")


def inversa_flechas():
    A = np.array([[2, 1], [0.5, 1.5]])
    sq = np.array([[0, 1, 1, 0, 0], [0, 0, 1, 1, 0]]); im = A @ sq
    fig, axs = plt.subplots(1, 3, figsize=(12, 3.8))
    for ax, pts, tit, col in ((axs[0], sq, r"$\mathbf{x}$", AZUL), (axs[1], im, r"$A\mathbf{x}$", VINO), (axs[2], sq, r"$A^{-1}(A\mathbf{x})=\mathbf{x}$", AZUL)):
        ax.fill(*pts, color=col, alpha=.15); ax.plot(*pts, color=col, lw=1.2)
        ax.plot(.7, .3, "o", color=VERDE) if col == AZUL else ax.plot(*(A @ [.7, .3]), "o", color=VERDE)
        ejes(ax, ((-.4, 3.3), (-.4, 2.3))); ax.set_title(tit, fontsize=14); ax.set_xticks([]); ax.set_yticks([])
    fig.text(.355, .52, "A  →", fontsize=20, ha="center", color=VINO); fig.text(.67, .52, "A⁻¹  →", fontsize=20, ha="center", color=AZUL)
    guardar(fig, "inversa_flechas.svg")


def transpuesta():
    fig, ax = plt.subplots(figsize=(9, 3.8))
    A = [[5, -2, 8], [7, 1, 0], [-4, -7, -6]]; At = [list(r) for r in zip(*A)]
    col = {(0, 1): "#fde2e4", (1, 0): "#dbeafe", (0, 2): "#fef3c7", (2, 0): "#dcfce7", (1, 2): "#ede9fe", (2, 1): "#fce7f3"}
    colt = {(j, i): c for (i, j), c in col.items()}
    matriz_grid(ax, A, 0, 2.6, col, r"$A$", w=.85)
    for k in range(3):
        ax.add_patch(Rectangle((k * .85, 2.6 - (k + 1) * .85), .85, .85, fill=False, ec=VINO, lw=2))
    ax.plot([-.1, 2.65], [2.7, -.05], ls="--", color=VINO, lw=1)
    ax.text(3.4, 1.35, r"$(A^T)_{ij}=a_{ji}$" + "\n\nreflejar respecto\na la diagonal", fontsize=12, ha="center", va="center")
    matriz_grid(ax, At, 4.6, 2.6, colt, r"$A^T$", w=.85)
    ax.set_xlim(-.4, 7.4); ax.set_ylim(-.2, 3.0); ax.axis("off")
    guardar(fig, "transpuesta.svg")


# ---------- Unidad 3 ----------
def det_area():
    fig, axs = plt.subplots(1, 2, figsize=(11, 4.2))
    for ax, (c1, c2), tit in ((axs[0], ((3, 1), (1, 2)), r"$\det\begin{pmatrix}3&1\\1&2\end{pmatrix}=5$: área 5"),
                              (axs[1], ((1, 2), (3, 1)), r"columnas intercambiadas: $\det=-5$")):
        c1, c2 = np.array(c1, float), np.array(c2, float)
        ax.fill([0, c1[0], c1[0] + c2[0], c2[0]], [0, c1[1], c1[1] + c2[1], c2[1]], color=AZUL if ax is axs[0] else VINO, alpha=.15)
        flecha(ax, (0, 0), c1, AZUL, "col 1", (.05, -.4)); flecha(ax, (0, 0), c2, VERDE, "col 2", (-.7, .1))
        ejes(ax, ((-.5, 4.6), (-.5, 3.6)))
        ax.set_title(tit.replace(r"\begin{pmatrix}3&1\\1&2\end{pmatrix}", " A"), fontsize=13)
    fig.text(.5, -.02, r"$|\det A|$ = área del paralelogramo de las columnas; el signo indica la orientación", ha="center", fontsize=12)
    guardar(fig, "det_area.svg")


def sarrus():
    fig, ax = plt.subplots(figsize=(8, 3.4))
    M = [["a₁₁", "a₁₂", "a₁₃", "a₁₁", "a₁₂"], ["a₂₁", "a₂₂", "a₂₃", "a₂₁", "a₂₂"], ["a₃₁", "a₃₂", "a₃₃", "a₃₁", "a₃₂"]]
    for i in range(3):
        for j in range(5):
            ax.text(j, -i, M[i][j], ha="center", va="center", fontsize=15, color=TINTA if j < 3 else GRIS)
    for k in range(3):
        ax.plot([k - .25, k + 2.25], [.25, -2.25], color=AZUL, lw=2, alpha=.8)
        ax.plot([k + 2.25, k - .25], [.25, -2.25], color=VINO, lw=2, alpha=.8, ls="--")
    ax.axvline(2.55, color=GRIS, lw=.8, ls=":")
    ax.text(5.1, -.4, "+  (hacia abajo)", color=AZUL, fontsize=13); ax.text(5.1, -1.6, "−  (hacia arriba)", color=VINO, fontsize=13)
    ax.set_xlim(-.6, 7.4); ax.set_ylim(-2.6, .6); ax.axis("off")
    guardar(fig, "sarrus.svg")


def det_operaciones():
    fig, axs = plt.subplots(1, 3, figsize=(13, 3.9))
    base = [np.array([2., 0]), np.array([0., 1.5])]
    casos = [("Original: área 3", base, AZUL),
             ("Sumar múltiplo de otra fila:\nárea igual (cizalla)", [np.array([2., 0]), np.array([1.5, 1.5])], VERDE),
             ("Multiplicar una fila por 2:\nárea doble", [np.array([2., 0]), np.array([0., 3.])], VINO)]
    for ax, (tit, (a, b), c) in zip(axs, casos):
        ax.fill([0, a[0], a[0] + b[0], b[0]], [0, a[1], a[1] + b[1], b[1]], color=c, alpha=.18)
        ax.plot([0, a[0], a[0] + b[0], b[0], 0], [0, a[1], a[1] + b[1], b[1], 0], color=c)
        ejes(ax, ((-.4, 4.0), (-.4, 3.4))); ax.set_title(tit, fontsize=12)
    guardar(fig, "det_operaciones.svg")


def cramer():
    a1 = np.array([2., 1]); a2 = np.array([1., 3]); x = np.array([1.5, 1.0]); b = x[0] * a1 + x[1] * a2
    fig, axs = plt.subplots(1, 2, figsize=(11, 4.4))
    ax = axs[0]
    ax.fill([0, a1[0], a1[0] + a2[0], a2[0]], [0, a1[1], a1[1] + a2[1], a2[1]], color=AZUL, alpha=.15)
    flecha(ax, (0, 0), a1, AZUL, r"$\mathbf{a}_1$", (.05, -.4)); flecha(ax, (0, 0), a2, VERDE, r"$\mathbf{a}_2$", (-.45, 0))
    ax.set_title(r"$\det A$ = área($\mathbf{a}_1,\mathbf{a}_2$)", fontsize=13); ejes(ax, ((-.5, 5.6), (-.5, 7.8)))
    ax = axs[1]
    ax.fill([0, b[0], b[0] + a2[0], a2[0]], [0, b[1], b[1] + a2[1], a2[1]], color=VINO, alpha=.15)
    flecha(ax, (0, 0), b, VINO, r"$\mathbf{b}=x_1\mathbf{a}_1+x_2\mathbf{a}_2$", (.1, -.6)); flecha(ax, (0, 0), a2, VERDE, r"$\mathbf{a}_2$", (-.45, 0))
    ax.set_title(r"$\det A_1$ = área($\mathbf{b},\mathbf{a}_2$) $= x_1\det A$", fontsize=13); ejes(ax, ((-.5, 5.6), (-.5, 7.8)))
    fig.text(.5, -.02, r"Por eso $x_1=\det A_1/\det A$: el área crece en el mismo factor $x_1$ (la parte $x_2\mathbf{a}_2$ no aporta área).", ha="center", fontsize=12)
    guardar(fig, "cramer.svg")


# ---------- Unidad 4 ----------
def vector_componentes():
    fig, ax = plt.subplots(figsize=(6.4, 4.6))
    v = np.array([-2.0, 2 * np.sqrt(3)])
    flecha(ax, (0, 0), v, VINO, r"$\mathbf{v}=(-2,\,2\sqrt{3})$", (-.9, .15), lw=2.8)
    ax.plot([v[0], v[0]], [0, v[1]], ls="--", color=GRIS); ax.plot([0, v[0]], [v[1], v[1]], ls="--", color=GRIS)
    th = np.linspace(0, 2 * np.pi / 3, 60); ax.plot(.8 * np.cos(th), .8 * np.sin(th), color=AZUL)
    ax.text(.55, .55, r"$\theta=120^\circ$", color=AZUL, fontsize=13)
    ax.text(-1.0, -.45, r"$a=-2$", color=GRIS, fontsize=12); ax.text(-3.1, 1.7, r"$b=2\sqrt{3}$", color=GRIS, fontsize=12)
    ax.text(.3, 3.4, r"$|\mathbf{v}|=\sqrt{4+12}=4$", color=VINO, fontsize=13)
    c = np.linspace(0, 2 * np.pi, 120); ax.plot(np.cos(c), np.sin(c), color=VERDE, lw=1, ls=":")
    flecha(ax, (0, 0), v / 4, VERDE, r"$\mathbf{u}=\mathbf{v}/|\mathbf{v}|$", (-1.75, -.25), lw=2)
    ejes(ax, ((-3.4, 2.6), (-.8, 4.2)))
    guardar(fig, "vector_componentes.svg")


def producto_cruz_3d():
    fig = plt.figure(figsize=(6.4, 5)); ax = fig.add_subplot(projection="3d")
    u = np.array([2., 0, 0]); v = np.array([.8, 1.8, 0]); w = np.cross(u, v) / 2
    ax.add_collection3d(Poly3DCollection([[(0, 0, 0), tuple(u), tuple(u + v), tuple(v)]], color=AZUL, alpha=.15))
    flecha3d(ax, (0, 0, 0), u, AZUL, r"$\mathbf{u}$", off=(.1, -.2, 0)); flecha3d(ax, (0, 0, 0), v, VERDE, r"$\mathbf{v}$", off=(0, .1, 0))
    flecha3d(ax, (0, 0, 0), w, VINO, r"$\mathbf{u}\times\mathbf{v}$", off=(.05, 0, .1), lw=3)
    ax.text(1.2, .8, 0, r"área $=\|\mathbf{u}\times\mathbf{v}\|$", fontsize=11)
    ax.text2D(.02, .92, "Regla de la mano derecha:\ndedos de u hacia v, el pulgar da u × v", transform=ax.transAxes, fontsize=11)
    ejes3d(ax); ax.set_xlim(-.3, 2.8); ax.set_ylim(-.3, 2.2); ax.set_zlim(0, 2); ax.view_init(22, -62)
    guardar(fig, "producto_cruz_3d.svg")


def paralelepipedo():
    fig = plt.figure(figsize=(6.2, 5)); ax = fig.add_subplot(projection="3d")
    u = np.array([2., 0, 0]); v = np.array([.6, 1.6, 0]); w = np.array([.5, .4, 1.4])
    O = np.zeros(3)
    caras = [[O, u, u + v, v], [w, u + w, u + v + w, v + w], [O, u, u + w, w], [v, u + v, u + v + w, v + w], [O, v, v + w, w], [u, u + v, u + v + w, u + w]]
    ax.add_collection3d(Poly3DCollection([[tuple(p) for p in c] for c in caras], color=AZUL, alpha=.08, edgecolor=GRIS, lw=.6))
    flecha3d(ax, O, u, AZUL, r"$\mathbf{v}$", off=(.1, -.2, 0)); flecha3d(ax, O, v, VERDE, r"$\mathbf{w}$", off=(0, .15, 0))
    flecha3d(ax, O, w, VINO, r"$\mathbf{u}$", off=(0, 0, .1))
    ax.text2D(.02, .92, r"$V=|\mathbf{u}\cdot(\mathbf{v}\times\mathbf{w})|$ = base × altura", transform=ax.transAxes, fontsize=12)
    ejes3d(ax); ax.view_init(20, -60); ax.set_xlim(0, 3); ax.set_ylim(0, 2.2); ax.set_zlim(0, 1.6)
    guardar(fig, "paralelepipedo.svg")


def rectas_posiciones():
    fig = plt.figure(figsize=(13, 4.2))
    t = np.linspace(-1.5, 1.5, 2)
    casos = [("Se cortan", ((0, 0, 0), (1, .3, .2)), ((0, 0, 0), (-.2, 1, .6)), True),
             ("Paralelas", ((0, 0, 0), (1, .5, .3)), ((0, .8, .8), (1, .5, .3)), False),
             ("Se cruzan (alabeadas)", ((0, 0, 0), (1, 0, 0)), ((0, 0, 1), (0, 1, 0)), False)]
    for k, (tit, (p1, v1), (p2, v2), corte) in enumerate(casos):
        ax = fig.add_subplot(1, 3, k + 1, projection="3d")
        for (p, v), c in (((p1, v1), AZUL), ((p2, v2), VINO)):
            p, v = np.array(p, float), np.array(v, float); L = p[:, None] + v[:, None] * t
            ax.plot(*L, color=c, lw=2.6)
        if corte:
            ax.scatter(0, 0, 0, color=TINTA, s=40)
        if k == 2:
            ax.plot([0, 0], [0, 0], [0, 1], ls=":", color=GRIS); ax.text(.05, 0, .5, "d > 0", color=GRIS)
        ax.set_title(tit, fontsize=13); ejes3d(ax); ax.view_init(22, -55)
        ax.set_xlim(-1.5, 1.5); ax.set_ylim(-1.5, 1.5); ax.set_zlim(-1, 1.5)
    guardar(fig, "rectas_posiciones.svg")


def planos_interseccion():
    fig = plt.figure(figsize=(6.4, 5)); ax = fig.add_subplot(projection="3d")
    n1 = np.array([0, 0, 1.]); n2 = np.array([0, 1, 1.])
    plano3d(ax, n1, 0, 1.6, AZUL, .16); plano3d(ax, n2, 0, 1.6, VINO, .16)
    ax.plot([-1.6, 1.6], [0, 0], [0, 0], color=TINTA, lw=3)
    flecha3d(ax, (1.2, -.9, 0), n1, AZUL, r"$\mathbf{n}_1$"); flecha3d(ax, (-1.2, .5, -.5), n2 / np.linalg.norm(n2), VINO, r"$\mathbf{n}_2$")
    flecha3d(ax, (-.6, 0, 0), (1.4, 0, 0), VERDE, r"$\mathbf{v}=\mathbf{n}_1\times\mathbf{n}_2$", lw=3, off=(-.3, 0, .15))
    ejes3d(ax); ax.view_init(22, -50); ax.set_zlim(-1.6, 1.6)
    guardar(fig, "planos_interseccion.svg")


def recta_plano():
    fig = plt.figure(figsize=(11, 4.4))
    for k, (tit, v) in enumerate((("La recta corta al plano en un punto", (.4, .3, 1.)), ("Recta paralela al plano: $\\mathbf{v}\\cdot\\mathbf{n}=0$", (1., .5, 0)))):
        ax = fig.add_subplot(1, 2, k + 1, projection="3d")
        plano3d(ax, (0, 0, 1), 0, 1.6, AZUL, .15)
        p = np.array([0, 0, 0.]) if k == 0 else np.array([-.6, -.3, .9]); v = np.array(v)
        t = np.linspace(-1.3, 1.3, 2); L = p[:, None] + v[:, None] * t
        ax.plot(*L, color=VINO, lw=2.6)
        if k == 0:
            ax.scatter(0, 0, 0, color=TINTA, s=40)
        flecha3d(ax, (1.1, -1.1, 0), (0, 0, .9), AMBAR, r"$\mathbf{n}$")
        ax.set_title(tit, fontsize=12); ejes3d(ax); ax.view_init(18, -55); ax.set_zlim(-1.3, 1.3)
    guardar(fig, "recta_plano.svg")


def distancia_punto_recta():
    fig, ax = plt.subplots(figsize=(6.6, 4))
    P = np.array([0., 0]); v = np.array([3., 1]); Q = np.array([1.2, 2.4])
    t = (Q - P) @ v / (v @ v); F = P + t * v
    ax.fill([0, v[0], v[0] + Q[0], Q[0]], [0, v[1], v[1] + Q[1], Q[1]], color=AZUL, alpha=.07)
    s = np.linspace(-.5, 1.8, 2); ax.plot(s * v[0], s * v[1], color=AZUL, lw=2)
    flecha(ax, P, v, AZUL, r"$\mathbf{v}$", (.1, -.35)); flecha(ax, P, Q, VERDE, r"$\overrightarrow{PQ}$", (-.8, .1))
    ax.plot([Q[0], F[0]], [Q[1], F[1]], color=VINO, lw=2.6); ax.text((Q[0] + F[0]) / 2 + .1, (Q[1] + F[1]) / 2, r"$D$", color=VINO, fontsize=15)
    for X, l in ((P, "P"), (Q, "Q")):
        ax.plot(*X, "o", color=TINTA); ax.text(X[0] - .25, X[1] + .1, l, fontsize=13)
    ax.text(2.1, 2.4, r"$D=\dfrac{\|\overrightarrow{PQ}\times\mathbf{v}\|}{\|\mathbf{v}\|}$" + "\n(altura del paralelogramo)", fontsize=12, color=TINTA)
    ejes(ax, ((-1.4, 5.0), (-.6, 3.8))); ax.set_xticks([]); ax.set_yticks([]); ax.axhline(0, color="none")
    guardar(fig, "distancia_punto_recta.svg")


# ---------- Unidad 5 ----------
def subespacios_r2():
    fig, axs = plt.subplots(1, 2, figsize=(11, 4.4))
    t = np.linspace(-2, 2.2, 2)
    ax = axs[0]; ax.plot(t, 2 * t, color=AZUL, lw=2.4)
    flecha(ax, (0, 0), (.6, 1.2), VINO, r"$\mathbf{u}$", (.1, -.1)); flecha(ax, (0, 0), (.4, .8), VERDE, None)
    flecha(ax, (0, 0), (1.0, 2.0), TINTA, r"$\mathbf{u}+\mathbf{v}$", (.1, 0), lw=1.4)
    ax.set_title(r"$W=\{y=2x\}$: subespacio (pasa por $\mathbf{0}$, es cerrado)", fontsize=12); ejes(ax, ((-2.2, 2.6), (-2.5, 4.5)))
    ax = axs[1]; ax.plot(t, t + 1.5, color=VINO, lw=2.4)
    u = np.array([.5, 2.]); w = np.array([1.5, 3.])
    flecha(ax, (0, 0), u, AZUL, r"$\mathbf{u}$", (-.4, 0)); flecha(ax, (0, 0), w, VERDE, r"$\mathbf{v}$", (.1, -.2))
    flecha(ax, (0, 0), u + w, TINTA, r"$\mathbf{u}+\mathbf{v}$ ¡fuera!", (-1.6, .15), lw=1.4)
    ax.plot(0, 0, "o", mfc="white", mec=VINO); ax.text(.1, -.4, r"$\mathbf{0}\notin W$", color=VINO)
    ax.set_title(r"$W=\{y=x+1.5\}$: no es subespacio", fontsize=12); ejes(ax, ((-2.2, 2.6), (-1, 5.6)))
    guardar(fig, "subespacios_r2.svg")


def gen_plano():
    fig = plt.figure(figsize=(6.4, 5)); ax = fig.add_subplot(projection="3d")
    v1 = np.array([1, 2, -1.]); v2 = np.array([3, 1, 2.])
    s, t = np.meshgrid(np.linspace(-1, 1.6, 2), np.linspace(-.6, 1.3, 2)); P = s[..., None] * v1 + t[..., None] * v2
    ax.plot_surface(P[..., 0], P[..., 1], P[..., 2], color=AZUL, alpha=.14, edgecolor=AZUL, lw=.4)
    flecha3d(ax, (0, 0, 0), v1, AZUL, r"$\mathbf{v}_1$"); flecha3d(ax, (0, 0, 0), v2, VERDE, r"$\mathbf{v}_2$")
    flecha3d(ax, (0, 0, 0), (5, 0, 5), VINO, r"$\mathbf{w}=-\mathbf{v}_1+2\mathbf{v}_2$", off=(-1.5, 0, .3))
    ax.text2D(.02, .92, r"gen$\{\mathbf{v}_1,\mathbf{v}_2\}$: el plano $x-y-z=0$", transform=ax.transAxes, fontsize=12)
    ejes3d(ax); ax.view_init(20, -35)
    guardar(fig, "gen_plano.svg")


def li_ld():
    fig = plt.figure(figsize=(11, 4.4))
    for k, (tit, vs) in enumerate((("Linealmente independientes:\nno caben en un plano", [(1, 0, 0), (0, 1, 0), (.3, .3, 1)]),
                                   ("Linealmente dependientes:\n$\\mathbf{v}_3=\\mathbf{v}_1+\\mathbf{v}_2$ (coplanares)", [(1, 0, 0), (0, 1, 0), (1, 1, 0)]))):
        ax = fig.add_subplot(1, 2, k + 1, projection="3d")
        plano3d(ax, (0, 0, 1), 0, 1.3, GRIS, .08)
        for v, c, l in zip(vs, (AZUL, VERDE, VINO), (r"$\mathbf{v}_1$", r"$\mathbf{v}_2$", r"$\mathbf{v}_3$")):
            flecha3d(ax, (0, 0, 0), v, c, l)
        ax.set_title(tit, fontsize=12); ejes3d(ax); ax.view_init(22, -55); ax.set_zlim(-.2, 1.2)
    guardar(fig, "li_ld.svg")


def coordenadas_base():
    fig, ax = plt.subplots(figsize=(6.4, 5))
    b1 = np.array([2., 1]); b2 = np.array([1., 2]); v = 1 * b1 + 2 * b2
    for k in range(-2, 5):
        p = np.array([k * b1 + s * b2 for s in (-2, 5)]); ax.plot(p[:, 0], p[:, 1], color="#c7d2fe", lw=.8)
        p = np.array([s * b1 + k * b2 for s in (-2, 5)]); ax.plot(p[:, 0], p[:, 1], color="#c7d2fe", lw=.8)
    flecha(ax, (0, 0), b1, AZUL, r"$\mathbf{b}_1$", (.05, -.45)); flecha(ax, (0, 0), b2, VERDE, r"$\mathbf{b}_2$", (-.5, 0))
    flecha(ax, b1, 2 * b2, VERDE, None, lw=1.2)
    flecha(ax, (0, 0), v, VINO, r"$\mathbf{v}=(4,5)$", (.15, -.35), lw=3)
    ax.text(-.8, 6.3, r"$\mathbf{v}=1\,\mathbf{b}_1+2\,\mathbf{b}_2\;\Rightarrow\;[\mathbf{v}]_B=(1,2)$", fontsize=12)
    ejes(ax, ((-1, 6.5), (-1, 6.9)))
    guardar(fig, "coordenadas_base.svg")


def rango_nulidad():
    fig, ax = plt.subplots(figsize=(10, 4.2))
    ax.add_patch(Ellipse((2, 2), 3.6, 3.4, fc="#eef3f9", ec=AZUL, lw=1.5)); ax.text(2, 4.0, r"$\mathbb{R}^n$ (dominio)", ha="center", fontsize=13, color=AZUL)
    ax.add_patch(Ellipse((8, 2), 3.6, 3.4, fc="#faf0f1", ec=VINO, lw=1.5)); ax.text(8, 4.0, r"$\mathbb{R}^m$ (llegada)", ha="center", fontsize=13, color=VINO)
    ax.add_patch(Ellipse((1.6, 1.4), 1.6, 1.0, fc="#dcfce7", ec=VERDE, lw=1.4)); ax.text(1.6, 1.4, r"$N_A$" + "\n" + r"dim $=\nu(A)$", ha="center", va="center", fontsize=11)
    ax.add_patch(Ellipse((8, 2.2), 2.4, 1.5, fc="#fef3c7", ec=AMBAR, lw=1.4)); ax.text(8, 2.2, r"$C_A$ = imagen" + "\n" + r"dim $=\rho(A)$", ha="center", va="center", fontsize=11)
    ax.plot(8, 1.0, "o", color=TINTA); ax.text(8.15, .75, r"$\mathbf{0}$", fontsize=13)
    ax.add_patch(FancyArrowPatch((2.2, 1.3), (7.85, 1.0), connectionstyle="arc3,rad=.25", arrowstyle="-|>", mutation_scale=16, color=VERDE, lw=1.6))
    ax.add_patch(FancyArrowPatch((2.6, 2.9), (7.6, 2.6), connectionstyle="arc3,rad=-.2", arrowstyle="-|>", mutation_scale=16, color=AMBAR, lw=1.6))
    ax.text(5, 3.55, r"$\mathbf{x}\mapsto A\mathbf{x}$", ha="center", fontsize=14)
    ax.text(5, -.15, r"$\rho(A)+\nu(A)=n$", ha="center", fontsize=15, color=TINTA)
    ax.set_xlim(0, 10); ax.set_ylim(-.5, 4.4); ax.axis("off")
    guardar(fig, "rango_nulidad.svg")


def gram_schmidt():
    fig, ax = plt.subplots(figsize=(6.6, 4.4))
    u1 = np.array([3., .6]); u2 = np.array([1.4, 2.4]); p = (u2 @ u1) / (u1 @ u1) * u1; v2 = u2 - p
    flecha(ax, (0, 0), u1, AZUL, r"$\mathbf{v}_1=\mathbf{u}_1$", (-.5, -.5)); flecha(ax, (0, 0), u2, GRIS, r"$\mathbf{u}_2$", (-.45, .05))
    flecha(ax, (0, 0), p, VERDE, r"proy$_{\mathbf{v}_1}\mathbf{u}_2$", (-.6, .25), lw=1.6)
    flecha(ax, (0, 0), v2, VINO, r"$\mathbf{v}_2=\mathbf{u}_2-$proy", (-2.4, .1), lw=3)
    ax.plot([u2[0], p[0]], [u2[1], p[1]], ls="--", color=GRIS)
    ax.text(1.6, -.75, r"$\mathbf{v}_1\perp\mathbf{v}_2$; luego se normaliza: $\mathbf{w}_i=\mathbf{v}_i/\|\mathbf{v}_i\|$", fontsize=12)
    ejes(ax, ((-2.2, 4.0), (-1.0, 3.0))); ax.set_xticks([]); ax.set_yticks([])
    guardar(fig, "gram_schmidt.svg")


# ---------- Unidad 6 ----------
F_FORMA = np.array([[0, 0], [.4, 0], [.4, .8], [.9, .8], [.9, 1.15], [.4, 1.15], [.4, 1.55], [1.1, 1.55], [1.1, 1.9], [0, 1.9], [0, 0]]).T


def dibujar_F(ax, M, color, tit, lim=((-2.1, 2.8), (-.5, 2.8))):
    ax.fill(*F_FORMA, color=GRIS, alpha=.15); ax.plot(*F_FORMA, color=GRIS, lw=.8)
    G = M @ F_FORMA; ax.fill(*G, color=color, alpha=.3); ax.plot(*G, color=color, lw=3 if abs(np.linalg.det(M)) < 1e-9 else 1.4)
    ejes(ax, lim); ax.set_title(tit, fontsize=12); ax.set_xticks([]); ax.set_yticks([])


def tl_galeria():
    c, s = np.cos(np.pi / 2), np.sin(np.pi / 2)
    mats = [(np.array([[c, -s], [s, c]]), AZUL, "Rotación 90°\n[[0,−1],[1,0]]"),
            (np.array([[-1, 0], [0, 1]]), VINO, "Reflexión eje y\n[[−1,0],[0,1]]"),
            (np.array([[1, .8], [0, 1]]), VERDE, "Cizalla\n[[1,0.8],[0,1]]"),
            (np.array([[1, 0], [0, 0]]), AMBAR, "Proyección eje x\n[[1,0],[0,0]]")]
    fig, axs = plt.subplots(1, 4, figsize=(14, 3.9))
    for ax, (M, col, t) in zip(axs, mats):
        dibujar_F(ax, M, col, t)
    fig.text(.5, -.02, "Gris: figura original. Color: su imagen T(x) = Ax. Las rectas van a rectas y el origen queda fijo.", ha="center", fontsize=12)
    guardar(fig, "tl_galeria.svg")


def nucleo_imagen():
    fig, ax = plt.subplots(figsize=(6.4, 5))
    t = np.linspace(-2.4, 2.4, 2)
    ax.plot(t, t, color=AMBAR, lw=2.6, label="Imagen: recta y = x")
    ax.plot(t, -t, color=VERDE, lw=2.6, label="Núcleo: recta y = −x (va a 0)")
    P = 0.5 * np.array([[1, 1], [1, 1]])
    for x in ([2, .5], [-.5, 1.8], [1, -1.6]):
        x = np.array(x, float); y = P @ x
        ax.plot(*x, "o", color=AZUL); ax.add_patch(FancyArrowPatch(tuple(x), tuple(y), arrowstyle="-|>", mutation_scale=13, color=AZUL, lw=1.2, ls="--"))
    ax.plot(0, 0, "o", color=TINTA)
    ax.set_title("Proyección sobre la recta y = x", fontsize=13)
    ax.legend(loc="lower right", frameon=False, fontsize=11); ejes(ax, ((-2.5, 2.6), (-2.5, 2.6)))
    guardar(fig, "nucleo_imagen.svg")


def composicion():
    T = np.array([[1, .8], [0, 1]]); S = np.array([[0, -1], [1, 0]])
    fig, axs = plt.subplots(1, 3, figsize=(12, 3.9))
    dibujar_F(axs[0], T, VERDE, "Primero T (cizalla)")
    dibujar_F(axs[1], S, AZUL, "Luego S (rotación 90°)")
    dibujar_F(axs[2], S @ T, VINO, "S∘T: matriz  A_S A_T")
    guardar(fig, "composicion.svg")


# ---------- Unidad 7 ----------
def eigen_circulo():
    A = np.array([[2., 1], [1, 2]])
    fig, axs = plt.subplots(1, 2, figsize=(11, 4.6))
    th = np.linspace(0, 2 * np.pi, 200); C = np.vstack([np.cos(th), np.sin(th)])
    for ax, pts, tit, col in ((axs[0], C, r"Círculo unitario: vectores $\mathbf{x}$", AZUL), (axs[1], A @ C, r"Imagen $A\mathbf{x}$: una elipse", VINO)):
        ax.plot(*pts, color=col, lw=2); ejes(ax, ((-3.4, 3.4), (-3.4, 3.4))); ax.set_title(tit, fontsize=13)
    e1 = np.array([1, 1]) / np.sqrt(2); e2 = np.array([-1, 1]) / np.sqrt(2)
    flecha(axs[0], (0, 0), e1, VERDE, r"$(1,1)$", (.05, .05)); flecha(axs[0], (0, 0), e2, AMBAR, r"$(-1,1)$", (-.9, .05))
    flecha(axs[1], (0, 0), 3 * e1, VERDE, r"$\lambda=3$", (.05, .05)); flecha(axs[1], (0, 0), e2, AMBAR, r"$\lambda=1$", (-.8, .1))
    fig.text(.5, -.02, r"$A=\begin{pmatrix}2&1\\1&2\end{pmatrix}$ estira por 3 en la dirección $(1,1)$ y por 1 en la dirección $(-1,1)$".replace(r"$A=\begin{pmatrix}2&1\\1&2\end{pmatrix}$", "A = [[2,1],[1,2]]"), ha="center", fontsize=12)
    guardar(fig, "eigen_circulo.svg")


def diagonalizacion():
    A = np.array([[1., 1], [-2, 4]])
    fig, ax = plt.subplots(figsize=(6.6, 4.8))
    x = np.array([1., -0.3]); pts = [x]
    for _ in range(6):
        x = A @ x; pts.append(x)
    cols = plt.cm.viridis(np.linspace(0, .9, len(pts)))
    for k, (p, c) in enumerate(zip(pts, cols)):
        u = p / np.linalg.norm(p)
        flecha(ax, (0, 0), u, c, None, lw=1.8)
        if k == 0:
            ax.text(u[0] + .03, u[1] - .12, r"$\mathbf{x}$", color=c, fontsize=14)
        if k == len(pts) - 1:
            ax.text(u[0] - .55, u[1] - .05, r"$A^{6}\mathbf{x}$", color=c, fontsize=14)
    d = np.array([1, 2.]) / np.sqrt(5); t = np.linspace(-1.2, 1.2, 2)
    ax.plot(t * d[0], t * d[1], ls=":", color=VINO, lw=1.5); ax.text(.52, .45, r"dirección propia" + "\n" + r"de $\lambda=3$", color=VINO, fontsize=11)
    ax.set_title("Direcciones (normalizadas) de $A^k\\mathbf{x}$: se alinean\ncon el vector propio del valor propio de mayor $|\\lambda|$", fontsize=11)
    ejes(ax, ((-1.2, 1.4), (-1.2, 1.3)))
    guardar(fig, "diagonalizacion.svg")


if __name__ == "__main__":
    for f in (planos_3x3, particular_homogenea, suma_vectores, producto_fila_columna, columnas_plano, inversa_flechas, transpuesta,
              det_area, sarrus, det_operaciones, cramer, vector_componentes, producto_cruz_3d, paralelepipedo, rectas_posiciones,
              planos_interseccion, recta_plano, distancia_punto_recta, subespacios_r2, gen_plano, li_ld, coordenadas_base,
              rango_nulidad, gram_schmidt, tl_galeria, nucleo_imagen, composicion, eigen_circulo, diagonalizacion):
        f()
        print("ok", f.__name__)


def tl_escala_traslacion():
    fig, axs = plt.subplots(1, 2, figsize=(11, 4.3))
    dibujar_F(axs[0], np.array([[2, 0], [0, 3]]), AZUL, "Lineal: T(x,y) = (2x, 3y)\nestira; el origen queda fijo", lim=((-.5, 3.0), (-.5, 6.0)))
    ax = axs[1]
    ax.fill(*F_FORMA, color=GRIS, alpha=.15); ax.plot(*F_FORMA, color=GRIS, lw=.8)
    G = F_FORMA + np.array([[2], [1]]); ax.fill(*G, color=VINO, alpha=.3); ax.plot(*G, color=VINO, lw=1.4)
    ax.plot(0, 0, "o", color=TINTA); ax.plot(2, 1, "o", color=VINO)
    ax.add_patch(FancyArrowPatch((0, 0), (2, 1), arrowstyle="-|>", mutation_scale=14, color=VINO, ls="--"))
    ax.text(1.0, .15, "T(0,0) = (2,1)", color=VINO, fontsize=11)
    ejes(ax, ((-.5, 3.6), (-.5, 3.4))); ax.set_title("No lineal: T(x,y) = (x+2, y+1)\ntraslada; el origen se mueve", fontsize=12); ax.set_xticks([]); ax.set_yticks([])
    guardar(fig, "tl_escala_traslacion.svg")


if __name__ == "__main__":
    tl_escala_traslacion()
