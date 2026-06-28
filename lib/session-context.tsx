'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type SessionContextType = {
  academicYear: string
  setAcademicYear: (year: string) => void
  availableYears: string[]
}

const SessionContext = createContext<SessionContextType | undefined>(undefined)

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [academicYear, setAcademicYearState] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('selectedAcademicYear')
      if (saved) return saved;
    }
    return '2025-26'
  })
  const availableYears = ['2024-25', '2025-26', '2026-27']

  useEffect(() => {
    // Only used to ensure local state syncs if needed, though initialization handles it.
    const saved = localStorage.getItem('selectedAcademicYear')
    if (saved && availableYears.includes(saved) && saved !== academicYear) {
      setAcademicYearState(saved)
    }
  }, [])

  const setAcademicYear = (year: string) => {
    setAcademicYearState(year)
    localStorage.setItem('selectedAcademicYear', year)
  }

  return (
    <SessionContext.Provider value={{ academicYear, setAcademicYear, availableYears }}>
      {children}
    </SessionContext.Provider>
  )
}

export function useSession() {
  const context = useContext(SessionContext)
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider')
  }
  return context
}
