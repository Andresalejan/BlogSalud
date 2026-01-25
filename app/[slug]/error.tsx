"use client"

import { useEffect } from "react"
import Link from "next/link"
import { ArrowLeftIcon } from "@heroicons/react/24/solid"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Article page error:", error)
  }, [error])

  return (
    <section className="mx-auto w-11/12 md:w-1/2 py-12 flex flex-col gap-6">
      <div className="rounded-2xl border border-red-100 bg-white px-6 py-10 md:px-10 md:py-12">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-poppins text-xs tracking-widest text-red-700/80">
              Error
            </p>
            <h1 className="font-cormorantGaramond text-4xl tracking-tight text-red-900">
              Algo salió mal
            </h1>
            <p className="mt-2 font-poppins text-neutral-700">
              Hubo un problema al cargar este artículo. Por favor, intenta de
              nuevo.
            </p>
          </div>
          <div aria-hidden="true" className="shrink-0">
            <div className="h-14 w-14 rounded-2xl bg-red-100 flex items-center justify-center text-red-900 font-poppins font-semibold">
              !
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={() => reset()}
            className="inline-flex items-center gap-2 rounded-xl bg-neutral-900 text-white px-4 py-2 text-sm font-poppins font-semibold hover:bg-neutral-800 transition"
          >
            Intentar de nuevo
          </button>

          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 px-4 py-2 text-sm font-poppins font-semibold text-neutral-900 hover:bg-neutral-50 transition"
          >
            <ArrowLeftIcon width={18} />
            Volver al inicio
          </Link>
        </div>
      </div>
    </section>
  )
}
