export default function LoadingPage() {
  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center relative">
      <div className="flex flex-col items-center gap-4 bg-white p-8 rounded-3xl shadow-xl border border-zinc-100">
        <div className="w-12 h-12 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
        <div className="space-y-2 text-center">
          <p className="text-lg font-bold text-zinc-900">Ayushman</p>
          <p className="text-sm text-zinc-500 animate-pulse">Preparing your dashboard...</p>
        </div>
      </div>
      
      {/* Background skeletons for depth */}
      <div className="absolute inset-0 -z-10 p-4 opacity-20 blur-sm pointer-events-none">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="h-8 w-48 rounded-xl bg-zinc-200" />
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            {[...Array(3)].map((_, idx) => (
              <div key={idx} className="h-36 rounded-3xl bg-zinc-200" />
            ))}
          </div>
          <div className="h-96 rounded-3xl bg-zinc-200" />
        </div>
      </div>
    </div>
  )
}
