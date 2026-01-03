import { NextResponse } from "next/server"
import { cookies } from "next/headers"

import { getAdminCookieName, signAdminSession } from "@/lib/server/adminAuth"

// Importante: este endpoint depende de APIs Node (cookies/crypto), así que forzamos runtime Node.
export const runtime = "nodejs"

// POST /api/admin/login
//
// Verifica una contraseña (configurada en env) y si es correcta setea una cookie HttpOnly
// firmada. Esa cookie es la “sesión” mínima que habilita publicar artículos.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | { username?: string; password?: string }
    | null

  const username = String(body?.username ?? "").trim()
  const password = body?.password
  const expectedUsername = (process.env.ADMIN_USERNAME ?? "admin").trim()
  const expectedPassword = process.env.ADMIN_PASSWORD
  const cookieSecret = process.env.ADMIN_COOKIE_SECRET

  // Si falta configuración del servidor, no se puede autenticar.
  if (!expectedPassword || !cookieSecret) {
    return NextResponse.json(
      { error: "Server is missing ADMIN_PASSWORD or ADMIN_COOKIE_SECRET" },
      { status: 500 }
    )
  }

  // Comparación directa: es un panel privado. Si quisieras hardening extra,
  // podrías aplicar rate limiting o comparar en timing-safe.
  if (!username || username !== expectedUsername || !password || password !== expectedPassword) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
  }

  // Creamos una sesión simple con expiración (12h).
  const token = signAdminSession(cookieSecret, 60 * 60 * 12) // 12h
  const cookieName = getAdminCookieName()

  // En Next 15 `cookies()` es async en route handlers.
  const cookieStore = await cookies()

  cookieStore.set(cookieName, token, {
    // HttpOnly: el JS del navegador no puede leer la cookie.
    httpOnly: true,
    // Lax: protege razonablemente contra CSRF manteniendo usabilidad.
    sameSite: "lax",
    // Secure solo en producción.
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  })

  return NextResponse.json({ ok: true })
}
