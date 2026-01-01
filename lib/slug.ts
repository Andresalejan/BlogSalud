// Convierte un texto (título) en un slug seguro para URL y nombres de archivo.
// Reglas: minúsculas, sin acentos, solo [a-z0-9-], espacios -> guiones.
export const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")

// Valida que el slug final cumpla el formato esperado.
export const isValidSlug = (value: string) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)
