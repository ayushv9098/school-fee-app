'use client'

import { useState } from 'react'
import { formatCurrency } from '@/lib/calculations'
import { Copy, Check, Mail } from 'lucide-react'
import EmailPreviewModal from './email-preview-modal'

// ✅ WHATSAPP ICON COMPONENT (Real look!)
function WhatsAppIcon({ size = 20, className = '' }: { size?: number; className?: string }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="currentColor" 
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  )
}

export default function DefaulterRow({
  student,
  index,
}: {
  student: any
  index: number
}) {
  const [copied, setCopied] = useState(false)
  const [sending, setSending] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  const message = `Dear Parent of ${student.name} (${student.class}), your fee payment of ${formatCurrency(student.remaining_fee)} is pending. Please pay at the earliest. — Ayushman Educational Academy`

  // ✅ Get email (hidden)
  const parentEmail = student.email || null
  
  // ✅ Get mobile for WhatsApp
  const parentMobile = student.mobile || student.phone || null

  // ✅ EMAIL DATA FOR MODAL
  const emailData = {
    to: parentEmail || 'parent@email.com',
    studentName: student.name,
    className: student.class,
    remainingFee: student.remaining_fee,
    totalFee: student.total_fee,
    schoolName: 'Ayushman Educational Academy',
    hasEmail: !!parentEmail
  }

  // Copy message for SMS/WhatsApp
  async function handleCopyMessage() {
    try {
      await navigator.clipboard.writeText(message)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Copy failed:', err)
    }
  }

  // ✅ SEND EMAIL FUNCTION
  async function handleSendEmail() {
    if (!parentEmail) {
      throw new Error(`No email found for ${student.name}`)
    }

    try {
      setSending(true)

      const res = await fetch('/api/send-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: parentEmail,
          studentName: student.name,
          className: student.class,
          remainingFee: student.remaining_fee,
          totalFee: student.total_fee,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || `Failed: ${res.status}`)
      }

      if (data.success) {
        return data
      } else {
        throw new Error(data.error || 'Unknown error')
      }
    } catch (error: any) {
      throw error
    } finally {
      setSending(false)
    }
  }

  // Open email preview modal
  function handleEmailClick() {
    setShowPreview(true)
  }

  // ✅ WHATSAPP/MESSAGE ACTION
  function handleWhatsAppClick() {
    // Always copy message first
    handleCopyMessage()
    
    if (parentMobile) {
      // Open WhatsApp with pre-filled message
      const whatsappURL = `https://wa.me/${parentMobile.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`
      
      if (confirm(`📱 Open WhatsApp to ${parentMobile}?\n\nClick OK for WhatsApp\nClick Cancel to copy only`)) {
        window.open(whatsappURL, '_blank')
      }
    } else {
      alert('📋 Message copied!\n\nNo phone number on record.\nPaste in any messaging app.')
    }
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-zinc-50 rounded-xl hover:bg-zinc-100 transition-colors duration-200 gap-3">
        
        {/* Left Side */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-8 h-8 sm:w-7 sm:h-7 bg-red-100 rounded-full flex items-center justify-center text-xs font-bold text-red-600 flex-shrink-0">
            {index + 1}
          </div>
          
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-zinc-900 truncate">
              {student.name}
            </p>
            <p className="text-xs text-zinc-500">
              Class {student.class}
            </p>
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end">
          
          <p className="text-sm font-bold text-red-500 whitespace-nowrap min-w-[80px] text-right">
            {formatCurrency(student.remaining_fee)}
          </p>

          {/* Action Buttons - MATCHING THEME! */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            
            {/* ✉️ Email Button - VIOLET THEME */}
            <button
              onClick={handleEmailClick}
              disabled={sending}
              className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs font-medium transition-all border ${
                parentEmail 
                  ? 'border-violet-200 bg-white text-violet-700 hover:bg-violet-50 hover:border-violet-400 shadow-sm' 
                  : 'border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100'
              } ${sending ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={sending ? 'Sending...' : parentEmail ? 'Send email reminder' : 'No email'}
            >
              {!sending && <Mail className="w-3.5 h-3.5" />}
              <span className="hidden xs:inline">
                {sending ? 'Sending...' : 'Email'}
              </span>
            </button>

            {/* 💬 WhatsApp Button - MATCHING VIOLET THEME! */}
            <button
              onClick={handleWhatsAppClick}
              className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs font-medium transition-all border ${
                copied 
                  ? 'border-green-300 bg-green-50 text-green-700' 
                  : 'border-violet-200 bg-white text-violet-700 hover:bg-violet-50 hover:border-violet-400 shadow-sm'
              }`}
              title={
                copied 
                  ? 'Copied!' 
                  : parentMobile 
                    ? `Send via WhatsApp to ${parentMobile}` 
                    : 'Copy message for WhatsApp/SMS'
              }
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline">Copied!</span>
                </>
              ) : (
                <>
                  <WhatsAppIcon size={16} className="text-green-600" />
                  <span className="hidden xs:inline">WhatsApp</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 📧 Email Preview Modal */}
      <EmailPreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        emailData={emailData}
        onSend={handleSendEmail}
      />
    </>
  )
}