/**
 * Helpers mínimos para “botones de formato” sobre un `<textarea>`.
 *
 * No usamos un editor WYSIWYG: la idea es mantener el flujo simple y predecible.
 * Estos helpers:
 * - modifican `textarea.value` directamente,
 * - y ajustan la selección/cursor para que el usuario pueda seguir escribiendo.
 */

export const insertAroundSelection = (
  textarea: HTMLTextAreaElement,
  before: string,
  after: string
) => {
  // Envuelve la selección actual con `before` y `after`.
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

export const insertAtLineStart = (textarea: HTMLTextAreaElement, prefix: string) => {
  // Inserta `prefix` al inicio de la línea donde está el cursor.
  const start = textarea.selectionStart
  const value = textarea.value

  const lineStart = value.lastIndexOf("\n", start - 1) + 1
  const next = value.slice(0, lineStart) + prefix + value.slice(lineStart)
  textarea.value = next

  const nextPos = start + prefix.length
  textarea.focus()
  textarea.setSelectionRange(nextPos, nextPos)
}

export const insertTextAtSelection = (textarea: HTMLTextAreaElement, text: string) => {
  // Reemplaza la selección actual por `text` (o inserta en el cursor si no hay selección).
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
export const newImageId = () => {
  // Preferimos UUID cuando existe para evitar colisiones.
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export const imageExtForMime = (mime: string) => {
  // Mapeo mínimo MIME -> extensión para generar nombres de archivo.
  // Si el MIME no está soportado, devolvemos "bin".
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
