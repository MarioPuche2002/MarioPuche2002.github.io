"""Figuras de las diapositivas «En la vida real» de Álgebra Lineal.

Uso:  python generar_figuras_aplicaciones.py
Requiere numpy, scipy, matplotlib y scikit-image (las fotografías de ejemplo
vienen de skimage.data y son de dominio público o CC0).
"""
from pathlib import Path

import matplotlib
import numpy as np

matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyArrowPatch, Polygon
from matplotlib.transforms import Affine2D
from scipy.fft import dctn, idctn
from skimage import data

OUT = Path(__file__).parent
AZUL, VINO, VERDE, GRIS, AMBAR = "#1f4e79", "#8c1d2c", "#0f766e", "#6b7280", "#b45309"
plt.rcParams.update({
    "font.family": "DejaVu Sans", "font.size": 12, "axes.edgecolor": GRIS,
    "axes.labelcolor": "#1b2430", "xtick.color": GRIS, "ytick.color": GRIS,
    "svg.fonttype": "path", "figure.facecolor": "none", "axes.facecolor": "none",
})

GATO = data.chelsea().astype(float)            # 300 x 451 x 3
CAFE = data.coffee().astype(float)[50:350, 75:526]
PESOS_GRIS = np.array([0.30, 0.59, 0.11])
GRIS_GATO = GATO @ PESOS_GRIS
GATO_CUAD = GATO[:, 90:390]                    # recorte cuadrado 300 x 300


def guardar(fig, nombre, dpi=110):
    fig.savefig(OUT / nombre, bbox_inches="tight", dpi=dpi, transparent=nombre.endswith(".svg"),
                facecolor="white" if nombre.endswith(".png") else "none")
    plt.close(fig)


def mostrar(ax, img, titulo, gris=False):
    img = np.clip(img, 0, 255)
    if gris:
        ax.imshow(img, cmap="gray", vmin=0, vmax=255)
    else:
        ax.imshow(img.astype(np.uint8))
    ax.set_title(titulo, fontsize=13, color="#1b2430")
    ax.axis("off")


def flecha(ax, o, v, color, label=None, off=(0.1, 0.1), lw=2.4, fs=14):
    ax.annotate("", xy=(o[0] + v[0], o[1] + v[1]), xytext=o,
                arrowprops=dict(arrowstyle="-|>", color=color, lw=lw, mutation_scale=18))
    if label:
        ax.text(o[0] + v[0] + off[0], o[1] + v[1] + off[1], label, color=color, fontsize=fs)


# ---------------------------------------------------------------- Clase 1
def parabola():
    fig, ax = plt.subplots(figsize=(7, 3.8))
    x = np.linspace(-0.2, 4.2, 200)
    ax.plot(x, -x**2 + 4 * x + 1, color=AZUL, lw=2.5)
    for p in [(0, 1), (1, 4), (3, 4)]:
        ax.plot(*p, "o", color=VINO, ms=9)
        ax.annotate(f"{p}", p, textcoords="offset points", xytext=(8, -16), color=VINO, fontsize=12)
    ax.plot(2, 5, "*", color=AMBAR, ms=14)
    ax.annotate("altura máxima (2, 5)", (2, 5), textcoords="offset points", xytext=(10, 4), color=AMBAR)
    ax.set_xlabel("distancia (m)"); ax.set_ylabel("altura (m)")
    ax.set_ylim(0, 6); ax.grid(color="#e5e7eb", lw=.6)
    for s in ["top", "right"]:
        ax.spines[s].set_visible(False)
    guardar(fig, "app_parabola.svg")


# ---------------------------------------------------------------- Clase 3
def imagen_matriz():
    fig = plt.figure(figsize=(12, 4.6))
    ax1 = fig.add_axes([0.0, 0.0, 0.42, 1])
    ax2 = fig.add_axes([0.47, 0.0, 0.53, 1])
    ax1.imshow(GRIS_GATO, cmap="gray", vmin=0, vmax=255)
    f0, c0, n = 120, 200, 8
    ax1.add_patch(plt.Rectangle((c0 - .5, f0 - .5), n, n, fill=False, ec="#ef4444", lw=2))
    ax1.set_title("Imagen de 300 × 451 píxeles", fontsize=13); ax1.axis("off")
    bloque = np.round(GRIS_GATO[f0:f0 + n, c0:c0 + n]).astype(int)
    ax2.imshow(bloque, cmap="gray", vmin=0, vmax=255)
    for i in range(n):
        for j in range(n):
            v = bloque[i, j]
            ax2.text(j, i, str(v), ha="center", va="center", fontsize=11,
                     color="white" if v < 130 else "black")
    ax2.set_title("Recuadro rojo ampliado: una matriz 8 × 8", fontsize=13)
    ax2.set_xticks(range(n)); ax2.set_yticks(range(n))
    ax2.set_xticklabels(range(1, n + 1)); ax2.set_yticklabels(range(1, n + 1))
    ax2.tick_params(length=0)
    guardar(fig, "app_imagen_matriz.png")


def canales_rgb():
    fig, axs = plt.subplots(1, 4, figsize=(13, 2.9))
    mostrar(axs[0], GATO, "Imagen a color")
    for k, (nom, cm) in enumerate([("R (rojo)", "Reds_r"), ("G (verde)", "Greens_r"), ("B (azul)", "Blues_r")]):
        axs[k + 1].imshow(GATO[:, :, k], cmap="gray", vmin=0, vmax=255)
        axs[k + 1].set_title(f"Matriz {nom}", fontsize=13); axs[k + 1].axis("off")
    guardar(fig, "app_rgb.png")


def operaciones():
    A = GRIS_GATO
    fig, axs = plt.subplots(1, 5, figsize=(15, 2.8))
    mostrar(axs[0], A, "A", True)
    mostrar(axs[1], A + 70, "A + 70·J  (brillo)", True)
    mostrar(axs[2], 1.6 * (A - 128) + 128, "contraste", True)
    mostrar(axs[3], 255 - A, "255·J − A  (negativo)", True)
    mostrar(axs[4], 0.5 * A + 0.5 * (CAFE @ PESOS_GRIS), "0.5A + 0.5B  (fundido)", True)
    guardar(fig, "app_operaciones.png")


# ---------------------------------------------------------------- Clase 4
SEPIA = np.array([[0.393, 0.769, 0.189], [0.349, 0.686, 0.168], [0.272, 0.534, 0.131]])
PERMUTA = np.array([[0, 0, 1], [0, 1, 0], [1, 0, 0]])


def filtros():
    fig, axs = plt.subplots(1, 4, figsize=(13, 2.9))
    mostrar(axs[0], GATO, "Original")
    mostrar(axs[1], GRIS_GATO, "Gris: w·(r, g, b)", True)
    mostrar(axs[2], GATO @ SEPIA.T, "Sepia: S·(r, g, b)")
    mostrar(axs[3], GATO @ PERMUTA.T, "Permutación: P·(r, g, b)")
    guardar(fig, "app_filtros.png")


# ---------------------------------------------------------------- Clase 6
MEZCLA = np.array([[0.2, 0.7, 0.1], [0.5, 0.1, 0.4], [0.3, 0.3, 0.4]])


def inversa_imagen():
    mezclada = GATO @ MEZCLA.T
    recuperada = mezclada @ np.linalg.inv(MEZCLA).T
    fig, axs = plt.subplots(1, 3, figsize=(11, 2.9))
    mostrar(axs[0], GATO, "Original  x")
    mostrar(axs[1], mezclada, "Cifrada  y = Mx")
    mostrar(axs[2], recuperada, "Recuperada  x = M⁻¹y")
    guardar(fig, "app_inversa.png")


# ---------------------------------------------------------------- Clase 7
def transpuesta_imagen():
    A = GRIS_GATO
    fig, axs = plt.subplots(1, 3, figsize=(12, 3.6), gridspec_kw={"width_ratios": [451, 300, 300]})
    mostrar(axs[0], A, "A  (300 × 451)", True)
    mostrar(axs[1], A.T, "Aᵀ  (451 × 300)", True)
    mostrar(axs[2], A.T[:, ::-1], "Aᵀ con columnas invertidas", True)
    guardar(fig, "app_transpuesta.png")


# ---------------------------------------------------------------- Clase 8
def lote():
    fig, ax = plt.subplots(figsize=(5.4, 4.4))
    P = np.array([(1, 1), (7, 2), (6, 6), (2, 5)])
    ax.add_patch(Polygon(P, closed=True, fc="#d9f0e6", ec=VERDE, lw=2))
    for (x, y), nom, off in zip(P, ["P₁", "P₂", "P₃", "P₄"], [(-30, -16), (6, -12), (6, 6), (-30, 6)]):
        ax.plot(x, y, "o", color=VINO, ms=7)
        ax.annotate(f"{nom}({x}, {y})", (x, y), textcoords="offset points", xytext=off, color=VINO)
    ax.set_xlim(0, 8.5); ax.set_ylim(0, 7.2); ax.set_aspect("equal"); ax.grid(color="#e5e7eb", lw=.6)
    ax.set_xlabel("decenas de metros"); ax.set_ylabel("decenas de metros")
    for s in ["top", "right"]:
        ax.spines[s].set_visible(False)
    guardar(fig, "app_lote.svg")


# ------------------------------------------------- Transformar una imagen
def dibujar_transformada(ax, img, M, titulo, lim=2.4, gris=False):
    """Dibuja la imagen sobre el cuadrado [0,1]x[0,1] transformada por M (2x2)."""
    h, w = img.shape[:2]
    escala = 1 / max(h, w)
    base = Affine2D().scale(escala, -escala).translate(0, h * escala)
    T = Affine2D(np.array([[M[0][0], M[0][1], 0], [M[1][0], M[1][1], 0], [0, 0, 1]]))
    kw = dict(cmap="gray", vmin=0, vmax=255) if gris else {}
    im = ax.imshow(np.clip(img, 0, 255).astype(np.uint8) if not gris else img, interpolation="bilinear", **kw)
    im.set_transform(base + T + ax.transData)
    im.set_zorder(3)
    ax.axhline(0, color=GRIS, lw=.8); ax.axvline(0, color=GRIS, lw=.8)
    lo, hi = (-lim, lim) if np.isscalar(lim) else lim
    ax.set_xlim(lo, hi); ax.set_ylim(lo, hi); ax.set_aspect("equal")
    ax.grid(color="#e5e7eb", lw=.6)
    ax.tick_params(labelsize=9)
    for s in ax.spines.values():
        s.set_visible(False)
    e1, e2 = np.array(M)[:, 0], np.array(M)[:, 1]
    flecha(ax, (0, 0), e1, VINO, lw=2)
    flecha(ax, (0, 0), e2, AZUL, lw=2)
    ax.set_title(titulo, fontsize=12.5)


def det_imagen():
    casos = [([[1, 0], [0, 1]], "Original · det = 1"),
             ([[2, 0], [0, 2]], "Escalar ×2 · det = 4"),
             ([[1, 0.8], [0, 1]], "Cizalla · det = 1"),
             ([[-1, 0], [0, 1]], "Espejo · det = −1")]
    fig, axs = plt.subplots(1, 4, figsize=(15, 4.1))
    for ax, (M, t) in zip(axs, casos):
        dibujar_transformada(ax, GATO_CUAD, M, t, lim=(-1.2, 2.2))
    guardar(fig, "app_det_imagen.png")


def det_cero():
    fig, axs = plt.subplots(1, 2, figsize=(9, 3.9))
    dibujar_transformada(axs[0], GATO_CUAD, [[1, 0], [0, 1]], "Original", lim=(-0.3, 1.6))
    M = np.array([[1, 0.5], [0.5, 0.25]])          # det = 0
    pequeña = GATO_CUAD[::4, ::4] / 255
    ys, xs = np.mgrid[0:pequeña.shape[0], 0:pequeña.shape[1]]
    pts = np.stack([xs.ravel() / pequeña.shape[1], 1 - ys.ravel() / pequeña.shape[0]])
    q = M @ pts
    axs[1].scatter(q[0], q[1], c=pequeña.reshape(-1, 3), s=6)
    axs[1].axhline(0, color=GRIS, lw=.8); axs[1].axvline(0, color=GRIS, lw=.8)
    axs[1].set_xlim(-0.3, 1.6); axs[1].set_ylim(-0.3, 1.6); axs[1].set_aspect("equal")
    axs[1].grid(color="#e5e7eb", lw=.6); axs[1].tick_params(labelsize=9)
    for s in axs[1].spines.values():
        s.set_visible(False)
    axs[1].set_title("det = 0: toda la imagen cae en una recta", fontsize=12.5)
    guardar(fig, "app_det_cero.png")


# ---------------------------------------------------------------- Clase 11
def avion():
    fig, ax = plt.subplots(figsize=(4.6, 5))
    flecha(ax, (0, 0), (0, 200), AZUL, "v = (0, 200)", off=(-95, 8))
    flecha(ax, (0, 200), (40, 0), AMBAR, "w = (40, 0)", off=(-10, 10))
    flecha(ax, (0, 0), (40, 200), VINO, "v + w", off=(5, -60))
    ax.set_xlim(-110, 110); ax.set_ylim(-10, 240); ax.set_aspect("equal")
    ax.set_xlabel("este (km/h)"); ax.set_ylabel("norte (km/h)")
    ax.grid(color="#e5e7eb", lw=.6)
    for s in ["top", "right"]:
        ax.spines[s].set_visible(False)
    guardar(fig, "app_avion.svg")


# ---------------------------------------------------------------- Clase 12
def normal_triangulo():
    fig = plt.figure(figsize=(5.5, 4.6))
    ax = fig.add_subplot(projection="3d")
    P, Q, R = np.array([1, 0, 0]), np.array([0, 2, 0]), np.array([0, 0, 2])
    from mpl_toolkits.mplot3d.art3d import Poly3DCollection
    ax.add_collection3d(Poly3DCollection([[P, Q, R]], fc="#cfe0f1", ec=AZUL, lw=1.5, alpha=.85))
    c = (P + Q + R) / 3
    n = np.cross(Q - P, R - P) / np.linalg.norm(np.cross(Q - P, R - P))
    ax.quiver(*c, *(1.3 * n), color=VINO, lw=3, arrow_length_ratio=.15)
    ax.text(*(c + 1.45 * n), "n = (4, 2, 2)", color=VINO, fontsize=13)
    L = np.array([1, 1, 1]) / np.sqrt(3)
    ax.quiver(*(c + 1.6 * L + [0, -.5, .3]), *(-1.1 * L), color=AMBAR, lw=3, arrow_length_ratio=.15)
    ax.text(*(c + 1.7 * L + [0, -.5, .35]), "luz", color=AMBAR, fontsize=14)
    for p, nom in zip([P, Q, R], "PQR"):
        ax.text(*p, nom, color="#1b2430", fontsize=13)
    ax.set_xlim(0, 2); ax.set_ylim(0, 2); ax.set_zlim(0, 2)
    ax.set_xlabel("x"); ax.set_ylabel("y"); ax.set_zlabel("z")
    ax.view_init(20, 10)
    guardar(fig, "app_normal.svg")


# ---------------------------------------------------------------- Clase 13
def dron():
    fig = plt.figure(figsize=(5.6, 4.6))
    ax = fig.add_subplot(projection="3d")
    P, d = np.array([2, 1, 0]), np.array([3, 2, 4])
    t = np.linspace(0, 2.4, 50)
    L = P[:, None] + d[:, None] * t
    ax.plot(*L, color=AZUL, lw=2.5)
    for k in [0, 1, 2]:
        q = P + k * d
        ax.scatter(*q, color=VINO, s=40)
        ax.text(*(q + [0.4, 0, 0.6]), f"t = {k}: {tuple(int(v) for v in q)}", color=VINO, fontsize=10.5, ha="left")
    ax.quiver(*P, *d, color=AMBAR, lw=2, arrow_length_ratio=.15)
    ax.set_xlabel("x (m)"); ax.set_ylabel("y (m)"); ax.set_zlabel("altura (m)")
    ax.view_init(18, -60)
    guardar(fig, "app_dron.svg")


# ---------------------------------------------------------------- Clase 14
def rayo():
    fig = plt.figure(figsize=(5.8, 4.6))
    ax = fig.add_subplot(projection="3d")
    xx, yy = np.meshgrid(np.linspace(0, 6, 2), np.linspace(0, 7, 2))
    ax.plot_surface(xx, yy, 0 * xx, color="#d9f0e6", alpha=.6)
    C, d = np.array([1, 2, 6]), np.array([1, 1, -2])
    X = C + 3 * d
    ax.plot(*np.c_[C, X], color=AMBAR, lw=2.5)
    ax.scatter(*C, color=AZUL, s=50); ax.text(*(C + [0, 0, .4]), "cámara (1, 2, 6)", color=AZUL)
    ax.scatter(*X, color=VINO, s=50); ax.text(*(X + [0.3, 0, .9]), "choque (4, 5, 0)", color=VINO)
    ax.text(4.5, 0.3, 0.1, "piso: z = 0", color=VERDE)
    ax.set_xlabel("x"); ax.set_ylabel("y"); ax.set_zlabel("z"); ax.set_zlim(0, 6.5)
    ax.view_init(18, -55)
    guardar(fig, "app_rayo.svg")


# ---------------------------------------------------------------- Clase 15
def minimos_cuadrados():
    x = np.array([1, 2, 3, 4, 5.]); y = np.array([2.0, 2.8, 3.1, 3.9, 4.5])
    fig, ax = plt.subplots(figsize=(6.4, 3.9))
    xs = np.linspace(0.5, 5.5, 10)
    ax.plot(xs, 1.43 + 0.61 * xs, color=AZUL, lw=2.5, label="y = 1.43 + 0.61x")
    for xi, yi in zip(x, y):
        ax.plot([xi, xi], [yi, 1.43 + 0.61 * xi], color=AMBAR, lw=1.5, ls="--")
    ax.plot(x, y, "o", color=VINO, ms=8, label="datos")
    ax.set_xlabel("horas de estudio"); ax.set_ylabel("nota"); ax.legend(frameon=False)
    ax.grid(color="#e5e7eb", lw=.6)
    for s in ["top", "right"]:
        ax.spines[s].set_visible(False)
    guardar(fig, "app_minimos.svg")


# ---------------------------------------------------------------- Clase 16
def cubo_rgb():
    fig = plt.figure(figsize=(5.4, 4.6))
    ax = fig.add_subplot(projection="3d")
    for a in [0, 1]:
        for b in [0, 1]:
            ax.plot([0, 1], [a, a], [b, b], color="#d1d5db", lw=.8)
            ax.plot([a, a], [0, 1], [b, b], color="#d1d5db", lw=.8)
            ax.plot([a, a], [b, b], [0, 1], color="#d1d5db", lw=.8)
    colores = {"rojo": (1, 0, 0), "verde": (0, 1, 0), "azul": (0, 0, 1), "amarillo": (1, 1, 0),
               "cian": (0, 1, 1), "magenta": (1, 0, 1), "blanco": (1, 1, 1), "naranja": (1, .5, 0)}
    for nom, c in colores.items():
        ax.scatter(*c, color=c, s=140, edgecolors="#374151")
        ax.text(c[0] + .05, c[1] + .05, c[2] + .05, nom, fontsize=10)
    ax.scatter(0, 0, 0, color="black", s=80); ax.text(0, 0, -.12, "negro", fontsize=10)
    ax.set_xlabel("R"); ax.set_ylabel("G"); ax.set_zlabel("B")
    ax.view_init(22, 30)
    guardar(fig, "app_cubo_rgb.svg")


# ---------------------------------------------------------------- Clase 17-18
def mezcla_colores():
    combos = [((1, 0, 0), "1·R"), ((1, 1, 0), "R + G"), ((1, .5, 0), "R + 0.5G"),
              ((.5, 0, .5), "0.5R + 0.5B"), ((.2, .6, .9), "0.2R + 0.6G + 0.9B"), ((1, 1, 1), "R + G + B")]
    fig, axs = plt.subplots(1, len(combos), figsize=(13, 2.2))
    for ax, (c, t) in zip(axs, combos):
        ax.add_patch(plt.Rectangle((0, 0), 1, 1, color=c, ec="#374151"))
        ax.set_xlim(0, 1); ax.set_ylim(0, 1); ax.set_aspect("equal"); ax.axis("off")
        ax.set_title(t, fontsize=12)
    guardar(fig, "app_mezcla_colores.svg")


def colores_dependientes():
    fig, axs = plt.subplots(1, 3, figsize=(8, 2.3))
    for ax, (c, t) in zip(axs, [((1, 0, 0), "rojo (1, 0, 0)"), ((0, 1, 0), "verde (0, 1, 0)"),
                                ((1, 1, 0), "amarillo (1, 1, 0)")]):
        ax.add_patch(plt.Rectangle((0, 0), 1, 1, color=c, ec="#374151"))
        ax.set_xlim(0, 1); ax.set_ylim(0, 1); ax.set_aspect("equal"); ax.axis("off")
        ax.set_title(t, fontsize=12)
    guardar(fig, "app_colores_dependientes.svg")


# ---------------------------------------------------------------- Clase 19
def dct_jpeg():
    N = 8
    fig = plt.figure(figsize=(14, 4.0))
    gs = fig.add_gridspec(N, N + 31, wspace=.08, hspace=.08)
    for u in range(N):
        for v in range(N):
            E = np.zeros((N, N)); E[u, v] = 1
            ax = fig.add_subplot(gs[u, v])
            ax.imshow(idctn(E, norm="ortho"), cmap="gray"); ax.axis("off")
    fig.text(0.13, 0.93, "Base del JPEG: 64 imágenes de 8 × 8", ha="center", fontsize=12.5)
    A = GRIS_GATO[96:192, 168:264]                  # recorte de 96 x 96 alrededor de un ojo
    b = A.reshape(12, N, 12, N).transpose(0, 2, 1, 3)
    coef = dctn(b, axes=(2, 3), norm="ortho")
    orden = np.argsort(np.add.outer(np.arange(N), np.arange(N)).ravel(), kind="stable")
    for k, (keep, titulo) in enumerate([(64, "Original (64 de 64)"), (10, "10 de 64 coeficientes"),
                                         (3, "3 de 64 coeficientes")]):
        mascara = np.zeros(N * N, bool); mascara[orden[:keep]] = True
        rec = idctn(coef * mascara.reshape(N, N), axes=(2, 3), norm="ortho").transpose(0, 2, 1, 3).reshape(96, 96)
        ax = fig.add_subplot(gs[:, N + 2 + k * 10: N + 11 + k * 10])
        mostrar(ax, rec, titulo, True)
        ax.images[0].set_interpolation("nearest")
    guardar(fig, "app_jpeg.png")


# ---------------------------------------------------------------- Clase 20
def rango_svd():
    A = GRIS_GATO
    U, s, Vt = np.linalg.svd(A, full_matrices=False)
    m, n = A.shape
    fig, axs = plt.subplots(1, 4, figsize=(14, 2.9))
    for ax, k in zip(axs, [1, 5, 20, 300]):
        Ak = (U[:, :k] * s[:k]) @ Vt[:k]
        datos = k * (m + n + 1) / (m * n) * 100
        titulo = f"rango {k} · {datos:.0f} % de los datos" if k < 300 else "rango 300 (original)"
        mostrar(ax, Ak, titulo, True)
    guardar(fig, "app_rango.png")


# ---------------------------------------------------------------- Clase 21
def senal():
    t = np.linspace(0, 2 * np.pi, 400, endpoint=False)
    f = 2 * np.sin(t) - np.sin(2 * t) + 0.5 * np.sin(3 * t)
    fig, axs = plt.subplots(1, 2, figsize=(12, 3.3), gridspec_kw={"width_ratios": [1.3, 1]})
    axs[0].plot(t, f, color=AZUL, lw=2.5)
    axs[0].set_title("Señal medida f", fontsize=12.5)
    for k, c in zip([1, 2, 3], [VINO, VERDE, AMBAR]):
        axs[1].plot(t, np.sin(k * t), color=c, lw=2, label=f"sen({k}t)" if k > 1 else "sen(t)")
    axs[1].set_title("Base ortogonal de senos", fontsize=12.5); axs[1].legend(frameon=False, fontsize=10, loc="lower left")
    for ax in axs:
        ax.axhline(0, color=GRIS, lw=.8); ax.grid(color="#e5e7eb", lw=.6)
        ax.set_xticks([0, np.pi, 2 * np.pi]); ax.set_xticklabels(["0", "π", "2π"])
        for s in ["top", "right"]:
            ax.spines[s].set_visible(False)
    guardar(fig, "app_senal.svg")


# ---------------------------------------------------------------- Clase 22
def tl_gato():
    c, s = np.cos(np.pi / 6), np.sin(np.pi / 6)
    casos = [([[c, -s], [s, c]], "Rotación 30°"), ([[1.6, 0], [0, 0.7]], "Escala (1.6, 0.7)"),
             ([[1, 0.6], [0, 1]], "Cizalla horizontal"), ([[0, 1], [1, 0]], "Reflexión en y = x")]
    fig, axs = plt.subplots(1, 4, figsize=(15, 4.1))
    for ax, (M, t) in zip(axs, casos):
        dibujar_transformada(ax, GATO_CUAD, M, t, lim=(-0.8, 1.8))
    guardar(fig, "app_tl_gato.png")


# ---------------------------------------------------------------- Clase 23
def nucleo_gris():
    c1 = np.array([200, 100, 50]); c2 = np.array([82, 160, 50])
    fig, axs = plt.subplots(1, 4, figsize=(10, 2.4))
    for ax, c, t in [(axs[0], c1, "c₁ = (200, 100, 50)"), (axs[1], c2, "c₂ = (82, 160, 50)")]:
        ax.add_patch(plt.Rectangle((0, 0), 1, 1, color=c / 255)); ax.set_title(t, fontsize=11.5)
    for ax, c, t in [(axs[2], c1, "T(c₁) = 124.5"), (axs[3], c2, "T(c₂) = 124.5")]:
        g = PESOS_GRIS @ c / 255
        ax.add_patch(plt.Rectangle((0, 0), 1, 1, color=(g, g, g))); ax.set_title(t, fontsize=11.5)
    for ax in axs:
        ax.set_xlim(0, 1); ax.set_ylim(0, 1); ax.set_aspect("equal"); ax.axis("off")
    guardar(fig, "app_nucleo_gris.svg")


# ---------------------------------------------------------------- Clase 24
def composicion_orden():
    c, s = np.cos(np.pi / 4), np.sin(np.pi / 4)
    R = np.array([[c, -s], [s, c]]); C = np.array([[1, 1], [0, 1]])
    fig, axs = plt.subplots(1, 3, figsize=(13, 4.4))
    dibujar_transformada(axs[0], GATO_CUAD, np.eye(2), "Original", lim=(-0.9, 2.0))
    dibujar_transformada(axs[1], GATO_CUAD, C @ R, "Primero rotar, luego cizalla: CR", lim=(-0.9, 2.0))
    dibujar_transformada(axs[2], GATO_CUAD, R @ C, "Primero cizalla, luego rotar: RC", lim=(-0.9, 2.0))
    guardar(fig, "app_composicion.png")


# ---------------------------------------------------------------- Clase 25
def pagerank():
    pos = {"A": (0, 1), "B": (1.6, 1), "C": (1.6, 0), "D": (0, 0)}
    enlaces = [("A", "B"), ("A", "C"), ("A", "D"), ("B", "C"), ("C", "A"), ("D", "A"), ("D", "C")]
    r = {"A": 0.4, "B": 2 / 15, "C": 1 / 3, "D": 2 / 15}
    fig, axs = plt.subplots(1, 2, figsize=(10, 3.6), gridspec_kw={"width_ratios": [1.1, 1]})
    ax = axs[0]
    for a, b in enlaces:
        rad = 0.25 if (b, a) in enlaces else 0.0
        ax.add_patch(FancyArrowPatch(pos[a], pos[b], connectionstyle=f"arc3,rad={rad}", arrowstyle="-|>",
                                     mutation_scale=18, lw=1.8, color=GRIS, shrinkA=22, shrinkB=22))
    for k, (x, y) in pos.items():
        ax.scatter(x, y, s=1400, color="#cfe0f1", edgecolors=AZUL, zorder=3)
        ax.text(x, y, k, ha="center", va="center", fontsize=16, color=AZUL, zorder=4, fontweight="bold")
    ax.set_xlim(-.5, 2.1); ax.set_ylim(-.5, 1.5); ax.set_aspect("equal"); ax.axis("off")
    ax.set_title("Enlaces entre 4 páginas", fontsize=12.5)
    axs[1].bar(list(r), list(r.values()), color=[VINO, AZUL, VERDE, AZUL])
    for k, v in r.items():
        axs[1].text(k, v + .01, f"{v:.2f}", ha="center")
    axs[1].set_title("Importancia (vector propio, λ = 1)", fontsize=12.5); axs[1].set_ylim(0, .48)
    for s in ["top", "right"]:
        axs[1].spines[s].set_visible(False)
    guardar(fig, "app_pagerank.svg")


# ---------------------------------------------------------------- Clase 26
def markov():
    n = np.arange(0, 11)
    x = 2 / 3 - 0.7**n / 6
    fig, ax = plt.subplots(figsize=(6.6, 3.5))
    ax.plot(n, x, "o-", color=VINO, lw=2, label="empresa A")
    ax.plot(n, 1 - x, "o-", color=AZUL, lw=2, label="empresa B")
    ax.axhline(2 / 3, color=VINO, ls=":", lw=1); ax.axhline(1 / 3, color=AZUL, ls=":", lw=1)
    ax.set_xlabel("mes n"); ax.set_ylabel("proporción de clientes"); ax.set_ylim(0.25, 0.75)
    ax.legend(frameon=False); ax.grid(color="#e5e7eb", lw=.6)
    for s in ["top", "right"]:
        ax.spines[s].set_visible(False)
    guardar(fig, "app_markov.svg")


def pca():
    rng = np.random.default_rng(3)
    X = rng.multivariate_normal([0, 0], [[3, 1], [1, 3]], 300)
    fig, ax = plt.subplots(figsize=(5.2, 4.6))
    ax.scatter(X[:, 0], X[:, 1], s=10, color="#9ca3af", alpha=.7)
    flecha(ax, (0, 0), 2 * np.array([1, 1]) / np.sqrt(2) * 1.6, VINO, "λ₁ = 4", off=(0.1, 0.1))
    flecha(ax, (0, 0), np.sqrt(2) * np.array([1, -1]) / np.sqrt(2) * 1.6, AZUL, "λ₂ = 2", off=(0.1, -0.5))
    ax.set_xlim(-6, 6); ax.set_ylim(-6, 6); ax.set_aspect("equal")
    ax.axhline(0, color=GRIS, lw=.8); ax.axvline(0, color=GRIS, lw=.8); ax.grid(color="#e5e7eb", lw=.6)
    ax.set_xlabel("característica 1"); ax.set_ylabel("característica 2")
    for sp in ax.spines.values():
        sp.set_visible(False)
    guardar(fig, "app_pca.svg")


if __name__ == "__main__":
    for f in [parabola, imagen_matriz, canales_rgb, operaciones, filtros, inversa_imagen,
              transpuesta_imagen, lote, det_imagen, det_cero, avion, normal_triangulo, dron, rayo,
              minimos_cuadrados, cubo_rgb, mezcla_colores, colores_dependientes, dct_jpeg, rango_svd,
              senal, tl_gato, nucleo_gris, composicion_orden, pagerank, markov, pca]:
        f()
        print("ok", f.__name__)
