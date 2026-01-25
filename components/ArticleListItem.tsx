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
    <div className="group flex flex-col gap-4 rounded-2xl border border-violet-100 bg-white/70 p-6 md:p-7 shadow-sm transition-transform duration-200 ease-out hover:-translate-y-1">
      <div className="flex items-center gap-3">
        <CategoryIcon category={category} />
        <h2 className="font-cormorantGaramond text-3xl md:text-4xl leading-tight text-violet-900">
          {category}
        </h2>
      </div>

      <ul className="list-disc space-y-2 pl-5 font-poppins text-base leading-relaxed text-neutral-700 marker:text-violet-600">
        {previewArticles.map((article) => (
          <li key={article.id}>
            <Link
              // Cada enlace apunta a la ruta dinámica /[slug]
              // (donde slug = article.id, el nombre del archivo .md sin extensión).
              href={`/${article.id}`}
              className="text-neutral-800 underline decoration-violet-200 underline-offset-4 transition hover:text-violet-900 hover:decoration-violet-300"
            >
              {article.title}
            </Link>
          </li>
        ))}
      </ul>

      <Link
        href={`/categoria/${categorySlug}`}
        className="mt-1 w-fit font-poppins text-sm text-neutral-700 transition hover:text-violet-900"
      >
        Ver artículos →
      </Link>
    </div>
  )
}

export default ArticleItemList
