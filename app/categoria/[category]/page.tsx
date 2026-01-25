import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeftIcon } from "@heroicons/react/24/solid"
import type { Metadata } from "next"

import BackButton from "@/components/BackButton"

import { isValidSlug } from "@/lib/slug"
import {
  getArticlesByCategorySlug,
  getCategorySlugs,
} from "@/lib/server/articles"

// Dynamic metadata for SEO and social sharing
export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ category: string }>
}): Promise<Metadata> => {
  const { category } = await params

  if (!isValidSlug(category)) {
    return {
      title: "Categoría no encontrada",
      description: "La categoría que buscas no existe.",
    }
  }

  const data = getArticlesByCategorySlug(category)

  if (!data) {
    return {
      title: "Categoría no encontrada",
      description: "La categoría que buscas no existe.",
    }
  }

  const siteName = process.env.NEXT_PUBLIC_SITE_NAME ?? "BlogSalud"

  return {
    title: `${data.category} | ${siteName}`,
    description: `Artículos sobre ${data.category}. Explora todos los artículos publicados en este tema.`,
    openGraph: {
      title: `${data.category} | ${siteName}`,
      description: `Artículos sobre ${data.category}`,
      type: "website",
    },
  }
}

const CategoryPage = async ({
  params,
}: {
  params: Promise<{ category: string }>
}) => {
  const { category } = await params

  // Validación básica del segmento dinámico.
  // Si la URL no es un slug válido, devolvemos 404.
  if (!isValidSlug(category)) notFound()

  // Buscamos la categoría real (con su nombre original) a partir del slug
  // y devolvemos sus artículos.
  const data = getArticlesByCategorySlug(category)
  if (!data || data.articles.length === 0) notFound()

  return (
    <section className="mx-auto w-11/12 md:w-1/2 py-12 md:py-14 flex flex-col gap-8">
      <div className="flex items-center justify-between gap-4 font-poppins text-sm text-neutral-700">
        <BackButton className="flex flex-row gap-2 items-center text-neutral-800 hover:text-violet-800 transition">
          <ArrowLeftIcon width={18} />
          <span>Volver</span>
        </BackButton>

        <Link
          href="/#articles"
          className="text-neutral-700 hover:text-violet-800 transition"
        >
          Ver todas las categorías
        </Link>
      </div>

      <header className="text-center flex flex-col gap-3">
        <p className="font-poppins text-xs tracking-widest text-violet-700/80">
          CATEGORÍA
        </p>
        <h1 className="font-cormorantGaramond font-light text-4xl md:text-5xl leading-tight text-violet-900 tracking-tight">
          {data.category}
        </h1>
        <p className="font-poppins text-sm md:text-base leading-relaxed text-neutral-600">
          Explora todos los artículos publicados en este tema.
        </p>
      </header>

      <div className="rounded-2xl border border-violet-100 bg-white/70 p-6 md:p-8 shadow-sm">
        <div className="grid grid-cols-1 gap-4">
          {data.articles.map((a) => (
            <Link
              key={a.id}
              href={`/${a.id}`}
              className="block rounded-2xl border border-violet-100 bg-white px-5 py-4 transition hover:bg-violet-50"
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-poppins text-base md:text-lg text-neutral-900">
                  {a.title}
                </h2>
                <span className="shrink-0 rounded-full bg-violet-100 px-3 py-1 text-xs text-violet-900">
                  {a.date}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

export const generateStaticParams = async () => {
  // Pre-generamos rutas estáticas por categoría para mejorar rendimiento.
  // En dev, Next puede seguir resolviendo dinámicamente, pero esto ayuda en build.
  const slugs = getCategorySlugs()
  return slugs.map((category) => ({ category }))
}

export default CategoryPage
