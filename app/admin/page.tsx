"use client"

import { useEffect, useMemo, useRef, useState } from "react"

import { slugify } from "@/lib/slug"

// Panel de autores (cliente) para redactar y publicar artículos.
//
// Flujo:
// 1) Login: envía contraseña a /api/admin/login y recibe cookie HttpOnly.
// 2) Editor: título + categoría + contenido Markdown.
// 3) Publicar: llama a /api/admin/publish.
//
// Importante: el usuario NO elige slug ni fecha.
// - El slug se deriva del título (consistente con el routing /[slug]).
// - La fecha se fija al día de publicación (servidor).
const todayDDMMYYYY = () => {
  const d = new Date()
  const dd = String(d.getDate()).padStart(2, "0")
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const yyyy = String(d.getFullYear())
  return `${dd}-${mm}-${yyyy}`
}

// Helpers mínimos para “botones de formato” en el textarea.
// No usamos un editor WYSIWYG: solo manipulamos selección/posición del cursor.
const insertAroundSelection = (
  textarea: HTMLTextAreaElement,
  before: string,
  after: string
) => {
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const value = textarea.value
  const selected = value.slice(start, end)
  const next = value.slice(0, start) + before + selected + after + value.slice(end)
  textarea.value = next

  const nextStart = start + before.length
  const nextEnd = end + before.length
  textarea.focus()
  textarea.setSelectionRange(nextStart, nextEnd)
}

const insertAtLineStart = (textarea: HTMLTextAreaElement, prefix: string) => {
  const start = textarea.selectionStart
  const value = textarea.value

  const lineStart = value.lastIndexOf("\n", start - 1) + 1
  const next = value.slice(0, lineStart) + prefix + value.slice(lineStart)
  textarea.value = next

  const nextPos = start + prefix.length
  textarea.focus()
  textarea.setSelectionRange(nextPos, nextPos)
}

const insertTextAtSelection = (textarea: HTMLTextAreaElement, text: string) => {
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const value = textarea.value
  const next = value.slice(0, start) + text + value.slice(end)
  textarea.value = next
  const nextPos = start + text.length
  textarea.focus()
  textarea.setSelectionRange(nextPos, nextPos)
}

// Genera un ID estable para referenciar imágenes dentro del Markdown antes de publicar.
// En publish, el servidor reemplaza el placeholder por la URL final en /public.
const newImageId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

const imageExtForMime = (mime: string) => {
  switch (mime) {
    case "image/png":
      return "png"
    case "image/jpeg":
      return "jpg"
    case "image/webp":
      return "webp"
    case "image/gif":
      return "gif"
    default:
      return "bin"
  }
}

export default function AdminPage() {
  // Estado de autenticación del panel.
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loggedIn, setLoggedIn] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // En algunos navegadores, el autofill de password NO dispara onChange.
  // Usamos un ref para leer el valor real del input y sincronizarlo al estado.
  const usernameInputRef = useRef<HTMLInputElement | null>(null)
  const passwordInputRef = useRef<HTMLInputElement | null>(null)

  // Formulario del artículo.
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("")
  const [newCategory, setNewCategory] = useState("")
  const [useNewCategory, setUseNewCategory] = useState(false)
  const [content, setContent] = useState("")

  // Categorías existentes para el dropdown.
  // Las obtenemos del índice admin (GitHub) para que coincida con lo publicado.
  const [categories, setCategories] = useState<string[]>([])

  // Listado de artículos (admin): viene de GitHub.
  const [articles, setArticles] = useState<
    Array<{ slug: string; title: string; category: string; date?: string }>
  >([])

  // Estado de carga del listado (para no mostrar “No hay artículos” mientras carga).
  const [loadingArticles, setLoadingArticles] = useState(false)

  // Modo edición.
  const [editingSlug, setEditingSlug] = useState<string | null>(null)

  // Modal confirmación eliminar.
  const [deleteTarget, setDeleteTarget] = useState<
    { slug: string; title: string } | null
  >(null)

  // Referencia al formulario para hacer scroll suave al editar.
  const formRef = useRef<HTMLDivElement | null>(null)

  // Estado específico para el caso “Editar”: mientras traemos los datos del artículo.
  const [loadingEdit, setLoadingEdit] = useState(false)

  // Imágenes pegadas/arrastradas: se mantienen en memoria hasta que el usuario apriete Publicar.
  // Así no commiteamos nada a GitHub “a mitad de edición”.
  const [images, setImages] = useState<
    Array<{ id: string; alt: string; ext: string; file: File }>
  >([])

  // Slug sugerido (no se muestra ni se edita), derivado del título.
  // El backend también deriva el slug para no confiar en el cliente.
  const derivedSlug = useMemo(() => slugify(title), [title])

  useEffect(() => {
    // Cargamos listado/categorías solo después de login.
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

        const unique = Array.from(
          new Set(list.map((x) => x.category).filter(Boolean))
        ).sort((a, b) => a.localeCompare(b, "es"))

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

  useEffect(() => {
    // Soporte para autofill: cuando el navegador rellena la contraseña,
    // el DOM puede tener valor aunque el estado siga vacío.
    if (loggedIn) return
    if (username.trim() && password.trim()) return

    let tries = 0
    const interval = setInterval(() => {
      tries += 1
      const domUsername = usernameInputRef.current?.value ?? ""
      const domPassword = passwordInputRef.current?.value ?? ""

      if (!username.trim() && domUsername.trim()) setUsername(domUsername)
      if (!password.trim() && domPassword.trim()) setPassword(domPassword)

      if ((username.trim() || domUsername.trim()) && (password.trim() || domPassword.trim())) {
        clearInterval(interval)
        return
      }
      if (tries >= 20) {
        clearInterval(interval)
      }
    }, 100)

    return () => clearInterval(interval)
  }, [loggedIn, username, password])

  const refreshArticles = async () => {
    // Refresca el listado admin desde GitHub para mantener UI sincronizada
    // después de publicar/editar/eliminar.
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

      const unique = Array.from(
        new Set(list.map((x) => x.category).filter(Boolean))
      ).sort((a, b) => a.localeCompare(b, "es"))

      setArticles(list)
      setCategories(unique)
    } catch {
      // ignore
    } finally {
      setLoadingArticles(false)
    }
  }

  const groupedArticles = useMemo(() => {
    // Agrupa para renderizar secciones por categoría en el panel.
    return articles.reduce<Record<string, Array<{ slug: string; title: string; date?: string }>>>(
      (acc, a) => {
        const key = a.category || "uncategorized"
        ;(acc[key] ??= []).push({ slug: a.slug, title: a.title, date: a.date })
        return acc
      },
      {}
    )
  }, [articles])

  const doLogin = async () => {
    // Login simple: manda password y espera cookie HttpOnly.
    setError(null)
    setSuccess(null)
    setBusy(true)
    try {
      const effectiveUsername =
        username.trim() || usernameInputRef.current?.value?.trim() || ""
      const effectivePassword =
        password.trim() || passwordInputRef.current?.value?.trim() || ""

      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: effectiveUsername,
          password: effectivePassword,
        }),
      })

      if (!res.ok) {
        const json = (await res.json().catch(() => null)) as any
        throw new Error(json?.error ?? "Login failed")
      }

      setLoggedIn(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed")
    } finally {
      setBusy(false)
    }
  }

  const publish = async () => {
    // Publicación: envía título/categoría/contenido.
    // El servidor se encarga de:
    // - Derivar slug a partir del título
    // - Asignar fecha = hoy
    // - Crear commit en GitHub con articles/<slug>.md
    setError(null)
    setSuccess(null)
    setBusy(true)
    try {
      const effectiveCategory = useNewCategory ? newCategory.trim() : category.trim()
      if (!effectiveCategory) throw new Error("Selecciona o escribe una categoría")

      if (editingSlug) {
        // Guardar cambios: actualiza el artículo existente (commit en GitHub).
        // Usamos multipart para permitir:
        // - Subir imágenes nuevas (placeholders __image:<id>__)
        // - Que el servidor borre imágenes removidas del markdown
        const form = new FormData()
        form.append("title", title)
        form.append("category", effectiveCategory)
        form.append("content", content)
        form.append(
          "imagesMeta",
          JSON.stringify(images.map((img) => ({ id: img.id, alt: img.alt, ext: img.ext })))
        )
        for (const img of images) {
          form.append(`image:${img.id}`, img.file)
        }

        const res = await fetch(`/api/admin/articles/${encodeURIComponent(editingSlug)}`, {
          method: "PUT",
          body: form,
        })

        const json = (await res.json().catch(() => null)) as any
        if (!res.ok) {
          throw new Error(json?.error ?? "Update failed")
        }

        setSuccess(
          `Actualizado en GitHub: ${json?.path ?? `articles/${editingSlug}.md`}. ` +
            "Puede tardar ~30–60s en verse en la home (deploy/caché)."
        )
      } else {
        if (!derivedSlug) throw new Error("Ingresa un título válido")

        // Publicar nuevo: envía multipart para permitir imágenes + markdown en un solo commit.
        // Enviamos multipart: contenido + metadata + archivos (imágenes) en un solo request.
        // El servidor crea el commit recién acá.
        const form = new FormData()
        form.append("title", title)
        form.append("category", effectiveCategory)
        form.append("content", content)
        form.append(
          "imagesMeta",
          JSON.stringify(images.map((img) => ({ id: img.id, alt: img.alt, ext: img.ext })))
        )
        for (const img of images) {
          form.append(`image:${img.id}`, img.file)
        }

        const res = await fetch("/api/admin/publish", {
          method: "POST",
          body: form,
        })

        const json = (await res.json().catch(() => null)) as any
        if (!res.ok) {
          throw new Error(json?.error ?? "Publish failed")
        }

        setSuccess(
          `Publicado en GitHub: ${json?.path ?? "articles/"}. ` +
            "Puede tardar ~30–60s en verse en la home (deploy/caché)."
        )
      }

      // Éxito: limpiar formulario.
      // (incluye imágenes en memoria y cualquier modo de edición activo).
      setTitle("")
      setCategory("")
      setNewCategory("")
      setUseNewCategory(false)
      setContent("")
      setImages([])
      setEditingSlug(null)
      await refreshArticles()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Publish failed")
    } finally {
      setBusy(false)
    }
  }

  const startEdit = async (slug: string) => {
    // Carga un artículo existente desde GitHub y precarga el formulario.
    // Nota: en modo edición las imágenes se manejan editando el markdown:
    // - Si se borra una referencia a /images/<slug>/..., el servidor elimina el archivo.
    // - Si se pega/arrastra una imagen nueva, se sube con el guardado.
    setError(null)
    setSuccess(null)
    setBusy(true)
    setLoadingEdit(true)

    // UX: al presionar Editar, subimos suavemente al inicio de la página.
    // Lo hacemos inmediatamente para que el usuario vea que se está cargando.
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "smooth" })
    })
    try {
      const res = await fetch(`/api/admin/articles/${encodeURIComponent(slug)}`, {
        cache: "no-store",
      })
      const json = (await res.json().catch(() => null)) as any
      if (!res.ok) {
        throw new Error(json?.error ?? "Failed to load article")
      }

      setEditingSlug(slug)
      setTitle(String(json?.title ?? ""))

      const cat = String(json?.category ?? "").trim()
      if (cat && categories.includes(cat)) {
        setUseNewCategory(false)
        setCategory(cat)
        setNewCategory("")
      } else {
        setUseNewCategory(true)
        setCategory("")
        setNewCategory(cat)
      }

      setContent(String(json?.content ?? ""))
      // Al entrar a edición, reseteamos imágenes para no mezclar con publicación nueva.
      setImages([])
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load article")
    } finally {
      setBusy(false)
      setLoadingEdit(false)
    }
  }

  const confirmDelete = async () => {
    // Elimina el archivo del repo tras confirmación (crea un commit).
    if (!deleteTarget) return
    setError(null)
    setSuccess(null)
    setBusy(true)
    try {
      const res = await fetch(`/api/admin/articles/${encodeURIComponent(deleteTarget.slug)}`, {
        method: "DELETE",
      })
      const json = (await res.json().catch(() => null)) as any
      if (!res.ok) {
        throw new Error(json?.error ?? "Delete failed")
      }

      const deleted = deleteTarget
      setDeleteTarget(null)
      setSuccess(
        `Eliminado en GitHub: articles/${deleted.slug}.md. ` +
          "Puede tardar ~30–60s en verse reflejado (deploy/caché)."
      )
      // Si el usuario estaba editando el mismo artículo, limpiamos el formulario.
      if (editingSlug === deleted.slug) {
        setEditingSlug(null)
        setTitle("")
        setCategory("")
        setNewCategory("")
        setUseNewCategory(false)
        setContent("")
        setImages([])
      }
      await refreshArticles()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed")
    } finally {
      setBusy(false)
    }
  }

  const addImagePlaceholder = (file: File) => {
    if (!title.trim()) {
      throw new Error("Primero ingresa un título (antes de pegar imágenes)")
    }

    const textarea = document.getElementById("md") as HTMLTextAreaElement | null
    if (!textarea) return

    const id = newImageId()
    const alt = file.name ? file.name.replace(/\.[^.]+$/, "") : "imagen"
    const ext = imageExtForMime(file.type)

    // Placeholder interno. En publish, el servidor lo reemplaza por la URL final.
    const placeholder = `__image:${id}__`
    insertTextAtSelection(textarea, `![${alt}](${placeholder})`)
    setContent(textarea.value)
    setImages((prev) => [...prev, { id, alt, ext, file }])
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-title text-3xl mb-6">Panel de autores</h1>

      {!loggedIn ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-6">
          <h2 className="font-title text-2xl mb-2">Acceso</h2>
          <p className="text-sm text-neutral-600 mb-4">
            Ingresa las credenciales para habilitar la publicación.
          </p>

          <label className="block text-sm font-semibold mb-2">Usuario</label>
          <input
            className="w-full rounded-xl border border-neutral-200 px-4 py-3"
            type="text"
            name="username"
            autoComplete="username"
            ref={usernameInputRef}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="admin"
          />

          <label className="block text-sm font-semibold mb-2">Contraseña</label>
          <input
            className="w-full rounded-xl border border-neutral-200 px-4 py-3"
            type="password"
            name="password"
            autoComplete="current-password"
            ref={passwordInputRef}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== "Enter") return
              if (busy) return
              const effectiveUser =
                username.trim() || usernameInputRef.current?.value?.trim() || ""
              const effectivePass =
                password.trim() || passwordInputRef.current?.value?.trim() || ""
              if (!effectiveUser || !effectivePass) return
              e.preventDefault()
              void doLogin()
            }}
            placeholder="••••••••"
          />

          <button
            className="mt-4 inline-flex items-center justify-center rounded-xl bg-neutral-900 text-white px-4 py-2 text-sm font-semibold disabled:opacity-50"
            onClick={doLogin}
            disabled={
              busy ||
              !(username.trim() || usernameInputRef.current?.value?.trim()) ||
              !(password.trim() || passwordInputRef.current?.value?.trim())
            }
          >
            {busy ? "Ingresando…" : "Ingresar"}
          </button>

          {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        </div>
      ) : (
        <div className="space-y-6">
          <div ref={formRef} className="rounded-2xl border border-neutral-200 bg-white p-6">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="font-title text-2xl">
                {editingSlug ? `Editar artículo (${editingSlug})` : "Nuevo artículo"}
              </h2>

              {editingSlug ? (
                <button
                  type="button"
                  className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-semibold disabled:opacity-50"
                  disabled={busy || loadingEdit}
                  onClick={() => {
                    // Volver al modo “Nuevo artículo” y limpiar el formulario.
                    setError(null)
                    setSuccess(null)
                    setEditingSlug(null)
                    setTitle("")
                    setCategory("")
                    setNewCategory("")
                    setUseNewCategory(false)
                    setContent("")
                    setImages([])
                  }}
                >
                  Nuevo artículo
                </button>
              ) : null}
            </div>

            <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Título</label>
              <input
                className="w-full rounded-xl border border-neutral-200 px-4 py-3"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Título del artículo"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Categoría</label>
                <select
                  className="w-full rounded-xl border border-neutral-200 px-4 py-3 bg-white"
                  value={useNewCategory ? "__new__" : category}
                  onChange={(e) => {
                    const v = e.target.value
                    if (v === "__new__") {
                      setUseNewCategory(true)
                      setCategory("")
                    } else {
                      setUseNewCategory(false)
                      setCategory(v)
                      setNewCategory("")
                    }
                  }}
                >
                  <option value="">Seleccionar…</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                  <option value="__new__">Nueva…</option>
                </select>
                {useNewCategory ? (
                  <input
                    className="mt-2 w-full rounded-xl border border-neutral-200 px-4 py-3"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="Escribe la nueva categoría"
                  />
                ) : null}
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Fecha</label>
                <input
                  className="w-full rounded-xl border border-neutral-200 px-4 py-3 bg-neutral-50"
                  value={todayDDMMYYYY()}
                  readOnly
                />
              </div>
            </div>

            <div>
              <div className="flex flex-wrap gap-2 mb-2">
                <span className="text-sm font-semibold mr-2">Opciones</span>
                <button
                  type="button"
                  className="rounded-lg border border-neutral-200 px-3 py-1 text-sm"
                  onClick={() => {
                    const el = document.getElementById("md") as HTMLTextAreaElement | null
                    if (!el) return
                    insertAtLineStart(el, "## ")
                    setContent(el.value)
                  }}
                >
                  H2
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-neutral-200 px-3 py-1 text-sm"
                  onClick={() => {
                    const el = document.getElementById("md") as HTMLTextAreaElement | null
                    if (!el) return
                    insertAroundSelection(el, "**", "**")
                    setContent(el.value)
                  }}
                >
                  Negrita
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-neutral-200 px-3 py-1 text-sm"
                  onClick={() => {
                    const el = document.getElementById("md") as HTMLTextAreaElement | null
                    if (!el) return
                    insertAroundSelection(el, "_", "_")
                    setContent(el.value)
                  }}
                >
                  Cursiva
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-neutral-200 px-3 py-1 text-sm"
                  onClick={() => {
                    const el = document.getElementById("md") as HTMLTextAreaElement | null
                    if (!el) return
                    insertAroundSelection(el, "[", "](https://)")
                    setContent(el.value)
                  }}
                >
                  Link
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-neutral-200 px-3 py-1 text-sm"
                  onClick={() => {
                    const el = document.getElementById("md") as HTMLTextAreaElement | null
                    if (!el) return
                    insertAtLineStart(el, "- ")
                    setContent(el.value)
                  }}
                >
                  Lista
                </button>
              </div>

              <label className="block text-sm font-semibold mb-2">Contenido (Markdown)</label>
              <textarea
                id="md"
                className="w-full min-h-[320px] rounded-xl border border-neutral-200 px-4 py-3 font-mono text-sm"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onPaste={async (e) => {
                  // Soporte de pegar imagen desde el portapapeles.
                  // Si el usuario pega texto normal, dejamos el comportamiento por defecto.
                  const items = Array.from(e.clipboardData?.items ?? [])
                  const imageItem = items.find((it) => it.kind === "file" && it.type.startsWith("image/"))
                  if (!imageItem) return

                  const file = imageItem.getAsFile()
                  if (!file) return

                  e.preventDefault()
                  setError(null)
                  setSuccess(null)
                  try {
                    addImagePlaceholder(file)
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "No se pudo adjuntar la imagen")
                  }
                }}
                onDrop={async (e) => {
                  // Soporte de arrastrar y soltar imágenes dentro del textarea.
                  const files = Array.from(e.dataTransfer?.files ?? []).filter((f) =>
                    f.type.startsWith("image/")
                  )
                  if (files.length === 0) return

                  e.preventDefault()
                  setError(null)
                  setSuccess(null)
                  try {
                    // Insertamos placeholders por cada archivo soltado.
                    for (const f of files) addImagePlaceholder(f)
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "No se pudo adjuntar la imagen")
                  }
                }}
                onDragOver={(e) => {
                  // Necesario para que el drop funcione.
                  if (Array.from(e.dataTransfer?.types ?? []).includes("Files")) {
                    e.preventDefault()
                  }
                }}
                placeholder="# Título\n\nEscribe aquí tu artículo…"
              />
            </div>

            <button
              className="inline-flex items-center justify-center rounded-xl bg-neutral-900 text-white px-4 py-2 text-sm font-semibold disabled:opacity-50"
              onClick={publish}
              disabled={
                busy ||
                !title.trim() ||
                !(useNewCategory ? newCategory.trim() : category.trim()) ||
                !content.trim() ||
                (!editingSlug && !derivedSlug)
              }
            >
              {loadingEdit
                ? "Cargando datos…"
                : busy
                  ? editingSlug
                    ? "Guardando…"
                    : "Publicando…"
                  : editingSlug
                    ? "Guardar cambios"
                    : "Publicar"}
            </button>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            {success ? <p className="text-sm text-green-700">{success}</p> : null}
          </div>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-6">
            <h2 className="font-title text-2xl mb-4">Artículos</h2>

            {loadingArticles ? (
              <p className="text-sm text-neutral-600">Cargando artículos…</p>
            ) : Object.keys(groupedArticles).length === 0 ? (
              <p className="text-sm text-neutral-600">No hay artículos para mostrar.</p>
            ) : (
              <div className="space-y-6">
                {Object.keys(groupedArticles)
                  .sort((a, b) => a.localeCompare(b, "es"))
                  .map((cat) => (
                    <div key={cat}>
                      <h3 className="text-sm font-semibold text-neutral-900 mb-2">{cat}</h3>
                      <div className="divide-y divide-neutral-200 rounded-xl border border-neutral-200">
                        {groupedArticles[cat]
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
                                  onClick={() => startEdit(a.slug)}
                                  disabled={busy}
                                >
                                  Editar
                                </button>
                                <button
                                  type="button"
                                  className="rounded-lg border border-neutral-200 px-3 py-1 text-sm text-red-700 disabled:opacity-50"
                                  onClick={() => setDeleteTarget({ slug: a.slug, title: a.title })}
                                  disabled={busy}
                                >
                                  Eliminar
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {deleteTarget ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
              <div
                className="absolute inset-0 bg-neutral-900/30"
                onClick={() => (busy ? null : setDeleteTarget(null))}
              />
              <div className="relative w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6">
                <h3 className="font-title text-xl mb-2">Confirmar eliminación</h3>
                <p className="text-sm text-neutral-700">
                  ¿Eliminar “{deleteTarget.title}”? Esta acción creará un commit que borra el archivo.
                </p>
                <div className="mt-4 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-semibold disabled:opacity-50"
                    onClick={() => setDeleteTarget(null)}
                    disabled={busy}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                    onClick={confirmDelete}
                    disabled={busy}
                  >
                    {busy ? "Eliminando…" : "Eliminar"}
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
