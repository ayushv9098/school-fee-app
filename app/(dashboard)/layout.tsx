import { DesktopSidebar, MobileSidebar } from '@/components/ui/layout/sidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-zinc-50">
      <DesktopSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-zinc-100 sticky top-0 z-30">
          <MobileSidebar />
          <p className="text-sm font-semibold text-zinc-900">Ayushman Educational Academy</p>
        </header>

        {/* Desktop Header */}
        <header className="hidden lg:flex items-center justify-between px-6 py-3 bg-white border-b border-zinc-100 sticky top-0 z-30">
          <p className="text-sm font-semibold text-zinc-900">Ayushman Educational Academy</p>
          <div className="flex items-center gap-4 text-sm text-zinc-500">
            <a href="/students" className="hover:text-violet-600 transition">Students</a>
            <a href="/payments" className="hover:text-violet-600 transition">Payments</a>
            <a href="/classes" className="hover:text-violet-600 transition">Classes</a>
            <a href="/dashboard" className="hover:text-violet-600 transition">Dashboard</a>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}