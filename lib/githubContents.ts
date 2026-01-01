type GitHubContentsGetResponse = {
  sha: string
  content?: string
  encoding?: string
}

type GitHubContentsDirEntry = {
  type: "file" | "dir" | string
  name: string
  path: string
  sha: string
}

export type GitHubPublishConfig = {
  // Token con permiso para escribir contenidos en el repo.
  token: string
  owner: string
  repo: string
  branch: string
}

const githubApiBase = "https://api.github.com"

// GitHub acepta distintos esquemas según el tipo de token.
// - Tokens clásicos (ghp_...) suelen documentarse con "token <PAT>".
// - Tokens fine-grained (github_pat_...) se documentan con "Bearer <token>".
// Para evitar incompatibilidades, detectamos el prefijo y elegimos el esquema.
const githubAuthHeader = (token: string) => {
  const scheme = token.startsWith("ghp_") ? "token" : "Bearer"
  return `${scheme} ${token}`
}

const ghHeaders = (token: string) => ({
  // Usamos Bearer token (PAT / fine-grained) para autenticar contra GitHub API.
  Authorization: githubAuthHeader(token),
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
  "Content-Type": "application/json",
})

const base64EncodeUtf8 = (text: string) => Buffer.from(text, "utf-8").toString("base64")
const base64FromBuffer = (buf: Buffer) => buf.toString("base64")

export const getExistingFileSha = async (
  cfg: GitHubPublishConfig,
  path: string
): Promise<string | null> => {
  // Consulta el endpoint de Contents para saber si el archivo existe.
  // Si existe, GitHub devuelve un `sha` que sirve para actualizarlo.
  // En este proyecto lo usamos principalmente para evitar sobreescrituras.
  const url = `${githubApiBase}/repos/${cfg.owner}/${cfg.repo}/contents/${encodeURIComponent(
    path
  )}?ref=${encodeURIComponent(cfg.branch)}`

  const res = await fetch(url, {
    method: "GET",
    headers: ghHeaders(cfg.token),
    cache: "no-store",
  })

  if (res.status === 404) return null

  if (!res.ok) {
    const body = await res.text().catch(() => "")
    if (res.status === 401) {
      throw new Error(
        "GitHub auth failed (401 Bad credentials). Revisa GITHUB_TOKEN y sus permisos (Contents: read/write) y reinicia el servidor."
      )
    }
    throw new Error(`GitHub GET contents failed (${res.status}): ${body}`)
  }

  const json = (await res.json()) as GitHubContentsGetResponse
  if (!json?.sha) throw new Error("GitHub GET contents returned no sha")
  return json.sha
}

export const getFileContentUtf8 = async (
  cfg: GitHubPublishConfig,
  path: string
): Promise<{ sha: string; contentUtf8: string } | null> => {
  // Lee un archivo del repo usando la Contents API y devuelve:
  // - sha: necesario para actualizar/borrar el archivo
  // - contentUtf8: contenido decodificado desde base64
  const url = `${githubApiBase}/repos/${cfg.owner}/${cfg.repo}/contents/${encodeURIComponent(
    path
  )}?ref=${encodeURIComponent(cfg.branch)}`

  const res = await fetch(url, {
    method: "GET",
    headers: ghHeaders(cfg.token),
    cache: "no-store",
  })

  if (res.status === 404) return null

  if (!res.ok) {
    const body = await res.text().catch(() => "")
    if (res.status === 401) {
      throw new Error(
        "GitHub auth failed (401 Bad credentials). Revisa GITHUB_TOKEN y sus permisos (Contents: read/write) y reinicia el servidor."
      )
    }
    throw new Error(`GitHub GET contents failed (${res.status}): ${body}`)
  }

  const json = (await res.json()) as GitHubContentsGetResponse
  if (!json?.sha) throw new Error("GitHub GET contents returned no sha")

  const encoding = (json.encoding ?? "base64").toLowerCase()
  // GitHub suele devolver el contenido con saltos de línea cada cierto largo.
  // Los removemos para poder decodificar correctamente.
  const contentBase64 = (json.content ?? "").replace(/\n/g, "")
  if (!contentBase64) throw new Error("GitHub GET contents returned no content")
  if (encoding !== "base64") {
    throw new Error(`Unsupported GitHub content encoding: ${encoding}`)
  }

  const contentUtf8 = Buffer.from(contentBase64, "base64").toString("utf-8")
  return { sha: json.sha, contentUtf8 }
}

export const listDirectory = async (
  cfg: GitHubPublishConfig,
  dirPath: string
): Promise<Array<{ name: string; path: string; sha: string; type: "file" | "dir" | string }> | null> => {
  // Lista entradas de un directorio del repo usando Contents API.
  // Si el directorio no existe, devolvemos null.
  const url = `${githubApiBase}/repos/${cfg.owner}/${cfg.repo}/contents/${encodeURIComponent(
    dirPath
  )}?ref=${encodeURIComponent(cfg.branch)}`

  const res = await fetch(url, {
    method: "GET",
    headers: ghHeaders(cfg.token),
    cache: "no-store",
  })

  if (res.status === 404) return null

  if (!res.ok) {
    const body = await res.text().catch(() => "")
    if (res.status === 401) {
      throw new Error(
        "GitHub auth failed (401 Bad credentials). Revisa GITHUB_TOKEN y sus permisos (Contents: read/write) y reinicia el servidor."
      )
    }
    throw new Error(`GitHub GET contents (dir) failed (${res.status}): ${body}`)
  }

  const json = (await res.json()) as unknown
  if (!Array.isArray(json)) {
    throw new Error("GitHub GET contents (dir) returned non-array")
  }

  return (json as GitHubContentsDirEntry[]).map((e) => ({
    name: String(e.name ?? ""),
    path: String(e.path ?? ""),
    sha: String(e.sha ?? ""),
    type: e.type,
  }))
}

export const deleteFile = async (args: {
  cfg: GitHubPublishConfig
  path: string
  sha: string
  message: string
}) => {
  // Borra un archivo del repo (crea un commit en el branch).
  // Importante: GitHub exige el `sha` del archivo a borrar.
  const url = `${githubApiBase}/repos/${args.cfg.owner}/${args.cfg.repo}/contents/${encodeURIComponent(
    args.path
  )}`

  const res = await fetch(url, {
    method: "DELETE",
    headers: ghHeaders(args.cfg.token),
    body: JSON.stringify({
      message: args.message,
      sha: args.sha,
      branch: args.cfg.branch,
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`GitHub DELETE contents failed (${res.status}): ${text}`)
  }

  return res.json()
}

export const createOrUpdateFile = async (args: {
  cfg: GitHubPublishConfig
  path: string
  // Para texto (markdown, etc.) conviene usar contentUtf8.
  // Para binarios (imágenes) conviene usar contentBuffer.
  contentUtf8?: string
  contentBuffer?: Buffer
  message: string
  sha?: string
}) => {
  // Crea o actualiza un archivo en el repo.
  // GitHub exige que el contenido se envíe en base64.
  // - Si incluyes `sha`, actualiza.
  // - Si NO incluyes `sha`, crea (y falla si ya existe).
  const url = `${githubApiBase}/repos/${args.cfg.owner}/${args.cfg.repo}/contents/${encodeURIComponent(
    args.path
  )}`

  if (!args.contentUtf8 && !args.contentBuffer) {
    throw new Error("Missing content (contentUtf8 or contentBuffer)")
  }

  const contentBase64 =
    args.contentBuffer ? base64FromBuffer(args.contentBuffer) : base64EncodeUtf8(args.contentUtf8 ?? "")

  const body = {
    // `message` termina siendo el mensaje del commit.
    message: args.message,
    content: contentBase64,
    branch: args.cfg.branch,
    ...(args.sha ? { sha: args.sha } : {}),
  }

  const res = await fetch(url, {
    method: "PUT",
    headers: ghHeaders(args.cfg.token),
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`GitHub PUT contents failed (${res.status}): ${text}`)
  }

  return res.json()
}
