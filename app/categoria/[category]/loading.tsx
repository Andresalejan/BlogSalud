export default function Loading() {
  return (
    <section className="mx-auto w-11/12 md:w-1/2 py-12 md:py-14 flex flex-col gap-8">
      <div className="animate-pulse">
        {/* Header skeleton */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="h-6 w-20 bg-violet-100 rounded-lg" />
          <div className="h-6 w-40 bg-violet-100 rounded-lg" />
        </div>

        {/* Category header skeleton */}
        <div className="text-center flex flex-col gap-3 items-center mb-8">
          <div className="h-4 w-24 bg-violet-100 rounded" />
          <div className="h-12 w-48 bg-violet-100 rounded-lg" />
          <div className="h-4 w-64 bg-violet-50 rounded" />
        </div>

        {/* Articles list skeleton */}
        <div className="rounded-2xl border border-violet-100 bg-white/70 p-6 md:p-8">
          <div className="grid grid-cols-1 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-violet-100 bg-white px-5 py-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="h-5 bg-violet-50 rounded w-3/4" />
                  <div className="h-6 w-24 bg-violet-100 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
