"use client"

import { useEffect } from "react"
import Link from "next/link"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Global error:", error)
  }, [error])

  return (
    <html lang="es">
      <body className="bg-violet-50 text-neutral-900">
        <section className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full rounded-2xl border border-red-100 bg-white px-6 py-10 md:px-10 md:py-12 text-center">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-red-100 flex items-center justify-center text-red-900 text-2xl font-semibold mb-6">
              !
            </div>
            <h1 className="text-2xl font-semibold text-red-900 mb-2">
              Algo salió mal
            </h1>
            <p className="text-neutral-700 mb-6">
              Hubo un problema inesperado. Por favor, intenta de nuevo o vuelve
              al inicio.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => reset()}
                className="rounded-xl bg-neutral-900 text-white px-6 py-2 font-semibold hover:bg-neutral-800 transition"
              >
                Intentar de nuevo
              </button>
              <Link
                href="/"
                className="rounded-xl border border-neutral-200 px-6 py-2 font-semibold text-neutral-900 hover:bg-neutral-50 transition"
              >
                Volver al inicio
              </Link>
            </div>
          </div>
        </section>
      </body>
    </html>
  )
}
