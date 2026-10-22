# Sitio personal · Mario Andrés Puche Ajiaco

Sitio web de clases y tutoriales, construido con [Quarto](https://quarto.org) y publicado automáticamente en GitHub Pages.

## Estructura

```
├── _quarto.yml                      Configuración del sitio (título, menú, tema)
├── index.qmd                        Portada: clases y tutoriales
├── about.qmd                        Página "Acerca de mí"
├── styles.css                       Estilos adicionales
├── clases/
│   ├── algebra_lineal.qmd           Página del curso ALLI (presentaciones, laboratorios, parciales, chatbot)
│   ├── algebra/                     Presentaciones (diapositivas reveal.js), solo teoría
│   │   ├── _metadata.yml            Formato común de las diapositivas
│   │   ├── alli.scss                Tema visual (cajas de definición, teorema, demostración…)
│   │   ├── clase_01.qmd … clase_26.qmd
│   │   └── img/                     Figuras SVG + generar_figuras.py y generar_figuras_2.py
│   ├── alli_laboratorios/           Laboratorios MATLAB por unidad (lab_01.qmd … lab_07.qmd)
│   ├── alli_evaluaciones/           Parciales y talleres de ALLI (PDF + guía)
│   ├── metodologia_investigacion.qmd
│   └── metodologia/
├── tutoriales/                      Un archivo .qmd por tutorial
└── .github/workflows/publish.yml    Genera y publica el sitio en cada push
```

## Agregar una clase de Álgebra Lineal

1. Copiar una clase existente, por ejemplo `clases/algebra/clase_26.qmd` → `clase_27.qmd`, y cambiar `title` y `subtitle`.
2. Cada `## Título` es una diapositiva. Cajas disponibles:

   ```markdown
   ::: {.definicion data-t="Nombre opcional"}
   ...
   :::
   ```

   Clases: `.definicion`, `.teorema`, `.demo`, `.ejemplo`, `.ejercicio`, `.solucion`, `.obs`.
   Para que una solución aparezca al avanzar: `::: {.solucion .fragment}`. Una pausa: `. . .` en una línea sola.
   Para una diapositiva con mucho contenido: `## Título {.compacto}`.
3. Enlazarla en `clases/algebra_lineal.qmd`.

## Agregar un parcial o taller

Copiar el PDF en `clases/alli_evaluaciones/parciales/` o `clases/alli_evaluaciones/talleres/` y añadir el enlace en la sección **Parciales y talleres** de `clases/algebra_lineal.qmd`. Cada asignatura tiene sus propios parciales dentro de su carpeta.

## Publicar

```bash
git add .
git commit -m "Describe el cambio"
git push
```

En uno o dos minutos el cambio aparece en el sitio. El avance se puede ver en la pestaña **Actions** del repositorio.

## Vista previa local

```bash
quarto preview
```

> Derechos de autor: el texto guía (Grossman y Flores) **no** se incluye en el repositorio; las clases solo citan sus secciones y números de ejercicios.
