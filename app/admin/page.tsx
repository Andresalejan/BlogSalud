"use client"

import { useEffect, useMemo, useRef, useState } from "react"

import { slugify } from "@/lib/slug"

import { useAdminIndex } from "./_hooks/useAdminIndex"
import { AdminLoginCard } from "./_components/AdminLoginCard"
import { AdminEditorCard } from "./_components/AdminEditorCard"
import { AdminArticlesCard } from "./_components/AdminArticlesCard"
import { DeleteConfirmModal } from "./_components/DeleteConfirmModal"
import {
  imageExtForMime,
  insertTextAtSelection,
  newImageId,
} from "./_utils/markdownEditor"

/**
 * Panel de autores (cliente) para redactar y publicar artículos.
 *
 * Este archivo es el “orquestador” del módulo admin:
 * - Mantiene el estado de UI (formulario, modo edición, mensajes).
 * - Llama a endpoints (`/api/admin/*`) y delega renderizado en componentes.
 *
 * Flujo general:
 * 1) Login: POST a `/api/admin/login` y el servidor setea cookie HttpOnly.
 * 2) Listado: GET a `/api/admin/articles` para categorías y artículos.
 * 3) Publicar: POST a `/api/admin/publish` (nuevo) o PUT a `/api/admin/articles/[slug]` (editar).
 * 4) Eliminar: DELETE a `/api/admin/articles/[slug]`.
 *
 * Decisiones importantes:
 * - El usuario NO elige el slug: se deriva desde el título (y el servidor lo vuelve a derivar).
 * - La fecha se fija en el servidor al publicar/actualizar.
 * - Las imágenes pegadas se mantienen en memoria hasta confirmar (para hacer commit atómico).
 */


// Helpers de edición Markdown / imágenes viven en `./_utils/markdownEditor`.
// Nota: este archivo solo “conecta” esas utilidades con el estado del formulario.

export default function AdminPage() {
  // ------------------------------
  // Estado de autenticación y UI
  // ------------------------------
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loggedIn, setLoggedIn] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // En algunos navegadores, el autofill de password NO dispara onChange.
  // Usamos un ref para leer el valor real del input y sincronizarlo al estado.
  const usernameInputRef = useRef<HTMLInputElement>(null!)
  const passwordInputRef = useRef<HTMLInputElement>(null!)

  // ------------------------------
  // Formulario del artículo
  // ------------------------------
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("")
  const [newCategory, setNewCategory] = useState("")
  const [useNewCategory, setUseNewCategory] = useState(false)
  const [content, setContent] = useState("")

  const { categories, groupedArticles, loadingArticles, refreshArticles } = useAdminIndex(loggedIn)

  // Modo edición: cuando hay `editingSlug`, el botón principal pasa a “Guardar cambios”.
  const [editingSlug, setEditingSlug] = useState<string | null>(null)

  // Modal de confirmación (evita borrados accidentales).
  const [deleteTarget, setDeleteTarget] = useState<
    { slug: string; title: string } | null
  >(null)

  // Referencia al formulario para hacer scroll suave al editar.
  const formRef = useRef<HTMLDivElement | null>(null)

  // Token para re-disparar animación del editor (sin librerías).
  const [editorFxKey, setEditorFxKey] = useState(0)

  // Estado específico del caso “Editar”: mientras traemos los datos del artículo.
  const [loadingEdit, setLoadingEdit] = useState(false)

  // Imágenes pegadas/arrastradas: se mantienen en memoria hasta confirmar Publicar/Guardar.
  // Esto permite que el servidor cree UN commit con:
  // - el markdown final, y
  // - todos los archivos de imagen nuevos.
  const [images, setImages] = useState<
    Array<{ id: string; alt: string; ext: string; file: File }>
  >([])

  // Slug derivado del título (no se edita). Se usa para validación de UI.
  // El backend también deriva el slug: el cliente no es fuente de verdad.
  const derivedSlug = useMemo(() => slugify(title), [title])

  // listado/categorías ahora lo maneja el hook useAdminIndex

  useEffect(() => {
    // Soporte para autofill: cuando el navegador rellena la contraseña,
    // el DOM puede tener valor aunque el estado siga vacío.
    // Esto mejora UX (p.ej. gestores de contraseñas) sin depender de eventos.
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

  // refreshArticles lo expone el hook

  // groupedArticles lo expone el hook

  const doLogin = async () => {
    // Login simple: manda password y espera cookie HttpOnly.
    // Nota: el servidor es quien decide si el usuario queda “logueado”.
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
    //
    // En modo edición (PUT), `editingSlug` indica qué archivo se actualiza.
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

    // Reproduce una animación sutil en el editor.
    setEditorFxKey((k) => k + 1)

    // UX: al presionar Editar, llevamos al usuario al editor (donde verá “Cargando…”).
    requestAnimationFrame(() => {
      const el = formRef.current
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" })
      } else {
        window.scrollTo({ top: 0, left: 0, behavior: "smooth" })
      }
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
    // Inserta un placeholder en el Markdown y guarda el archivo en memoria.
    // El placeholder se reemplaza en el servidor al publicar/guardar.
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

      <div
        key={loggedIn ? "admin:logged-in" : "admin:logged-out"}
        className="page-transition-enter"
      >
        {!loggedIn ? (
          <AdminLoginCard
            username={username}
            setUsername={setUsername}
            password={password}
            setPassword={setPassword}
            usernameInputRef={usernameInputRef}
            passwordInputRef={passwordInputRef}
            busy={busy}
            error={error}
            doLogin={doLogin}
          />
        ) : (
          <div className="space-y-6">
            <div key={editorFxKey} className="page-transition-enter">
              <AdminEditorCard
                formRef={formRef}
                editingSlug={editingSlug}
                busy={busy}
                loadingEdit={loadingEdit}
                title={title}
                setTitle={setTitle}
                category={category}
                setCategory={setCategory}
                categories={categories}
                newCategory={newCategory}
                setNewCategory={setNewCategory}
                useNewCategory={useNewCategory}
                setUseNewCategory={setUseNewCategory}
                content={content}
                setContent={setContent}
                derivedSlug={derivedSlug}
                publish={publish}
                addImagePlaceholder={(file) => {
                  setError(null)
                  setSuccess(null)
                  try {
                    addImagePlaceholder(file)
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "No se pudo adjuntar la imagen")
                  }
                }}
                onResetToNew={() => {
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
                error={error}
                success={success}
              />
            </div>

            <AdminArticlesCard
              groupedArticles={groupedArticles}
              loadingArticles={loadingArticles}
              busy={busy}
              startEdit={(slug) => void startEdit(slug)}
              requestDelete={(t) => setDeleteTarget(t)}
            />

            {deleteTarget ? (
              <DeleteConfirmModal
                deleteTarget={deleteTarget}
                busy={busy}
                onCancel={() => setDeleteTarget(null)}
                onConfirm={() => void confirmDelete()}
              />
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}
