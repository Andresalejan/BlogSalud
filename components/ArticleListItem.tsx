import Link from "next/link"
import type { ArticleItem } from "@/types"
import { slugify } from "@/lib/slug"

import CategoryIcon from "@/components/CategoryIcon"

interface Props {
  category: string
  articles: ArticleItem[]
}

const ArticleItemList = ({ category, articles }: Props) => {
  // Convertimos el nombre de la categoría a un slug estable para la URL.
  // Ej: "Ciclo menstrual" -> "/categoria/ciclo-menstrual"
  const categorySlug = slugify(category)

  // En la home mostramos solo un “preview” para evitar listas largas.
  // La página de categoría muestra el listado completo.
  const previewArticles = articles.slice(0, 5)
  return (
    <div className="group card-surface flex h-full flex-col gap-4 p-6 md:p-7 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_60px_-30px_rgba(16,24,40,0.35)]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/60 ring-1 ring-black/5">
            <CategoryIcon category={category} />
          </span>
          <div className="flex flex-col">
            <h2 className="font-cormorantGaramond text-3xl md:text-4xl leading-tight text-violet-900">
              <Link
                href={`/categoria/${categorySlug}`}
                className="rounded-md underline decoration-violet-200/40 underline-offset-4 transition-colors transition-[text-decoration-color] hover:text-violet-950 hover:decoration-violet-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-200"
              >
                {category}
              </Link>
            </h2>
          </div>
        </div>
      </div>

      <ul className="flex flex-1 flex-col gap-2 font-poppins text-base leading-relaxed text-neutral-700">
        {previewArticles.map((article) => (
          <li key={article.id}>
            <Link
              // Cada enlace apunta a la ruta dinámica /[slug]
              // (donde slug = article.id, el nombre del archivo .md sin extensión).
              href={`/${article.id}`}
              className="group/link inline-flex items-baseline gap-2 rounded-xl px-2 py-2 transition hover:bg-white/55"
            >
              <span className="mt-[0.38em] inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-violet-300/70" />
              <span className="text-neutral-900 underline decoration-violet-200 underline-offset-4 transition group-hover/link:decoration-violet-300">
                {article.title}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-1">
        <Link
          href={`/categoria/${categorySlug}`}
          className="inline-flex items-center gap-2 rounded-full bg-violet-900 px-4 py-2 font-poppins text-sm font-semibold text-white shadow-sm transition hover:bg-violet-950"
        >
          Ver todos
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </div>
  )
}

export default ArticleItemList
