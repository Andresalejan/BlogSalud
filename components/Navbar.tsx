"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"

type ArticleIndexItem = {
  // `id` coincide con el slug del artículo (nombre del .md sin extensión).
  id: string
  title: string
  category: string
}

type NavbarProps = {
  contentEnv?: "dev" | "prod"
}

const Navbar = ({ contentEnv }: NavbarProps) => {
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME ?? "BlogSalud"
  const siteDescription =
    process.env.NEXT_PUBLIC_SITE_DESCRIPTION ??
    "Artículos de salud femenina."

  // Logo del título (archivo en /public). Nota: el nombre incluye espacios, por eso va URL-encoded.
  const siteLogoSrc = "/ginesavia%20web%20blanco-01.png"

  // Estado del input y su versión “debounced” (para no filtrar en cada tecla).
  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")

  // Índice descargado desde /api/articles (solo title/category/id, sin contenido).
  const [articleIndex, setArticleIndex] = useState<ArticleIndexItem[]>([])

  // Flags para UX: placeholder “Cargando…” y error amigable.
  const [isLoadingIndex, setIsLoadingIndex] = useState(false)
  const [indexError, setIndexError] = useState<string | null>(null)

  // Importante: en modo dev, React puede ejecutar efectos más de una vez
  // (Strict Mode). Además, si el efecto depende de estados que cambian durante
  // el fetch, es fácil caer en loops y abortos.
  // Estas refs nos ayudan a garantizar: “solo 1 fetch” y “no refetch si ya cargó”.
  const indexLoadedRef = useRef(false)
  const indexInFlightRef = useRef(false)

  useEffect(() => {
    // Debounce simple: esperamos 150ms tras la última tecla para actualizar
    // el valor que se usa para filtrar.
    const handle = setTimeout(() => setDebouncedQuery(query.trim()), 150)
    return () => clearTimeout(handle)
  }, [query])

  useEffect(() => {
    // Cargamos el índice una sola vez y reutilizamos en todas las rutas.
    // Evita: re-fetch infinito y requests canceladas.
    if (indexLoadedRef.current || indexInFlightRef.current) return

    // AbortController por si el componente se desmonta antes de terminar.
    const controller = new AbortController()
    indexInFlightRef.current = true
    setIsLoadingIndex(true)
    setIndexError(null)

    // Descargamos el índice una sola vez. Luego filtramos en el cliente.
    fetch("/api/articles", { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`Error ${res.status}`)
        }
        return (await res.json()) as ArticleIndexItem[]
      })
      .then((data) => {
        setArticleIndex(Array.isArray(data) ? data : [])
        // Marcamos como “cargado” para no volver a pedirlo.
        indexLoadedRef.current = true
      })
      .catch((err: unknown) => {
        // Si el request fue cancelado (navegación, desmontaje, etc.) no mostramos error.
        if (err instanceof DOMException && err.name === "AbortError") {
          indexInFlightRef.current = false
          return
        }
        // Error real: mostramos un mensaje breve.
        setIndexError("No se pudo cargar la búsqueda")
        indexInFlightRef.current = false
      })
      .finally(() => {
        // Siempre bajamos el flag de carga (éxito o error).
        setIsLoadingIndex(false)
        indexInFlightRef.current = false
      })

    // Cleanup: si el efecto se limpia (Strict Mode o desmontaje), cancelamos el request.
    // Importante: en Strict Mode (dev) React ejecuta efecto+cleanup y luego re-ejecuta
    // el efecto inmediatamente. Si no liberamos el flag aquí, el segundo efecto puede
    // “creer” que hay un request en vuelo y no volver a pedir el índice.
    return () => {
      indexInFlightRef.current = false
      controller.abort()
    }
  }, [])

  const results = useMemo(() => {
    if (!debouncedQuery) return []

    // Búsqueda simple “contains” por título y por categoría.
    const q = debouncedQuery.toLowerCase()
    return articleIndex
      .filter((a) => {
        const title = (a.title ?? "").toLowerCase()
        const category = (a.category ?? "").toLowerCase()
        return title.includes(q) || category.includes(q)
      })
      .slice(0, 8)
  }, [articleIndex, debouncedQuery])

  return (
    <header className="relative z-50 w-full border-b border-violet-100 bg-violet-50/70 backdrop-blur supports-[backdrop-filter]:bg-violet-50/60">
      <nav className="mx-auto w-11/12 max-w-5xl py-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <Link href="/" className="flex items-center leading-none shrink-0">
          <span className="flex items-center gap-2 font-cormorantGaramond text-2xl tracking-tight text-violet-900">
            <span className="inline-flex items-center">
              <Image
                src={siteLogoSrc}
                alt={siteName}
                width={720}
                height={180}
                priority
                // Usamos tamaños que existen en Tailwind y una base suficientemente grande.
                // Con zoom, el viewport efectivo cambia y puede activar/desactivar breakpoints.
                // Esta escala evita saltos donde el logo queda demasiado pequeño.
                sizes="(max-width: 768px) 75vw, 520px"
                className="relative -top-3 h-16 sm:h-20 md:h-24 lg:h-24 w-auto"
              />
              <span className="sr-only">{siteName}</span>
            </span>
            {contentEnv === "dev" ? (
              <span className="inline-flex items-center rounded-full border border-violet-200 bg-violet-100 px-2.5 py-1 font-poppins text-xs font-semibold tracking-widest text-violet-900">
                DEV
              </span>
            ) : null}
          </span>
          {/* <span className="font-poppins text-xs tracking-wide text-violet-700/90">
            {siteDescription}
          </span> */}
        </Link>

        <div className="flex w-full flex-wrap items-center gap-x-4 gap-y-3 font-poppins text-sm md:w-auto md:flex-nowrap md:justify-end">
          <Link href="/" className="px-2 py-1 text-neutral-800 hover:text-violet-800 transition">
            Inicio
          </Link>
          <Link href="/sobre-nosotros" className="px-2 py-1 text-neutral-800 hover:text-violet-800 transition">
            Sobre nosotros
          </Link>

          <div className="relative w-full md:w-auto md:min-w-72">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Buscar por categoría o título"
              // Placeholder dinámico para indicar estado.
              placeholder={
                isLoadingIndex ? "Cargando…" : "Buscar temas, síntomas, dudas…"
              }
              className="w-full min-w-0 rounded-full border border-violet-100 bg-white px-4 py-2 text-sm text-neutral-900 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-violet-200 md:w-72"
            />

            {indexError ? (
              // Mensaje de error pequeño debajo del input.
              <div className="absolute left-0 right-0 mt-2 rounded-xl border border-violet-100 bg-white px-3 py-2 text-xs text-neutral-700 md:left-auto md:right-0 md:w-72">
                {indexError}
              </div>
            ) : null}

            {debouncedQuery ? (
              // Dropdown de resultados: aparece solo si hay texto.
              <div className="absolute left-0 right-0 z-50 mt-2 overflow-hidden rounded-xl border border-violet-100 bg-white md:left-auto md:right-0 md:w-72">
                {results.length > 0 ? (
                  <ul
                    className={
                      results.length > 4
                        ? "max-h-56 overflow-y-auto"
                        : "overflow-y-auto"
                    }
                  >
                    {results.map((item) => (
                      <li key={item.id}>
                        <Link
                          href={`/${item.id}`}
                          // UX: limpiamos el input al seleccionar un resultado.
                          onClick={() => setQuery("")}
                          className="block px-4 py-3 hover:bg-violet-50 transition"
                        >
                          <div className="text-sm text-neutral-900">
                            {item.title}
                          </div>
                          {item.category ? (
                            <div className="text-xs text-neutral-600">
                              {item.category}
                            </div>
                          ) : null}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="px-4 py-3 text-xs text-neutral-700">
                    Sin resultados
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </nav>
    </header>
  )
}

export default Navbar
