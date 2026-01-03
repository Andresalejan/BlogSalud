import { NextResponse } from "next/server"

import { getSortedArticles } from "@/lib/server/articles"

// Revalida la respuesta (ISR) cada 1h.
// Esto evita recalcular y enviar el índice en cada request, pero permite
// que se actualice automáticamente si agregas/edits artículos.
export const revalidate = 3600

// Endpoint de soporte para la barra de búsqueda de la home.
// Devuelve un índice mínimo (id/slug, title y category) para poder filtrar
// en el cliente sin traer HTML ni contenido del Markdown.
export async function GET() {
  // Generamos un “índice liviano”: solo lo necesario para buscar.
  const articles = getSortedArticles().map((article) => ({
    id: article.id,
    title: article.title,
    category: article.category,
  }))

  return NextResponse.json(articles, {
    headers: {
      // Cachea en CDN/edge cuando aplique (en dev se suele ignorar).
      // - s-maxage: cache en el “shared cache” (CDN)
      // - stale-while-revalidate: permite servir cache “vieja” mientras
      //   se revalida en segundo plano
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  })
}
