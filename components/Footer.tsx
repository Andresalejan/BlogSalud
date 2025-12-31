const Footer = () => {
  return (
    <footer className="w-full border-t border-rose-100 bg-white">
      <div className="mx-auto w-11/12 md:w-1/2 py-10 flex flex-col gap-2">
        <p className="font-cormorantGaramond text-xl text-rose-900">
          Salud Femenina
        </p>
        <p className="font-poppins text-sm text-neutral-600">
          Contenido informativo. No sustituye consejo médico profesional.
        </p>
        <p className="font-poppins text-xs text-neutral-500">
          © {new Date().getFullYear()} · BlogSalud
        </p>
      </div>
    </footer>
  )
}

export default Footer
