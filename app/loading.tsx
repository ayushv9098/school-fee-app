export default function LoadingPage() {
  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center relative">
      <div className="flex flex-col items-center gap-2 bg-white/90 backdrop-blur-md px-6 py-5 rounded-2xl shadow-2xl border border-zinc-200/50 animate-in zoom-in-95 duration-300">
        <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mt-1">Loading</p>
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
