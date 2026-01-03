import type { Ref } from "react"

import {
  insertAroundSelection,
  insertAtLineStart,
} from "../_utils/markdownEditor"

// Componente puramente de UI para crear/editar artículos.
//
// Este componente NO hace llamadas de red: delega en callbacks (publish, addImagePlaceholder, etc.).
// La página `app/admin/page.tsx` es la dueña del estado y de la integración con los endpoints.
const todayDDMMYYYY = () => {
  const d = new Date()
  const dd = String(d.getDate()).padStart(2, "0")
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const yyyy = String(d.getFullYear())
  return `${dd}-${mm}-${yyyy}`
}

/**
 * Props del editor.
 *
 * Notas:
 * - `derivedSlug` se usa para validar en UI que el título es “publicable”.
 * - El textarea tiene `id="md"` para que los botones de formato puedan ubicarlo
 *   sin pasar refs (implementación intencionalmente simple).
 */
type Props = {
  formRef: Ref<HTMLDivElement>
  editingSlug: string | null
  busy: boolean
  loadingEdit: boolean
  title: string
  setTitle: (v: string) => void
  category: string
  setCategory: (v: string) => void
  categories: string[]
  newCategory: string
  setNewCategory: (v: string) => void
  useNewCategory: boolean
  setUseNewCategory: (v: boolean) => void
  content: string
  setContent: (v: string) => void
  derivedSlug: string
  publish: () => Promise<void>
  onResetToNew: () => void
  addImagePlaceholder: (file: File) => void
  error: string | null
  success: string | null
}

export const AdminEditorCard = (props: Props) => {
  return (
    <div ref={props.formRef} className="rounded-2xl border border-neutral-200 bg-white p-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="font-title text-2xl">
          {props.editingSlug ? `Editar artículo (${props.editingSlug})` : "Nuevo artículo"}
        </h2>

        {props.editingSlug ? (
          <button
            type="button"
            className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-semibold disabled:opacity-50"
            disabled={props.busy || props.loadingEdit}
            onClick={props.onResetToNew}
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
            value={props.title}
            onChange={(e) => props.setTitle(e.target.value)}
            placeholder="Título del artículo"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Categoría</label>
            <select
              className="w-full rounded-xl border border-neutral-200 px-4 py-3 bg-white"
              value={props.useNewCategory ? "__new__" : props.category}
              onChange={(e) => {
                const v = e.target.value
                if (v === "__new__") {
                  props.setUseNewCategory(true)
                  props.setCategory("")
                } else {
                  props.setUseNewCategory(false)
                  props.setCategory(v)
                  props.setNewCategory("")
                }
              }}
            >
              <option value="">Seleccionar…</option>
              {props.categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
              <option value="__new__">Nueva…</option>
            </select>
            {props.useNewCategory ? (
              <input
                className="mt-2 w-full rounded-xl border border-neutral-200 px-4 py-3"
                value={props.newCategory}
                onChange={(e) => props.setNewCategory(e.target.value)}
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
                props.setContent(el.value)
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
                props.setContent(el.value)
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
                props.setContent(el.value)
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
                props.setContent(el.value)
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
                props.setContent(el.value)
              }}
            >
              Lista
            </button>
          </div>

          <label className="block text-sm font-semibold mb-2">Contenido (Markdown)</label>
          <textarea
            id="md"
            // Pegado/drag&drop de imágenes: insertamos un placeholder en el markdown.
            // El archivo real se mantiene en memoria y se sube recién al publicar/guardar.
            className="w-full min-h-[320px] rounded-xl border border-neutral-200 px-4 py-3 font-mono text-sm"
            value={props.content}
            onChange={(e) => props.setContent(e.target.value)}
            onPaste={async (e) => {
              const items = Array.from(e.clipboardData?.items ?? [])
              const imageItem = items.find(
                (it) => it.kind === "file" && it.type.startsWith("image/")
              )
              if (!imageItem) return

              const file = imageItem.getAsFile()
              if (!file) return

              e.preventDefault()
              try {
                props.addImagePlaceholder(file)
              } catch {
                // el error/success se manejan en la página
              }
            }}
            onDrop={async (e) => {
              const files = Array.from(e.dataTransfer?.files ?? []).filter((f) =>
                f.type.startsWith("image/")
              )
              if (files.length === 0) return

              e.preventDefault()
              try {
                for (const f of files) props.addImagePlaceholder(f)
              } catch {
                // el error/success se manejan en la página
              }
            }}
            onDragOver={(e) => {
              if (Array.from(e.dataTransfer?.types ?? []).includes("Files")) {
                e.preventDefault()
              }
            }}
            placeholder="# Título\n\nEscribe aquí tu artículo…"
          />
        </div>

        <button
          className="inline-flex items-center justify-center rounded-xl bg-neutral-900 text-white px-4 py-2 text-sm font-semibold disabled:opacity-50"
          onClick={props.publish}
          disabled={
            props.busy ||
            !props.title.trim() ||
            !(props.useNewCategory ? props.newCategory.trim() : props.category.trim()) ||
            !props.content.trim() ||
            (!props.editingSlug && !props.derivedSlug)
          }
        >
          {props.loadingEdit
            ? "Cargando datos…"
            : props.busy
              ? props.editingSlug
                ? "Guardando…"
                : "Publicando…"
              : props.editingSlug
                ? "Guardar cambios"
                : "Publicar"}
        </button>

        {props.error ? <p className="text-sm text-red-600">{props.error}</p> : null}
        {props.success ? <p className="text-sm text-green-700">{props.success}</p> : null}
      </div>
    </div>
  )
}
