export default function DashboardLoading() {
  return (
    <div className="p-4 md:p-6 space-y-6 bg-zinc-50 min-h-[calc(100vh-56px)]">
      <div className="flex items-center justify-between gap-4">
        <div className="h-6 w-32 rounded-lg bg-zinc-200 animate-pulse" />
        <div className="h-10 w-28 rounded-xl bg-zinc-200 animate-pulse" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="h-28 rounded-3xl bg-zinc-200 animate-pulse" />
        ))}
      </div>
      <div className="space-y-4">
        {[...Array(3)].map((_, idx) => (
          <div key={idx} className="rounded-3xl bg-zinc-200 p-5 space-y-4 animate-pulse">
            <div className="h-4 w-1/3 rounded-lg bg-zinc-300" />
            <div className="h-4 w-3/4 rounded-lg bg-zinc-300" />
            <div className="h-44 rounded-3xl bg-zinc-200" />
          </div>
        ))}
      </div>
    </div>
  )
}
