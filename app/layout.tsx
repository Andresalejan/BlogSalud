import type { Metadata } from "next"
import { Cormorant_Garamond, Poppins } from "next/font/google"
import "./globals.css"

import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"
import PageTransition from "./_components/PageTransition"

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

const contentBranch = process.env.CONTENT_BRANCH ?? "main"

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
    <html lang="es" className="bg-violet-50">
      <body
        className={`${cormorantGaramond.variable} ${poppins.variable} relative overflow-x-hidden bg-violet-50 bg-gradient-to-b from-violet-50 via-violet-50 to-violet-50 text-neutral-900`}
      >
        <div className="min-h-dvh flex flex-col relative isolate">
          {/*
            Difuminados de fondo para dar identidad (violetas) sin invadir el contenido.
            Importante: este layer vive dentro del contenedor principal para heredar su altura
            (crece con el contenido), y así el fondo no se siente uniforme al hacer scroll.
          */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
          >
            {/* Zona superior */}
            <div className="absolute -top-28 -left-28 h-80 w-80 rounded-full bg-violet-200/35 blur-3xl" />
            <div className="absolute top-10 -right-24 h-96 w-96 rounded-full bg-fuchsia-200/25 blur-3xl" />
            <div className="absolute top-36 left-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-violet-100/35 blur-3xl" />

            {/* Zona media */}
            <div className="absolute top-[30%] -left-32 h-96 w-96 rounded-full bg-violet-100/45 blur-3xl" />
            <div className="absolute top-[42%] -right-40 h-[28rem] w-[28rem] rounded-full bg-fuchsia-100/35 blur-3xl" />
            <div className="absolute top-[55%] left-[12%] h-72 w-72 rounded-full bg-fuchsia-200/20 blur-3xl" />
            <div className="absolute top-[62%] right-[18%] h-56 w-56 rounded-full bg-violet-200/25 blur-3xl" />

            {/* Zona inferior */}
            <div className="absolute top-[78%] left-1/3 h-80 w-80 -translate-x-1/2 rounded-full bg-violet-200/25 blur-3xl" />
            <div className="absolute top-[86%] right-1/4 h-96 w-96 rounded-full bg-violet-100/40 blur-3xl" />
            <div className="absolute top-[92%] left-[70%] h-72 w-72 -translate-x-1/2 rounded-full bg-fuchsia-100/25 blur-3xl" />
          </div>

          <div className="relative z-20">
            <Navbar contentEnv={contentBranch === "dev" ? "dev" : "prod"} />
          </div>
          <PageTransition className="relative z-10 flex-1">
            {children}
          </PageTransition>
          <div className="relative z-10">
            <Footer />
          </div>
        </div>
      </body>
    </html>
  )
}
