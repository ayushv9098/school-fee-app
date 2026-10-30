export default function StudentRecordsLoading() {
  return (
    <div className="flex flex-col h-full animate-pulse">
      {/* Header Skeleton */}
      <div className="shrink-0 bg-zinc-50 dark:bg-zinc-950 px-4 md:px-6 pt-4 md:pt-6 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="h-7 w-64 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
            <div className="h-4 w-48 bg-zinc-100 dark:bg-zinc-800/60 rounded" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-10 w-28 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
            <div className="h-10 w-36 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="flex-1 p-4 md:p-6 space-y-6">
        {/* Date Selector Skeleton */}
        <div className="h-10 w-52 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="h-5 w-40 bg-zinc-200 dark:bg-zinc-800 rounded" />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm" />
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <div className="h-5 w-40 bg-zinc-200 dark:bg-zinc-800 rounded" />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
