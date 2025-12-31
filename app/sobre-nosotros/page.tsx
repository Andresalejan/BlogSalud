import Image from "next/image"

export default function SobreNosotrosPage() {
  return (
    <section className="mx-auto w-11/12 md:w-1/2 py-10 flex flex-col gap-10">
      <header className="text-center flex flex-col gap-3">
        <h1 className="font-cormorantGaramond font-light text-5xl md:text-6xl text-rose-900 tracking-tight">
          Sobre nosotros
        </h1>
        <p className="font-poppins text-base md:text-lg text-neutral-700">
          Este proyecto busca ofrecer información clara, respetuosa y basada en
          evidencia sobre salud femenina.
        </p>
      </header>

      <section className="flex flex-col gap-4 font-poppins text-neutral-700">
        <p>
          Nuestro contenido es informativo y no sustituye una valoración médica
          individual. Si tienes síntomas, dolor persistente o dudas importantes,
          consulta con un profesional de salud.
        </p>

        <p>
          Creemos que entender tu cuerpo ayuda a tomar mejores decisiones: por
          eso explicamos conceptos con calma, sin alarmismo y con ejemplos
          prácticos.
        </p>

        <ul className="list-disc pl-5 marker:text-rose-700 font-poppins text-sm text-neutral-700">
          <li>Priorizamos fuentes fiables y actualizadas.</li>
          <li>Usamos lenguaje claro, sin tecnicismos innecesarios.</li>
          <li>Indicamos cuándo conviene consultar en persona.</li>
        </ul>
      </section>

      <section className="rounded-2xl border border-rose-100 bg-white p-6 md:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center">
          <div className="mx-auto w-36 md:mx-0 md:w-40">
            <Image
              src="/doctor-profile.jpg"
              alt="Foto del médico ginecólogo"
              width={320}
              height={320}
              className="h-auto w-full rounded-2xl object-cover"
              priority
            />
          </div>

          <div className="flex flex-col gap-3">
            <div>
              <h2 className="font-cormorantGaramond text-3xl text-rose-900">
                Dr. / Dra. Nombre Apellido
              </h2>
              <p className="font-poppins text-sm text-neutral-600">
                Ginecología y obstetricia · Colegiado/a Nº XXXX
              </p>
            </div>

            <p className="font-poppins text-base text-neutral-700">
              Redacción y revisión médica de los artículos del sitio, con enfoque
              en educación sanitaria, lenguaje claro y sensibilidad clínica.
            </p>

            <ul className="list-disc pl-5 marker:text-rose-700 font-poppins text-sm text-neutral-700">
              <li>Experiencia en consulta ginecológica.</li>
              <li>Interés en salud menstrual y anticoncepción.</li>
              <li>Compromiso con información actualizada.</li>
            </ul>
          </div>
        </div>
      </section>
    </section>
  )
}
