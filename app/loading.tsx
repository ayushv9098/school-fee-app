export default function LoadingPage() {
  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="h-8 w-48 rounded-xl bg-zinc-200 animate-pulse" />
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {[...Array(3)].map((_, idx) => (
            <div key={idx} className="h-36 rounded-3xl bg-zinc-200 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[...Array(2)].map((_, idx) => (
            <div key={idx} className="space-y-3 rounded-3xl bg-zinc-200 p-5 animate-pulse">
              <div className="h-5 w-3/4 rounded-lg bg-zinc-300" />
              <div className="h-4 w-full rounded-lg bg-zinc-300" />
              <div className="h-4 w-5/6 rounded-lg bg-zinc-300" />
              <div className="h-48 rounded-3xl bg-zinc-200" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
