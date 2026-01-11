import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import matter from "gray-matter"

import { getAdminCookieName, verifyAdminSession } from "@/lib/server/adminAuth"
import { getContentBranch } from "@/lib/server/contentBranch"

// Endpoint ADMIN (server-only): lista artículos directamente desde GitHub.
// Se usa para poblar el panel /admin con el contenido real del repo.
export const runtime = "nodejs"

type GitHubDirEntry = {
  name: string
  path: string
  sha: string
  type: "file" | "dir"
}

const githubApiBase = "https://api.github.com"

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

const getCfg = () => {
  // Configuración GitHub desde env (server-only).
  const token = process.env.GITHUB_TOKEN
  const owner = process.env.GITHUB_OWNER
  const repo = process.env.GITHUB_REPO
  const branch = getContentBranch()
  if (!token || !owner || !repo) {
    throw new Error("Missing GitHub env (GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO)")
  }
  return { token, owner, repo, branch }
}

const requireAdmin = async () => {
  // Valida sesión admin (cookie firmada). Si falla, rechazamos.
  const cookieSecret = process.env.ADMIN_COOKIE_SECRET
  if (!cookieSecret) throw new Error("Server is missing ADMIN_COOKIE_SECRET")

  const cookieStore = await cookies()
  const token = cookieStore.get(getAdminCookieName())?.value
  const session = verifyAdminSession(cookieSecret, token)
  if (!session.ok) throw new Error("Unauthorized")
}

const getDirEntries = async (cfg: ReturnType<typeof getCfg>, dirPath: string) => {
  // Lista entradas en un directorio dentro del repo usando Contents API.
  const url = `${githubApiBase}/repos/${cfg.owner}/${cfg.repo}/contents/${encodeURIComponent(
    dirPath
  )}?ref=${encodeURIComponent(cfg.branch)}`

  const res = await fetch(url, {
    method: "GET",
    headers: ghHeaders(cfg.token),
    cache: "no-store",
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`GitHub GET contents failed (${res.status}): ${text}`)
  }

  const json = (await res.json()) as GitHubDirEntry[]
  return (json ?? []).filter((x) => x.type === "file")
}

const getFileText = async (cfg: ReturnType<typeof getCfg>, filePath: string) => {
  // Obtiene el contenido de un archivo como texto UTF-8.
  const url = `${githubApiBase}/repos/${cfg.owner}/${cfg.repo}/contents/${encodeURIComponent(
    filePath
  )}?ref=${encodeURIComponent(cfg.branch)}`

  const res = await fetch(url, {
    method: "GET",
    headers: ghHeaders(cfg.token),
    cache: "no-store",
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`GitHub GET file failed (${res.status}): ${text}`)
  }

  const json = (await res.json()) as { content?: string; encoding?: string }
  const encoding = (json.encoding ?? "base64").toLowerCase()
  const contentBase64 = (json.content ?? "").replace(/\n/g, "")
  if (!contentBase64) throw new Error("GitHub file response missing content")
  if (encoding !== "base64") throw new Error(`Unsupported file encoding: ${encoding}`)
  return Buffer.from(contentBase64, "base64").toString("utf-8")
}

export async function GET() {
  try {
    await requireAdmin()
    const cfg = getCfg()

    // Leemos /articles en GitHub y nos quedamos solo con .md.
    const entries = await getDirEntries(cfg, "articles")
    const mdFiles = entries.filter((e) => e.name.toLowerCase().endsWith(".md"))

    // Para cada archivo, parseamos frontmatter (title/category/date) usando gray-matter.
    const items = await Promise.all(
      mdFiles.map(async (e) => {
        const slug = e.name.replace(/\.md$/i, "")
        const raw = await getFileText(cfg, e.path)
        const parsed = matter(raw)

        return {
          slug,
          title: String(parsed.data?.title ?? "").trim() || slug,
          category: String(parsed.data?.category ?? "").trim() || "uncategorized",
          date: String(parsed.data?.date ?? "").trim(),
        }
      })
    )

    // Orden simple: category asc, date desc (si existe), title asc.
    const sorted = items.sort((a, b) => {
      const c = a.category.localeCompare(b.category, "es")
      if (c !== 0) return c
      const d = (b.date || "").localeCompare(a.date || "")
      if (d !== 0) return d
      return a.title.localeCompare(b.title, "es")
    })

    return NextResponse.json(sorted)
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed"
    const status = message === "Unauthorized" ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
