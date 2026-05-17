'use client'

import { useState, useRef } from 'react'
import { pdf, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import html2canvas from 'html2canvas'
import { Download, X } from 'lucide-react'

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  receiptId: { fontSize: 10, color: '#71717A' },
  receiptIdValue: { fontSize: 11, fontWeight: 'bold', color: '#18181B' },
  badge: { backgroundColor: '#DCFCE7', color: '#16A34A', fontSize: 10, padding: '4px 10px', borderRadius: 20 },
  header: { textAlign: 'center', marginBottom: 30, borderBottom: '2px solid #7C3AED', paddingBottom: 20 },
  schoolName: { fontSize: 22, fontWeight: 'bold', color: '#7C3AED', marginBottom: 4 },
  subtitle: { fontSize: 11, color: '#71717A' },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottom: '1px solid #F4F4F5' },
  label: { fontSize: 12, color: '#71717A' },
  value: { fontSize: 12, fontWeight: 'bold', color: '#18181B' },
  valueGreen: { fontSize: 12, fontWeight: 'bold', color: '#16A34A' },
  valueRed: { fontSize: 12, fontWeight: 'bold', color: '#DC2626' },
  totalBox: { backgroundColor: '#F5F3FF', borderRadius: 8, padding: 16, marginTop: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 14, fontWeight: 'bold', color: '#7C3AED' },
  totalValue: { fontSize: 18, fontWeight: 'bold', color: '#7C3AED' },
  footer: { marginTop: 40, paddingTop: 20, borderTop: '1px solid #E4E4E7', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  footerText: { fontSize: 9, color: '#A1A1AA', maxWidth: 200 },
  signatureLine: { borderTop: '1px solid #71717A', paddingTop: 4, fontSize: 10, color: '#71717A', width: 120, textAlign: 'center' },
})

interface Props {
  studentName: string
  className: string
  amountPaid: number
  totalFees: number
  remainingFees: number
  schoolName: string
  schoolAddress?: string
  schoolMobile?: string
  payments?: {
    id: string
    amount: number
    paid_at: string
    mode: string
  }[]
}

function ReceiptDocument({ studentName, className, amountPaid, totalFees, remainingFees, schoolName, schoolAddress, schoolMobile, payments }: Props) {
  const receiptId = `REC-${Date.now()}`
  const date = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.receiptId}>Receipt ID</Text>
            <Text style={styles.receiptIdValue}>{receiptId}</Text>
          </View>
          <Text style={styles.badge}>✓ Paid</Text>
        </View>
        <View style={styles.header}>
          <Text style={styles.schoolName}>{schoolName}</Text>
          {schoolAddress ? <Text style={styles.subtitle}>{schoolAddress}</Text> : null}
          {schoolMobile ? <Text style={styles.subtitle}>📞 {schoolMobile}</Text> : null}
          <Text style={[styles.subtitle, { marginTop: 8 }]}>Fee Payment Receipt</Text>
        </View>
        <View>
          <View style={styles.row}>
            <Text style={styles.label}>Student Name</Text>
            <Text style={styles.value}>{studentName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Class</Text>
            <Text style={styles.value}>{className}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Date of Generation</Text>
            <Text style={styles.value}>{date}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Total Fees</Text>
            <Text style={styles.value}>₹{totalFees.toLocaleString('en-IN')}</Text>
          </View>
          
          {/* Payment History Table for PDF */}
          <View style={{ marginTop: 20, marginBottom: 10 }}>
            <Text style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 10, color: '#7C3AED' }}>Installment History</Text>
            <View style={{ borderBottom: '1px solid #E4E4E7', flexDirection: 'row', paddingVertical: 5 }}>
              <Text style={{ flex: 2, fontSize: 10, color: '#71717A' }}>Date</Text>
              <Text style={{ flex: 1, fontSize: 10, color: '#71717A' }}>Mode</Text>
              <Text style={{ flex: 1, fontSize: 10, color: '#71717A', textAlign: 'right' }}>Amount</Text>
            </View>
            {payments?.map((p) => (
              <View key={p.id} style={{ borderBottom: '1px solid #F4F4F5', flexDirection: 'row', paddingVertical: 5 }}>
                <Text style={{ flex: 2, fontSize: 10, color: '#18181B' }}>{new Date(p.paid_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
                <Text style={{ flex: 1, fontSize: 10, color: '#18181B', textTransform: 'capitalize' }}>{p.mode}</Text>
                <Text style={{ flex: 1, fontSize: 10, fontWeight: 'bold', color: '#18181B', textAlign: 'right' }}>₹{p.amount.toLocaleString('en-IN')}</Text>
              </View>
            ))}
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Total Amount Paid</Text>
            <Text style={styles.valueGreen}>₹{amountPaid.toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Outstanding Balance</Text>
            <Text style={remainingFees > 0 ? styles.valueRed : styles.valueGreen}>
              ₹{Math.max(remainingFees, 0).toLocaleString('en-IN')}
            </Text>
          </View>
        </View>
        <View style={styles.totalBox}>
          <Text style={styles.totalLabel}>Grand Total Paid</Text>
          <Text style={styles.totalValue}>₹{amountPaid.toLocaleString('en-IN')}</Text>
        </View>
        <View style={styles.footer}>
          <Text style={styles.footerText}>Generated digitally by school fee management system.</Text>
          <View>
            <Text style={styles.signatureLine}>Authorized Signature</Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}

// Hidden receipt for image capture
function ReceiptHTML({ studentName, className, amountPaid, totalFees, remainingFees, schoolName, schoolAddress, schoolMobile, payments }: Props) {
  const receiptId = `REC-${Date.now()}`
  const date = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div style={{
      width: '500px',
      padding: '40px',
      backgroundColor: '#ffffff',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: '#18181b',
    }}>
      {/* Receipt Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#71717a', margin: '0 0 4px' }}>Receipt ID</p>
          <p style={{ fontSize: '12px', fontWeight: '700', margin: 0 }}>{receiptId}</p>
        </div>
        <div style={{ backgroundColor: '#dcfce7', color: '#16a34a', fontSize: '10px', fontWeight: '700', padding: '4px 10px', borderRadius: '12px', textTransform: 'uppercase' }}>
          ✓ Paid
        </div>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#7c3aed', margin: '0 0 8px' }}>{schoolName}</h1>
        {schoolAddress && <p style={{ fontSize: '12px', color: '#71717a', margin: '0 0 4px' }}>{schoolAddress}</p>}
        {schoolMobile && <p style={{ fontSize: '12px', color: '#71717a', margin: 0 }}>📞 {schoolMobile}</p>}
        <div style={{ margin: '20px auto 0', height: '2px', width: '60px', backgroundColor: '#7c3aed' }}></div>
        <p style={{ fontSize: '14px', fontWeight: '600', color: '#71717a', marginTop: '16px' }}>Fee Payment Receipt</p>
      </div>

      {/* Details */}
      <div style={{ borderTop: '1px solid #e4e4e7', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f4f4f5' }}>
          <span style={{ fontSize: '13px', color: '#71717a' }}>Student Name</span>
          <span style={{ fontSize: '13px', fontWeight: '600' }}>{studentName}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f4f4f5' }}>
          <span style={{ fontSize: '13px', color: '#71717a' }}>Class</span>
          <span style={{ fontSize: '13px', fontWeight: '600' }}>{className}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f4f4f5' }}>
          <span style={{ fontSize: '13px', color: '#71717a' }}>Total School Fee</span>
          <span style={{ fontSize: '13px', fontWeight: '600' }}>₹{totalFees.toLocaleString('en-IN')}</span>
        </div>
      </div>

      {/* Payment History Table */}
      <div style={{ marginBottom: '24px' }}>
        <p style={{ fontSize: '12px', fontWeight: '700', color: '#7c3aed', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Installment History</p>
        <div style={{ width: '100%', borderCollapse: 'collapse' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid #e4e4e7', paddingBottom: '8px', marginBottom: '8px' }}>
            <span style={{ flex: 2, fontSize: '11px', color: '#71717a', fontWeight: '600' }}>Date</span>
            <span style={{ flex: 1, fontSize: '11px', color: '#71717a', fontWeight: '600' }}>Mode</span>
            <span style={{ flex: 1, fontSize: '11px', color: '#71717a', fontWeight: '600', textAlign: 'right' }}>Amount</span>
          </div>
          {payments && payments.length > 0 ? (
            payments.map((p) => (
              <div key={p.id} style={{ display: 'flex', padding: '8px 0', borderBottom: '1px solid #f4f4f5' }}>
                <span style={{ flex: 2, fontSize: '12px' }}>{new Date(p.paid_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                <span style={{ flex: 1, fontSize: '12px', textTransform: 'capitalize' }}>{p.mode}</span>
                <span style={{ flex: 1, fontSize: '12px', fontWeight: '700', textAlign: 'right' }}>₹{p.amount.toLocaleString('en-IN')}</span>
              </div>
            ))
          ) : (
            <p style={{ fontSize: '12px', color: '#71717a', textAlign: 'center', padding: '10px' }}>No payments recorded</p>
          )}
        </div>
      </div>

      <div style={{ borderTop: '1px solid #e4e4e7', paddingTop: '12px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
          <span style={{ fontSize: '13px', color: '#71717a' }}>Total Amount Paid</span>
          <span style={{ fontSize: '13px', fontWeight: '700', color: '#16a34a' }}>₹{amountPaid.toLocaleString('en-IN')}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
          <span style={{ fontSize: '13px', color: '#71717a' }}>Outstanding Balance</span>
          <span style={{ fontSize: '13px', fontWeight: '700', color: remainingFees > 0 ? '#dc2626' : '#16a34a' }}>
            ₹{Math.max(remainingFees, 0).toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Total Box */}
      <div style={{ backgroundColor: '#f5f3ff', borderRadius: '12px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <span style={{ fontSize: '14px', fontWeight: '700', color: '#7c3aed' }}>Grand Total Paid</span>
        <span style={{ fontSize: '24px', fontWeight: '800', color: '#7c3aed' }}>₹{amountPaid.toLocaleString('en-IN')}</span>
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: '20px', borderTop: '1px dotted #e4e4e7' }}>
        <p style={{ fontSize: '10px', color: '#a1a1aa', maxWidth: '200px', lineHeight: '1.5' }}>
          Generated digitally on {date}. This record shows all installments made towards the total school fee.
        </p>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '120px', height: '1px', backgroundColor: '#71717a', marginBottom: '8px' }}></div>
          <p style={{ fontSize: '11px', color: '#71717a', fontWeight: '600' }}>Authorized Signatory</p>
        </div>
      </div>
    </div>
  )
}

export default function ReceiptPDF(props: Props) {
  const [loading, setLoading] = useState(false)
  const [imgLoading, setImgLoading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const receiptRef = useRef<HTMLDivElement>(null)

  async function handlePreview() {
    setLoading(true)
    try {
      const el = receiptRef.current
      if (!el) return

      el.style.display = 'block'
      const canvas = await html2canvas(el, { scale: 3, backgroundColor: '#ffffff', logging: false, useCORS: true })
      el.style.display = 'none'

      const imgUrl = canvas.toDataURL('image/jpeg', 1.0)
      setPreviewUrl(imgUrl)
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  async function handleWhatsApp() {
  setImgLoading(true)
  try {
    const el = receiptRef.current
    if (!el) return

    el.style.display = 'block'
    const canvas = await html2canvas(el, { scale: 3, backgroundColor: '#ffffff', logging: false, useCORS: true })
    el.style.display = 'none'

    // Convert to blob
    canvas.toBlob(async (blob) => {
      if (!blob) return

      const file = new File([blob], `${props.studentName}-receipt.jpg`, { type: 'image/jpeg' })

      // Check if Web Share API supports files (mobile)
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Fee Receipt - ${props.studentName}`,
          text: `Dear Parent, fee receipt for ${props.studentName} (${props.className}). Amount Paid: ₹${props.amountPaid.toLocaleString('en-IN')}. Remaining: ₹${Math.max(props.remainingFees, 0).toLocaleString('en-IN')}. — ${props.schoolName}`,
        })
      } else {
        // Desktop fallback — download + open WhatsApp
        const imgUrl = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = imgUrl
        a.download = `${props.studentName}-receipt.jpg`
        a.click()

        setTimeout(() => {
          const message = `Dear Parent, fee receipt for *${props.studentName}* (${props.className}). Amount Paid: *₹${props.amountPaid.toLocaleString('en-IN')}*. Remaining: *₹${Math.max(props.remainingFees, 0).toLocaleString('en-IN')}*. — ${props.schoolName}`
          window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank')
        }, 1000)
      }
    }, 'image/jpeg', 0.95)

  } catch (err) {
    console.error(err)
  }
  setImgLoading(false)
}

  function handleDownloadImage() {
    if (!previewUrl) return
    const a = document.createElement('a')
    a.href = previewUrl
    a.download = `${props.studentName}-receipt.jpg`
    a.click()
  }

  function handleClose() {
    setPreviewUrl(null)
  }

  return (
    <div className="w-full">

      {/* Hidden receipt for image capture */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
        <div ref={receiptRef} style={{ display: 'none' }}>
          <ReceiptHTML {...props} />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handlePreview}
          disabled={loading}
          className="h-11 px-5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium shadow-sm transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? (
            <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Generating...</>
          ) : <>📄 View Receipt</>}
        </button>

        <button
          onClick={handleWhatsApp}
          disabled={imgLoading}
          className="h-11 px-5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-medium shadow-sm transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
        >
          {imgLoading ? (
            <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Processing...</>
          ) : <>💬 Share on WhatsApp</>}
        </button>
      </div>

      {/* Preview Modal */}
      {previewUrl && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
              <h2 className="text-lg font-bold text-zinc-900">Receipt Preview</h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleDownloadImage}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold shadow-sm transition-all hover:scale-105 active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  Download Image
                </button>
                <button
                  onClick={handleClose}
                  className="p-2 rounded-xl hover:bg-zinc-100 transition-colors text-zinc-400 hover:text-zinc-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-auto bg-zinc-100/50 p-6 sm:p-8 flex justify-center">
              <div className="relative">
                <img 
                  src={previewUrl} 
                  className="max-w-full h-auto shadow-2xl rounded-lg ring-1 ring-black/5" 
                  alt="Receipt Preview" 
                />
              </div>
            </div>
            
            <div className="p-3 bg-zinc-50 border-t border-zinc-100 flex justify-center">
               <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">
                 Preview Mode • High Quality Capture
               </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}