import { slugify } from "@/lib/slug"

type CategoryIconProps = {
  category: string
}

// Hash simple y determinista para asignar un icono estable a cualquier categoría nueva.
// Objetivo: si se crean categorías nuevas, siempre tendrán un icono (sin tocar el código).
const hashToIndex = (value: string, modulo: number) => {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0
  }
  return modulo > 0 ? hash % modulo : 0
}

export default function CategoryIcon({ category }: CategoryIconProps) {
  // Usamos dos normalizaciones:
  // - `plain`: minúsculas (útil para matches rápidos)
  // - `slug`: sin tildes y con formato URL (mejor para palabras clave en español)
  const plain = (category ?? "").toLowerCase()
  const slug = slugify(category ?? "")

  // Iconos lineales y minimalistas por categoría.
  // Objetivo UX: dar una pista visual sin recargar (nada literal/“médico”).
  // Todos comparten tamaño y grosor para mantener una jerarquía calmada.
  const common = {
    className:
      "h-6 w-6 text-violet-700/70 transition-colors group-hover:text-violet-800/80",
    viewBox: "0 0 24 24",
    fill: "none" as const,
    stroke: "currentColor" as const,
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  }

  // Matches por palabras clave (categorías conocidas o frecuentes).
  // Nota: usamos `slug` para soportar tildes (p. ej. “pélvico” -> “pelvico”).
  if (plain.includes("anticon") || slug.includes("anticon")) {
    // círculo + hoja
    return (
      <svg {...common} aria-hidden="true">
        <circle cx="10" cy="12" r="5" />
        <path d="M17 8c2 1 3 2.7 3 4.7C20 16 16.5 18 14 18c.3-2.7 1.5-7.5 3-10Z" />
      </svg>
    )
  }

  if (
    plain.includes("ciclo") ||
    plain.includes("menstru") ||
    slug.includes("ciclo") ||
    slug.includes("menstru")
  ) {
    // círculo incompleto
    return (
      <svg {...common} aria-hidden="true">
        <path d="M20 12a8 8 0 1 1-2.1-5.4" />
        <path d="M20 6v3h-3" />
      </svg>
    )
  }

  if (plain.includes("suelo") || slug.includes("suelo")) {
    // líneas curvas
    return (
      <svg {...common} aria-hidden="true">
        <path d="M6 8c2.5 0 2.5 8 5 8s2.5-8 5-8 2.5 8 5 8" />
      </svg>
    )
  }

  if (
    plain.includes("mental") ||
    plain.includes("ánimo") ||
    plain.includes("animo") ||
    slug.includes("mental") ||
    slug.includes("animo") ||
    // ampliación: temas frecuentes asociados a salud mental
    slug.includes("ansiedad") ||
    slug.includes("estres") ||
    slug.includes("depres") ||
    slug.includes("sueno")
  ) {
    // nube/punto
    return (
      <svg {...common} aria-hidden="true">
        <path d="M7 16a4 4 0 0 1 .4-7.98A5 5 0 0 1 17 10.5a3.5 3.5 0 0 1 0 7H7Z" />
        <circle cx="11" cy="13" r="0.9" />
      </svg>
    )
  }

  if (
    plain.includes("horm") ||
    slug.includes("horm") ||
    // ampliación: etapas/temas que suelen leerse como “hormonal”
    slug.includes("menopaus") ||
    slug.includes("perimenop") ||
    slug.includes("climater")
  ) {
    // ondas
    return (
      <svg {...common} aria-hidden="true">
        <path d="M4 10c3 0 3-4 6-4s3 8 6 8 3-4 4-4" />
        <path d="M4 14c3 0 3-4 6-4s3 8 6 8 3-4 4-4" />
      </svg>
    )
  }

  if (
    plain.includes("dolor") ||
    plain.includes("pélv") ||
    plain.includes("pelv") ||
    slug.includes("dolor") ||
    slug.includes("pelv") ||
    // ampliación: patologías/temas muy asociados a dolor pélvico
    slug.includes("endometri")
  ) {
    // punto con aura
    return (
      <svg {...common} aria-hidden="true">
        <circle cx="12" cy="12" r="1.2" />
        <path d="M12 6.5c3 0 5.5 2.5 5.5 5.5S15 17.5 12 17.5 6.5 15 6.5 12 9 6.5 12 6.5Z" />
      </svg>
    )
  }

  if (
    // ampliación: nutrición y hábitos (icono “hoja” abstracta)
    slug.includes("nutric") ||
    slug.includes("alimenta") ||
    slug.includes("dieta") ||
    slug.includes("hierro") ||
    slug.includes("anemia")
  ) {
    return (
      <svg {...common} aria-hidden="true">
        <path d="M20 6c-7 0-11 4-12 12 8-1 12-5 12-12Z" />
        <path d="M8 18c1-4 4-7 8-8" />
      </svg>
    )
  }

  if (
    // ampliación: fertilidad/embarazo/posparto/lactancia (icono “brote” abstracto)
    slug.includes("fertil") ||
    slug.includes("embar") ||
    slug.includes("lact") ||
    slug.includes("pospart") ||
    slug.includes("postpart")
  ) {
    return (
      <svg {...common} aria-hidden="true">
        <path d="M12 18V9" />
        <path d="M12 10c-3 0-5 1.7-6 4 3 .4 5-.4 6-2" />
        <path d="M12 10c3 0 5 1.7 6 4-3 .4-5-.4-6-2" />
      </svg>
    )
  }

  if (
    // ampliación: salud sexual/relaciones (icono de “conexión” abstracta)
    slug.includes("sexual") ||
    slug.includes("relacion") ||
    slug.includes("intim") ||
    slug.includes("libido")
  ) {
    return (
      <svg {...common} aria-hidden="true">
        <circle cx="9" cy="12" r="3" />
        <circle cx="16" cy="12" r="3" />
        <path d="M12 12h1" />
      </svg>
    )
  }

  if (
    // ampliación: SOP / ovario poliquístico (lo tratamos como “orbital”, abstracto)
    slug === "sop" ||
    slug.includes("poliquist") ||
    slug.includes("ovario")
  ) {
    return (
      <svg {...common} aria-hidden="true">
        <circle cx="12" cy="12" r="1.4" />
        <path d="M7.3 13.2c.9 2.2 2.7 3.8 4.7 3.8 2.9 0 5.2-2.8 5.2-6.3 0-2.7-1.4-5-3.5-5.9" />
      </svg>
    )
  }

  // Fallback automático: si no hay match por palabras clave, asignamos un icono
  // abstracto desde un set cerrado, en base al hash del slug de la categoría.
  // Esto mantiene consistencia visual y evita que categorías nuevas queden “sin icono”.
  const index = hashToIndex(slug || plain, 6)
  switch (index) {
    case 0:
      // arco suave
      return (
        <svg {...common} aria-hidden="true">
          <path d="M6.5 14.5c1.8-3.5 3.9-5.2 5.5-5.2s3.7 1.7 5.5 5.2" />
          <path d="M8 16.8h8" />
        </svg>
      )
    case 1:
      // dos ondas
      return (
        <svg {...common} aria-hidden="true">
          <path d="M5 11c2 0 2-3 4-3s2 6 4 6 2-3 6-3" />
          <path d="M5 15c2 0 2-3 4-3s2 6 4 6 2-3 6-3" />
        </svg>
      )
    case 2:
      // círculo abierto
      return (
        <svg {...common} aria-hidden="true">
          <path d="M18.5 12a6.5 6.5 0 1 1-1.8-4.5" />
          <path d="M18.5 7.5v3h-3" />
        </svg>
      )
    case 3:
      // punto + órbita
      return (
        <svg {...common} aria-hidden="true">
          <circle cx="12" cy="12" r="1.4" />
          <path d="M7.3 13.2c.9 2.2 2.7 3.8 4.7 3.8 2.9 0 5.2-2.8 5.2-6.3 0-2.7-1.4-5-3.5-5.9" />
        </svg>
      )
    case 4:
      // líneas curvas (variante)
      return (
        <svg {...common} aria-hidden="true">
          <path d="M6 10c2 0 2 4 4 4s2-4 4-4 2 4 4 4" />
          <path d="M6 14c2 0 2 4 4 4s2-4 4-4 2 4 4 4" />
        </svg>
      )
    default:
      // punto suave
      return (
        <svg {...common} aria-hidden="true">
          <circle cx="12" cy="12" r="2.2" />
        </svg>
      )
  }
}
