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
        className={`${cormorantGaramond.variable} ${poppins.variable} bg-gradient-to-b from-rose-50 via-neutral-50 to-white text-neutral-900`}
      >
        <div className="min-h-dvh flex flex-col">
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  )
}
