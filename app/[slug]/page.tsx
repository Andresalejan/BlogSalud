import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeftIcon } from "@heroicons/react/24/solid"
import { getArticleData } from "@/lib/server/articles"

// Página de ruta dinámica: /[slug]
// Ejemplo: /how-to-write-clean-code -> slug = "how-to-write-clean-code"
const Article = async ({
  params,
}: {
  params: Promise<{ slug: string }>
}) => {
  // En App Router, `params` trae los segmentos dinámicos de la URL.
  const { slug } = await params
  // Leemos el Markdown y lo convertimos a HTML en el servidor.
  const articleData = await getArticleData(slug)
  if (!articleData) notFound()

  return (
    <section className="mx-auto w-11/12 md:w-1/2 py-10 flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4 font-poppins text-sm text-neutral-700">
        <Link
          href={"/"}
          className="flex flex-row gap-2 items-center text-neutral-800 hover:text-violet-800 transition"
        >
          <ArrowLeftIcon width={18} />
          <span>Volver al inicio</span>
        </Link>

        <div className="flex items-center gap-3">
          {articleData.category ? (
            <span className="rounded-full bg-violet-100 text-violet-900 px-3 py-1 text-xs">
              {articleData.category}
            </span>
          ) : null}
          <span className="text-neutral-600">{articleData.date.toString()}</span>
        </div>
      </div>

      <div className="rounded-2xl border border-violet-100 bg-white px-6 py-8 md:px-10 md:py-10">
        <article
          className="article"
          // `dangerouslySetInnerHTML` inserta HTML directamente.
          // Aquí se usa porque el Markdown ya fue convertido a HTML en `getArticleData`.
          dangerouslySetInnerHTML={{ __html: articleData.contentHtml }}
        />
      </div>
    </section>
  )
}

export default Article
