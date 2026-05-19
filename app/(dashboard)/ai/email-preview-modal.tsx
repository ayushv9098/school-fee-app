'use client'

import { useState } from 'react'
import { X, Mail, Send, CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react'

interface EmailPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  emailData: {
    to: string
    studentName: string
    className: string
    remainingFee: number
    totalFee?: number
    schoolName?: string
    hasEmail?: boolean
  }
  onSend: () => Promise<any>
}

export default function EmailPreviewModal({
  isOpen,
  onClose,
  emailData,
  onSend
}: EmailPreviewModalProps) {
  const [isSending, setIsSending] = useState(false)
  const [sendStatus, setSendStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [manualEmail, setManualEmail] = useState('')

  if (!isOpen) return null

  const hasRealEmail = emailData.hasEmail !== false && emailData.to !== 'parent@email.com'
  const percentage = emailData.totalFee 
    ? Math.round((emailData.remainingFee / emailData.totalFee) * 100) 
    : 0

  // ✅ HANDLE SEND WITH BETTER LOGGING
  const handleSend = async () => {
    console.log('🎯 Modal handleSend called!')
    
    // Validate email
    if (!hasRealEmail && !manualEmail) {
      console.log('⚠️ No email provided')
      setErrorMessage('Please enter an email address')
      setSendStatus('error')
      return
    }

    setIsSending(true)
    setSendStatus('idle')
    setErrorMessage('')
    
    console.log('📤 Calling onSend function...')
    
    try {
      const result = await onSend()
      console.log('✅ onSend returned:', result)
      
      setSendStatus('success')
      
      // Auto close after 2 seconds
      setTimeout(() => {
        onClose()
        resetState()
      }, 2000)
    } catch (error: any) {
      console.error('❌ Catch block - Error:', error)
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
      
      setSendStatus('error')
      setErrorMessage(error.message || 'Failed to send email. Please check console for details.')
      setIsSending(false)
    }
  }

  const resetState = () => {
    setSendStatus('idle')
    setIsSending(false)
    setErrorMessage('')
    setManualEmail('')
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-3 sm:p-4 md:p-6">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[95vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 text-white">
            <Mail size={20} className="sm:w-6 sm:h-6" />
            <h2 className="text-base sm:text-xl font-semibold">📧 Email Preview</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-1.5 sm:p-2 transition-colors"
          >
            <X size={18} className="sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-4 sm:space-y-6">
          
          {/* Warning if No Email */}
          {!hasRealEmail && sendStatus === 'idle' && (
            <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-3 sm:p-4 flex items-start gap-2 sm:gap-3">
              <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold text-orange-800 text-sm sm:text-base">⚠️ No Email on File</p>
                <p className="text-xs sm:text-sm text-orange-700 mt-1">
                  This student doesn't have an email address. Enter it below:
                </p>
                
                <input
                  type="email"
                  value={manualEmail}
                  onChange={(e) => setManualEmail(e.target.value)}
                  placeholder="parent@email.com"
                  className="mt-3 w-full px-3 py-2 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                />
              </div>
            </div>
          )}

          {/* Email Meta */}
          <div className="bg-zinc-50 rounded-lg p-3 sm:p-4 space-y-2 sm:space-y-3 border border-zinc-200">
            <div className="flex flex-col xs:flex-row xs:items-start gap-1 xs:gap-2">
              <span className="font-semibold text-zinc-600 min-w-[50px] text-xs sm:text-sm">To:</span>
              <span className={`break-all text-xs sm:text-sm font-mono ${hasRealEmail ? 'text-zinc-900' : 'text-orange-600 italic'}`}>
                {hasRealEmail ? emailData.to : manualEmail || 'Not provided'}
              </span>
            </div>
            <div className="flex flex-col xs:flex-row xs:items-start gap-1 xs:gap-2">
              <span className="font-semibold text-zinc-600 min-w-[50px] text-xs sm:text-sm">Subject:</span>
              <span className="text-zinc-900 break-all text-xs sm:text-sm">
                ⚠️ Fee Payment Reminder - ₹{emailData.remainingFee.toLocaleString('en-IN')} Pending
              </span>
            </div>
          </div>

          {/* Email Preview Card */}
          <div className="border border-zinc-300 rounded-lg overflow-hidden shadow-sm">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-violet-600 to-purple-600 text-white p-6 sm:p-8 text-center">
              <h1 className="text-xl sm:text-2xl font-bold">📚 {emailData.schoolName || 'Ayushman Educational Academy'}</h1>
              <p className="mt-1 sm:mt-2 text-white/90 text-sm sm:text-lg">Fee Payment Reminder</p>
            </div>

            {/* Body */}
            <div className="bg-zinc-50 p-4 sm:p-6 space-y-3 sm:space-y-4">
              
              <p className="text-zinc-700 leading-relaxed text-xs sm:text-base">Dear Parent/Guardian,</p>
              
              <p className="text-zinc-600 leading-relaxed text-xs sm:text-base">
                We hope this message finds you well. This is a friendly reminder regarding the pending fee payment.
              </p>

              {/* Student Info */}
              <div className="bg-white p-4 sm:p-5 rounded-lg border-2 border-violet-200 shadow-sm">
                <h3 className="font-bold text-violet-800 mb-2 sm:mb-3 text-sm sm:text-lg flex items-center gap-2">
                  👨‍🎓 Student Details
                </h3>
                <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                  <div className="flex justify-between py-1 border-b border-zinc-100">
                    <span className="text-zinc-600">Student Name:</span>
                    <span className="font-semibold text-zinc-900">{emailData.studentName}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-zinc-100">
                    <span className="text-zinc-600">Class:</span>
                    <span className="font-semibold text-zinc-900">{emailData.className}</span>
                  </div>
                  {percentage > 0 && (
                    <div className="flex justify-between py-1">
                      <span className="text-zinc-600">Pending:</span>
                      <span className="font-semibold text-red-600">{percentage}%</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Amount */}
              <div className="bg-red-50 border-l-4 border-red-500 p-4 sm:p-5 rounded-r-lg shadow-sm">
                <h3 className="font-bold text-red-800 mb-1 sm:mb-2 text-sm sm:text-base flex items-center gap-2">
                  💰 Pending Amount
                </h3>
                <p className="text-2xl sm:text-4xl font-bold text-red-600 my-2 sm:my-3">
                  ₹{emailData.remainingFee.toLocaleString('en-IN')}
                </p>
                {emailData.totalFee && (
                  <p className="text-xs sm:text-sm text-red-600/80">
                    Total Fee: ₹{emailData.totalFee.toLocaleString('en-IN')}
                  </p>
                )}
              </div>

              {/* CTA */}
              <div className="text-center py-3 sm:py-4">
                <span className="inline-block bg-violet-600 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg font-bold text-sm sm:text-lg shadow-lg">
                  💳 Pay Now
                </span>
              </div>

              <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed bg-yellow-50 p-2.5 sm:p-3 rounded border-l-4 border-yellow-400">
                ⚠️ Please clear the dues at your earliest convenience.
              </p>
            </div>

            {/* Footer */}
            <div className="bg-zinc-100 p-4 sm:p-5 text-center border-t border-zinc-200">
              <p className="font-bold text-zinc-800 text-sm sm:text-base">
                {emailData.schoolName || 'Ayushman Educational Academy'}
              </p>
              <p className="text-xs text-zinc-500 mt-1 sm:mt-2">
                This is an automated message. Please do not reply.
              </p>
            </div>
          </div>

          {/* Success Message */}
          {sendStatus === 'success' && (
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-3 sm:p-4 flex items-start gap-2 sm:gap-3">
              <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 flex-shrink-0" />
              <div>
                <p className="font-bold text-green-800 text-sm sm:text-base">✅ Email Sent Successfully!</p>
                <p className="text-xs sm:text-sm text-green-700 mt-1">
                  Sent to <strong>{hasRealEmail ? emailData.to : manualEmail}</strong>
                </p>
              </div>
            </div>
          )}

          {/* Error Message - DETAILED! */}
          {sendStatus === 'error' && (
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3 sm:p-4 flex items-start gap-2 sm:gap-3">
              <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-bold text-red-800 text-sm sm:text-base">❌ Failed to Send Email</p>
                <p className="text-xs sm:text-sm text-red-700 mt-1 font-mono bg-red-100 p-2 rounded">
                  {errorMessage}
                </p>
                <details className="mt-2">
                  <summary className="text-xs text-red-600 cursor-pointer hover:underline">
                    🔍 Troubleshooting Tips
                  </summary>
                  <ul className="mt-2 ml-4 text-xs text-red-600 list-disc space-y-1">
                    <li>Check browser console (F12) for detailed errors</li>
                    <li>Verify RESEND_API_KEY in .env.local</li>
                    <li>Check network tab for failed requests</li>
                    <li>Ensure API route exists at /api/send-reminder</li>
                  </ul>
                </details>
              </div>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="border-t border-zinc-200 px-4 sm:px-6 py-3 sm:py-4 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 bg-zinc-50 flex-shrink-0">
          <button
            onClick={onClose}
            disabled={isSending}
            className="w-full sm:w-auto px-5 py-2.5 text-zinc-700 hover:bg-zinc-200 rounded-lg font-medium transition-colors disabled:opacity-50 text-sm sm:text-base order-2 sm:order-1"
          >
            Cancel
          </button>
          
          <button
            onClick={handleSend}
            disabled={isSending || sendStatus === 'success'}
            className="w-full sm:w-auto px-6 py-2.5 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md text-sm sm:text-base order-1 sm:order-2"
          >
            {isSending ? (
              'Sending...'
            ) : sendStatus === 'success' ? (
              <>
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                Sent Successfully!
              </>
            ) : (
              <>
                <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                Send Email Now
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}