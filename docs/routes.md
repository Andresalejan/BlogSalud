# Mapa de rutas (URL → archivo)

Este proyecto usa **Next.js App Router**. En App Router, el “truco” es que el nombre del archivo suele repetirse (`page.tsx`, `route.ts`) y lo que te orienta es **la ruta de carpetas**.

## Reglas rápidas (para ubicar dónde modificar)

### Pantallas (Front UI)

- Si estás en una URL como `/algo`, busca en `app/algo/page.tsx`.
- La home `/` siempre es `app/page.tsx`.
- Segmentos dinámicos (lo que cambia) van entre corchetes: `app/[slug]/page.tsx`.

### Endpoints (Back HTTP)

- Si estás llamando `/api/x/y`, el handler vive en `app/api/x/y/route.ts`.
- El archivo se llama **siempre** `route.ts` porque Next lo exige; por eso hay muchos.
- Los métodos HTTP se implementan como funciones exportadas: `export async function GET() { ... }`, `POST`, `PUT`, `DELETE`.

## Ejemplos (de URL a archivo)

- Estás en `/admin` → ve a `app/admin/page.tsx`.
- El panel hace `fetch("/api/admin/publish")` → ve a `app/api/admin/publish/route.ts`.
- Estás en `/mi-articulo` → ve a `app/[slug]/page.tsx` (y `slug = "mi-articulo"`).
- El panel edita `fetch("/api/admin/articles/<slug>")` → ve a `app/api/admin/articles/[slug]/route.ts`.

## Páginas

| URL | Archivo |
| --- | --- |
| `/` | `app/page.tsx` |
| `/<slug>` (detalle de artículo) | `app/[slug]/page.tsx` |
| `/sobre-nosotros` | `app/sobre-nosotros/page.tsx` |
| `/admin` | `app/admin/page.tsx` |

## API (pública)

| Método | URL | Archivo |
| --- | --- | --- |
| `GET` | `/api/articles` | `app/api/articles/route.ts` |

## API (admin)

| Método | URL | Archivo |
| --- | --- | --- |
| `POST` | `/api/admin/login` | `app/api/admin/login/route.ts` |
| `GET` | `/api/admin/articles` | `app/api/admin/articles/route.ts` |
| `POST` | `/api/admin/publish` | `app/api/admin/publish/route.ts` |
| `GET` | `/api/admin/articles/:slug` | `app/api/admin/articles/[slug]/route.ts` |
| `PUT` | `/api/admin/articles/:slug` | `app/api/admin/articles/[slug]/route.ts` |
| `DELETE` | `/api/admin/articles/:slug` | `app/api/admin/articles/[slug]/route.ts` |

## Notas

- La carpeta `app/api/**/upload-image/` existe pero no tiene `route.ts`, por lo que **no expone endpoint**.

## “¿Dónde está la lógica real?” (lib)

Los `route.ts` suelen ser la “puerta” HTTP (validan auth, parsean body y devuelven JSON). La lógica reutilizable vive en `lib/`.

- **Server-only** (backend): `lib/server/**`
	- Markdown/FS: `lib/server/articles.ts`
	- Auth admin (cookies firmadas): `lib/server/adminAuth.ts`
	- GitHub (lectura/escritura/commits): `lib/server/github/*`
		- `lib/server/github/contents.ts` (Contents API)
		- `lib/server/github/gitData.ts` (Git Data API para commits atómicos)
		- `lib/server/github/index.ts` (re-exports para importar más fácil)

Si dudas “qué tocar”, busca primero el `fetch("/api/...")` en el front (ej. `app/admin/page.tsx`) y salta al `route.ts` correspondiente; desde ahí verás qué función de `lib/server/**` está haciendo el trabajo.