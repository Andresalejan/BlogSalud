const Footer = () => {
  return (
    <footer className="w-full border-t border-violet-100 bg-transparent">
      <div className="mx-auto w-11/12 max-w-5xl py-10 flex flex-col gap-2">
        <p className="font-cormorantGaramond text-xl text-violet-900">
          GINESAVIA
        </p>
        <p className="font-poppins text-sm text-neutral-600">
          Contenido informativo. No sustituye una consulta presencial.
        </p>
        <p className="font-poppins text-xs text-neutral-500">
          © {new Date().getFullYear()} · Todos los derechos reservados.
        </p>
      </div>
    </footer>
  )
}

export default Footer
