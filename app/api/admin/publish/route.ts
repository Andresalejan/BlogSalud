import { NextResponse } from "next/server"
import { cookies } from "next/headers"

import { getAdminCookieName, verifyAdminSession } from "@/lib/server/adminAuth"
import { getExistingFileSha, createSingleCommitWithFiles } from "@/lib/server/github"
import { getContentBranch } from "@/lib/server/contentBranch"
import { isValidSlug, slugify } from "@/lib/slug"

// Este endpoint publica escribiendo en GitHub (Git Data API), por lo que requiere runtime Node.
export const runtime = "nodejs"

// El publish acepta multipart/form-data para poder enviar imágenes junto al Markdown.
// Campos esperados:
// - title: string
// - category: string
// - content: string (markdown con placeholders)
// - imagesMeta: JSON string con [{ id, alt, ext }]
// - image:<id>: File (opcional)

// Genera la fecha en el formato que el blog espera (DD-MM-YYYY).
// Se calcula del lado del servidor para que el usuario no la pueda alterar.
const todayDDMMYYYY = () => {
  const d = new Date()
  const dd = String(d.getDate()).padStart(2, "0")
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const yyyy = String(d.getFullYear())
  return `${dd}-${mm}-${yyyy}`
}

// Construye el archivo Markdown con frontmatter compatible con el parser actual.
// Nota: escapamos comillas para no romper el YAML.
const buildMarkdownFile = (args: {
  title: string
  category: string
  date: string
  content: string
}) => {
  const frontmatter = `---\ntitle: "${args.title.replace(/"/g, "\\\"")}"\ncategory: "${args.category.replace(
    /"/g,
    "\\\""
  )}"\ndate: "${args.date}"\n---\n\n`

  const normalizedContent = args.content.trimStart()
  return frontmatter + normalizedContent + (normalizedContent.endsWith("\n") ? "" : "\n")
}

const base64FromBuffer = (buf: Buffer) => buf.toString("base64")

const replaceImagePlaceholders = (
  markdown: string,
  slug: string,
  images: Array<{ id: string; ext: string }>
) => {
  // Reemplaza __image:<id>__ por /images/<slug>/<id>.<ext>
  let out = markdown
  for (const img of images) {
    const token = `__image:${img.id}__`
    const url = `/images/${slug}/${img.id}.${img.ext}`
    out = out.split(token).join(url)
  }
  return out
}

export async function POST(req: Request) {
  // 1) Autenticación: validamos cookie firmada.
  const cookieSecret = process.env.ADMIN_COOKIE_SECRET
  if (!cookieSecret) {
    return NextResponse.json(
      { error: "Server is missing ADMIN_COOKIE_SECRET" },
      { status: 500 }
    )
  }

  const cookieName = getAdminCookieName()
  const cookieStore = await cookies()
  const token = cookieStore.get(cookieName)?.value
  const session = verifyAdminSession(cookieSecret, token)
  if (!session.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // 2) Parseo de form-data (permite imágenes).
  const form = await req.formData().catch(() => null)
  if (!form) {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 })
  }

  const title = String(form.get("title") ?? "").trim()
  const category = String(form.get("category") ?? "").trim()
  const content = String(form.get("content") ?? "")

  const imagesMetaRaw = String(form.get("imagesMeta") ?? "[]")
  const imagesMeta = (() => {
    try {
      const parsed = JSON.parse(imagesMetaRaw) as Array<{ id?: string; alt?: string; ext?: string }>
      return (parsed ?? [])
        .map((x) => ({ id: String(x.id ?? "").trim(), ext: String(x.ext ?? "").trim() }))
        .filter((x) => x.id && x.ext)
    } catch {
      return [] as Array<{ id: string; ext: string }>
    }
  })()

  if (!title || !category || !content) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    )
  }

  // 3) Derivaciones server-side.
  // - date: hoy (no editable)
  // - slug: siempre desde el título (no editable)
  const date = todayDDMMYYYY()
  const slug = slugify(title)
  if (!slug || !isValidSlug(slug)) {
    return NextResponse.json({ error: "Unable to derive a valid slug from title" }, { status: 400 })
  }

  // 4) Config de publicación.
  const tokenEnv = process.env.GITHUB_TOKEN
  const owner = process.env.GITHUB_OWNER
  const repo = process.env.GITHUB_REPO
  const branch = getContentBranch()

  if (!tokenEnv || !owner || !repo) {
    return NextResponse.json(
      { error: "Missing GitHub env (GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO)" },
      { status: 500 }
    )
  }

  const cfg = { token: tokenEnv, owner, repo, branch }
  const path = `articles/${slug}.md`

  // Evitamos sobreescritura: si ya existe un archivo con ese slug, devolvemos conflicto.
  const existingSha = await getExistingFileSha(cfg, path)
  if (existingSha) {
    return NextResponse.json(
      { error: "Ya existe una publicación con el mismo título" },
      { status: 409 }
    )
  }

  // 5) Reemplazo de placeholders de imágenes por URLs finales.
  const contentWithUrls = replaceImagePlaceholders(content, slug, imagesMeta)

  const md = buildMarkdownFile({ title, category, date, content: contentWithUrls })

  // 6) Preparar archivos para un commit único.
  const filesToCommit: Array<{ path: string; contentBase64: string }> = []
  filesToCommit.push({
    path,
    contentBase64: base64FromBuffer(Buffer.from(md, "utf-8")),
  })

  // Convertimos cada imagen a un archivo en public/images/<slug>/<id>.<ext>
  for (const img of imagesMeta) {
    const f = form.get(`image:${img.id}`)
    if (!(f instanceof File)) continue
    const buf = Buffer.from(await f.arrayBuffer())
    filesToCommit.push({
      path: `public/images/${slug}/${img.id}.${img.ext}`,
      contentBase64: base64FromBuffer(buf),
    })
  }

  try {
    // Crea UN commit que incluye Markdown + imágenes.
    await createSingleCommitWithFiles({
      cfg,
      message: `Add article: ${slug}`,
      files: filesToCommit,
    })

    return NextResponse.json({ ok: true, path })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Publish failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
