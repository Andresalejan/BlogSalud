"use client"

import { useRouter } from "next/navigation"
import type { ReactNode } from "react"
import { useCallback } from "react"

type BackButtonProps = {
  children: ReactNode
  className?: string
  fallbackHref?: string
  ariaLabel?: string
}

export default function BackButton({
  children,
  className,
  fallbackHref = "/",
  ariaLabel,
}: BackButtonProps) {
  const router = useRouter()

  const handleClick = useCallback(() => {
    // If the user landed directly on this page (no meaningful history), `back()`
    // can be a no-op. In that case, we provide a safe fallback.
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back()
      return
    }

    router.push(fallbackHref)
  }, [fallbackHref, router])

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={handleClick}
      className={className}
    >
      {children}
    </button>
  )
}
