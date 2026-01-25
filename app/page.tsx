import ArticleItemList from "@/components/ArticleListItem"
import LatestPosts from "@/components/LatestPosts"
import { getCategorisedArticles } from "@/lib/server/articles"

const HomePage = () => {
  // Obtiene artículos agrupados por categoría leyendo los Markdown del directorio /articles.
  const articles = getCategorisedArticles()

  const sortedCategories = Object.keys(articles).sort((a, b) =>
    a.localeCompare(b, "es", { sensitivity: "base" }),
  )
  return (
    <section className="mx-auto w-11/12 md:w-1/2 py-12 md:py-16 flex flex-col gap-14">
      <header className="text-center flex flex-col gap-5 md:gap-6">
        <h1 className="font-cormorantGaramond font-light text-5xl md:text-6xl leading-tight text-violet-900 tracking-tight">
          Saber es <span className="sanar-underline">sanar</span>
        </h1>
        <p className="font-poppins text-base md:text-lg leading-relaxed text-neutral-700">
          Artículos pensados para acompañarte con información clara y cuidadosa.
        </p>
      </header>

      {/* Componente que muestra las últimas publicaciones. */}
      <LatestPosts />

      <section className="flex flex-col gap-6">
        <h2 className="font-cormorantGaramond text-3xl md:text-4xl leading-tight text-violet-900">
          Categorías
        </h2>

        <section id="articles" className="md:grid md:grid-cols-2 flex flex-col gap-10 scroll-mt-24">
          {/* Pintamos una "sección" por categoría, y dentro enlaces a cada artículo */}
          {articles !== null &&
            sortedCategories.map((category) => {
              const categoryArticles = articles[category]
              if (!categoryArticles) return null
              return (
                <ArticleItemList
                  category={category}
                  articles={categoryArticles}
                  key={category}
                />
              )
            })}
        </section>
      </section>
    </section>
  )
}

export default HomePage
