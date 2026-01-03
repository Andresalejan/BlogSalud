import { useCallback, useEffect, useMemo, useState } from "react"

/**
 * Hook de “índice” del admin.
 *
 * Responsabilidades:
 * - Traer el listado de artículos y derivar categorías.
 * - Exponer una función `refreshArticles()` para refrescar después de publicar/editar/borrar.
 * - Preparar una estructura agrupada para renderizar fácil en UI.
 *
 * Nota: este hook asume que el servidor usa cookie HttpOnly para auth.
 * Si no hay sesión válida, `/api/admin/articles` responderá con error/no-ok.
 */
export type AdminIndexItem = {
  slug: string
  title: string
  category: string
  date?: string
}

export const useAdminIndex = (loggedIn: boolean) => {
  const [categories, setCategories] = useState<string[]>([])
  const [articles, setArticles] = useState<AdminIndexItem[]>([])
  const [loadingArticles, setLoadingArticles] = useState(false)

  const refreshArticles = useCallback(async () => {
    // Refresco explícito (p.ej. luego de publicar/editar/borrar).
    try {
      setLoadingArticles(true)
      const res = await fetch("/api/admin/articles", { cache: "no-store" })
      if (!res.ok) return
      const json = (await res.json().catch(() => null)) as
        | Array<{ slug?: string; title?: string; category?: string; date?: string }>
        | null

      const list = (json ?? [])
        .map((x) => ({
          slug: String(x.slug ?? "").trim(),
          title: String(x.title ?? "").trim(),
          category: String(x.category ?? "").trim(),
          date: String(x.date ?? "").trim(),
        }))
        .filter((x) => x.slug && x.title)

      const unique = Array.from(new Set(list.map((x) => x.category).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b, "es")
      )

      setArticles(list)
      setCategories(unique)
    } catch {
      // ignore
    } finally {
      setLoadingArticles(false)
    }
  }, [])

  useEffect(() => {
    // Carga inicial del índice cuando el usuario ya está logueado.
    // Usamos bandera `cancelled` para evitar setState si el componente desmonta.
    if (!loggedIn) return
    let cancelled = false

    setLoadingArticles(true)

    ;(async () => {
      try {
        const res = await fetch("/api/admin/articles", { cache: "no-store" })
        if (!res.ok) return
        const json = (await res.json().catch(() => null)) as
          | Array<{ slug?: string; title?: string; category?: string; date?: string }>
          | null

        const list = (json ?? [])
          .map((x) => ({
            slug: String(x.slug ?? "").trim(),
            title: String(x.title ?? "").trim(),
            category: String(x.category ?? "").trim(),
            date: String(x.date ?? "").trim(),
          }))
          .filter((x) => x.slug && x.title)

        const unique = Array.from(new Set(list.map((x) => x.category).filter(Boolean))).sort((a, b) =>
          a.localeCompare(b, "es")
        )

        if (!cancelled) {
          setArticles(list)
          setCategories(unique)
        }
      } catch {
        // silencioso: si falla, el usuario igual puede crear una categoría nueva
      } finally {
        if (!cancelled) setLoadingArticles(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [loggedIn])

  const groupedArticles = useMemo(() => {
    // Estructura útil para el componente de lista (categoría -> items).
    return articles.reduce<Record<string, Array<{ slug: string; title: string; date?: string }>>>(
      (acc, a) => {
        const key = a.category || "uncategorized"
        ;(acc[key] ??= []).push({ slug: a.slug, title: a.title, date: a.date })
        return acc
      },
      {}
    )
  }, [articles])

  return {
    categories,
    articles,
    loadingArticles,
    groupedArticles,
    refreshArticles,
  }
}
