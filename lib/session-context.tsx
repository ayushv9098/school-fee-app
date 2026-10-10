'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type SessionContextType = {
  academicYear: string
  setAcademicYear: (year: string) => void
  availableYears: string[]
  isInitialized: boolean
}

const SessionContext = createContext<SessionContextType | undefined>(undefined)

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const availableYears = ['2024-25', '2025-26', '2026-27', '2027-28']
  const [isInitialized, setIsInitialized] = useState(false)
  const [academicYear, setAcademicYearState] = useState('2025-26')

  useEffect(() => {
    const saved = localStorage.getItem('selectedAcademicYear')
    if (saved && availableYears.includes(saved)) {
      setAcademicYearState(saved)
    }
    setIsInitialized(true)
  }, [])

  const setAcademicYear = (year: string) => {
    setAcademicYearState(year)
    localStorage.setItem('selectedAcademicYear', year)
  }

  return (
    <SessionContext.Provider value={{ academicYear, setAcademicYear, availableYears, isInitialized }}>
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
