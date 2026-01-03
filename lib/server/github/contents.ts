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
  Authorization: githubAuthHeader(token),
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
  "Content-Type": "application/json",
})

const base64EncodeUtf8 = (text: string) => Buffer.from(text, "utf-8").toString("base64")
const base64FromBuffer = (buf: Buffer) => buf.toString("base64")

/**
 * Devuelve el `sha` actual de un archivo en GitHub (Contents API).
 *
 * Se usa principalmente para:
 * - saber si el archivo existe
 * - y/o pasar ese `sha` al actualizar/borrar
 */
export const getExistingFileSha = async (
  cfg: GitHubPublishConfig,
  path: string
): Promise<string | null> => {
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

/**
 * Lee un archivo en GitHub y devuelve su `sha` + contenido en UTF-8.
 *
 * Nota: GitHub devuelve el contenido en base64; aquí se decodifica.
 */
export const getFileContentUtf8 = async (
  cfg: GitHubPublishConfig,
  path: string
): Promise<{ sha: string; contentUtf8: string } | null> => {
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
  const contentBase64 = (json.content ?? "").replace(/\n/g, "")
  if (!contentBase64) throw new Error("GitHub GET contents returned no content")
  if (encoding !== "base64") {
    throw new Error(`Unsupported GitHub content encoding: ${encoding}`)
  }

  const contentUtf8 = Buffer.from(contentBase64, "base64").toString("utf-8")
  return { sha: json.sha, contentUtf8 }
}

/**
 * Lista un directorio en GitHub (Contents API).
 *
 * Devuelve `null` si el path no existe.
 */
export const listDirectory = async (
  cfg: GitHubPublishConfig,
  dirPath: string
): Promise<
  Array<{ name: string; path: string; sha: string; type: "file" | "dir" | string }> | null
> => {
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

/**
 * Borra un archivo usando Contents API.
 *
 * Requiere el `sha` del archivo a borrar (seguridad de concurrencia).
 */
export const deleteFile = async (args: {
  cfg: GitHubPublishConfig
  path: string
  sha: string
  message: string
}) => {
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

/**
 * Crea o actualiza un archivo usando Contents API.
 *
 * - Si se pasa `sha`, GitHub interpreta que es una actualización.
 * - Si no se pasa `sha`, GitHub interpreta que es creación.
 */
export const createOrUpdateFile = async (args: {
  cfg: GitHubPublishConfig
  path: string
  contentUtf8?: string
  contentBuffer?: Buffer
  message: string
  sha?: string
}) => {
  const url = `${githubApiBase}/repos/${args.cfg.owner}/${args.cfg.repo}/contents/${encodeURIComponent(
    args.path
  )}`

  if (!args.contentUtf8 && !args.contentBuffer) {
    throw new Error("Missing content (contentUtf8 or contentBuffer)")
  }

  const contentBase64 =
    args.contentBuffer
      ? base64FromBuffer(args.contentBuffer)
      : base64EncodeUtf8(args.contentUtf8 ?? "")

  const body = {
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
