type Props = {
  groupedArticles: Record<string, Array<{ slug: string; title: string; date?: string }>>
  loadingArticles: boolean
  busy: boolean
  startEdit: (slug: string) => void
  requestDelete: (args: { slug: string; title: string }) => void
}

/**
 * Lista de artículos por categoría.
 *
 * `groupedArticles` llega ya agrupado desde el hook, pero este componente decide:
 * - orden de categorías (locale ES)
 * - orden de artículos dentro de cada categoría (por título)
 */
export const AdminArticlesCard = (props: Props) => {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6">
      <h2 className="font-title text-2xl mb-4">Artículos</h2>

      {props.loadingArticles ? (
        <p className="text-sm text-neutral-600">Cargando artículos…</p>
      ) : Object.keys(props.groupedArticles).length === 0 ? (
        <p className="text-sm text-neutral-600">No hay artículos para mostrar.</p>
      ) : (
        <div className="space-y-6">
          {Object.keys(props.groupedArticles)
            .sort((a, b) => a.localeCompare(b, "es"))
            .map((cat) => {
              const articles = props.groupedArticles[cat]
              if (!articles) return null
              return (
              <div key={cat}>
                <h3 className="text-sm font-semibold text-neutral-900 mb-2">{cat}</h3>
                <div className="divide-y divide-neutral-200 rounded-xl border border-neutral-200">
                  {articles
                    .slice()
                    .sort((a, b) => a.title.localeCompare(b.title, "es"))
                    .map((a) => (
                      <div
                        key={a.slug}
                        className="flex items-center justify-between gap-4 px-4 py-3"
                      >
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-neutral-900 truncate">
                            {a.title}
                          </div>
                          <div className="text-xs text-neutral-600 truncate">
                            /{a.slug} {a.date ? `• ${a.date}` : ""}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="rounded-lg border border-neutral-200 px-3 py-1 text-sm disabled:opacity-50"
                            onClick={() => props.startEdit(a.slug)}
                            disabled={props.busy}
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            className="rounded-lg border border-neutral-200 px-3 py-1 text-sm text-red-700 disabled:opacity-50"
                            onClick={() => props.requestDelete({ slug: a.slug, title: a.title })}
                            disabled={props.busy}
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
              )
            })}
        </div>
      )}
    </div>
  )
}
