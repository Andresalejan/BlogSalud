import Link from "next/link"
import { ArrowLeftIcon } from "@heroicons/react/24/solid"

import BackButton from "@/components/BackButton"

export default function NotFound() {
  return (
    <section className="mx-auto w-11/12 md:w-1/2 py-12 flex flex-col gap-6">
      <div className="rounded-2xl border border-violet-100 bg-white px-6 py-10 md:px-10 md:py-12">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-poppins text-xs tracking-widest text-violet-700/80">404</p>
            <h1 className="font-cormorantGaramond text-4xl tracking-tight text-violet-900">
              Esta página no existe
            </h1>
            <p className="mt-2 font-poppins text-neutral-700">
              Puede que el enlace esté mal escrito o que el artículo ya no esté disponible.
            </p>
          </div>
          <div aria-hidden="true" className="shrink-0">
            <div className="h-14 w-14 rounded-2xl bg-violet-100 flex items-center justify-center text-violet-900 font-poppins font-semibold">
              ?
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <BackButton className="inline-flex items-center gap-2 rounded-xl bg-neutral-900 text-white px-4 py-2 text-sm font-poppins font-semibold">
            <ArrowLeftIcon width={18} />
            Volver
          </BackButton>

          <Link
            href="/sobre-nosotros"
            className="inline-flex items-center rounded-xl border border-neutral-200 px-4 py-2 text-sm font-poppins font-semibold text-neutral-900"
          >
            Sobre nosotros
          </Link>
        </div>
      </div>
    </section>
  )
}
