export default function Loading() {
  return (
    <section className="mx-auto w-11/12 md:w-1/2 py-12 flex flex-col gap-6">
      <div className="animate-pulse">
        {/* Header skeleton */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="h-6 w-20 bg-violet-100 rounded-lg" />
          <div className="h-6 w-32 bg-violet-100 rounded-lg" />
        </div>

        {/* Content card skeleton */}
        <div className="rounded-2xl border border-violet-100 bg-white px-6 py-8 md:px-10 md:py-10">
          {/* Title skeleton */}
          <div className="h-10 bg-violet-100 rounded-lg mb-6 w-3/4 mx-auto" />

          {/* Content lines skeleton */}
          <div className="space-y-4">
            <div className="h-4 bg-violet-50 rounded w-full" />
            <div className="h-4 bg-violet-50 rounded w-5/6" />
            <div className="h-4 bg-violet-50 rounded w-4/5" />
            <div className="h-4 bg-violet-50 rounded w-full" />
            <div className="h-4 bg-violet-50 rounded w-3/4" />
          </div>

          {/* Paragraph break */}
          <div className="my-6" />

          <div className="space-y-4">
            <div className="h-4 bg-violet-50 rounded w-full" />
            <div className="h-4 bg-violet-50 rounded w-5/6" />
            <div className="h-4 bg-violet-50 rounded w-2/3" />
          </div>
        </div>
      </div>
    </section>
  )
}
