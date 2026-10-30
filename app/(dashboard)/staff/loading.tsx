export default function StaffLoading() {
  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-6 space-y-6 pb-20 font-sans min-w-0 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="h-7 w-48 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
          <div className="h-4 w-60 bg-zinc-100 dark:bg-zinc-800/60 rounded" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-10 w-36 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <div className="h-4 w-20 bg-zinc-200 dark:bg-zinc-800 rounded" />
              <div className="h-8 w-8 bg-zinc-100 dark:bg-zinc-800 rounded-lg" />
            </div>
            <div className="h-7 w-16 bg-zinc-200 dark:bg-zinc-800 rounded" />
          </div>
        ))}
      </div>

      {/* Search and Table Skeleton */}
      <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm p-4 sm:p-6 space-y-4">
        <div className="h-10 w-full max-w-sm bg-zinc-100 dark:bg-zinc-800 rounded-xl" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-zinc-50 dark:bg-zinc-900/60 rounded-xl border border-zinc-100 dark:border-zinc-800/60" />
          ))}
        </div>
      </div>
    </div>
  )
}
