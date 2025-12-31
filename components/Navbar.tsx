import Link from "next/link"

const Navbar = () => {
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME ?? "BlogSalud"
  const siteDescription =
    process.env.NEXT_PUBLIC_SITE_DESCRIPTION ??
    "Artículos de salud femenina con información clara y cuidada."

  return (
    <header className="w-full border-b border-rose-100 bg-rose-50/70 backdrop-blur supports-[backdrop-filter]:bg-rose-50/60">
      <nav className="mx-auto w-11/12 md:w-1/2 py-4 flex items-center justify-between">
        <Link href="/" className="flex flex-col leading-none">
          <span className="font-cormorantGaramond text-2xl tracking-tight text-rose-900">
            {siteName}
          </span>
          <span className="font-poppins text-xs tracking-wide text-rose-700/90">
            {siteDescription}
          </span>
        </Link>

        <div className="flex items-center gap-6 font-poppins text-sm">
          <Link
            href="/"
            className="text-neutral-800 hover:text-rose-800 transition"
          >
            Inicio
          </Link>
          <Link
            href="/#articles"
            className="text-neutral-800 hover:text-rose-800 transition"
          >
            Artículos
          </Link>
        </div>
      </nav>
    </header>
  )
}

export default Navbar
