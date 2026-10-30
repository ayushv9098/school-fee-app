'use client'

// Module-level hydration tracking
let hasHydrated = false

if (typeof window !== 'undefined') {
  if (document.readyState === 'complete') {
    hasHydrated = true
  } else {
    window.addEventListener('load', () => {
      hasHydrated = true
    }, { once: true })
    setTimeout(() => {
      hasHydrated = true
    }, 50)
  }
}

export function isAppHydrated(): boolean {
  return hasHydrated
}

export function markAppHydrated(): void {
  hasHydrated = true
}

/**
 * Returns cached item from sessionStorage ONLY if we are in client-side SPA navigation
 * (after initial SSR hydration is complete). This guarantees:
 * 1. 0 hydration mismatch errors on hard refresh (F5)
 * 2. 0ms instant display on client-side route navigation
 */
export function getSafeInitialCache<T>(key: string): T | null {
  if (typeof window === 'undefined' || !hasHydrated) {
    return null
  }
  try {
    const raw = sessionStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

export function setSafeCache(key: string, data: any): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(key, JSON.stringify(data))
  } catch {}
}
