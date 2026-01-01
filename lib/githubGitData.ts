// Publicación “atómica” a GitHub: crea UN commit que incluye múltiples archivos.
//
// Usamos Git Data API en vez de Contents API para evitar múltiples commits
// (uno por archivo). Esto es especialmente importante cuando el artículo incluye
// imágenes: queremos que Markdown + imágenes entren juntos cuando el usuario hace Publish.

import type { GitHubPublishConfig } from "@/lib/githubContents"

const githubApiBase = "https://api.github.com"

// Ver explicación en lib/githubContents.ts.
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

type RefResponse = {
  object: { sha: string }
}

type CommitResponse = {
  sha: string
  tree: { sha: string }
}

type CreateBlobResponse = {
  sha: string
}

type CreateTreeResponse = {
  sha: string
}

type CreateCommitResponse = {
  sha: string
}

export type GitFileToCommit = {
  path: string
  // Base64 del contenido del blob.
  contentBase64: string
  // Opcional: si no se pasa, usamos 100644 (archivo normal).
  mode?: "100644"
}

const getHeadRef = async (cfg: GitHubPublishConfig) => {
  const url = `${githubApiBase}/repos/${cfg.owner}/${cfg.repo}/git/ref/heads/${encodeURIComponent(
    cfg.branch
  )}`

  const res = await fetch(url, {
    method: "GET",
    headers: ghHeaders(cfg.token),
    cache: "no-store",
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`GitHub GET ref failed (${res.status}): ${text}`)
  }

  const json = (await res.json()) as RefResponse
  const sha = json?.object?.sha
  if (!sha) throw new Error("GitHub ref response missing sha")
  return sha
}

const getCommit = async (cfg: GitHubPublishConfig, sha: string) => {
  const url = `${githubApiBase}/repos/${cfg.owner}/${cfg.repo}/git/commits/${sha}`
  const res = await fetch(url, {
    method: "GET",
    headers: ghHeaders(cfg.token),
    cache: "no-store",
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`GitHub GET commit failed (${res.status}): ${text}`)
  }

  const json = (await res.json()) as CommitResponse
  if (!json?.tree?.sha) throw new Error("GitHub commit response missing tree sha")
  return json
}

const createBlob = async (cfg: GitHubPublishConfig, contentBase64: string) => {
  const url = `${githubApiBase}/repos/${cfg.owner}/${cfg.repo}/git/blobs`
  const res = await fetch(url, {
    method: "POST",
    headers: ghHeaders(cfg.token),
    body: JSON.stringify({ content: contentBase64, encoding: "base64" }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    if (res.status === 401) {
      throw new Error(
        "GitHub auth failed (401). Revisa GITHUB_TOKEN y reinicia el servidor."
      )
    }
    if (res.status === 404) {
      throw new Error(
        "GitHub returned 404 when creating a blob. Esto suele pasar si el token NO tiene acceso al repositorio (repo privado sin scope `repo`, usuario sin permisos, o SSO sin autorizar) o si GITHUB_OWNER/GITHUB_REPO no existen."
      )
    }
    throw new Error(`GitHub POST blob failed (${res.status}): ${text}`)
  }

  const json = (await res.json()) as CreateBlobResponse
  if (!json?.sha) throw new Error("GitHub blob response missing sha")
  return json.sha
}

const createTree = async (args: {
  cfg: GitHubPublishConfig
  baseTreeSha: string
  entries: Array<{ path: string; mode: string; type: "blob"; sha: string | null }>
}) => {
  const url = `${githubApiBase}/repos/${args.cfg.owner}/${args.cfg.repo}/git/trees`
  const res = await fetch(url, {
    method: "POST",
    headers: ghHeaders(args.cfg.token),
    body: JSON.stringify({ base_tree: args.baseTreeSha, tree: args.entries }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`GitHub POST tree failed (${res.status}): ${text}`)
  }

  const json = (await res.json()) as CreateTreeResponse
  if (!json?.sha) throw new Error("GitHub tree response missing sha")
  return json.sha
}

const createCommit = async (args: {
  cfg: GitHubPublishConfig
  message: string
  treeSha: string
  parentSha: string
}) => {
  const url = `${githubApiBase}/repos/${args.cfg.owner}/${args.cfg.repo}/git/commits`
  const res = await fetch(url, {
    method: "POST",
    headers: ghHeaders(args.cfg.token),
    body: JSON.stringify({
      message: args.message,
      tree: args.treeSha,
      parents: [args.parentSha],
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`GitHub POST commit failed (${res.status}): ${text}`)
  }

  const json = (await res.json()) as CreateCommitResponse
  if (!json?.sha) throw new Error("GitHub commit creation missing sha")
  return json.sha
}

const updateRef = async (cfg: GitHubPublishConfig, newCommitSha: string) => {
  const url = `${githubApiBase}/repos/${cfg.owner}/${cfg.repo}/git/refs/heads/${encodeURIComponent(
    cfg.branch
  )}`

  const res = await fetch(url, {
    method: "PATCH",
    headers: ghHeaders(cfg.token),
    body: JSON.stringify({ sha: newCommitSha, force: false }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`GitHub PATCH ref failed (${res.status}): ${text}`)
  }
}

export const createSingleCommitWithFiles = async (args: {
  cfg: GitHubPublishConfig
  message: string
  files: GitFileToCommit[]
  // Paths a borrar en el mismo commit.
  // Nota: GitHub soporta borrado en createTree pasando sha:null.
  deletePaths?: string[]
}) => {
  const headSha = await getHeadRef(args.cfg)
  const headCommit = await getCommit(args.cfg, headSha)

  // 1) Crear blobs.
  const blobs = await Promise.all(
    args.files.map(async (f) => {
      const blobSha = await createBlob(args.cfg, f.contentBase64)
      return {
        path: f.path,
        mode: f.mode ?? "100644",
        type: "blob" as const,
        sha: blobSha,
      }
    })
  )

  // 1b) Entradas de borrado (sha:null) para eliminar archivos que ya no se usan.
  const deletes = (args.deletePaths ?? []).map((p) => ({
    path: p,
    mode: "100644",
    type: "blob" as const,
    sha: null,
  }))

  // 2) Crear tree basado en el tree actual.
  const treeSha = await createTree({
    cfg: args.cfg,
    baseTreeSha: headCommit.tree.sha,
    entries: [...blobs, ...deletes],
  })

  // 3) Crear commit y mover el ref del branch.
  const commitSha = await createCommit({
    cfg: args.cfg,
    message: args.message,
    treeSha,
    parentSha: headSha,
  })

  await updateRef(args.cfg, commitSha)

  return { commitSha }
}
