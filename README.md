
# BlogSalud — Blog de salud femenina

Blog minimalista orientado a artículos de salud femenina escritos en Markdown. El foco del proyecto es una implementación clara y mantenible (App Router, tipado con TypeScript, estilos con Tailwind) con lectura de contenido desde el filesystem.

## Demo

- https://blog-salud.vercel.app/

## Características

- Home con artículos agrupados por categoría.
- Página de artículo por ruta dinámica (`/[slug]`).
- Contenido en Markdown con frontmatter (`title`, `category`, `date`).
- Índice liviano para búsqueda en la home (título/categoría) consumido desde un endpoint interno.

## Tecnologías

- Next.js (App Router)
- React + TypeScript
- Tailwind CSS
- Markdown
	- `gray-matter` para frontmatter
	- `remark` + `remark-html` para Markdown → HTML
- `moment` para ordenación de fechas
- `@heroicons/react`
- Fuentes con `next/font`

## Arquitectura (alto nivel)

- `app/`
	- `page.tsx`: Home (renderiza categorías + lista de artículos)
	- `[slug]/page.tsx`: Detalle de artículo
	- `api/articles/route.ts`: Índice JSON de artículos (para la búsqueda en cliente)
	- `layout.tsx`: Layout global (Navbar + Footer + estilos base)
- `articles/`: Markdown (cada archivo = un post)
- `lib/articles.ts`: Lectura del filesystem + parseo de frontmatter + conversión Markdown → HTML
- `components/`: Componentes reutilizables

## Requisitos

- Node.js 18+ (recomendado)
- npm / pnpm / yarn

## Desarrollo local

Instalación:

```bash
npm install
```

Servidor de desarrollo:

```bash
npm run dev
```

Aplicación en:

- http://localhost:3000

Build de producción:

```bash
npm run build
```

## Contenido (añadir un artículo)

1) Crear un archivo `.md` en `articles/` con nombre tipo slug (p. ej. `mi-articulo.md`).

2) Definir frontmatter al inicio:

```md
---
title: "Título del artículo"
category: "Ciclo menstrual"
date: "31-12-2025"
---
```

3) Escribir el contenido en Markdown.

Notas:

- El slug se obtiene del nombre del archivo: `mi-articulo.md` → `/mi-articulo`.
- La home agrupa por `category`.
- El formato esperado de `date` es `DD-MM-YYYY`.

## Panel de autores (/admin)

Para evitar crear archivos a mano y hacer commit/push manual, existe un panel simple en:

- `/admin`

Permite escribir el artículo en un textarea (Markdown) y publicarlo. Al publicar, el servidor crea un commit en GitHub con un archivo nuevo en `articles/<slug>.md`.

Además, el panel incluye un listado de artículos (agrupados por categoría) con acciones para:

- **Editar**: carga el artículo en el formulario y permite guardar cambios (crea un commit en GitHub).
- **Eliminar**: muestra confirmación y luego borra el archivo (crea un commit en GitHub).

Requisitos:

- Configurar variables de entorno server-only (ver `.env.example`):
	- `ADMIN_USERNAME`
	- `ADMIN_PASSWORD`
	- `ADMIN_COOKIE_SECRET`
	- `GITHUB_TOKEN`, `GITHUB_OWNER`, `GITHUB_REPO`
	- (recomendado) `GITHUB_BRANCH_PROD`, `GITHUB_BRANCH_DEV`, `CONTENT_ENV`
	- (legacy) `GITHUB_BRANCH`

Notas:

- El token de GitHub debe tener permisos para escribir contenidos en el repo.
- El panel bloquea slugs ya existentes (no sobreescribe).
- En edición, el slug no cambia (se edita el mismo `articles/<slug>.md`) y se mantiene la fecha original del post.

### Imágenes en artículos

El editor del panel permite **pegar** (Ctrl+V) o **arrastrar y soltar** imágenes directamente dentro del textarea.

Qué ocurre al pegar una imagen:

- En el momento de pegar, **NO se commitea nada**.
- El editor inserta un placeholder interno en el Markdown (por ejemplo `__image:<id>__`).
- Solo cuando haces **Publicar**, el servidor:
	- reemplaza los placeholders por URLs finales del sitio (`/images/<slug>/<id>.<ext>`)
	- commitea el Markdown + todas las imágenes juntas en el repo.

De esta forma, las imágenes quedan servidas como estáticos por Next.js y quedan relacionadas al artículo por carpeta.

Edición y eliminación de imágenes:

- Al **editar**, si quitas del Markdown una referencia a `/images/<slug>/...` y guardas, el servidor elimina del repo la imagen correspondiente en `public/images/<slug>/...`.
- Al **eliminar** un artículo desde el panel, también se eliminan sus imágenes bajo `public/images/<slug>/`.

## Variables de entorno

Soporta configuración básica del sitio mediante variables públicas.

- Ejemplo versionado: `.env.example`
- Local (no versionado): `.env.local`

Variables:

- `NEXT_PUBLIC_SITE_NAME`
- `NEXT_PUBLIC_SITE_DESCRIPTION`
- `NEXT_PUBLIC_SITE_URL`

### Separación DEV/PRO de artículos (por branch)

Este proyecto puede mantener artículos distintos en DEV y en PROD publicando/leyendo desde **branches distintos**.

Recomendación:

- `main`: artículos de **PRO**
- `dev` (o `content-dev`): artículos de **DEV**

Selección automática del branch:

- Si defines `CONTENT_ENV` (manual):
	- `CONTENT_ENV=prod` → `GITHUB_BRANCH_PROD` (o `GITHUB_BRANCH` o `main`)
	- `CONTENT_ENV=dev` → `GITHUB_BRANCH_DEV` (o `GITHUB_BRANCH` o `dev`)
- Si NO defines `CONTENT_ENV`:
	- En Vercel usa `VERCEL_ENV` (`production` → prod, `preview/development` → dev)
	- Si no hay Vercel, usa `NODE_ENV` (`production` → prod; cualquier otro → dev)

Variables server-only recomendadas:

- `GITHUB_BRANCH_PROD` (p. ej. `main`)
- `GITHUB_BRANCH_DEV` (p. ej. `dev` o `content-dev`)
- `CONTENT_ENV` (opcional en Vercel; útil en local)

Compatibilidad:

- Si solo configuras `GITHUB_BRANCH` (legacy), se usará ese branch tanto en dev como en prod.

### Merge a `main` sin traer artículos ni imágenes (solo merges locales)

Si quieres mergear **código** desde `dev` hacia `main` pero evitar que el merge incluya cambios en:

- `articles/` (Markdown)
- `public/images/` (imágenes)

Nota importante: `.gitattributes merge=ours` ayuda en algunos casos, pero **no evita borrados** cuando una rama elimina archivos (Git puede aplicar el borrado sin entrar a un merge de contenido).

Para que sea consistente (incluyendo borrados), usa el script incluido:

```bash
powershell -ExecutionPolicy Bypass -File scripts/merge-dev-into-main.ps1
```
esto es una prueba


Este script hace el merge con `--no-commit` y luego restaura `articles/` y `public/images/` desde `main` antes del commit.

Importante:

- Esto aplica cuando haces el merge **localmente** (en tu PC) y luego haces push a `main`.
- Si haces merge usando el botón de GitHub (PR "Merge"), GitHub no ejecuta tu configuración local (`merge.ours.driver`), por lo que esta regla puede no aplicarse.
- Si necesitas que GitHub nunca meta artículos DEV a `main`, el enfoque más robusto es publicar DEV en un branch separado (p. ej. `content-dev`) y no mergearlo a `main`.

Nota: cualquier variable `NEXT_PUBLIC_*` puede terminar expuesta en el bundle del cliente si se usa en componentes cliente.

## Deploy

El proyecto está desplegado en Vercel:

- https://blog-salud.vercel.app/

En producción, las variables de entorno deben configurarse en el proveedor (por ejemplo Vercel) y no en `.env.local`.

## Git

El repositorio incluye `.gitignore` adecuado para Next.js. `.env.local` se ignora y `.env.example` se mantiene versionado.
