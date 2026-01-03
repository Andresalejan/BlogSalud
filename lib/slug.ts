/**
 * Convierte un texto (título) en un slug seguro para URL y nombres de archivo.
 *
 * Reglas:
 * - minúsculas
 * - sin acentos/diacríticos (NFD)
 * - solo `a-z`, `0-9` y `-`
 * - espacios -> guiones
 * - compacta guiones repetidos y recorta bordes
 */
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

/**
 * Valida que el slug final cumpla el formato esperado.
 *
 * Formato: segmentos alfanuméricos separados por un solo guion.
 * Ejemplos válidos: `hola`, `hola-mundo`, `abc-123`.
 */
export const isValidSlug = (value: string) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)
