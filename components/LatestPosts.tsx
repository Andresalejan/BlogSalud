// Este componente es SOLO de servidor.
// Lee artículos desde el sistema de archivos (vía `getSortedArticles()`), así que
// no debe importarse en componentes client (evita errores de bundling).
import "server-only"

import Link from "next/link"

import CategoryIcon from "@/components/CategoryIcon"
import { getSortedArticles } from "@/lib/server/articles"
import { slugify } from "@/lib/slug"

export default function LatestPosts() {
  // Tomamos los artículos ya ordenados por fecha (descendente) y nos quedamos
  // con los 4 más recientes para la home.
  const latestArticles = getSortedArticles().slice(0, 4)

  return (
    // Sección de “Últimas publicaciones” en formato cards.
    <section id="latest" className="flex flex-col gap-4 scroll-mt-24">
      <h2 className="font-cormorantGaramond text-3xl md:text-4xl leading-tight text-violet-900">
        Últimas publicaciones
      </h2>
      <div className="grid gap-4 md:grid-cols-2">
        {latestArticles.map((article) => {
          // Convertimos el nombre de categoría a slug para enlazar a /categoria/[category].
          const categorySlug = slugify(article.category)
          return (
            <article
              key={article.id}
              className="group rounded-2xl border border-violet-100 bg-white/70 p-6 md:p-7 shadow-sm"
            >
              <div className="flex items-center justify-between gap-4">
                {/* Chip de categoría (link) con icono */}
                <Link
                  href={`/categoria/${categorySlug}`}
                  className="inline-flex items-center gap-2 rounded-full border border-violet-100 bg-white/70 px-3 py-1 font-poppins text-sm text-neutral-700 transition hover:text-violet-900"
                >
                  <CategoryIcon category={article.category} />
                  <span className="line-clamp-1">{article.category}</span>
                </Link>
                {/* Fecha del artículo (del frontmatter) */}
                <time className="font-poppins text-sm text-neutral-600">{article.date}</time>
              </div>

              <h3 className="mt-4 font-cormorantGaramond text-2xl md:text-3xl leading-tight text-violet-900">
                {/* Título del artículo (link) */}
                <Link
                  href={`/${article.id}`}
                  className="underline decoration-violet-200 underline-offset-4 transition hover:decoration-violet-300"
                >
                  {article.title}
                </Link>
              </h3>
            </article>
          )
        })}
      </div>
    </section>
  )
}
