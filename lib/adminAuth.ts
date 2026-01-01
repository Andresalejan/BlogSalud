import crypto from "crypto"

// Autenticación mínima para el panel de admin.
//
// Idea: al hacer login, el servidor genera un token firmado (HMAC) que se guarda
// en una cookie HttpOnly. Luego, los endpoints de publicación validan esa cookie.
//
// No usamos JWT completo ni una DB: para este caso alcanza con un payload simple
// (solo expiración) y una firma HMAC con un secreto del servidor.
const COOKIE_NAME = "blogsalud_admin"

export type AdminSessionPayload = {
  // Expiración en epoch seconds.
  exp: number
}

// Base64 URL-safe (sin +, /, ni padding =), ideal para cookies/URLs.
const base64UrlEncode = (value: string | Buffer): string =>
  Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "")

const base64UrlDecode = (value: string): Buffer => {
  // Revertimos el formato URL-safe a base64 estándar y reponemos el padding.
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/")
  const pad = normalized.length % 4
  const padded = pad ? normalized + "=".repeat(4 - pad) : normalized
  return Buffer.from(padded, "base64")
}

const hmac = (secret: string, payloadB64: string): string => {
  // Firma determinística: HMAC-SHA256(payloadB64, secret)
  const sig = crypto
    .createHmac("sha256", secret)
    .update(payloadB64)
    .digest()
  return base64UrlEncode(sig)
}

export const getAdminCookieName = () => COOKIE_NAME

export const signAdminSession = (secret: string, expSecondsFromNow: number) => {
  // Token: base64url(payload).base64url(signature)
  // El payload solo contiene exp; el secreto queda del lado del servidor.
  const payload: AdminSessionPayload = {
    exp: Math.floor(Date.now() / 1000) + expSecondsFromNow,
  }
  const payloadB64 = base64UrlEncode(JSON.stringify(payload))
  const sig = hmac(secret, payloadB64)
  return `${payloadB64}.${sig}`
}

export const verifyAdminSession = (secret: string, token: string | undefined) => {
  // Validación defensiva: formato correcto, firma correcta (timing-safe) y no expirado.
  if (!token) return { ok: false as const }
  const parts = token.split(".")
  if (parts.length !== 2) return { ok: false as const }

  const [payloadB64, sig] = parts
  const expectedSig = hmac(secret, payloadB64)

  // Importante: comparación timing-safe para evitar leaks por tiempo.
  const sigBuf = Buffer.from(sig)
  const expectedBuf = Buffer.from(expectedSig)
  if (sigBuf.length !== expectedBuf.length) return { ok: false as const }
  if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return { ok: false as const }

  try {
    const payload = JSON.parse(base64UrlDecode(payloadB64).toString("utf-8")) as
      | AdminSessionPayload
      | undefined

    if (!payload || typeof payload.exp !== "number") return { ok: false as const }
    if (Math.floor(Date.now() / 1000) > payload.exp) return { ok: false as const }

    return { ok: true as const, payload }
  } catch {
    return { ok: false as const }
  }
}
