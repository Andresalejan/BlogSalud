import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import crypto from "crypto"

import { getAdminCookieName, signAdminSession } from "@/lib/server/adminAuth"
import { checkRateLimit, getClientIp, resetRateLimit } from "@/lib/server/rateLimit"

// Importante: este endpoint depende de APIs Node (cookies/crypto), así que forzamos runtime Node.
export const runtime = "nodejs"

// Rate limit configuration: 5 attempts per 15 minutes per IP
const RATE_LIMIT_CONFIG = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxAttempts: 5,
}

/**
 * Timing-safe string comparison to prevent timing attacks.
 * Always compares in constant time regardless of where strings differ.
 */
const timingSafeCompare = (a: string, b: string): boolean => {
  const aBuf = Buffer.from(a, "utf-8")
  const bBuf = Buffer.from(b, "utf-8")

  if (aBuf.length !== bBuf.length) {
    // Still do a comparison to prevent length-based timing leaks
    crypto.timingSafeEqual(new Uint8Array(aBuf), new Uint8Array(aBuf.length))
    return false
  }

  return crypto.timingSafeEqual(new Uint8Array(aBuf), new Uint8Array(bBuf))
}

// POST /api/admin/login
//
// Verifica una contraseña (configurada en env) y si es correcta setea una cookie HttpOnly
// firmada. Esa cookie es la “sesión” mínima que habilita publicar artículos.
export async function POST(req: Request) {  // Rate limiting check
  const clientIp = getClientIp(req)
  const rateLimit = checkRateLimit(clientIp, RATE_LIMIT_CONFIG)

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: "Demasiados intentos. Intenta de nuevo más tarde.",
        retryAfter: rateLimit.retryAfterSeconds,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfterSeconds),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.floor(rateLimit.resetAt / 1000)),
        },
      }
    )
  }
  const body = (await req.json().catch(() => null)) as
    | { username?: string; password?: string }
    | null

  const username = String(body?.username ?? "").trim()
  const password = body?.password ?? ""
  const expectedUsername = (process.env.ADMIN_USERNAME ?? "admin").trim()
  const expectedPassword = process.env.ADMIN_PASSWORD ?? ""
  const cookieSecret = process.env.ADMIN_COOKIE_SECRET

  // Si falta configuración del servidor, no se puede autenticar.
  if (!expectedPassword || !cookieSecret) {
    return NextResponse.json(
      { error: "Server is missing ADMIN_PASSWORD or ADMIN_COOKIE_SECRET" },
      { status: 500 }
    )
  }

  // Timing-safe comparison to prevent timing attacks
  const usernameValid = timingSafeCompare(username, expectedUsername)
  const passwordValid = timingSafeCompare(password, expectedPassword)

  if (!usernameValid || !passwordValid) {
    return NextResponse.json(
      { error: "Invalid credentials" },
      {
        status: 401,
        headers: {
          "X-RateLimit-Remaining": String(rateLimit.remaining),
          "X-RateLimit-Reset": String(Math.floor(rateLimit.resetAt / 1000)),
        },
      }
    )
  }

  // Successful login - reset rate limit for this IP
  resetRateLimit(clientIp)

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
