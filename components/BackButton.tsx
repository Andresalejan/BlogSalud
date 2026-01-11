"use client"

import { useRouter } from "next/navigation"
import { ArrowLeftIcon } from "@heroicons/react/24/solid"

type BackButtonProps = {
  className?: string
  label?: string
  fallbackHref?: string
}

export default function BackButton({
  className,
  label = "Volver",
  fallbackHref = "/",
}: BackButtonProps) {
  const router = useRouter()

  const handleClick = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back()
      return
    }
    router.push(fallbackHref)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={className}
      aria-label={label}
    >
      <ArrowLeftIcon width={18} />
      <span>{label}</span>
    </button>
  )
}
