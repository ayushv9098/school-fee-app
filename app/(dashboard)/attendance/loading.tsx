export default function AttendanceLoading() {
  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-6 space-y-5 sm:space-y-6 pb-20 font-sans min-w-0 overflow-x-clip animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="h-7 w-52 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
          <div className="h-4 w-44 bg-zinc-100 dark:bg-zinc-800/60 rounded" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-10 w-44 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
          <div className="h-10 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
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
            <div className="h-7 w-12 bg-zinc-200 dark:bg-zinc-800 rounded" />
          </div>
        ))}
      </div>

      {/* Card Content Skeleton */}
      <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="h-9 w-44 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
          <div className="flex items-center gap-2">
            <div className="h-9 w-28 bg-zinc-100 dark:bg-zinc-800 rounded-lg" />
            <div className="h-9 w-28 bg-zinc-100 dark:bg-zinc-800 rounded-lg" />
          </div>
        </div>

        {/* Staff Rows */}
        <div className="space-y-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex items-center justify-between p-3.5 rounded-xl border border-zinc-100 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-900/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                <div className="space-y-1.5">
                  <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded" />
                  <div className="h-3 w-20 bg-zinc-100 dark:bg-zinc-800/60 rounded" />
                </div>
              </div>
              <div className="h-8 w-24 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
