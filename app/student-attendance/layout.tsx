'use client'

import { GraduationCap } from 'lucide-react'

export default function StudentAttendanceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-[100dvh] bg-zinc-50 dark:bg-zinc-950 flex flex-col">
      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="fade-in-page h-full">
          {children}
        </div>
      </main>
    </div>
  )
}
