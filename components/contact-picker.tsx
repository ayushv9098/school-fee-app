'use client'

import { useState, useEffect } from 'react'
import { Contact2 } from 'lucide-react'

interface ContactPickerProps {
  onSelect: (phone: string) => void
  disabled?: boolean
}

export function ContactPicker({ onSelect, disabled }: ContactPickerProps) {
  const [isSupported, setIsSupported] = useState(false)

  useEffect(() => {
    // Check if Contact Picker API is supported
    // navigator.contacts is the main entry point
    const supported = 
      typeof navigator !== 'undefined' && 
      'contacts' in navigator &&
      !!(navigator as any).contacts.select

    setIsSupported(supported)
  }, [])

  if (!isSupported) return null

  const handlePickContact = async () => {
    try {
      const props = ['name', 'tel']
      const opts = { multiple: false }
      
      // Ensure we are in a secure context (HTTPS or localhost)
      if (!window.isSecureContext) {
        alert('Contact Picker requires a secure connection (HTTPS).')
        return
      }

      const contacts = await (navigator as any).contacts.select(props, opts)
      
      if (contacts && contacts.length > 0) {
        const contact = contacts[0]
        if (contact.tel && contact.tel.length > 0) {
          const rawPhone = contact.tel[0]
          const digitsOnly = rawPhone.replace(/[^0-9]/g, '')
          onSelect(digitsOnly)
        } else {
          alert('No phone number found for this contact.')
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') return
      
      console.error('Contact Picker Error:', error)
      alert(`Could not open contacts: ${error.message || 'Unknown error'}`)
    }
  }

  return (
    <button
      type="button"
      onClick={handlePickContact}
      disabled={disabled}
      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-zinc-400 hover:text-violet-600 hover:bg-violet-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      title="Pick from contacts"
    >
      <Contact2 className="w-4 h-4" />
    </button>
  )
}
