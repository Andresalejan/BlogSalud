import fs from "fs"
import matter from "gray-matter"
import path from "path"
import moment from "moment"
import { remark } from "remark"
import html from "remark-html"

import type { ArticleItem } from "@/types"
import { slugify } from "@/lib/slug"

// OJO: este módulo usa `fs` (sistema de archivos), así que debe ejecutarse en el servidor.
// En Next.js (App Router) eso ocurre cuando lo importas desde páginas/Server Components o route handlers.
const articlesDirectory = path.join(process.cwd(), "articles")

export type ArticleData = ArticleItem & {
  contentHtml: string
}

/**
 * Devuelve el listado de artículos ordenado por fecha (descendente).
 *
 * Lee todos los `.md` en `/articles`, extrae frontmatter con `gray-matter`
 * y ordena por `date` asumiendo formato `DD-MM-YYYY`.
 */
export const getSortedArticles = (): ArticleItem[] => {
  // Lee los nombres de archivo dentro de /articles (p.ej. "mi-post.md")
  const fileNames = fs.readdirSync(articlesDirectory)

  const allArticlesData = fileNames.map((fileName) => {
    // El "id" será el slug de la URL: mi-post.md -> /mi-post
    const id = fileName.replace(/\.md$/, "")

    const fullPath = path.join(articlesDirectory, fileName)
    const fileContents = fs.readFileSync(fullPath, "utf-8")

    // `gray-matter` separa el frontmatter (YAML/metadata) del contenido Markdown.
    const matterResult = matter(fileContents)

    return {
      id,
      title: matterResult.data.title,
      date: matterResult.data.date,
      category: matterResult.data.category,
    }
  })

  return allArticlesData.sort((a, b) => {
    // Ordena por fecha descendente (más nuevo primero).
    // Importante: aquí se asume formato "DD-MM-YYYY".
    const format = "DD-MM-YYYY"
    const aTime = moment(a.date, format).valueOf()
    const bTime = moment(b.date, format).valueOf()
    return bTime - aTime
  })
}

/**
 * Agrupa artículos por `category`.
 *
 * Si un artículo no tiene categoría, cae en `uncategorized`.
 */
export const getCategorisedArticles = (): Record<string, ArticleItem[]> => {
  // Agrupa artículos por `category` para pintar secciones en la home.
  const sorted = getSortedArticles()
  return sorted.reduce<Record<string, ArticleItem[]>>((acc, article) => {
    const key = article.category || "uncategorized"
    ;(acc[key] ??= []).push(article)
    return acc
  }, {})
}

/**
 * Devuelve el listado de slugs de categorías disponibles.
 * Útil para `generateStaticParams`.
 */
export const getCategorySlugs = (): string[] => {
  // Transformamos nombres “humanos” de categorías a slugs de URL.
  // Importante: el contenido viene de los Markdown, así que lo calculamos en server.
  const grouped = getCategorisedArticles()
  return Object.keys(grouped).map((c) => slugify(c || "uncategorized"))
}

/**
 * Resuelve una categoría por slug y devuelve el nombre de categoría real + sus artículos.
 */
export const getArticlesByCategorySlug = (
  categorySlug: string,
): { category: string; articles: ArticleItem[] } | null => {
  // Resolvemos el slug a la categoría real (con tildes/mayúsculas) para mostrarla
  // en UI, y devolvemos el listado completo de artículos de esa categoría.
  const safeSlug = String(categorySlug ?? "").trim()
  if (!safeSlug) return null

  const grouped = getCategorisedArticles()
  const category = Object.keys(grouped).find((c) => slugify(c) === safeSlug)
  if (!category) return null

  return {
    category,
    articles: grouped[category] ?? [],
  }
}

/**
 * Carga un artículo por slug y devuelve sus datos + HTML renderizado.
 *
 * El HTML se genera con `remark` + `remark-html`. El render final lo hace
 * la página del artículo.
 */
export const getArticleData = async (id: string): Promise<ArticleData | null> => {
  // Carga el Markdown de un artículo concreto a partir del slug.
  // Importante: si el archivo no existe (o el slug es inválido), devolvemos `null`
  // para que la ruta pueda renderizar un 404 (notFound) en vez de crashear con ENOENT.
  const safeId = String(id ?? "").trim()

  if (!safeId) return null
  if (safeId.includes("..") || safeId.includes("/") || safeId.includes("\\")) return null

  const fullPath = path.resolve(articlesDirectory, `${safeId}.md`)
  const root = path.resolve(articlesDirectory) + path.sep
  if (!fullPath.startsWith(root)) return null
  if (!fs.existsSync(fullPath)) return null

  const fileContents = fs.readFileSync(fullPath, "utf-8")

  const matterResult = matter(fileContents)

  // Convierte Markdown -> HTML. Luego ese HTML se renderiza en la página del artículo.
  const processedContent = await remark().use(html).process(matterResult.content)
  const contentHtml = processedContent.toString()

  return {
    id,
    title: matterResult.data.title,
    date: matterResult.data.date,
    category: matterResult.data.category,
    contentHtml,
  }
}
