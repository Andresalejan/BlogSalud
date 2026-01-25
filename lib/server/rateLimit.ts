/**
 * Simple in-memory rate limiter for server endpoints.
 *
 * Use case: prevent brute-force attacks on admin login.
 *
 * Limitations:
 * - In-memory: resets on server restart (acceptable for small-scale).
 * - Single-instance: doesn't share state across serverless functions.
 *   For production at scale, use Redis or a distributed cache.
 */

type RateLimitEntry = {
  count: number
  firstAttempt: number
}

// Map: IP or identifier -> entry
const attempts = new Map<string, RateLimitEntry>()

// Cleanup old entries periodically to prevent memory leaks
const CLEANUP_INTERVAL_MS = 60 * 1000 // 1 minute
let lastCleanup = Date.now()

const cleanup = (windowMs: number) => {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return
  lastCleanup = now

  const cutoff = now - windowMs
  for (const [key, entry] of attempts.entries()) {
    if (entry.firstAttempt < cutoff) {
      attempts.delete(key)
    }
  }
}

export type RateLimitConfig = {
  // Time window in milliseconds
  windowMs: number
  // Maximum number of attempts allowed in the window
  maxAttempts: number
}

export type RateLimitResult = {
  // Whether the request should be allowed
  allowed: boolean
  // Number of remaining attempts (0 if blocked)
  remaining: number
  // When the rate limit resets (epoch ms)
  resetAt: number
  // How many seconds until reset
  retryAfterSeconds: number
}

/**
 * Check and update rate limit for a given identifier (typically IP or username).
 *
 * @param identifier - Unique key for the rate limit (IP, username, etc.)
 * @param config - Rate limit configuration
 * @returns RateLimitResult with allowed status and metadata
 */
export const checkRateLimit = (
  identifier: string,
  config: RateLimitConfig
): RateLimitResult => {
  const now = Date.now()
  cleanup(config.windowMs)

  const entry = attempts.get(identifier)

  if (!entry) {
    // First attempt from this identifier
    attempts.set(identifier, { count: 1, firstAttempt: now })
    return {
      allowed: true,
      remaining: config.maxAttempts - 1,
      resetAt: now + config.windowMs,
      retryAfterSeconds: 0,
    }
  }

  const windowEnd = entry.firstAttempt + config.windowMs

  if (now > windowEnd) {
    // Window expired, reset counter
    attempts.set(identifier, { count: 1, firstAttempt: now })
    return {
      allowed: true,
      remaining: config.maxAttempts - 1,
      resetAt: now + config.windowMs,
      retryAfterSeconds: 0,
    }
  }

  // Within window
  if (entry.count >= config.maxAttempts) {
    // Rate limited
    const retryAfterSeconds = Math.ceil((windowEnd - now) / 1000)
    return {
      allowed: false,
      remaining: 0,
      resetAt: windowEnd,
      retryAfterSeconds,
    }
  }

  // Increment and allow
  entry.count++
  return {
    allowed: true,
    remaining: config.maxAttempts - entry.count,
    resetAt: windowEnd,
    retryAfterSeconds: 0,
  }
}

/**
 * Reset rate limit for a specific identifier.
 * Useful after successful authentication to clear failed attempts.
 */
export const resetRateLimit = (identifier: string): void => {
  attempts.delete(identifier)
}

/**
 * Get client IP from request headers.
 * Handles common proxy headers (X-Forwarded-For, X-Real-IP).
 */
export const getClientIp = (req: Request): string => {
  // Check for forwarded headers (behind proxy/load balancer)
  const forwarded = req.headers.get("x-forwarded-for")
  if (forwarded) {
    // Take the first IP in the chain (client's original IP)
    const firstIp = forwarded.split(",")[0]?.trim()
    if (firstIp) return firstIp
  }

  const realIp = req.headers.get("x-real-ip")
  if (realIp) return realIp.trim()

  // Fallback: use a default identifier (not ideal but prevents crashes)
  return "unknown"
}
