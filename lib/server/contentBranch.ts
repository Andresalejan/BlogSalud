export const getContentBranch = (): string => {
  const raw = String(process.env.CONTENT_BRANCH ?? "").trim()
  // Fallback conservador: si no está seteada, trabajamos contra main.
  if (!raw) return "main"

  // Evita valores obviously inválidos (espacios, saltos de línea).
  // No intentamos “normalizar” más para permitir nombres de rama arbitrarios.
  if (/\s/.test(raw)) return "main"

  return raw
}
