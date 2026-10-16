# Sitio personal · Mario Andrés Puche Ajiaco

Sitio web de tutoriales, construido con [Quarto](https://quarto.org) y publicado automáticamente en GitHub Pages.

## Estructura

```
├── _quarto.yml                 Configuración del sitio (título, menú, tema)
├── index.qmd                   Portada con el listado de tutoriales
├── about.qmd                   Página "Acerca de mí"
├── styles.css                  Estilos adicionales
├── tutoriales/                 Un archivo .qmd por tutorial
└── .github/workflows/
    └── publish.yml             Genera y publica el sitio en cada push
```

## Agregar un tutorial nuevo

1. Crear un archivo en `tutoriales/`, por ejemplo `tutoriales/mi_tutorial.qmd`, con este encabezado:

   ```yaml
   ---
   title: "Título del tutorial"
   description: "Resumen de una o dos líneas que aparece en la portada."
   author: "Mario Andrés Puche Ajiaco"
   date: 2026-10-20
   categories: [Python]
   ---
   ```

2. Escribir el contenido en Markdown.
3. Publicar:

   ```bash
   git add .
   git commit -m "Agrega tutorial: título"
   git push
   ```

En uno o dos minutos el tutorial aparece en la portada. El avance se puede ver en la pestaña **Actions** del repositorio.
