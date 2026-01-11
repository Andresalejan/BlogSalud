"use client"

import Image from "next/image"
import { Stethoscope, Leaf, HeartHandshake, Linkedin, Instagram  } from "lucide-react"

export default function SobreNosotrosPage() {
  return (
    <section className="mx-auto w-11/12 md:w-1/2 py-10 flex flex-col gap-10">
      <header className="text-center flex flex-col gap-3">
        <h1 className="font-cormorantGaramond font-light text-5xl md:text-6xl text-violet-900 tracking-tight">
          Sobre Nosotros
        </h1>
      <div className="grid grid-cols-3 gap-10 my-12 text-center">
        <div className="flex flex-col items-center gap-3">
          <Stethoscope className="h-8 w-8 text-violet-700" strokeWidth={1.5} />
        </div>

        <div className="flex flex-col items-center gap-3">
          <Leaf className="h-8 w-8 text-violet-700" strokeWidth={1.5} />
        </div>

        <div className="flex flex-col items-center gap-3">
          <HeartHandshake className="h-8 w-8 text-violet-700" strokeWidth={1.5} />
        </div>
    </div>
        <p className="font-poppins text-base md:text-lg text-neutral-700">
          Somos una página de salud dedicada a brindar información confiable y actualizada sobre el cuidado integral de la mujer. Nuestro enfoque se basa en el conocimiento, la prevención y la educación en salud, con el objetivo de empoderar a las personas brindándoles herramientas para tomar las decisiones necesarias para su bienestar. Promovemos la prevención de enfermedades mediante el autocuidado, siempre desde una perspectiva respetuosa, científica y accesible.
        </p>
      </header>

      <section className="flex flex-col gap-4 font-poppins text-neutral-700">
        <h2 className="font-cormorantGaramond text-2xl text-violet-900 mb-2">Sobre el autor</h2>
        
      <section className="rounded-2xl border border-violet-100 bg-white p-6 md:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center">
          <div className="mx-auto w-36 md:mx-0 md:w-40">
            <Image
              src="/doctor-profile.jpg"
              alt="Foto del Dr. Jesús Sánchez"
              width={320}
              height={320}
              className="h-auto w-full rounded-2xl object-cover"
              priority
            />
          </div>
          <div className="flex flex-col gap-3">
            <div>
              <h2 className="font-cormorantGaramond text-3xl text-violet-900">
                Dr. Jesús Sánchez
              </h2>
              <p className="font-poppins text-sm text-neutral-600">
                Médico con experiencia en la salud de la mujer · Más de 25 años de experiencia
              </p>
            </div>
            <div className="flex items-center gap-4 mt-2">
              <a
                href="https://www.linkedin.com/in/usuario"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn del Dr. Jesús Sánchez"
                className="text-neutral-500 hover:text-violet-700 transition-colors"
              >
                <Linkedin className="h-5 w-5" strokeWidth={1.5} />
              </a>

              <a
                href="https://www.instagram.com/ginesavia"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram del Dr. Jesús Sánchez"
                className="text-neutral-500 hover:text-violet-700 transition-colors"
              >
                <Instagram className="h-5 w-5" strokeWidth={1.5} />
              </a>
            </div>
          </div>
        </div>
      </section>
        <p>
          Soy el Dr. Jesús Sánchez, médico con más de 25 años de experiencia en el cuidado de la salud. A lo largo de mi trayectoria he acompañado a muchas pacientes en distintas etapas de su vida, lo que me ha permitido comprender la importancia no solo del tratamiento, sino también de la prevención y la constancia en el cuidado de la salud.
        </p>
        <p>
          Este espacio nace con el objetivo de educar, informar y motivar a tomar acción, promoviendo hábitos saludables y la realización regular de controles. Creo firmemente que el conocimiento empodera y que la constancia es clave para mantenerse siempre saludable.
        </p>
        <p>
          Aquí encontrarás información clara, confiable y basada en experiencia médica, pensada para acompañarte y ayudarte a cuidar tu bienestar de manera consciente y sostenida.
        </p>
      </section>

    </section>
  )
}
