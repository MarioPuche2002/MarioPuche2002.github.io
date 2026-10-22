"""Figuras de las sesiones de Metodología de la Investigación.  Uso: python generar_figuras.py"""
from pathlib import Path
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch, Rectangle, Polygon

OUT = Path(__file__).parent
AZUL, VERDE, NARANJA, VINO, GRIS, TINTA = "#0f4c5c", "#2a9d8f", "#e76f51", "#9a3412", "#6b7280", "#1b2430"
plt.rcParams.update({"font.family": "DejaVu Sans", "font.size": 11, "svg.fonttype": "path",
                     "figure.facecolor": "none", "axes.facecolor": "none"})


def caja(ax, x, y, w, h, texto, fc, tc="white", fs=11, bold=False, ec=None):
    ax.add_patch(FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.02,rounding_size=0.08", fc=fc, ec=ec or fc, lw=1.2))
    ax.text(x + w / 2, y + h / 2, texto, ha="center", va="center", color=tc, fontsize=fs, fontweight="bold" if bold else "normal", wrap=True)


def flecha(ax, a, b, color=GRIS, rad=0.0):
    ax.add_patch(FancyArrowPatch(a, b, arrowstyle="-|>", mutation_scale=14, color=color, lw=1.4, connectionstyle=f"arc3,rad={rad}"))


def gantt():
    act = [  # (fase, actividad, inicio (semana), duración, color)
        ("Planeación", "Revisión de literatura", 1, 3, AZUL),
        ("Planeación", "Aval del comité de ética", 3, 2, AZUL),
        ("Ejecución", "Diseño y prueba de instrumentos", 4, 2, VERDE),
        ("Ejecución", "Recolección de datos", 6, 4, VERDE),
        ("Ejecución", "Depuración y análisis descriptivo", 9, 2, VERDE),
        ("Análisis", "Análisis inferencial", 11, 3, NARANJA),
        ("Cierre", "Redacción del informe", 13, 3, VINO),
        ("Cierre", "Socialización de resultados", 16, 1, VINO),
    ]
    fig, ax = plt.subplots(figsize=(12, 4.8))
    n = len(act)
    for i, (fase, nom, ini, dur, c) in enumerate(act):
        y = n - 1 - i
        ax.barh(y, dur, left=ini - 1, height=.55, color=c, edgecolor="white")
        ax.text(-0.3, y, nom, ha="right", va="center", fontsize=11, color=TINTA)
    for s, txt in ((5, "Hito: aval ético"), (10, "Hito: base de datos completa"), (16, "Hito: entrega final")):
        ax.plot([s, s], [-0.7, n - 0.3], ls="--", color=GRIS, lw=1)
        ax.plot(s, n - 0.25, marker="D", color=TINTA, ms=8)
        ax.text(s, n + 0.15, txt, ha="center", fontsize=9.5, color=TINTA)
    ax.set_xlim(0, 16.2); ax.set_ylim(-0.8, n + 0.6)
    ax.set_xticks([k - 0.5 for k in range(1, 17)]); ax.set_xticklabels([f"S{k}" for k in range(1, 17)], fontsize=9)
    ax.set_yticks([]); ax.grid(axis="x", color="#e5e7eb"); ax.set_axisbelow(True)
    for sp in ("top", "right", "left"):
        ax.spines[sp].set_visible(False)
    ax.set_xlabel("Semanas", color=GRIS)
    from matplotlib.patches import Patch
    ax.legend(handles=[Patch(color=c, label=l) for l, c in (("Planeación", AZUL), ("Ejecución", VERDE), ("Análisis", NARANJA), ("Cierre", VINO))],
              loc="lower left", bbox_to_anchor=(0, -0.32), ncol=4, frameon=False)
    fig.tight_layout(); fig.savefig(OUT / "gantt.svg", bbox_inches="tight"); plt.close(fig)


def limitaciones():
    fig, ax = plt.subplots(figsize=(11, 5.2)); ax.axis("off"); ax.set_xlim(0, 11); ax.set_ylim(0, 10)
    caja(ax, 0.2, 4.4, 2.0, 1.2, "Tipos de\nlimitaciones", "#f4a261", TINTA, 12, True)
    caja(ax, 3.0, 7.0, 2.4, 1.1, "Metodológicas", VERDE, fs=12, bold=True)
    caja(ax, 3.0, 1.9, 2.4, 1.1, "Atribuibles al\ninvestigador", VERDE, fs=11.5, bold=True)
    flecha(ax, (2.2, 5.0), (3.0, 7.5)); flecha(ax, (2.2, 5.0), (3.0, 2.45))
    met = ["Tamaño de la muestra", "Falta de datos confiables", "Falta de estudios previos", "Problemas con los datos recopilados", "Datos autoinformados"]
    inv = ["Acceso a la población o a los datos", "Efectos longitudinales (tiempo)", "Sesgos culturales", "Barreras de idioma"]
    for k, t in enumerate(met):
        y = 9.2 - k * 0.95; caja(ax, 6.2, y - 0.38, 4.5, 0.76, t, AZUL, fs=10.5); flecha(ax, (5.4, 7.55), (6.2, y), rad=0)
    for k, t in enumerate(inv):
        y = 3.85 - k * 0.95; caja(ax, 6.2, y - 0.38, 4.5, 0.76, t, AZUL, fs=10.5); flecha(ax, (5.4, 2.45), (6.2, y), rad=0)
    fig.savefig(OUT / "limitaciones.svg", bbox_inches="tight"); plt.close(fig)


def delimitacion():
    fig, ax = plt.subplots(figsize=(11, 4.2)); ax.axis("off"); ax.set_xlim(0, 11); ax.set_ylim(0, 5)
    dims = [("Temática", "¿Qué aspecto\ndel tema?"), ("Objetivos", "¿Qué se busca\nlograr?"), ("Contexto", "¿Dónde?\n(espacio)"),
            ("Unidad de\nestudio", "¿Con quiénes\no con qué?"), ("Tiempo", "¿En qué\nperíodo?")]
    for k, (t, q) in enumerate(dims):
        x = 0.3 + k * 2.15
        caja(ax, x, 2.6, 1.9, 1.3, t, AZUL, fs=12, bold=True)
        ax.text(x + 0.95, 1.9, q, ha="center", va="center", fontsize=10.5, color=TINTA)
    ax.text(5.5, 4.55, "El tema se delimita hasta que pueda abarcarse en un solo estudio", ha="center", fontsize=13, color=TINTA, fontweight="bold")
    ax.annotate("", xy=(10.7, 1.0), xytext=(0.3, 1.0), arrowprops=dict(arrowstyle="-|>", color=NARANJA, lw=2))
    ax.text(5.5, 0.55, "de un tema amplio  →  a un problema investigable", ha="center", fontsize=11, color=NARANJA)
    fig.savefig(OUT / "delimitacion.svg", bbox_inches="tight"); plt.close(fig)


def embudo_delimitacion():
    fig, ax = plt.subplots(figsize=(8, 5)); ax.axis("off"); ax.set_xlim(0, 10); ax.set_ylim(0, 10)
    niveles = [("Tema general", "Calidad del sueño"), ("Temática", "Uso de pantallas y sueño"),
               ("Unidad de estudio", "Estudiantes de primer semestre"), ("Contexto", "Una universidad urbana"),
               ("Tiempo", "Primer semestre del año en curso")]
    cols = ["#0f4c5c", "#1d6a7a", "#2a9d8f", "#5bb5a8", "#8fd0c3"]
    for k, ((nom, ej), c) in enumerate(zip(niveles, cols)):
        y = 8.6 - k * 1.8; w = 9.6 - k * 1.1; x0 = (10 - w) / 2
        ax.add_patch(Polygon([(x0, y), (x0 + w, y), (x0 + w - .75, y - 1.55), (x0 + .75, y - 1.55)], closed=True, fc=c, ec="white"))
        ax.text(5, y - 0.5, nom, ha="center", va="center", color="white", fontsize=12, fontweight="bold")
        ax.text(5, y - 1.05, ej, ha="center", va="center", color="white", fontsize=10.5, style="italic")
    fig.savefig(OUT / "embudo_delimitacion.svg", bbox_inches="tight"); plt.close(fig)


def marco_elementos():
    fig, ax = plt.subplots(figsize=(11, 4.4)); ax.axis("off"); ax.set_xlim(0, 11); ax.set_ylim(0, 5.4)
    pasos = [("Antecedentes", "Estudios previos sobre\nel problema", AZUL), ("Teorías", "Modelos que explican\nel fenómeno", VERDE),
             ("Conceptos clave", "Definiciones de los\ntérminos del estudio", NARANJA), ("Estado del arte", "Lo más reciente:\nqué se sabe y qué falta", VINO)]
    for k, (t, d, c) in enumerate(pasos):
        x = 0.2 + k * 2.7; y = 0.4 + k * 1.05
        caja(ax, x, y, 2.4, 1.0, t, c, fs=12, bold=True)
        ax.text(x + 1.2, y - 0.08, d, ha="center", va="top", fontsize=9.5, color=TINTA)
        if k < 3:
            flecha(ax, (x + 2.4, y + 0.5), (x + 2.7, y + 1.55), color=c)
    ax.text(0.2, 5.0, "Elementos del marco teórico (se construyen en escalera, de lo previo a lo actual)", fontsize=12, color=TINTA, fontweight="bold")
    fig.savefig(OUT / "marco_elementos.svg", bbox_inches="tight"); plt.close(fig)


def marco_funciones():
    fig, ax = plt.subplots(figsize=(10, 4.6)); ax.axis("off"); ax.set_xlim(0, 10); ax.set_ylim(0, 6)
    caja(ax, 3.5, 2.4, 3.0, 1.2, "Marco\nteórico", AZUL, fs=14, bold=True)
    funcs = [("Sustenta la\ninvestigación", 0.2, 4.4), ("Guía el diseño\nmetodológico", 6.8, 4.4), ("Ayuda a interpretar\nlos resultados", 0.2, 0.4), ("Es la base\nde la discusión", 6.8, 0.4)]
    for t, x, y in funcs:
        caja(ax, x, y, 3.0, 1.2, t, "#e6f2f0", TINTA, 11.5, ec=VERDE)
        flecha(ax, (5.0 + (-1.4 if x < 5 else 1.4), 3.0 + (0.6 if y > 3 else -0.6)), (x + (3.0 if x < 5 else 0), y + (0.0 if y > 3 else 1.2)), color=VERDE)
    fig.savefig(OUT / "marco_funciones.svg", bbox_inches="tight"); plt.close(fig)


def marco_vs():
    fig, ax = plt.subplots(figsize=(11, 4.6)); ax.axis("off"); ax.set_xlim(0, 11); ax.set_ylim(0, 6)
    cols = [("Antecedentes", "¿Qué se ha investigado\nantes sobre el problema?", "Estudios empíricos previos:\nautor, año, objetivo, método,\nresultados y aporte.", AZUL),
            ("Marco teórico", "¿Con qué teorías se\nexplica el fenómeno?", "Teorías, modelos y enfoques\nque sustentan el estudio\ny orientan el análisis.", VERDE),
            ("Marco conceptual", "¿Qué significa cada\ntérmino en este estudio?", "Definiciones precisas de\nlos conceptos y variables\nque se usarán.", NARANJA)]
    for k, (t, q, d, c) in enumerate(cols):
        x = 0.2 + k * 3.65
        caja(ax, x, 4.4, 3.3, 1.0, t, c, fs=13, bold=True)
        caja(ax, x, 2.75, 3.3, 1.35, q, "#f3f4f6", TINTA, 11, ec=c)
        ax.text(x + 1.65, 1.6, d, ha="center", va="center", fontsize=10.5, color=TINTA)
    fig.savefig(OUT / "marco_vs.svg", bbox_inches="tight"); plt.close(fig)


def errores_marco():
    import numpy as np
    fig, ax = plt.subplots(figsize=(7.5, 6)); ax.axis("off"); ax.set_aspect("equal"); ax.set_xlim(-3.3, 3.3); ax.set_ylim(-3.1, 3.2)
    errs = ["Falta de\nprofundidad", "Fuentes no\nacadémicas", "Desconexión con\nla investigación", "Incoherencia", "No citar\n(plagio)"]
    ang = [90 - k * 72 for k in range(5)]
    for k, (e, a) in enumerate(zip(errs, ang)):
        x, y = 2.2 * np.cos(np.radians(a)), 2.2 * np.sin(np.radians(a))
        c = plt.Circle((x, y), 0.9, fc="#fde8e1" if k == 4 else "#eef4f6", ec=VINO if k == 4 else AZUL, lw=1.5); ax.add_patch(c)
        ax.text(x, y, e, ha="center", va="center", fontsize=10, color=VINO if k == 4 else TINTA, fontweight="bold" if k == 4 else "normal")
        a2 = ang[(k + 1) % 5]; m = (a + a2) / 2 if k < 4 else (a + a2 - 360) / 2
        ax.annotate("", xy=(1.95 * np.cos(np.radians(m - 9)), 1.95 * np.sin(np.radians(m - 9))), xytext=(1.95 * np.cos(np.radians(m + 9)), 1.95 * np.sin(np.radians(m + 9))),
                    arrowprops=dict(arrowstyle="-|>", color=GRIS, lw=1.4))
    ax.text(0, 0, "Errores\nfrecuentes", ha="center", va="center", fontsize=12, fontweight="bold", color=TINTA)
    fig.savefig(OUT / "errores_marco.svg", bbox_inches="tight"); plt.close(fig)


def apa_pagina():
    fig, ax = plt.subplots(figsize=(9, 5.6)); ax.axis("off"); ax.set_xlim(0, 12); ax.set_ylim(0, 8)
    ax.add_patch(Rectangle((3.5, 0.3), 5.2, 7.2, fc="white", ec=TINTA, lw=1.4))
    ax.add_patch(Rectangle((4.2, 1.0), 3.8, 5.8, fc="none", ec=NARANJA, lw=1.2, ls="--"))
    ax.text(8.45, 7.2, "1", fontsize=10, ha="right")
    ax.text(6.1, 6.45, "Título en negrita, centrado", ha="center", fontsize=8.5, fontweight="bold")
    for k in range(9):
        y = 5.9 - k * 0.5; x0 = 4.75 if k % 3 == 0 else 4.2
        ax.plot([x0, 8.0], [y, y], color="#9ca3af", lw=2.2)
    for (x, y, t) in ((1.7, 6.9, "Márgenes de 2,54 cm\n(1 pulgada) en todos\nlos lados"), (10.2, 7.2, "Número de página\narriba a la derecha"),
                      (1.7, 4.6, "Sangría de 1,27 cm\nen la primera línea\nde cada párrafo"), (10.3, 3.8, "Interlineado doble\nsin espacio extra\nentre párrafos"),
                      (10.3, 1.4, "Alineado a la izquierda\n(sin justificar)")):
        ax.text(x, y, t, ha="center", va="center", fontsize=9.5, color=AZUL)
    flecha(ax, (2.9, 6.9), (4.2, 6.6), AZUL); flecha(ax, (9.1, 7.2), (8.5, 7.25), AZUL); flecha(ax, (2.9, 4.6), (4.7, 5.9), AZUL)
    flecha(ax, (9.2, 3.8), (8.05, 4.4), AZUL); flecha(ax, (9.2, 1.4), (8.05, 2.0), AZUL)
    ax.text(6.1, -0.15, "Fuente sugerida: Times New Roman 12 o Calibri 11", ha="center", fontsize=9.5, color=TINTA)
    fig.savefig(OUT / "apa_pagina.svg", bbox_inches="tight"); plt.close(fig)


def anatomia(nombre, partes, ejemplo_partes, titulo):
    fig, ax = plt.subplots(figsize=(12, 3.0)); ax.axis("off"); ax.set_xlim(0, 12); ax.set_ylim(0, 3)
    cols = [AZUL, VERDE, NARANJA, VINO, "#6d28d9", GRIS]
    x = 0.2
    raw = [max(14, len(f)) for f in ejemplo_partes]; tot = sum(raw)
    for k, ((t, q), frag) in enumerate(zip(partes, ejemplo_partes)):
        w = 11.6 * raw[k] / tot
        c = cols[k % len(cols)]
        caja(ax, x, 2.1, w - 0.1, 0.65, t, c, fs=11, bold=True)
        ax.text(x + (w - 0.1) / 2, 1.75, q, ha="center", va="top", fontsize=9, color=GRIS)
        ax.text(x + (w - 0.1) / 2, 0.75, frag.replace(", ", ",\n", 1) if len(frag) > 30 else frag, ha="center", va="center", fontsize=10, color=c, style="italic" if k == 2 and "APA" in titulo else "normal")
        x += w
    ax.text(0.2, 0.15, titulo, fontsize=9.5, color=GRIS)
    fig.savefig(OUT / nombre, bbox_inches="tight"); plt.close(fig)


def apa_referencia():
    anatomia("apa_referencia.svg",
             [("Autor", "¿Quién?"), ("Fecha", "¿Cuándo?"), ("Título", "¿Qué?"), ("Fuente", "¿Dónde se encuentra?")],
             ["Pérez, A., & Gómez, L.", "(2023).", "Calidad del sueño en universitarios.", "Revista de Salud, 12(3), 45–60. https://doi.org/..."],
             "Estilo APA (7.ª ed.): artículo de revista. El nombre de la revista y el volumen van en cursiva.")


def ieee_referencia():
    anatomia("ieee_referencia.svg",
             [("Número", "Orden de aparición"), ("Autor", "Inicial y apellido"), ("Título", "Entre comillas"), ("Fuente", "Abreviada, en cursiva"), ("Datos", "vol., n.º, pp., año")],
             ["[1]", "A. Pérez y L. Gómez,", "\"Calidad del sueño en universitarios,\"", "Rev. Salud,", "vol. 12, no. 3, pp. 45–60, 2023."],
             "Estilo IEEE: artículo de revista. La lista de referencias se ordena por número, no alfabéticamente.")


def apa_vs_ieee():
    fig, axs = plt.subplots(1, 2, figsize=(12, 4)); 
    for ax in axs:
        ax.axis("off"); ax.set_xlim(0, 10); ax.set_ylim(0, 6)
    ax = axs[0]; caja(ax, 0, 5.0, 10, 0.8, "APA: autor y año", AZUL, fs=13, bold=True)
    ax.text(0.2, 4.1, "…la exposición a pantallas reduce el sueño\n(Pérez & Gómez, 2023).", fontsize=11, va="top")
    ax.text(0.2, 2.5, "Referencias (orden alfabético):", fontsize=10.5, fontweight="bold")
    ax.text(0.2, 1.9, "García, M. (2021). …\nPérez, A., & Gómez, L. (2023). …\nZapata, R. (2020). …", fontsize=10, va="top", color=TINTA)
    ax = axs[1]; caja(ax, 0, 5.0, 10, 0.8, "IEEE: número entre corchetes", VINO, fs=13, bold=True)
    ax.text(0.2, 4.1, "…la exposición a pantallas reduce el sueño [1].\nOtros estudios lo confirman [2], [3].", fontsize=11, va="top")
    ax.text(0.2, 2.5, "Referencias (orden de aparición):", fontsize=10.5, fontweight="bold")
    ax.text(0.2, 1.9, "[1] A. Pérez y L. Gómez, …\n[2] M. García, …\n[3] R. Zapata, …", fontsize=10, va="top", color=TINTA)
    fig.savefig(OUT / "apa_vs_ieee.svg", bbox_inches="tight"); plt.close(fig)


if __name__ == "__main__":
    for f in (gantt, limitaciones, delimitacion, embudo_delimitacion, marco_elementos, marco_funciones, marco_vs, errores_marco,
              apa_pagina, apa_referencia, ieee_referencia, apa_vs_ieee):
        f(); print("ok", f.__name__)
