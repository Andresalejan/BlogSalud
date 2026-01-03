"use client"

import * as React from "react"
import { usePathname } from "next/navigation"

type PageTransitionProps = {
  children: React.ReactNode
  className?: string
}

export default function PageTransition({
  children,
  className,
}: PageTransitionProps) {
  const pathname = usePathname()

  return (
    <main
      key={pathname}
      className={
        className
          ? `${className} page-transition-enter`
          : "page-transition-enter"
      }
    >
      {children}
    </main>
  )
}
