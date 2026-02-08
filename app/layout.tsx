import type { Metadata } from "next"
import { Inter, Lora } from "next/font/google"
import "./globals.css"

import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"
import PageTransition from "./_components/PageTransition"
import Script from "next/script"
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
  verification: {
    google: "CIeXAkB6egtU03rOtRxUgfiVJVklF-wnH5sZLX90s1U",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className="bg-violet-50">
       {/* Google Analytics */}
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-V1355QL85W"
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-V1355QL85W');
        `}
      </Script>
      <body className={`${lora.variable} ${inter.variable} bg-[#faf7fd] text-neutral-900`}>

        <div className="min-h-dvh flex flex-col relative isolate">
          {/*
            Difuminados de fondo para dar identidad (violetas) sin invadir el contenido.
            Importante: este layer vive dentro del contenedor principal para heredar su altura
            (crece con el contenido), y así el fondo no se siente uniforme al hacer scroll.
          */}
<div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
  {/* Blob principal superior (en móvil: más grande, menos opacidad, más blur y más lejos) */}
  <div
    className="
      absolute -top-64 -left-64
      h-[44rem] w-[44rem]
      rounded-full bg-violet-300/20 blur-[170px]
      md:-top-40 md:-left-40
      md:h-[36rem] md:w-[36rem]
      md:bg-violet-300/45 md:blur-[120px]
    "
  />

  {/* Contrapunto superior */}
  <div
    className="
      absolute -top-56 right-[-18rem]
      h-[46rem] w-[46rem]
      rounded-full bg-fuchsia-300/18 blur-[180px]
      md:-top-32 md:right-[-10rem]
      md:h-[34rem] md:w-[34rem]
      md:bg-fuchsia-300/40 md:blur-[120px]
    "
  />

  {/* Blob central izquierda */}
  <div
    className="
      absolute top-[38%] -left-72
      h-[52rem] w-[52rem]
      rounded-full bg-violet-200/22 blur-[190px]
      md:top-[35%] md:-left-48
      md:h-[40rem] md:w-[40rem]
      md:bg-violet-200/45 md:blur-[140px]
    "
  />

  {/* Blob central derecha */}
  <div
    className="
      absolute top-[48%] right-[-26rem]
      h-[50rem] w-[50rem]
      rounded-full bg-fuchsia-200/20 blur-[200px]
      md:top-[45%] md:right-[-18rem]
      md:h-[38rem] md:w-[38rem]
      md:bg-fuchsia-200/40 md:blur-[140px]
    "
  />

  {/* Blob inferior */}
  <div
    className="
      absolute bottom-[-35%] left-1/2
      h-[56rem] w-[56rem] -translate-x-1/2
      rounded-full bg-violet-300/18 blur-[220px]
      md:bottom-[-25%] md:left-1/3
      md:h-[42rem] md:w-[42rem]
      md:bg-violet-300/35 md:blur-[160px]
    "
  />
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
