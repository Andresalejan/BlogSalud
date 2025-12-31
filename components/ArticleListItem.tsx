import Link from "next/link"
import type { ArticleItem } from "@/types"

interface Props {
  category: string
  articles: ArticleItem[]
}

const ArticleItemList = ({ category, articles }: Props) => {
  return (
    <div className="flex flex-col gap-5">
      <h2 className="font-cormorantGaramond text-4xl text-rose-900">
        {category}
      </h2>
      <ul className="list-disc space-y-2.5 pl-5 font-poppins text-lg marker:text-rose-700">
        {articles.map((article) => (
          <li key={article.id}>
            <Link
              // Cada enlace apunta a la ruta dinámica /[slug]
              // (donde slug = article.id, el nombre del archivo .md sin extensión).
              href={`/${article.id}`}
              className="text-neutral-900 hover:text-rose-800 transition duration-150"
            >
              {article.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default ArticleItemList
