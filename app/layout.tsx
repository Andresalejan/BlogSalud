import type { Metadata } from "next"
import { Inter, Lora } from "next/font/google"
import "./globals.css"

import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"
import PageTransition from "./_components/PageTransition"
// Tipografías del sitio:
// - Texto/cuerpo: Inter (muy legible en pantallas)
// - Títulos: Lora (serif editorial, buena lectura)
const lora = Lora({
  subsets: ["latin"],
  variable: "--font-cormorant-garamond",
  weight: ["400", "600"],
})

const inter = Inter({
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
    <html lang="es" className="h-full">
      <body
        className={`${lora.variable} ${inter.variable} min-h-dvh text-slate-900 antialiased`}
      >
        {/* Modern background system: gradient + grid + subtle noise */}
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10">
          <div className="absolute inset-0 app-bg" />
          <div className="absolute inset-0 app-noise" />
          <div className="absolute inset-0 app-vignette" />
        </div>

        <div className="min-h-dvh flex flex-col relative">
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
