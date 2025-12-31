
# BlogSalud — Blog de salud femenina

Un blog minimalista y elegante, pensado para publicar artículos de **salud femenina** en formato Markdown, con un diseño rosa suave, navegación superior y footer.

## Tecnologías

- **Next.js (App Router)**
- **React + TypeScript**
- **Tailwind CSS**
- **Markdown** con:
	- `gray-matter` (frontmatter)
	- `remark` + `remark-html` (Markdown → HTML)
- `moment` (ordenación de fechas)
- `@heroicons/react` (iconos)
- Fuentes con `next/font` (Google Fonts)

## Estructura del proyecto

- `app/`
	- `page.tsx`: Home (lista de artículos agrupados por categoría)
	- `[slug]/page.tsx`: Página de artículo (ruta dinámica)
	- `layout.tsx`: Layout global (Navbar + Footer + estilos base)
- `articles/`: Markdown de artículos (cada archivo = un post)
- `lib/articles.ts`: Lectura de archivos Markdown y conversión a HTML
- `components/`: Componentes reutilizables

## Requisitos

- Node.js 18+ (recomendado)
- npm / pnpm / yarn

## Primeros pasos

Instala dependencias:

```bash
npm install
```

Levanta el entorno de desarrollo:

```bash
npm run dev
```

Abre:

- http://localhost:3000

Build de producción:

```bash
npm run build
```

## Cómo añadir un artículo

1) Crea un archivo `.md` nuevo en `articles/` con un nombre tipo slug (por ejemplo: `mi-articulo.md`).

2) Añade frontmatter al inicio:

```md
---
title: "Título del artículo"
category: "Ciclo menstrual"
date: "31-12-2025"
---
```

3) Escribe el contenido en Markdown.

Notas:
- El `slug` (URL) sale del nombre del fichero: `mi-articulo.md` → `/mi-articulo`
- La home agrupa por `category` automáticamente.
- El formato de `date` esperado es `DD-MM-YYYY`.

## Variables de entorno

Este proyecto soporta configuración básica por entorno para nombre/descripcion del sitio.

- Archivo de ejemplo (se sube al repo): `.env.example`
- Archivo local (no se sube): `.env.local`

Variables disponibles:

- `NEXT_PUBLIC_SITE_NAME`
- `NEXT_PUBLIC_SITE_DESCRIPTION`
- `NEXT_PUBLIC_SITE_URL`

Importante:
- Todo lo que empiece por `NEXT_PUBLIC_` puede ser accesible desde el navegador si se usa en componentes cliente. No pongas secretos ahí.

## Deploy

Recomendación:
- En producción, configura las variables de entorno desde el proveedor (Vercel/Netlify/Render/VPS/Docker), no subas `.env.local`.

## Git

Incluye `.gitignore` preparado para Next.js y variables de entorno. `.env.local` está ignorado y `.env.example` se mantiene versionado.

---

Hecho para crecer: hoy es un blog Markdown, mañana puede integrarse con analytics, buscador o un CMS si lo necesitas.
