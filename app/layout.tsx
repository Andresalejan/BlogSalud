import type { Metadata } from "next"
import { Cormorant_Garamond, Poppins } from "next/font/google"
import "./globals.css"

import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"

const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant-garamond",
  weight: ["400"],
})

const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  weight: ["400", "600"],
})

const siteName = process.env.NEXT_PUBLIC_SITE_NAME ?? "BlogSalud"
const siteDescription =
  process.env.NEXT_PUBLIC_SITE_DESCRIPTION ??
  "Artículos de salud."

export const metadata: Metadata = {
  title: `${siteName} · BlogSalud`,
  description: siteDescription,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body
        className={`${cormorantGaramond.variable} ${poppins.variable} relative overflow-x-hidden bg-gradient-to-b from-violet-50 via-neutral-50 to-white text-neutral-900`}
      >
        {/*
          Difuminados de fondo para dar identidad (violetas) sin invadir el contenido.
          Usamos `fixed` para que acompañen el scroll y se perciban en toda la página.
        */}
        <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          {/* Zona superior */}
          <div className="absolute -top-28 -left-28 h-80 w-80 rounded-full bg-violet-200/35 blur-3xl" />
          <div className="absolute top-10 -right-24 h-96 w-96 rounded-full bg-fuchsia-200/25 blur-3xl" />

          {/* Zona media */}
          <div className="absolute top-1/3 -left-32 h-96 w-96 rounded-full bg-violet-100/45 blur-3xl" />
          <div className="absolute top-1/2 -right-40 h-[28rem] w-[28rem] rounded-full bg-fuchsia-100/35 blur-3xl" />

          {/* Zona inferior */}
          <div className="absolute bottom-24 left-1/3 h-80 w-80 -translate-x-1/2 rounded-full bg-violet-200/25 blur-3xl" />
          <div className="absolute -bottom-24 right-1/4 h-96 w-96 rounded-full bg-violet-100/40 blur-3xl" />
        </div>

        <div className="min-h-dvh flex flex-col">
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  )
}
