import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import matter from "gray-matter"

import { getAdminCookieName, verifyAdminSession } from "@/lib/server/adminAuth"
import {
  getExistingFileSha,
  getFileContentUtf8,
  listDirectory,
  createSingleCommitWithFiles,
} from "@/lib/server/github"

// Endpoint ADMIN (server-only): leer/editar/eliminar un artículo por slug.
export const runtime = "nodejs"

const requireAdmin = async () => {
  // Valida sesión admin (cookie firmada). Si falla, rechazamos.
  const cookieSecret = process.env.ADMIN_COOKIE_SECRET
  if (!cookieSecret) throw new Error("Server is missing ADMIN_COOKIE_SECRET")

  const cookieStore = await cookies()
  const token = cookieStore.get(getAdminCookieName())?.value
  const session = verifyAdminSession(cookieSecret, token)
  if (!session.ok) throw new Error("Unauthorized")
}

const getCfg = () => {
  // Configuración GitHub desde env (server-only).
  const token = process.env.GITHUB_TOKEN
  const owner = process.env.GITHUB_OWNER
  const repo = process.env.GITHUB_REPO
  const branch = process.env.GITHUB_BRANCH ?? "main"
  if (!token || !owner || !repo) {
    throw new Error("Missing GitHub env (GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO)")
  }
  return { token, owner, repo, branch }
}

const buildMarkdownFile = (args: {
  title: string
  category: string
  date: string
  content: string
}) => {
  // Reconstruye el archivo markdown con frontmatter compatible con el blog.
  // Nota: escapamos comillas para no romper YAML.
  const frontmatter = `---\ntitle: "${args.title.replace(/"/g, "\\\"")}"\ncategory: "${args.category.replace(
    /"/g,
    "\\\""
  )}"\ndate: "${args.date}"\n---\n\n`

  const normalizedContent = args.content.trimStart()
  return frontmatter + normalizedContent + (normalizedContent.endsWith("\n") ? "" : "\n")
}

const todayDDMMYYYY = () => {
  const d = new Date()
  const dd = String(d.getDate()).padStart(2, "0")
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const yyyy = String(d.getFullYear())
  return `${dd}-${mm}-${yyyy}`
}

const replaceImagePlaceholders = (
  markdown: string,
  slug: string,
  imagesMeta: Array<{ id: string; ext: string }>
) => {
  // Reemplaza placeholders internos __image:<id>__ por URL pública /images/<slug>/<id>.<ext>
  // Esto permite enviar imágenes nuevas durante edición sin conocer la URL final en el cliente.
  let out = markdown
  for (const meta of imagesMeta) {
    const id = String(meta.id ?? "").trim()
    const ext = String(meta.ext ?? "").trim()
    if (!id || !ext) continue
    out = out.split(`__image:${id}__`).join(`/images/${slug}/${id}.${ext}`)
  }
  return out
}

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

const extractReferencedImageNames = (markdown: string, slug: string) => {
  // Busca referencias de imágenes dentro del markdown hacia /images/<slug>/... (incluye URLs absolutas).
  const names = new Set<string>()
  const re = new RegExp(`/images/${escapeRegex(slug)}/([^\\s)"'>]+)`, "g")
  let match: RegExpExecArray | null
  while ((match = re.exec(markdown)) !== null) {
    const raw = String(match[1] ?? "").trim()
    if (!raw) continue
    const filename = raw.split(/[?#]/)[0]
    if (filename) names.add(filename)
  }
  return names
}

const bufferToBase64 = async (file: File) => {
  const arrayBuffer = await file.arrayBuffer()
  return Buffer.from(arrayBuffer).toString("base64")
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ slug: string }> }
) {
  try {
    await requireAdmin()
    const { slug } = await ctx.params
    const cfg = getCfg()
    const path = `articles/${slug}.md`

    // Carga el archivo del repo para prellenar el formulario en /admin.
    const file = await getFileContentUtf8(cfg, path)
    if (!file) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const parsed = matter(file.contentUtf8)
    // Devolvemos el contenido sin frontmatter, y los campos para el formulario.
    return NextResponse.json({
      slug,
      title: String(parsed.data?.title ?? "").trim() || slug,
      category: String(parsed.data?.category ?? "").trim() || "",
      date: String(parsed.data?.date ?? "").trim() || "",
      content: String(parsed.content ?? ""),
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed"
    const status = message === "Unauthorized" ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

export async function PUT(
  req: Request,
  ctx: { params: Promise<{ slug: string }> }
) {
  try {
    await requireAdmin()
    const { slug } = await ctx.params
    const cfg = getCfg()

    const contentType = req.headers.get("content-type") ?? ""
    const isMultipart = contentType.toLowerCase().includes("multipart/form-data")

    let title = ""
    let category = ""
    let content = ""
    let imagesMeta: Array<{ id: string; ext: string }> = []
    const newImages: Array<{ id: string; ext: string; file: File }> = []

    if (isMultipart) {
      const form = await req.formData()
      title = String(form.get("title") ?? "").trim()
      category = String(form.get("category") ?? "").trim()
      content = String(form.get("content") ?? "")

      const imagesMetaRaw = String(form.get("imagesMeta") ?? "[]")
      const parsed = (JSON.parse(imagesMetaRaw) as unknown) ?? []
      imagesMeta = Array.isArray(parsed)
        ? parsed
            .map((x: any) => ({
              id: String(x?.id ?? "").trim(),
              ext: String(x?.ext ?? "").trim(),
            }))
            .filter((x) => x.id && x.ext)
        : []

      for (const meta of imagesMeta) {
        const f = form.get(`image:${meta.id}`)
        if (f instanceof File) {
          newImages.push({ id: meta.id, ext: meta.ext, file: f })
        }
      }
    } else {
      // Fallback (legacy): edición solo de markdown vía JSON.
      const body = (await req.json().catch(() => null)) as
        | { title?: string; category?: string; content?: string }
        | null
      title = String(body?.title ?? "").trim()
      category = String(body?.category ?? "").trim()
      content = String(body?.content ?? "")
    }

    if (!title || !category || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const path = `articles/${slug}.md`
    const existingSha = await getExistingFileSha(cfg, path)
    if (!existingSha) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    // Mantenemos la fecha original del archivo (si existe) para que editar no cambie
    // la fecha de publicación.
    const existing = await getFileContentUtf8(cfg, path)
    const existingDate = (() => {
      try {
        const parsed = matter(existing?.contentUtf8 ?? "")
        return String(parsed.data?.date ?? "").trim()
      } catch {
        return ""
      }
    })()

    // En edición, si el usuario pegó/arrastró imágenes, el Markdown puede contener
    // placeholders internos __image:<id>__. Los convertimos a URL final.
    const contentWithUrls = replaceImagePlaceholders(content, slug, imagesMeta)

    const md = buildMarkdownFile({
      title,
      category,
      date: existingDate || todayDDMMYYYY(),
      content: contentWithUrls,
    })

    // 1) Detectamos qué imágenes quedan referenciadas tras editar.
    const referencedNames = extractReferencedImageNames(contentWithUrls, slug)

    // 2) Archivos a escribir en el commit: markdown + SOLO imágenes nuevas referenciadas.
    const referencedNewImages = newImages.filter((img) =>
      referencedNames.has(`${img.id}.${img.ext}`)
    )

    const files = [
      {
        path,
        contentBase64: Buffer.from(md, "utf-8").toString("base64"),
        mode: "100644" as const,
      },
      ...(await Promise.all(
        referencedNewImages.map(async (img) => ({
          path: `public/images/${slug}/${img.id}.${img.ext}`,
          contentBase64: await bufferToBase64(img.file),
          mode: "100644" as const,
        }))
      )),
    ]

    // 3) Borrado de imágenes: listamos public/images/<slug>/ y borramos las que ya no se referencian.
    const existingImagesDir = await listDirectory(cfg, `public/images/${slug}`)
    const deletePaths = (existingImagesDir ?? [])
      .filter((e) => e.type === "file")
      .filter((e) => {
        const name = String(e.name ?? "").trim()
        return name && !referencedNames.has(name)
      })
      .map((e) => `public/images/${slug}/${e.name}`)

    // 4) Commit atómico: markdown + imágenes nuevas + borrados.
    await createSingleCommitWithFiles({
      cfg,
      message: `Update article: ${slug}`,
      files,
      deletePaths,
    })

    return NextResponse.json({ ok: true, path })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed"
    const status = message === "Unauthorized" ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ slug: string }> }
) {
  try {
    await requireAdmin()
    const { slug } = await ctx.params
    const cfg = getCfg()

    const path = `articles/${slug}.md`
    const sha = await getExistingFileSha(cfg, path)
    if (!sha) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    // Además de borrar el markdown, borramos todas las imágenes bajo public/images/<slug>/.
    // Esto evita dejar archivos huérfanos cuando el artículo ya no existe.
    const imagesDir = await listDirectory(cfg, `public/images/${slug}`)
    const imagePaths = (imagesDir ?? [])
      .filter((e) => e.type === "file")
      .map((e) => `public/images/${slug}/${e.name}`)

    // Commit atómico: borrado del artículo + borrado de imágenes (si existen).
    await createSingleCommitWithFiles({
      cfg,
      message: `Delete article: ${slug}`,
      files: [],
      deletePaths: [path, ...imagePaths],
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed"
    const status = message === "Unauthorized" ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
