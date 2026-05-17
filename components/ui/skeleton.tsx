export function SkeletonCard({ className }: { className?: string }) {
  return <div className={`bg-zinc-200 animate-pulse rounded-3xl ${className ?? ''}`} />
}

export function SkeletonSection({ children }: { children: React.ReactNode }) {
  return <div className="space-y-4 py-6">{children}</div>
}
